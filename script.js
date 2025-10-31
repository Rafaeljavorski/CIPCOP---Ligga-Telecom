// Robust import + UI for Ligga Telecom panel
const STORAGE_KEY = 'atendimento_cop_ligga_v3';
let registros = [];

// mapping candidate keys (normalized) to fields we want
const KEY_MAP = {
  contrato: ['contrato','nº contrato','num contrato','numero contrato','contract','contracto','n_contrato','contrato_id','codcontrato'],
  nome: ['nome','cliente','titular','responsavel'],
  celular: ['celular','telefone','telefone celular','fone','telefone1','phone','contact'],
  data: ['data agendada','data','dataagendada','agendamento','data agenda','data agend'],
  endereco: ['endereco','endereco','rua','logradouro','address'],
  bairro: ['bairro','neighbourhood','district'],
  status: ['status','status da atividade','status_atividade','situacao','situacion']
};

function normalizeHeader(h){
  if(!h) return '';
  return h.toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
}

function mapRow(raw){
  const out = { contrato:'', nome:'', celular:'', data:'', endereco:'', bairro:'', status:'', periodo:'', messageCustom:'' };
  for(const rawKey in raw){
    const norm = normalizeHeader(rawKey);
    const val = (raw[rawKey] || '').toString().trim();
    for(const field in KEY_MAP){
      if(KEY_MAP[field].some(k => norm.includes(k))){
        out[field] = val;
      }
    }
  }
  return out;
}

window.addEventListener('load', () => {
  document.getElementById('fileInput').addEventListener('change', handleFile);
  document.getElementById('btnExport').addEventListener('click', exportCSV);
  document.getElementById('filtro').addEventListener('input', renderTable);
  document.getElementById('selAllTop').addEventListener('change', toggleSelectAll);
  loadFromStorageAndRender();
});

function handleFile(e){
  const f = e.target.files && e.target.files[0];
  if(!f) return alert('Nenhum arquivo selecionado.');
  Papa.parse(f, {
    header: true,
    skipEmptyLines: true,
    complete: function(res){
      if(!res || !res.data || res.data.length === 0) return alert('Arquivo vazio ou formato inválido.');
      // map rows
      const mapped = [];
      res.data.forEach(r => {
        const m = mapRow(r);
        // require at least contrato or nome to consider valid
        if(m.contrato || m.nome){
          mapped.push(m);
        }
      });
      if(mapped.length === 0) return alert('Nenhum dado válido encontrado no CSV. Verifique cabeçalhos.');
      // dedupe by contrato if present, else by nome+endereco
      const seen = new Set();
      let added = 0;
      mapped.forEach(m => {
        const key = m.contrato ? ('C_'+m.contrato) : ('N_'+(m.nome||'')+'_'+(m.endereco||''));
        if(seen.has(key)) return;
        seen.add(key);
        registros.push(m);
        added++;
      });
      saveToStorage();
      renderTable();
      updateCounters();
      alert('✅ Importação concluída — ' + added + ' registros adicionados.');
      e.target.value = '';
    },
    error: function(err){
      console.error(err);
      alert('Erro ao ler CSV: ' + (err && err.message ? err.message : 'unknown'));
    }
  });
}

