document.getElementById("csvFile").addEventListener("change", handleFileUpload);

let dados = [];

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) {
    alert("Nenhum arquivo selecionado!");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;

    // Detecta automaticamente o separador
    const separador = text.includes(";") ? ";" : ",";
    const linhas = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    const cabecalho = linhas[0].split(separador).map(c => c.trim());
    const linhasDados = linhas.slice(1);

    // Colunas esperadas
    const camposEsperados = ["Contrato", "Cliente", "Celular", "Data Agendamento", "Endereço", "Bairro"];
    const indices = camposEsperados.map(campo => cabecalho.indexOf(campo));

    if (indices.includes(-1)) {
      alert("Colunas inválidas! Verifique se o CSV contém: " + camposEsperados.join(", "));
      return;
    }

    dados = linhasDados.map(linha => {
      const cols = linha.split(separador);
      return {
        contrato: cols[indices[0]]?.trim() || "",
        cliente: cols[indices[1]]?.trim() || "",
        celular: cols[indices[2]]?.trim() || "",
        data: cols[indices[3]]?.trim() || "",
        endereco: cols[indices[4]]?.trim() || "",
        bairro: cols[indices[5]]?.trim() || "",
        status: "Aguardando"
      };
    }).filter(d => d.contrato && d.celular);

    if (dados.length === 0) {
      alert("Nenhum dado válido encontrado no CSV!");
      return;
    }

    alert("Planilha importada com sucesso!");
    atualizarTabela();
    atualizarContadores();
  };

  reader.readAsText(file, "UTF-8");
}

function atualizarTabela() {
  const tabela = document.getElementById("tabelaDados");
  if (!tabela) return;

  tabela.innerHTML = `
    <tr>
      <th>Contrato</th>
      <th>Cliente</th>
      <th>Celular</th>
      <th>Data Agendamento</th>
      <th>Endereço</th>
      <th>Bairro</th>
      <th>Status</th>
    </tr>
  `;

  dados.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.contrato}</td>
      <td>${d.cliente}</td>
      <td>${d.celular}</td>
      <td>${d.data}</td>
      <td>${d.endereco}</td>
      <td>${d.bairro}</td>
      <td>${d.status}</td>
    `;
    tabela.appendChild(tr);
  });
}

function atualizarContadores() {
  let aguardando = dados.filter(d => d.status === "Aguardando").length;
  let confirmados = dados.filter(d => d.status === "Confirmado").length;
  let cancelados = dados.filter(d => d.status === "Cancelado").length;
  let reagendados = dados.filter(d => d.status === "Reagendado").length;

  document.getElementById("contadorAguardando").innerText = aguardando;
  document.getElementById("contadorConfirmado").innerText = confirmados;
  document.getElementById("contadorCancelado").innerText = cancelados;
  document.getElementById("contadorReagendado").innerText = reagendados;
}
