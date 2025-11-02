let clientes = [];
let abaWhatsApp = null;

// ----- LOCAL STORAGE -----
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

// ----- ADICIONAR -----
function adicionarCliente() {
  const nome = document.getElementById("cliente").value;
  const celular = document.getElementById("celular").value;
  const contrato = document.getElementById("contrato").value;
  const data = document.getElementById("data").value;
  const periodo = document.getElementById("periodo").value;
  const endereco = document.getElementById("endereco").value;

  if (!nome || !celular || !contrato || !data || !periodo || !endereco) {
    alert("Preencha todos os campos!");
    return;
  }

  clientes.push({
    nome,
    celular,
    contrato,
    data,
    periodo,
    endereco,
    status: "Aguardando",
  });

  atualizarTabela();
  limparCampos();
  salvarLocal();
}

function limparCampos() {
  ["cliente", "celular", "contrato", "data", "periodo", "endereco"].forEach(
    (id) => (document.getElementById(id).value = "")
  );
}

// ----- MENSAGENS -----
function gerarMensagem(c) {
  const tipo = document.getElementById("tipoMensagem").value;

  if (tipo === "antecipacao") {
    return `Olá, Prezado(a) ${c.nome}!\n\nAqui é da Ligga Telecom, tudo bem? 😊\n\nIdentificamos a possibilidade de antecipar o seu atendimento para hoje!\n📅 Nova data sugerida: ${c.data}\n📍 Endereço: ${c.endereco}\n⏰ Período: ${c.periodo}\n\nVocê confirma a antecipação do seu atendimento?\n1️⃣ SIM, CONFIRMAR\n2️⃣ NÃO, MANTER DATA ATUAL\n\n(Nosso sistema não suporta chamadas ou áudios)`;
  } else if (tipo === "confirmacao") {
    return `Olá, ${c.nome}! Tudo bem?\n\nAqui é da Ligga Telecom! Confirmando seu agendamento:\n📅 Data: ${c.data}\n📍 Endereço: ${c.endereco}\n⏰ Período: ${c.periodo}\n\nPor favor, responda uma das opções abaixo:\n1️⃣ Confirmar atendimento\n2️⃣ Preciso reagendar\n3️⃣ Cancelar visita\n\nAguardamos sua resposta!\nEquipe Ligga Telecom.`;
  } else if (tipo === "chegada") {
    return `Olá, ${c.nome}!\n\nAqui é da Ligga Telecom. Nosso técnico está chegando ao endereço:\n📍 ${c.endereco}\n\n⚠️ Pedimos que haja alguém maior de 18 anos no local durante o atendimento.\n\nAgradecemos sua atenção!`;
  }
}

function atualizarMensagemPadrao() {
  const c = { nome: "Cliente", data: "dd/mm/aaaa", periodo: "Período", endereco: "Endereço" };
  document.getElementById("mensagemPadrao").value = gerarMensagem(c);
}

