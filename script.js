let clientes = [];
let tipoMensagemAtual = "";
let periodoEscolhido = "";

// ===============================
// Salvar e carregar clientes
// ===============================
function salvarLocal() {
  localStorage.setItem("clientes", JSON.stringify(clientes));
}

function carregarLocal() {
  const data = localStorage.getItem("clientes");
  if (data) {
    clientes = JSON.parse(data);
    atualizarTabela();
  }
}

window.onload = () => {
  carregarLocal();
  atualizarMensagemPadrao();
};

// ===============================
// Selecionar tipo de mensagem
// ===============================
function selecionarTipoMensagem(tipo) {
  tipoMensagemAtual = tipo;
  atualizarMensagemPadrao();

  // Remove botões antigos, se houver
  const antigos = document.querySelector(".botoes-periodo");
  if (antigos) antigos.remove();

  // Adiciona botões "☀️ Manhã" e "🌙 Tarde" apenas se o tipo for antecipação
  if (tipo === "antecipacao") {
    const container = document.querySelector(".botoes-mensagens");
    const div = document.createElement("div");
    div.className = "botoes-periodo";
    div.innerHTML = `
      <button class="msg-btn periodo-btn" onclick="definirPeriodo('Manhã')">☀️ Manhã</button>
      <button class="msg-btn periodo-btn" onclick="definirPeriodo('Tarde')">🌙 Tarde</button>
    `;
    container.insertAdjacentElement("afterend", div);
  }

  // Destaca o botão selecionado
  document.querySelectorAll(".msg-btn").forEach((b) => b.classList.remove("ativo"));
  document.querySelector(`.msg-btn[onclick*="${tipo}"]`)?.classList.add("ativo");
}

// Define o período escolhido e remove os botões
function definirPeriodo(periodo) {
  periodoEscolhido = periodo;
  atualizarMensagemPadrao();
  const botoes = document.querySelector(".botoes-periodo");
  if (botoes) botoes.remove();
}

// ===============================
// Adicionar cliente manualmente
// ===============================
function adicionarCliente() {
  const nome = document.getElementById("cliente").value.trim();
  const celular = document.getElementById("celular").value.trim();
  const contrato = document.getElementById("contrato").value.trim();
  const data = document.getElementById("data").value.trim();
  const periodo = document.getElementById("periodo").value.trim();
  const endereco = document.getElementById("endereco").value.trim();

  if (!nome || !celular || !contrato) {
    alert("Preencha nome, celular e contrato do cliente.");
    return;
  }

  clientes.push({ nome, celular, contrato, data, periodo, endereco, status: "Aguardando" });
  atualizarTabela();
  salvarLocal();
}

// ===============================
// Gerar mensagem conforme o tipo
// ===============================
function gerarMensagem(c) {
  const tipo = tipoMensagemAtual || "antecipacao";
  const periodoMsg = periodoEscolhido || c.periodo || "Manhã/Tarde";

  if (tipo === "antecipacao") {
    return `Olá, Prezado(a) ${c.nome}!\n\nAqui é da Ligga Telecom, tudo bem? 😊\n\nIdentificamos a possibilidade de antecipar o seu atendimento.\n\n📅 Data: ${c.data}\n⏰ Período: ${periodoMsg}\n🏠 Endereço: ${c.endereco}\n🔢 Contrato: ${c.contrato}\n\nVocê confirma a antecipação do seu atendimento?\n1️⃣ SIM, CONFIRMAR\n2️⃣ NÃO, MANTER DATA ATUAL\n\n(Nosso sistema não aceita áudios ou chamadas telefônicas.)`;
  } else if (tipo === "confirmacao") {
    return `Olá, ${c.nome}!\n\nMeu contato é referente à Confirmação de Agendamento – Instalação de Internet | Ligga Telecom.\n\n📅 Agendado: ${c.data}\n⏰ Período: ${c.periodo}\n🏠 Endereço: ${c.endereco}\n🔢 Contrato: ${c.contrato}\n\nPor favor, selecione uma das opções abaixo:\n1️⃣ Confirmar atendimento\n2️⃣ Preciso reagendar\n3️⃣ Já cancelei os serviços\n\nAguardamos sua resposta!\nEquipe Ligga Telecom`;
  } else {
    return `Olá, ${c.nome}!\n\nAqui é da Ligga Telecom. Nosso técnico está em frente ao seu endereço (${c.endereco}) para realizar a visita técnica. 🚀\n\n🔢 Contrato: ${c.contrato}\n⚠️ Pedimos que haja alguém maior de 18 anos no local durante o atendimento.\n\nAgradecemos a sua atenção!\nEquipe Ligga Telecom`;
  }
}

