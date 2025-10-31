let dados = [];
let contadores = { aguardando: 0, confirmado: 0, reagendado: 0, cancelado: 0 };

document.getElementById("fileInput").addEventListener("change", e => {
  const arquivo = e.target.files[0];
  if (!arquivo) return;

  Papa.parse(arquivo, {
    header: true,
    skipEmptyLines: true,
    complete: resultado => {
      // Normaliza os nomes das colunas e remove linhas vazias
      dados = resultado.data.map(r => normalizarColunas(r)).filter(r => r.Contrato && r.Cliente && r.Celular);
      dados = removerDuplicados(dados);
      if (dados.length === 0) {
        alert("⚠️ Nenhum dado válido encontrado. Verifique se o CSV contém colunas: Contrato, Cliente, Celular, Data Agendamento, Endereço e Bairro.");
        return;
      }
      atualizarTabela(dados);
      atualizarContadores();
      salvarLocal();
      alert(`✅ Planilha importada com sucesso! (${dados.length} registros)`);
    },
    error: err => {
      console.error(err);
      alert("❌ Erro ao importar CSV!");
    }
  });
});

// Corrige cabeçalhos (remove acentos, espaços e deixa padronizado)
function normalizarColunas(linha) {
  const map = {};
  for (const chave in linha) {
    const chaveNormalizada = chave
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

    if (chaveNormalizada.includes("contrato")) map.Contrato = linha[chave];
    if (chaveNormalizada.includes("cliente")) map.Cliente = linha[chave];
    if (chaveNormalizada.includes("celular")) map.Celular = linha[chave];
    if (chaveNormalizada.includes("data")) map["Data Agendamento"] = linha[chave];
    if (chaveNormalizada.includes("endereco") || chaveNormalizada.includes("endereço")) map.Endereco = linha[chave];
    if (chaveNormalizada.includes("bairro")) map.Bairro = linha[chave];
  }
  return map;
}

function removerDuplicados(lista) {
  const unicos = {};
  return lista.filter(item => {
    if (unicos[item.Contrato]) return false;
    unicos[item.Contrato] = true;
    return true;
  });
}

function atualizarTabela(lista) {
  const tbody = document.querySelector("#tabela tbody");
  tbody.innerHTML = "";

  lista.forEach((linha, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${linha.Contrato || ""}</td>
      <td>${linha.Cliente || ""}</td>
      <td>${linha.Celular || ""}</td>
      <td>${linha["Data Agendamento"] || ""}</td>
      <td>${linha.Endereco || ""}</td>
      <td>${linha.Bairro || ""}</td>
      <td>
        <select id="periodo-${i}">
          <option>Manhã</option>
          <option>Tarde</option>
          <option>Noite</option>
        </select>
      </td>
      <td>
        <select id="status-${i}" onchange="atualizarContadores()">
          <option>Aguardando</option>
          <option>Confirmado</option>
          <option>Reagendado</option>
          <option>Cancelado</option>
        </select>
      </td>
      <td><button onclick="gerarMensagem(${i})">📩 Prévia</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function atualizarContadores() {
  contadores = { aguardando: 0, confirmado: 0, reagendado: 0, cancelado: 0 };
  dados.forEach((_, i) => {
    const s = document.getElementById(`status-${i}`);
    if (!s) return;
    const val = s.value.toLowerCase();
    if (val.includes("aguard")) contadores.aguardando++;
    if (val.includes("confirm")) contadores.confirmado++;
    if (val.includes("reagen")) contadores.reagendado++;
    if (val.includes("cancel")) contadores.cancelado++;
  });

  document.getElementById("aguardando").textContent = `Aguardando: ${contadores.aguardando}`;
  document.getElementById("confirmado").textContent = `Confirmado: ${contadores.confirmado}`;
  document.getElementById("reagendado").textContent = `Reagendado: ${contadores.reagendado}`;
  document.getElementById("cancelado").textContent = `Cancelado: ${contadores.cancelado}`;
  salvarLocal();
}

function gerarMensagem(i) {
  const d = dados[i];
  const periodo = document.getElementById(`periodo-${i}`).value;

  const msg = `Olá, ${d.Cliente}!\n\nAqui é do agendamento da Ligga Telecom 😊\n\n📅 Data: ${d["Data Agendamento"]}\n⏰ Período: ${periodo}\n🏠 Endereço: ${d.Endereco}, ${d.Bairro}\n\nPodemos confirmar o agendamento?\n1️⃣ Confirmar\n2️⃣ Reagendar\n3️⃣ Cancelar`;

  if (confirm("Deseja abrir o WhatsApp com esta mensagem?")) {
    const link = `https://wa.me/55${d.Celular}?text=${encodeURIComponent(msg)}`;
    window.open(link, "_blank");
  } else {
    alert("📋 Mensagem:\n\n" + msg);
  }
}

function salvarLocal() {
  localStorage.setItem("dadosLigga", JSON.stringify(dados));
}

window.onload = () => {
  const salvos = localStorage.getItem("dadosLigga");
  if (salvos) {
    dados = JSON.parse(salvos);
    atualizarTabela(dados);
    atualizarContadores();
  }
};

document.getElementById("exportarBtn").addEventListener("click", () => {
  const csv = Papa.unparse(dados);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "atendimento_cop_ligga.csv";
  link.click();
});