// ----- TABELA -----
function atualizarTabela() {
  const tbody = document.querySelector("#tabela tbody");
  tbody.innerHTML = "";

  clientes.forEach((c, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" class="selCliente" data-i="${i}"></td>
      <td>${c.nome}</td>
      <td contenteditable="true" onblur="alterarNumero(${i},this.innerText)">${c.celular}</td>
      <td contenteditable="true" onblur="alterarContrato(${i},this.innerText)">${c.contrato}</td>
      <td>${c.data}</td>
      <td>${c.periodo}</td>
      <td>${c.endereco}</td>
      <td>${c.status}</td>
      <td>
        <button onclick="enviarMensagem(${i})">📤 Enviar</button>
        <button onclick="atualizarStatus(${i},'Confirmado')">✅ Confirmar</button>
        <button onclick="atualizarStatus(${i},'Reagendado')">📅 Reagendar</button>
        <button onclick="atualizarStatus(${i},'Cancelado')">❌ Cancelar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  atualizarContadores();
  salvarLocal();
}

// ----- EDIÇÃO -----
function alterarNumero(i, numero) {
  clientes[i].celular = numero;
  salvarLocal();
}
function alterarContrato(i, valor) {
  clientes[i].contrato = valor;
  salvarLocal();
}
function atualizarStatus(i, status) {
  clientes[i].status = status;
  atualizarTabela();
  salvarLocal();
}

// ----- CONTADORES -----
function atualizarContadores() {
  const cont = { aguardando: 0, confirmado: 0, reagendado: 0, cancelado: 0 };
  clientes.forEach((c) => {
    if (c.status.includes("Aguardando") || c.status === "Mensagem enviada")
      cont.aguardando++;
    else if (c.status === "Confirmado") cont.confirmado++;
    else if (c.status === "Reagendado") cont.reagendado++;
    else if (c.status === "Cancelado") cont.cancelado++;
  });
  document.getElementById("contAguardando").innerText = cont.aguardando;
  document.getElementById("contConfirmado").innerText = cont.confirmado;
  document.getElementById("contReagendado").innerText = cont.reagendado;
  document.getElementById("contCancelado").innerText = cont.cancelado;
}

// ----- ENVIO -----
function enviarMensagem(i) {
  const c = clientes[i];
  const numero = c.celular.replace(/\D/g, "");
  const msg = gerarMensagem(c);

  if (!numero || !msg) {
    alert("Número ou mensagem inválida!");
    return;
  }

  const url = `https://web.whatsapp.com/send?phone=55${numero}&text=${encodeURIComponent(msg)}`;

  // Reutiliza a mesma aba
  if (abaWhatsApp && !abaWhatsApp.closed) {
    abaWhatsApp.location.href = url;
  } else {
    abaWhatsApp = window.open(url, "whatsLigga");
  }

  c.status = "Mensagem enviada";
  atualizarTabela();
  salvarLocal();
}

// ----- SELEÇÃO MÚLTIPLA -----
function excluirSelecionados() {
  const marcados = document.querySelectorAll(".selCliente:checked");
  if (marcados.length === 0) {
    alert("Selecione pelo menos um cliente!");
    return;
  }
  if (!confirm("Deseja excluir os clientes selecionados?")) return;
  const indices = Array.from(marcados).map((cb) => parseInt(cb.dataset.i));
  clientes = clientes.filter((_, idx) => !indices.includes(idx));
  atualizarTabela();
  salvarLocal();
}
function selecionarTodos(chk) {
  document.querySelectorAll(".selCliente").forEach((c) => (c.checked = chk.checked));
}

// ----- IMPORTAÇÃO -----
function importarCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      results.data.forEach((row) => {
        const dataStr = row["Data agendada"] || row["Data"] || "";
        const hora = (row["Previsão de chegada ao local"] || "08:00").split(":")[0];
        const periodo = parseInt(hora) < 13 ? "Manhã" : "Tarde";

        clientes.push({
          nome: row["Nome"] || "",
          celular: row["Celular"] || row["Telefone"] || "",
          contrato: row["Contrato"] || "",
          data: dataStr,
          periodo: periodo,
          endereco: row["Endereço"] || row["Endereço do Contrato"] || "",
          status: "Importado",
        });
      });
      atualizarTabela();
      salvarLocal();
    },
  });
}

// ----- EXPORTAÇÃO -----
function exportarCSV() {
  const unicos = clientes.filter(
    (c, i, self) => i === self.findIndex((t) => t.contrato === c.contrato)
  );

  let csv = "Cliente,Celular,Contrato,Data,Período,Endereço,Status\n";
  unicos.forEach((c) => {
    csv += `"${c.nome}","${c.celular}","${c.contrato}","${c.data}","${c.periodo}","${c.endereco}","${c.status}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "relatorio_visitas.csv";
  link.click();
}
