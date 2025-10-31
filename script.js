let dados = [];

// === Importar CSV ===
document.getElementById("fileInput").addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (!file) {
    alert("Nenhum arquivo selecionado!");
    return;
  }

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      if (!results.data || results.data.length === 0) {
        alert("Arquivo CSV vazio ou formato incorreto!");
        return;
      }

      dados = results.data.filter(row =>
        Object.values(row).some(val => val && val.trim() !== "")
      );

      console.log(`✅ ${dados.length} registros importados`);
      atualizarDashboard();
    },
    error: function (error) {
      console.error("❌ Erro ao ler CSV:", error);
      alert("Falha ao ler o arquivo CSV. Verifique o formato e tente novamente.");
    },
  });
});

// === Atualiza todo o painel ===
function atualizarDashboard() {
  if (dados.length === 0) return;
  atualizarContadores();
  atualizarTabela();
  atualizarGraficos();
}

// === Atualiza os contadores de status ===
function atualizarContadores() {
  const total = dados.length;
  const confirmados = dados.filter(d => d.Status?.toLowerCase() === "confirmado").length;
  const cancelados = dados.filter(d => d.Status?.toLowerCase() === "cancelado").length;
  const reagendados = dados.filter(d => d.Status?.toLowerCase() === "reagendado").length;
  const aguardando = total - (confirmados + cancelados + reagendados);

  document.getElementById("total").innerText = total;
  document.getElementById("confirmado").innerText = confirmados;
  document.getElementById("cancelado").innerText = cancelados;
  document.getElementById("reagendado").innerText = reagendados;
  document.getElementById("aguardando").innerText = aguardando;
}

// === Atualiza a tabela ===
function atualizarTabela() {
  const corpo = document.getElementById("tabelaDados");
  if (!corpo) return;

  corpo.innerHTML = "";

  dados.forEach((linha) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${linha.Contrato || ""}</td>
      <td>${linha.Cliente || ""}</td>
      <td>${linha.Celular || ""}</td>
      <td>${linha["Data Agendamento"] || ""}</td>
      <td>${linha.Endereço || ""}</td>
      <td>${linha.Bairro || ""}</td>
      <td>${linha.Status || "Aguardando"}</td>
    `;
    corpo.appendChild(tr);
  });
}

// === Atualiza os gráficos ===
function atualizarGraficos() {
  atualizarGraficoStatus();
  atualizarGraficoBairros();
}

// === Gráfico de status ===
function atualizarGraficoStatus() {
  const ctx = document.getElementById("graficoStatus");
  if (!ctx) return;

  const contagem = {};
  dados.forEach((item) => {
    const status = item.Status || "Aguardando";
    contagem[status] = (contagem[status] || 0) + 1;
  });

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(contagem),
      datasets: [
        {
          data: Object.values(contagem),
          backgroundColor: ["#4caf50", "#f44336", "#ff9800", "#9e9e9e"],
        },
      ],
    },
    options: {
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: function (context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const value = context.raw;
              const pct = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${value} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

// === Gráfico por bairro ===
function atualizarGraficoBairros() {
  const ctx = document.getElementById("graficoBairros");
  if (!ctx) return;

  const bairros = {};
  dados.forEach((item) => {
    const bairro = item.Bairro || "Não informado";
    bairros[bairro] = (bairros[bairro] || 0) + 1;
  });

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(bairros),
      datasets: [
        {
          label: "Atendimentos por Bairro",
          data: Object.values(bairros),
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: { y: { beginAtZero: true } },
      plugins: {
        legend: { display: false },
      },
    },
  });
}
