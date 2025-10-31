// STORAGE KEY
const STORAGE_KEY = 'atendimento_cop_data_v2';

// Data
let clientes = [];

// On load: bind UI
window.addEventListener('load', () => {
  bindUI();
  loadFromStorage();
  renderAll();
});

function bindUI(){
  document.getElementById('fileInput').addEventListener('change', handleFile);
  document.getElementById('btnAdd').addEventListener('click', handleAdd);
  document.getElementById('filtro').addEventListener('input', renderAll);
  document.getElementById('btnSelectAll').addEventListener('click', toggleSelectAll);
  document.getElementById('btnPreviewSel').addEventListener('click', previewSelected);
  document.getElementById('btnSendSel').addEventListener('click', sendSelected);
  document.getElementById('btnExport').addEventListener('click', exportCSV);
  document.getElementById('selTop').addEventListener('change', function(){ document.querySelectorAll('.rowSel').forEach(cb=>cb.checked = this.checked); });
}

// --- FILE IMPORT ---
function handleFile(e){
  const f = e.target.files && e.target.files[0];
  if(!f){ alert('Nenhum arquivo selecionado'); return; }

  Papa.parse(f, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h ? h.trim() : h,
    complete: function(results){
      if(!results.data || results.data.length === 0){ alert('CSV vazio ou formato inválido'); return; }
      // normalize keys (lowercase trimmed)
      const rows = results.data.map(r => {
        const normalized = {};
        for(const k in r){
          if(!Object.prototype.hasOwnProperty.call(r,k)) continue;
          const key = k.trim().toLowerCase();
          normalized[key] = (r[k]||'').toString().trim();
        }
        return normalized;
      });

      // Map keys to expected fields
      const mapped = rows.map(r => ({
        contrato: r['contrato'] || r['nº contrato'] || r['n_contrato'] || '',
        nome: r['cliente'] || r['nome'] || '',
        celular: (r['celular'] || r['telefone'] || r['telefone celular'] || '').replace(/\D/g,''),
        data: (r['data agendamento'] || r['data'] || r['data_agendamento'] || ''),
        periodo: r['periodo'] || '',
        endereco: r['endereço'] || r['endereco'] || r['rua'] || '',
        bairro: r['bairro'] || '',
        status: r['status'] || 'Aguardando',
        messageCustom: ''
      }));

      // Deduplicate by contrato (keep first)
      const seen = new Set();
      let added = 0;
      mapped.forEach(m => {
        if(!m.contrato || seen.has(m.contrato)) return;
        seen.add(m.contrato);
        clientes.push(m);
        added++;
      });

      saveToStorage();
      renderAll();
      alert(`Importado: ${added} registros (não importados: duplicados / sem contrato).`);
      e.target.value = '';
    },
    error: function(err){
      console.error('Erro CSV', err);
      alert('Erro ao ler CSV: ' + err.message);
    }
  });
}

// --- STORAGE ---
function saveToStorage(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes)); }
function loadFromStorage(){
  try{
    const s = localStorage.getItem(STORAGE_KEY);
    clientes = s ? JSON.parse(s) : [];
  }catch(e){ clientes = []; }
}

// --- RENDERING ---
function renderAll(){
  renderTable();
  updateCounters();
}

