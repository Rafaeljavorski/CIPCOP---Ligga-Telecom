// script.js — versão corrigida (substitua todo o arquivo por este)
let clientes = [];
let abaWhatsApp = null;

// util: normaliza texto null->"" e trim
const s = v => (v === null || v === undefined) ? "" : String(v).trim();

// armazenamento local
function salvarLocal(){ localStorage.setItem('clientes', JSON.stringify(clientes)); }
function carregarLocal(){ const data = localStorage.getItem('clientes'); if(data){ clientes = JSON.parse(data); atualizarTabela(); } }
window.onload = () => { carregarLocal(); atualizarMensagemPadrao(); };

// ---------- ADICIONAR MANUAL ----------
function adicionarCliente(){
  const nome = s(document.getElementById('cliente').value);
  const celular = s(document.getElementById('celular').value);
  const contrato = s(document.getElementById('contrato').value);
  const data = s(document.getElementById('data').value);
  const periodo = s(document.getElementById('periodo').value);
  const endereco = s(document.getElementById('endereco').value);
  if(!contrato) return alert("Preencha o número do contrato.");
  if(!nome) return alert("Preencha o nome do cliente.");
  if(!celular) return alert("Preencha o celular do cliente.");
  clientes.push({ nome, celular, contrato, data, periodo, endereco, status:"Aguardando" });
  atualizarTabela(); salvarLocal();
}

// ---------- MENSAGENS ----------
// Generate message - uses today's date override
function gerarMensagem(c){
  const tipo = document.getElementById('tipoMensagem').value || 'antecipacao';
  const dataUso = hojeFormatado(); // always today's date as requested
  const rodape = '\n\n🟠 Ligga Telecom 🟠';
  if(tipo === 'antecipacao'){
    return `Olá, Prezado(a) ${c.nome}!\n\nAqui é da Ligga Telecom, tudo bem? 😊\n\nIdentificamos a possibilidade de antecipar o seu atendimento.\n\n📅 Data: ${dataUso}\n⏰ Período: ${c.periodo}\n🏠 Endereço: ${c.endereco}\n\nVocê confirma a antecipação do seu atendimento?\n1️⃣ SIM, CONFIRMAR\n2️⃣ NÃO, MANTER DATA ATUAL\n\n(Nosso sistema não aceita áudios ou chamadas telefônicas.)${rodape}`;
  } else if(tipo === 'confirmacao'){
    return `Olá, ${c.nome}! Tudo bem?\n\nMeu contato é referente à Confirmação de Agendamento – Instalação de Internet | Ligga Telecom.\n\n📅 Agendado: ${dataUso}\n⏰ Período: ${c.periodo}\n🏠 Endereço: ${c.endereco}\n\nPor favor, selecione uma das opções abaixo:\n1️⃣ Confirmar atendimento\n2️⃣ Preciso reagendar\n3️⃣ Já cancelei os serviços\n\nAguardamos sua resposta!${rodape}`;
  } else {
    return `Olá, ${c.nome}!\n\nAqui é da Ligga Telecom. Nosso técnico está em frente ao seu endereço (${c.endereco}) para realizar a visita técnica. 🚀\n\n⚠️ Pedimos que haja alguém maior de 18 anos no local durante o atendimento. ⚠️\n\nAgradecemos a sua atenção!${rodape}`;
  }
}


function atualizarMensagemPadrao(){
  const exemplo = { nome:"Cliente", data:"dd/mm/aaaa", periodo:"Manhã/Tarde", endereco:"Rua Exemplo, 123" };
  document.getElementById('mensagemPadrao').value = gerarMensagem(exemplo);
}

