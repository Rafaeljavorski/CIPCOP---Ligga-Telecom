let clientes = [];
let abaWhatsApp = null;
let tipoMensagemAtual = "antecipacao";

// utilitário
const s = v => (v === null || v === undefined) ? "" : String(v).trim();

// armazenamento local
function salvarLocal(){ localStorage.setItem('clientes', JSON.stringify(clientes)); }
function carregarLocal(){ const data = localStorage.getItem('clientes'); if(data){ clientes = JSON.parse(data); atualizarTabela(); } }
window.onload = () => { carregarLocal(); atualizarMensagemPadrao(); };

// ---------- SELECIONAR TIPO DE MENSAGEM ----------
function selecionarTipoMensagem(tipo) {
  tipoMensagemAtual = tipo;
  atualizarMensagemPadrao();
}

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
function gerarMensagem(c){
  const tipo = tipoMensagemAtual || "antecipacao";
  const logoUrl = "https://rafaeljavorski.github.io/CIPCOP---Ligga-Telecom/ligga.png";
  const rodape = `\n\n(Mensagem automática – Ligga Telecom)\n${logoUrl}`;

  if(tipo === "antecipacao"){
    return `Olá, Prezado(a) ${c.nome}!\n\nAqui é da Ligga Telecom, tudo bem? 😊\n\nIdentificamos a possibilidade de antecipar o seu atendimento.\n\n📅 Data: ${c.data}\n⏰ Período: ${c.periodo}\n🏠 Endereço: ${c.endereco}\n🔢 Contrato: ${c.contrato}\n\nVocê confirma a antecipação do seu atendimento?\n1️⃣ SIM, CONFIRMAR\n2️⃣ NÃO, MANTER DATA ATUAL\n\n(Nosso sistema não aceita áudios ou chamadas telefônicas.)${rodape}`;
  } else if(tipo === "confirmacao"){
    return `Olá, ${c.nome}!\n\nMeu contato é referente à Confirmação de Agendamento – Instalação de Internet | Ligga Telecom.\n\n📅 Agendado: ${c.data}\n⏰ Período: ${c.periodo}\n🏠 Endereço: ${c.endereco}\n🔢 Contrato: ${c.contrato}\n\nPor favor, selecione uma das opções abaixo:\n1️⃣ Confirmar atendimento\n2️⃣ Preciso reagendar\n3️⃣ Já cancelei os serviços\n\nAguardamos sua resposta!\nEquipe Ligga Telecom${rodape}`;
  } else { // chegada
    return `Olá, ${c.nome}!\n\nAqui é da Ligga Telecom. Nosso técnico está em frente ao seu endereço (${c.endereco}) para realizar a visita técnica. 🚀\n\n🔢 Contrato: ${c.contrato}\n⚠️ Pedimos que haja alguém maior de 18 anos no local durante o atendimento.\n\nAgradecemos a sua atenção!\nEquipe Ligga Telecom${rodape}`;
  }
}

function atualizarMensagemPadrao(){
  const exemplo = { nome:"Cliente", data:"dd/mm/aaaa", periodo:"Manhã/Tarde", endereco:"Rua Exemplo, 123", contrato:"123456" };
  document.getElementById('mensagemPadrao').value = gerarMensagem(exemplo);
}

// ---------- RESTANTE DO CÓDIGO ORIGINAL ----------
/* ... (mantém todas as funções do script original: atualizarTabela, enviarMensagem, importarCSV, etc.) */
