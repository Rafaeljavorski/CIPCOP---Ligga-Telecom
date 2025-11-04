let clientes = [];
let tipoMensagemAtual = "";
let periodoEscolhido = "";

const s = v => (v === null || v === undefined) ? "" : String(v).trim();

function salvarLocal(){ localStorage.setItem('clientes', JSON.stringify(clientes)); }
function carregarLocal(){ const data = localStorage.getItem('clientes'); if(data){ clientes = JSON.parse(data); atualizarTabela(); } }
window.onload = () => { carregarLocal(); atualizarMensagemPadrao(); };

function selecionarTipoMensagem(tipo) {
  tipoMensagemAtual = tipo;
  atualizarMensagemPadrao();

  // remove botões de período se já existirem
  const antigos = document.querySelector('.botoes-periodo');
  if (antigos) antigos.remove();

  // cria botões Manhã/Tarde somente ao clicar em Antecipação
  if (tipo === "antecipacao") {
    const container = document.querySelector(".botoes-mensagens");
    const div = document.createElement("div");
    div.className = "botoes-periodo";
    div.innerHTML = `
      <button class="msg-btn periodo-btn manha" onclick="definirPeriodo('Manhã')">☀️ Manhã</button>
      <button class="msg-btn periodo-btn tarde" onclick="definirPeriodo('Tarde')">🌙 Tarde</button>
    `;
    container.appendChild(div);
  }

  document.querySelectorAll(".msg-btn").forEach(b => b.classList.remove("ativo"));
  document.querySelector(`.msg-btn[onclick*="${tipo}"]`)?.classList.add("ativo");
}

function definirPeriodo(periodo) {
  periodoEscolhido = periodo;
  atualizarMensagemPadrao();
  const botoes = document.querySelector('.botoes-periodo');
  if (botoes) botoes.remove();
}

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

function gerarMensagem(c){
  const tipo = tipoMensagemAtual || "antecipacao";
  let periodoMsg = periodoEscolhido || c.periodo;

  if(tipo === "antecipacao"){
    return `Olá, Prezado(a) ${c.nome}!\n\nAqui é da Ligga Telecom, tudo bem? 😊\n\nIdentificamos a possibilidade de antecipar o seu atendimento.\n\n📅 Data: ${c.data}\n⏰ Período: ${periodoMsg}\n🏠 Endereço: ${c.endereco}\n🔢 Contrato: ${c.contrato}\n\nVocê confirma a antecipação do seu atendimento?\n1️⃣ SIM, CONFIRMAR\n2️⃣ NÃO, MANTER DATA ATUAL\n\n(Nosso sistema não aceita áudios ou chamadas telefônicas.)`;
  } else if(tipo === "confirmacao"){
    return `Olá, ${c.nome}!\n\nMeu contato é referente à Confirmação de Agendamento – Instalação de Internet | Ligga Telecom.\n\n📅 Agendado: ${c.data}\n⏰ Período: ${c.periodo}\n🏠 Endereço: ${c.endereco}\n🔢 Contrato: ${c.contrato}\n\nPor favor, selecione uma das opções abaixo:\n1️⃣ Confirmar atendimento\n2️⃣ Preciso reagendar\n3️⃣ Já cancelei os serviços\n\nAguardamos sua resposta!\nEquipe Ligga Telecom`;
  } else {
    return `Olá, ${c.nome}!\n\nAqui é da Ligga Telecom. Nosso técnico está em frente ao seu endereço (${c.endereco}) para realizar a visita técnica. 🚀\n\n🔢 Contrato: ${c.contrato}\n⚠️ Pedimos que haja alguém maior de 18 anos no local durante o atendimento.\n\nAgradecemos a sua atenção!\nEquipe Ligga Telecom`;
  }
}

function atualizarMensagemPadrao(){
  const exemplo = { nome:"Cliente", data:"dd/mm/aaaa", periodo:"Manhã/Tarde", endereco:"Rua Exemplo, 123", contrato:"123456" };
  document.getElementById('mensagemPadrao').value = gerarMensagem(exemplo);
}

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
        <button class="btn-enviar" onclick="enviarMensagem(${i})">
          <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" width="16" style="vertical-align:middle;margin-right:4px;">
          Enviar
        </button>
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

function enviarMensagem(i){
  const c = clientes[i];
  const numeroRaw = s(c.celular).replace(/\D/g,"");
  if(!numeroRaw){ alert("Número inválido para o contrato " + (c.contrato||"")); return; }

  const msg = gerarMensagem(c);
  const url = `https://web.whatsapp.com/send?phone=55${numeroRaw}&text=${encodeURIComponent(msg)}`;
  window.open(url, "whatsappMsg");

  clientes[i].status = "Mensagem enviada";
  atualizarTabela(); salvarLocal();
}

// Importação, exportação e contadores — mantidos iguais
function importarCSV(e){
  const file = e.target.files[0];
  if(!file) return alert("Arquivo não selecionado.");
  Papa.parse(file, { header:true, skipEmptyLines:true, complete: function(res){
    res.data.forEach(row => {
      const nome = s(row["Nome"] || row["Cliente"] || "");
      const celular = s(row["Celular"] || row["Telefone"] || "");
      const contrato = s(row["Contrato"] || "");
      const data = s(row["Data"] || "");
      const periodo = s(row["Período"] || "");
      const endereco = s(row["Endereço"] || "");
      if(!contrato || !nome || !celular) return;
      clientes.push({ nome, celular, contrato, data, periodo, endereco, status:"Importado" });
    });
    atualizarTabela(); salvarLocal();
  }});
}

function exportarCSV(){
  let csv = "Cliente,Celular,Contrato,Data,Período,Endereço,Status\n";
  clientes.forEach(c => {
    csv += `"${c.nome}","${c.celular}","${c.contrato}","${c.data}","${c.periodo}","${c.endereco}","${c.status}"\n`;
  });
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'relatorio_visitas.csv'; a.click();
}

function selecionarTodosClientes(chk){
  document.querySelectorAll('.checkContato').forEach(cb => cb.checked = chk.checked);
}

function excluirSelecionados(){
  const checked = Array.from(document.querySelectorAll('.checkContato:checked'));
  if(checked.length === 0) return alert("Nenhum contato selecionado.");
  if(!confirm(`Excluir ${checked.length} contatos selecionados?`)) return;
  const indices = checked.map(cb => parseInt(cb.dataset.index,10));
  clientes = clientes.filter((_,i) => !indices.includes(i));
  atualizarTabela(); salvarLocal();
}

function filtrarPorContrato(){
  const termo = s(document.getElementById('buscaContrato').value).toLowerCase();
  document.querySelectorAll('#tabela tbody tr').forEach(tr=>{
    const text = tr.innerText.toLowerCase();
    tr.style.display = text.includes(termo) ? '' : 'none';
  });
}

function atualizarContadores(){
  const cont = {Aguardando:0,Confirmado:0,Reagendado:0,Cancelado:0};
  clientes.forEach(c => { cont[c.status] = (cont[c.status]||0) + 1; });
  document.getElementById('contAguardando').innerText = cont.Aguardando || 0;
  document.getElementById('contConfirmado').innerText = cont.Confirmado || 0;
  document.getElementById('contReagendado').innerText = cont.Reagendado || 0;
  document.getElementById('contCancelado').innerText = cont.Cancelado || 0;
}