function renderTable(){
  const tbody = document.getElementById('tabelaBody');
  tbody.innerHTML = '';
  const filtro = (document.getElementById('filtro').value || '').toLowerCase().trim();

  registros.forEach((r, i) => {
    if(filtro){
      const hay = (r.contrato+' '+r.nome+' '+r.endereco+' '+r.bairro).toLowerCase();
      if(!hay.includes(filtro)) return;
    }
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="sel-col"><input class="rowSel" data-i="${i}" type="checkbox"></td>
      <td contenteditable="true" data-i="${i}" data-field="contrato">${escapeHtml(r.contrato)}</td>
      <td contenteditable="true" data-i="${i}" data-field="nome">${escapeHtml(r.nome)}</td>
      <td contenteditable="true" data-i="${i}" data-field="celular">${escapeHtml(r.celular)}</td>
      <td><input type="date" data-i="${i}" data-field="data" value="${toIsoDate(r.data)}"></td>
      <td contenteditable="true" data-i="${i}" data-field="endereco">${escapeHtml(r.endereco)}</td>
      <td contenteditable="true" data-i="${i}" data-field="bairro">${escapeHtml(r.bairro)}</td>
      <td>
        <select data-i="${i}" data-field="periodo">
          <option ${r.periodo==='Manhã'?'selected':''}>Manhã</option>
          <option ${r.periodo==='Tarde'?'selected':''}>Tarde</option>
          <option ${r.periodo==='Noite'?'selected':''}>Noite</option>
        </select>
      </td>
      <td><span data-i="${i}" class="status-cell">${escapeHtml(r.status || 'Aguardando')}</span></td>
      <td>
        <button class="action" data-action="preview" data-i="${i}">Prévia</button>
        <button class="action" data-action="edit" data-i="${i}">Editar Msg</button>
        <button class="action" data-action="send" data-i="${i}">Enviar</button>
        <button class="action" data-action="confirm" data-i="${i}">✅</button>
        <button class="action" data-action="reag" data-i="${i}">📅</button>
        <button class="action" data-action="cancel" data-i="${i}">❌</button>
        <button class="action" data-action="del" data-i="${i}">🗑️</button>
        <div id="preview_box_${i}" class="preview" style="display:none"></div>
        <div id="editor_box_${i}" style="display:none;margin-top:6px">
          <textarea id="msg_edit_${i}" style="width:100%;min-height:80px"></textarea>
          <div style="margin-top:6px">
            <button class="action" data-action="saveMsg" data-i="${i}">Salvar Msg</button>
            <button class="action" data-action="closeEditor" data-i="${i}">Fechar</button>
          </div>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // bind events
  document.querySelectorAll('[data-field]').forEach(el => {
    const i = el.dataset.i;
    const field = el.dataset.field;
    if(el.tagName === 'SELECT' || el.tagName === 'INPUT'){
      el.onchange = () => applyEdit(i, field, el.value);
    } else {
      el.onblur = () => applyEdit(i, field, el.innerText);
    }
  });
  document.querySelectorAll('.action').forEach(b => {
    b.onclick = (ev) => {
      const act = b.dataset.action;
      const idx = parseInt(b.dataset.i,10);
      if(act==='preview') previewMsg(idx);
      if(act==='edit') openEditor(idx);
      if(act==='send') sendOne(idx);
      if(act==='confirm') updateStatus(idx,'Confirmado');
      if(act==='reag') updateStatus(idx,'Reagendado');
      if(act==='cancel') updateStatus(idx,'Cancelado');
      if(act==='del') deleteRow(idx);
      if(act==='saveMsg') saveEditedMessage(idx);
      if(act==='closeEditor') closeEditor(idx);
    };
  });
  document.querySelectorAll('.rowSel').forEach(cb => cb.onchange = () => {
    const all = Array.from(document.querySelectorAll('.rowSel'));
    document.getElementById('selAllTop').checked = all.length>0 && all.every(x=>x.checked);
  });
}

function applyEdit(i, field, value){
  const idx = parseInt(i,10);
  if(!registros[idx]) return;
  if(field==='celular') value = (value||'').toString().replace(/\\D/g,'');
  registros[idx][field] = value;
  saveToStorage();
  renderTable();
  updateCounters();
}

function previewMsg(i){
  const box = document.getElementById('preview_box_'+i);
  if(!box) return;
  box.style.display='block';
  box.textContent = buildMessage(i);
  box.scrollIntoView({behavior:'smooth', block:'center'});
}

function openEditor(i){
  const box = document.getElementById('editor_box_'+i);
  const ta = document.getElementById('msg_edit_'+i);
  if(!box || !ta) return;
  ta.value = registros[i].messageCustom && registros[i].messageCustom.trim() ? registros[i].messageCustom : buildMessage(i);
  box.style.display='block';
}

function closeEditor(i){
  const box = document.getElementById('editor_box_'+i);
  if(box) box.style.display='none';
}

function saveEditedMessage(i){
  const ta = document.getElementById('msg_edit_'+i);
  registros[i].messageCustom = ta.value;
  saveToStorage();
  closeEditor(i);
  previewMsg(i);
}

function buildMessage(i){
  const r = registros[i];
  const tipo = document.getElementById('tipoMensagem').value;
  const templates = {
    antecipacao: `Olá, Prezado(a) Cliente Ligga!\\nAqui é do agendamento da Ligga Telecom, tudo bem? 😊\\n\\nIdentificamos a oportunidade de antecipar o seu atendimento para hoje!!!\\n\\n📅 Data: ${formatDate(r.data)}\\n⏰ Período: ${r.periodo || '—'}\\n\\nPodemos confirmar a antecipação de agenda para execução do serviço? ✅\\n1. CONFIRMAR\\n2. PERMANECER DATA ATUAL AGENDADA\\n(Nosso sistema não suporta chamadas e áudios)`,
    confirmacao: `Olá, tudo bem?\\nMeu contato é referente à Confirmação de Agendamento – Instalação de Internet | Ligga Telecom.\\n\\n📅 Agendado: ${formatDate(r.data)}\\n\\nPor favor, selecione uma das opções abaixo para que possamos dar andamento:\\n1️⃣ Confirmar atendimento\\n2️⃣ Preciso reagendar\\n3️⃣ Já cancelei os serviços\\n\\nObs.: Nosso sistema não aceita áudios ou chamadas telefônicas.\\nAguardamos sua resposta!\\nEquipe Ligga Telecom`,
    chegada: `Um técnico a serviço da Ligga Telecom está em frente à sua residência para realizar a visita técnica.\\n\\n⚠️ Pedimos que haja alguém maior de 18 anos no local durante o atendimento. ⚠️`
  };
  return (r.messageCustom && r.messageCustom.trim()) ? r.messageCustom : templates[tipo] || templates.antecipacao;
}

function sendOne(i){
  const r = registros[i];
  if(!r) return alert('Registro inválido');
  let phone = (r.celular||'').replace(/\\D/g,'');
  if(!phone) return alert('Registro não possui número de celular válido.');
  if(!phone.startsWith('55')) phone = '55'+phone;
  const message = buildMessage(i);
  tryOpenWhatsApp(phone, message);
  r.status = 'Confirmado';
  saveToStorage();
  renderTable();
  updateCounters();
}

function tryOpenWhatsApp(phone, message){
  const encoded = encodeURIComponent(message);
  const appUrl = `whatsapp://send?phone=${phone}&text=${encoded}`;
  const webUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encoded}`;
  const iframe = document.createElement('iframe');
  iframe.style.display='none';
  iframe.src = appUrl;
  document.body.appendChild(iframe);
  const fallback = setTimeout(()=> {
    window.open(webUrl,'_blank');
    try{ iframe.remove(); }catch(e){}
  },1200);
  document.addEventListener('visibilitychange', function onVis(){
    if(document.hidden){ clearTimeout(fallback); try{ iframe.remove(); }catch(e){} document.removeEventListener('visibilitychange', onVis); }
  });
}

function updateStatus(i, status){
  registros[i].status = status;
  saveToStorage();
  renderTable();
  updateCounters();
}

function deleteRow(i){
  if(!confirm('Excluir registro?')) return;
  registros.splice(i,1);
  saveToStorage();
  renderTable();
  updateCounters();
}

function toggleSelectAll(){
  const top = document.getElementById('selAllTop').checked;
  document.querySelectorAll('.rowSel').forEach(cb => cb.checked = top);
}

function getSelectedIndices(){
  return Array.from(document.querySelectorAll('.rowSel:checked')).map(cb => parseInt(cb.dataset.i,10));
}

function exportCSV(){
  const out = [];
  const seen = new Set();
  registros.forEach(r => {
    const key = r.contrato || (r.nome+'|'+r.endereco);
    if(key && seen.has(key)) return;
    if(key) seen.add(key);
    out.push(r);
  });
  if(out.length===0) return alert('Nada a exportar');
  const header = ['Contrato','Nome','Celular','Data Agendada','Endereço','Bairro','Período','Status'];
  const lines = [header.join(',')];
  out.forEach(r=>{
    const row = [
      `"${(r.contrato||'').replace(/"/g,'""')}"`,
      `"${(r.nome||'').replace(/"/g,'""')}"`,
      `"${(r.celular||'').replace(/"/g,'""')}"`,
      `"${(r.data||'').replace(/"/g,'""')}"`,
      `"${(r.endereco||'').replace(/"/g,'""')}"`,
      `"${(r.bairro||'').replace(/"/g,'""')}"`,
      `"${(r.periodo||'').replace(/"/g,'""')}"`,
      `"${(r.status||'').replace(/"/g,'""')}"`,
    ].join(',');
    lines.push(row);
  });
  const blob = new Blob([lines.join('\\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'export_atendimento.csv'; a.click(); URL.revokeObjectURL(a.href);
}

function updateCounters(){
  let aguard=0, conf=0, re=0, can=0;
  registros.forEach(r=>{
    const s = (r.status||'').toLowerCase();
    if(s.includes('confirm')) conf++;
    else if(s.includes('reag')) re++;
    else if(s.includes('cancel')) can++;
    else aguard++;
  });
  document.getElementById('contAguardando').innerText = aguard;
  document.getElementById('contConfirmado').innerText = conf;
  document.getElementById('contReagendado').innerText = re;
  document.getElementById('contCancelado').innerText = can;
}

function saveToStorage(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(registros)); }
function loadFromStorage(){ try{ const s = localStorage.getItem(STORAGE_KEY); registros = s ? JSON.parse(s) : []; }catch(e){ registros = []; } }
function loadFromStorageAndRender(){ loadFromStorage(); renderTable(); updateCounters(); }
function toIsoDate(v){
  if(!v) return '';
  const m = v.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{2,4})$/);
  if(m){ const d = m[1].padStart(2,'0'), mo = m[2].padStart(2,'0'), y = m[3].length===2 ? ('20'+m[3]) : m[3]; return `${y}-${mo}-${d}`; }
  if(/^\\d{4}-\\d{2}-\\d{2}$/.test(v)) return v;
  return '';
}
function formatDate(v){
  if(!v) return '';
  if(/^\\d{4}-\\d{2}-\\d{2}$/.test(v)){ const [y,m,d] = v.split('-'); return `${d}/${m}/${y}`; }
  return v;
}
function escapeHtml(s){ if(s===null||s===undefined) return ''; return s.toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// initialize storage on load
loadFromStorageAndRender();