// ---------- TABELA ----------
function atualizarTabela(){
  const tbody = document.querySelector("#tabela tbody");
  tbody.innerHTML = "";
  clientes.forEach((c,i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" class="checkContato" data-index="${i}"></td>
      <td>${c.nome}</td>
      <td contenteditable="true" onblur="clientes[${i}].celular=this.innerText">${c.celular}</td>
      <td>${c.contrato}</td>
      <td>${c.data}</td>
      <td>${c.periodo}</td>
      <td>${c.endereco}</td>
      <td>${c.status}</td>
      <td>
        <button onclick="enviarMensagem(${i})">📤 Enviar</button>
        <button onclick="atualizarStatus(${i},'Confirmado')">✅</button>
        <button onclick="atualizarStatus(${i},'Reagendado')">📅</button>
        <button onclick="atualizarStatus(${i},'Cancelado')">❌</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  atualizarContadores();
  salvarLocal();
}

function atualizarStatus(i, status){ clientes[i].status = status; atualizarTabela(); salvarLocal(); }

// ---------- ABA FIXA WHATS (ABRIR UMA VEZ) ----------
function abrirAbaWhatsApp(){
  // botão é ação de usuário -> pop-up permitido
  if(!abaWhatsApp || abaWhatsApp.closed){
    abaWhatsApp = window.open("https://web.whatsapp.com", "whatsappWindow");
    // small timeout to let it start
    setTimeout(()=>{ try { abaWhatsApp.focus(); }catch(e){} }, 700);
    alert("Aba do WhatsApp Web aberta. Aguarde o carregamento (se necessário) e mantenha-a aberta.");
  } else {
    try { abaWhatsApp.focus(); } catch(e){}
  }
}

// ---------- ENVIO (usa aba fixa) ----------
function enviarMensagem(i){
  const c = clientes[i];
  // validações
  const numeroRaw = s(c.celular).replace(/\D/g,"");
  if(!numeroRaw){
    alert("Número inválido para o contrato " + (c.contrato||""));
    return;
  }

  // garante mensagem gerada com os dados atuais
  const msg = gerarMensagem(c);

  // url para whatsapp web
  const url = `https://web.whatsapp.com/send?phone=55${numeroRaw}&text=${encodeURIComponent(msg)}`;

  if(abaWhatsApp && !abaWhatsApp.closed){
    // reaproveita aba já aberta
    try {
      abaWhatsApp.location.href = url;
      try { abaWhatsApp.focus(); } catch(e){}
    } catch(e) {
      // caso o navegador bloqueie, abre na mesma janela nomeada
      abaWhatsApp = window.open(url, "whatsappWindow");
    }
  } else {
    // se usuário não abriu a aba, abre aqui (primeiro click)
    abaWhatsApp = window.open(url, "whatsappWindow");
    setTimeout(()=>{ try { abaWhatsApp.focus(); } catch(e){} }, 700);
  }

  clientes[i].status = "Mensagem enviada";
  atualizarTabela();
  salvarLocal();
}

// ---------- IMPORTAÇÃO CSV (com regras solicitadas) ----------
function importarCSV(e){
  const file = e.target.files[0];
  if(!file) return alert("Arquivo não selecionado.");
  Papa.parse(file, { header:true, skipEmptyLines:true, complete: function(res){
    let added = 0;
    res.data.forEach(row => {
      // nomes possíveis
      const nomeOrig = s(row["Nome"] || row["nome"] || row["Cliente"] || row["cliente"] || "");
      const nomeSolicitante = s(row["Nome Solicitante"] || row["Nome solicitante"] || row["nome solicitante"] || row["Nome do Solicitante"] || row["Nome do solicitante"] || "");
      const nome = nomeOrig || nomeSolicitante;

      // telefones possíveis
      const telOrig = s(row["Celular"] || row["celular"] || row["Telefone"] || row["telefone"] || "");
      const telSolicitante = s(row["Telefone do Solicitante"] || row["Telefone do solicitante"] || row["telefone do solicitante"] || row["Telefone Contato"] || "");
      const celular = telOrig || telSolicitante;

      // contrato (prioridade)
      const contrato = s(row["Contrato"] || row["contrato"] || row["ID Sistema Externo"] || row["ID Atividade"] || "");

      // data
      const data = s(row["Data agendada"] || row["Data Agendamento"] || row["data agendada"] || row["data"] || "");

      // período (usamos 'Período Agendado' prioritariamente)
      let periodoRaw = s(row["Período Agendado"] || row["Período agendado"] || row["periodo agendado"] || row["Período"] || row["periodo"] || "");
      let periodo = formatarPeriodo(periodoRaw);

      // endereço (várias possibilidades)
      const endereco = s(row["Endereço do Contrato"] || row["Endereço"] || row["Endereco"] || row["endereco"] || row["Endereço Resolvido"] || "");

      // filtros: precisamos de contrato e pelo menos nome e celular
      if(!contrato) {
        // se não tem contrato, ignorar linha
        return;
      }
      if(!nome || !celular) {
        // se faltar nome ou celular, ignorar a linha (evita linhas vazias)
        return;
      }

      clientes.push({ nome, celular, contrato, data, periodo, endereco, status:"Importado" });
      added++;
    });

    atualizarTabela();
    salvarLocal();
    alert(`${added} linhas importadas com sucesso.`);
  }});
}

// ---------- formata período a partir do campo bruto ----------
function formatarPeriodo(raw){
  raw = s(raw).toLowerCase();
  if(!raw) return "Tarde"; // default
  // se contém manhã ou 08 ou 07..13 => manhã
  if(raw.includes('manhã') || raw.includes('manha') || raw.match(/\b(0?[7-9]|1[0-3])\b/)) return "Manhã";
  // se contém tarde ou 13..23 => tarde
  if(raw.includes('tarde') || raw.match(/\b(1[3-9]|2[0-3])\b/)) return "Tarde";
  // se contém ranges tipo "08 - 12" ou "08 - 12 (..)" detecta limite
  const nums = raw.match(/\d{1,2}/g);
  if(nums && nums.length){
    const first = parseInt(nums[0],10);
    if(!isNaN(first) && first <= 13) return "Manhã";
  }
  return "Tarde";
}

// ---------- EXPORTAR ----------
function exportarCSV(){
  const clientesUnicos = clientes.filter((c,index,self) => index === self.findIndex(t => t.contrato === c.contrato));
  let csv = "Cliente,Celular,Contrato,Data,Período,Endereço,Status\n";
  clientesUnicos.forEach(c => {
    csv += `"${c.nome}","${c.celular}","${c.contrato}","${c.data}","${c.periodo}","${c.endereco}","${c.status}"\n`;
  });
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'relatorio_visitas.csv'; a.click();
}

// ---------- SELECIONAR / EXCLUIR ----------
function selecionarTodosClientes(chk){
  document.querySelectorAll('.checkContato').forEach(cb => cb.checked = chk.checked);
}

function excluirSelecionados(){
  const checked = Array.from(document.querySelectorAll('.checkContato:checked'));
  if(checked.length === 0) return alert("Nenhum contato selecionado.");
  if(!confirm(`Excluir ${checked.length} contatos selecionados?`)) return;
  const índices = checked.map(cb => parseInt(cb.dataset.index,10));
  clientes = clientes.filter((_,i) => !índices.includes(i));
  atualizarTabela(); salvarLocal();
}

// ---------- FILTRO (busca livre por contrato/nome/endereço/celular) ----------
function filtrarPorContrato(){
  const termo = s(document.getElementById('buscaContrato').value).toLowerCase();
  document.querySelectorAll('#tabela tbody tr').forEach(tr=>{
    const text = tr.innerText.toLowerCase();
    tr.style.display = text.includes(termo) ? '' : 'none';
  });
}

// ---------- CONTADORES ----------
function atualizarContadores(){
  const cont = {Aguardando:0,Confirmado:0,Reagendado:0,Cancelado:0};
  clientes.forEach(c => { cont[c.status] = (cont[c.status]||0) + 1; });
  document.getElementById('contAguardando').innerText = cont.Aguardando || 0;
  document.getElementById('contConfirmado').innerText = cont.Confirmado || 0;
  document.getElementById('contReagendado').innerText = cont.Reagendado || 0;
  document.getElementById('contCancelado').innerText = cont.Cancelado || 0;
}