function atualizarMensagemPadrao() {
  const exemplo = {
    nome: "Cliente",
    contrato: "123456",
    data: "dd/mm/aaaa",
    periodo: "Manhã/Tarde",
    endereco: "Rua Exemplo, 123",
  };
  document.getElementById("mensagemPadrao").value = gerarMensagem(exemplo);
}

// ===============================
// Atualizar tabela de clientes
// ===============================
function atualizarTabela() {
  const tbody = document.querySelector("#tabela tbody");
  tbody.innerHTML = "";
  clientes.forEach((c, i) => {
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
        <button onclick="enviarMensagem(${i})">Enviar</button>
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

// ===============================
// Ações
// ===============================
function atualizarStatus(i, status) {
  clientes[i].status = status;
  atualizarTabela();
  salvarLocal();
}

function enviarMensagem(i) {
  const c = clientes[i];
  const numeroRaw = (c.celular || "").replace(/\D/g, "");
  if (!numeroRaw) return alert("Número inválido para o contrato " + (c.contrato || ""));

  const msg = gerarMensagem(c);
  const url = `https://web.whatsapp.com/send?phone=55${numeroRaw}&text=${encodeURIComponent(msg)}`;
  window.open(url, "whatsappMsg");

  clientes[i].status = "Mensagem enviada";
  atualizarTabela();
  salvarLocal();
}

// ===============================
// Importar / Exportar CSV
// ===============================
function importarCSV(e) {
  const file = e.target.files[0];
  if (!file) return alert("Arquivo não selecionado.");

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (res) {
      res.data.forEach((row) => {
        const nome = row["Nome"] || row["Cliente"] || "";
        const celular = row["Celular"] || row["Telefone"] || "";
        const contrato = row["Contrato"] || "";
        const data = row["Data Agendada"] || row["Data"] || "";
        const periodo = row["Período Agendado"] || row["Período"] || "";
        const endereco = row["Endereço"] || "";
        if (!contrato || !nome || !celular) return;
        clientes.push({ nome, celular, contrato, data, periodo, endereco, status: "Importado" });
      });
      atualizarTabela();
      salvarLocal();
    },
  });
}

function exportarCSV() {
  let csv = "Cliente,Celular,Contrato,Data,Período,Endereço,Status\n";
  clientes.forEach((c) => {
    csv += `"${c.nome}","${c.celular}","${c.contrato}","${c.data}","${c.periodo}","${c.endereco}","${c.status}"\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "relatorio_visitas.csv";
  a.click();
}

// ===============================
// Utilidades
// ===============================
function selecionarTodosClientes(chk) {
  document.querySelectorAll(".checkContato").forEach((cb) => (cb.checked = chk.checked));
}

function excluirSelecionados() {
  const selecionados = Array.from(document.querySelectorAll(".checkContato:checked"));
  if (!selecionados.length) return alert("Nenhum contato selecionado.");
  if (!confirm(`Excluir ${selecionados.length} contatos selecionados?`)) return;
  const indices = selecionados.map((cb) => parseInt(cb.dataset.index));
  clientes = clientes.filter((_, i) => !indices.includes(i));
  atualizarTabela();
  salvarLocal();
}

function filtrarPorContrato() {
  const termo = document.getElementById("buscaContrato").value.toLowerCase();
  document.querySelectorAll("#tabela tbody tr").forEach((tr) => {
    tr.style.display = tr.innerText.toLowerCase().includes(termo) ? "" : "none";
  });
}

function atualizarContadores() {
  const cont = { Aguardando: 0, Confirmado: 0, Reagendado: 0, Cancelado: 0 };
  clientes.forEach((c) => (cont[c.status] = (cont[c.status] || 0) + 1));
  document.getElementById("contAguardando").innerText = cont.Aguardando || 0;
  document.getElementById("contConfirmado").innerText = cont.Confirmado || 0;
  document.getElementById("contReagendado").innerText = cont.Reagendado || 0;
  document.getElementById("contCancelado").innerText = cont.Cancelado || 0;
}