function renderTable(){
  const tbody = document.getElementById('tabelaBody');
  tbody.innerHTML = '';
  const filtro = (document.getElementById('filtro').value || '').toLowerCase().trim();

  clientes.forEach((c, i) => {
    if(filtro){
      const match = (c.contrato||'').toLowerCase().includes(filtro) || (c.nome||'').toLowerCase().includes(filtro);
      if(!match) return;
    }
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="rowSel" data-i="${i}" type="checkbox"></td>
      <td contenteditable="true" data-field="contrato" data-i="${i}">${escapeHtml(c.contrato)}</td>
      <td contenteditable="true" data-field="nome" data-i="${i}">${escapeHtml(c.nome)}</td>
      <td contenteditable="true" data-field="celular" data-i="${i}">${escapeHtml(c.celular)}</td>
      <td><input type="date" data-field="data" data-i="${i}" value="${escapeHtml(c.data||'')}"></td>
      <td>
        <select data-field="periodo" data-i="${i}">
          <option value="">—</option>
          <option ${c.periodo==='Manhã'?'selected':''}>Manhã</option>
          <option ${c.periodo==='Tarde'?'selected':''}>Tarde</option>
          <option ${c.periodo==='Noite'?'selected':''}>Noite</option>
        </select>
      </td>
      <td contenteditable="true" data-field="endereco" data-i="${i}">${escapeHtml(c.endereco)}</td>
      <td contenteditable="true" data-field="bairro" data-i="${i}">${escapeHtml(c.bairro)}</td>
      <td>${escapeHtml(c.status)}</td>
      <td>
        <button data-action="preview" data-i="${i}">Prévia</button>
        <button data-action="edit" data-i="${i}">Editar Msg</button>
        <button data-action="send" data-i="${i}">Enviar</button>
        <button data-action="ok" data-i="${i}">✅</button>
        <button data-action="reag" data-i="${i}">📅</button>
        <button data-action="cancel" data-i="${i}">❌</button>
        <button data-action="del" data-i="${i}">🗑️</button>
        <div id="preview_box_${i}" class="preview" style="display:none;margin-top:6px"></div>
        <div id="editor_box_${i}" style="display:none;margin-top:6px">
          <textarea id="msg_edit_${i}" style="width:100%;min-height:80px"></textarea>
          <div style="margin-top:6px">
            <button data-action="saveMsg" data-i="${i}">Salvar Msg</button>
            <button data-action="closeEditor" data-i="${i}">Fechar</button>
          </div>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // bind events for editable selects/inputs/buttons
  bindTableEvents();
}

// helper to bind table events (delegation)
function bindTableEvents(){
  // contenteditable blur and select changes
  document.querySelectorAll('[data-field]').forEach(el => {
    const i = el.dataset.i;
    if(el.tagName === 'SELECT' || el.tagName === 'INPUT'){
      el.onchange = () => { applyEdit(i, el.dataset.field, el.value); };
    } else {
      el.onblur = () => { applyEdit(i, el.dataset.field, el.innerText); };
    }
  });

  // buttons
  document.querySelectorAll('#tabela button').forEach(btn => {
    btn.onclick = (ev) => {
      const action = btn.dataset.action;
      const i = parseInt(btn.dataset.i,10);
      if(action === 'preview') previewMessage(i);
      else if(action === 'edit') openEditor(i);
      else if(action === 'send') sendOne(i);
      else if(action === 'ok') updateStatus(i, 'Confirmado');
      else if(action === 'reag') updateStatus(i, 'Reagendado');
      else if(action === 'cancel') updateStatus(i, 'Cancelado');
      else if(action === 'del') deleteRow(i);
      else if(action === 'saveMsg') saveEditedMessage(i);
      else if(action === 'closeEditor') closeEditor(i);
    };
  });

  // row selectors update top checkbox state
  document.querySelectorAll('.rowSel').forEach(cb => cb.onchange = () => {
    const all = Array.from(document.querySelectorAll('.rowSel'));
    const top = document.getElementById('selTop');
    top.checked = all.length > 0 && all.every(c => c.checked);
  });
}

function applyEdit(i, field, value){
  if(!clientes[i]) return;
  if(field === 'celular') value = (value||'').toString().replace(/\D/g,'');
  clientes[i][field] = value;
  saveToStorage();
  renderAll();
}

// --- COUNTERS ---
function updateCounters(){
  let aguard=0, conf=0, re=0, can=0;
  clientes.forEach(c=>{
    if(c.status === 'Confirmado') conf++;
    else if(c.status === 'Reagendado') re++;
    else if(c.status === 'Cancelado') can++;
    else aguard++;
  });
  document.getElementById('contAguardando').innerText = aguard;
  document.getElementById('contConfirmado').innerText = conf;
  document.getElementById('contReagendado').innerText = re;
  document.getElementById('contCancelado').innerText = can;
}

// --- helper actions ---
function updateStatus(i, status){
  if(!clientes[i]) return;
  clientes[i].status = status;
  saveToStorage();
  renderAll();
}
function deleteRow(i){
  if(!confirm('Excluir registro?')) return;
  clientes.splice(i,1);
  saveToStorage();
  renderAll();
}

// --- preview / edit message ---
function montarTemplate(i){
  const c = clientes[i];
  const tipo = document.getElementById('tipoMensagem').value;
  const templates = {
    antecipacao: `Olá, Prezado(a) Cliente Ligga!\nAqui é do agendamento da Ligga Telecom, tudo bem? 😊\n\nIdentificamos a oportunidade de antecipar o seu atendimento para hoje!!!\n\n📅 Data: ${formatDate(c.data)}\n⏰ Período: ${c.periodo || ''}\n\nPodemos confirmar a antecipação de agenda para execução do serviço? ✅\n1. CONFIRMAR\n2. PERMANECER DATA ATUAL AGENDADA\n(Nosso sistema não suporta chamadas e áudios)`,
    confirmacao: `Olá, tudo bem?\nMeu contato é referente à Confirmação de Agendamento – Instalação de Internet | Ligga Telecom.\n\n📅 Agendado: ${formatDate(c.data)}\n\nPor favor, selecione uma das opções abaixo para que possamos dar andamento:\n1️⃣ Confirmar atendimento\n2️⃣ Preciso reagendar\n3️⃣ Já cancelei os serviços\n\nObs.: Nosso sistema não aceita áudios ou chamadas telefônicas.\nAguardamos sua resposta!\nEquipe Ligga Telecom`,
    chegada: `Um técnico a serviço da Ligga Telecom está em frente à sua residência para realizar a visita técnica.\n\n⚠️ Pedimos que haja alguém maior de 18 anos no local durante o atendimento. ⚠️`
  };
  return (c.messageCustom && c.messageCustom.trim()) ? c.messageCustom : templates[tipo || 'antecipacao'];
}

function previewMessage(i){
  const box = document.getElementById(`preview_box_${i}`);
  if(!box) return;
  box.style.display = 'block';
  box.textContent = montarTemplate(i);
  box.scrollIntoView({behavior:'smooth', block:'center'});
}

function openEditor(i){
  const box = document.getElementById(`editor_box_${i}`);
  const ta = document.getElementById(`msg_edit_${i}`);
  if(!box || !ta) return;
  ta.value = clientes[i].messageCustom && clientes[i].messageCustom.trim() ? clientes[i].messageCustom : montarTemplate(i);
  box.style.display = 'block';
}
function closeEditor(i){
  const box = document.getElementById(`editor_box_${i}`);
  if(box) box.style.display = 'none';
}
function saveEditedMessage(i){
  const ta = document.getElementById(`msg_edit_${i}`);
  clientes[i].messageCustom = ta.value;
  saveToStorage();
  closeEditor(i);
  previewMessage(i);
}

// --- SEND via WhatsApp (try app, fallback web) ---
function tryOpenWhatsApp(phoneFull, message){
  const encoded = encodeURIComponent(message);
  const appUrl = `whatsapp://send?phone=${phoneFull}&text=${encoded}`;
  const webUrl = `https://web.whatsapp.com/send?phone=${phoneFull}&text=${encoded}`;

  // Try open app via iframe
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = appUrl;
  document.body.appendChild(iframe);

  const fallback = setTimeout(()=> {
    window.open(webUrl, '_blank');
    try{ iframe.remove(); }catch(e){}
  }, 1200);

  document.addEventListener('visibilitychange', function onVis(){
    if(document.hidden){
      clearTimeout(fallback);
      try{ iframe.remove(); }catch(e){}
      document.removeEventListener('visibilitychange', onVis);
    }
  });
}

function sendOne(i){
  const c = clientes[i];
  if(!c) return;
  let phone = (c.celular||'').toString().replace(/\D/g,'');
  if(!phone){ alert('Número inválido'); return; }
  if(!phone.startsWith('55')) phone = '55' + phone;
  const message = montarTemplate(i);
  tryOpenWhatsApp(phone, message);
  // mark confirmed
  c.status = 'Confirmado';
  saveToStorage();
  renderAll();
}

// --- bulk -->
function toggleSelectAll(){
  const checkboxes = Array.from(document.querySelectorAll('.rowSel'));
  const allChecked = checkboxes.every(cb => cb.checked);
  checkboxes.forEach(cb => cb.checked = !allChecked);
}
function getSelectedIndices(){
  return Array.from(document.querySelectorAll('.rowSel:checked')).map(cb => parseInt(cb.dataset.i,10));
}
function previewSelected(){
  const idxs = getSelectedIndices();
  if(idxs.length === 0){ alert('Selecione ao menos um registro'); return; }
  idxs.forEach(i => previewMessage(i));
  alert(`${idxs.length} pré-visualizações mostradas.`);
}
function sendSelected(){
  const idxs = getSelectedIndices();
  if(idxs.length === 0){ alert('Selecione ao menos um registro'); return; }
  if(!confirm(`Enviar mensagem para ${idxs.length} contatos selecionados?`)) return;
  let delay = 0;
  idxs.forEach(i => {
    setTimeout(()=> sendOne(i), delay);
    delay += 1400;
  });
}

// --- ADD new manually
function handleAdd(){
  const contrato = document.getElementById('inputContrato').value.trim();
  const nome = document.getElementById('inputCliente').value.trim();
  let celular = (document.getElementById('inputCelular').value||'').replace(/\D/g,'');
  const data = document.getElementById('inputData').value || '';
  const endereco = document.getElementById('inputEndereco').value.trim();
  const bairro = document.getElementById('inputBairro').value.trim();
  if(!contrato || !nome || !celular){ alert('Preencha Contrato, Cliente e Celular'); return; }
  if(!celular.startsWith('55')) celular = '55' + celular;
  clientes.push({contrato,nome,celular,data,periodo:'',endereco,bairro,status:'Aguardando',messageCustom:''});
  saveToStorage(); renderAll();
  // clear
  document.getElementById('inputContrato').value=''; document.getElementById('inputCliente').value='';
  document.getElementById('inputCelular').value=''; document.getElementById('inputData').value='';
  document.getElementById('inputEndereco').value=''; document.getElementById('inputBairro').value='';
}

// --- EXPORT CSV (dedupe contracts)
function exportCSV(){
  const rows = clientes.slice();
  const seen = new Set();
  const out = [];
  rows.forEach(r => {
    if(r.contrato && seen.has(r.contrato)) return;
    if(r.contrato) seen.add(r.contrato);
    out.push(r);
  });
  if(out.length === 0){ alert('Nada para exportar'); return; }
  const header = ['Contrato','Cliente','Celular','Data Agendamento','Período','Endereço','Bairro','Status'];
  const lines = [header.join(',')];
  out.forEach(r => {
    const row = [
      `"${(r.contrato||'').replace(/"/g,'""')}"`,
      `"${(r.nome||'').replace(/"/g,'""')}"`,
      `"${(r.celular||'').replace(/"/g,'""')}"`,
      `"${(r.data||'').replace(/"/g,'""')}"`,
      `"${(r.periodo||'').replace(/"/g,'""')}"`,
      `"${(r.endereco||'').replace(/"/g,'""')}"`,
      `"${(r.bairro||'').replace(/"/g,'""')}"`,
      `"${(r.status||'').replace(/"/g,'""')}"`,
    ].join(',');
    lines.push(row);
  });
  const blob = new Blob([lines.join('\\n')], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'relatorio_atendimento_cop.csv'; a.click(); URL.revokeObjectURL(url);
}

// --- utils ---
function formatDate(v){
  if(!v) return '';
  if(/\\d{4}-\\d{2}-\\d{2}/.test(v)){ const [y,m,d] = v.split('-'); return `${d}/${m}/${y}`; }
  return v;
}
function escapeHtml(s){ if(s===null||s===undefined) return ''; return s.toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function saveToStorage(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes)); }
function loadFromStorage(){ try{ const s = localStorage.getItem(STORAGE_KEY); clientes = s ? JSON.parse(s) : []; }catch(e){ clientes = []; } }
function loadFromStorage(){ try{ const s = localStorage.getItem(STORAGE_KEY); clientes = s ? JSON.parse(s) : []; }catch(e){ clientes = []; } }
function renderAll(){ renderTable(); updateCounters(); }
function loadFromStorage(){ try{ const s = localStorage.getItem(STORAGE_KEY); clientes = s ? JSON.parse(s) : []; }catch(e){ clientes = []; } }

// ensure loadFromStorage memory
loadFromStorage();
