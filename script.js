document.addEventListener("DOMContentLoaded", () => {
  let dados = [];
  let tabela = document.querySelector("table") || document.getElementById("tabela") || document.getElementById("tabelaBody");

  if (!tabela) {
    const msg = document.createElement("p");
    msg.textContent = "❌ Nenhuma tabela encontrada no HTML.";
    document.body.appendChild(msg);
    return;
  }

  if (!document.getElementById("fileInput")) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.id = "fileInput";
    input.style.marginBottom = "10px";
    document.body.insertBefore(input, tabela);
  }

  if (!document.getElementById("contadores")) {
    const div = document.createElement("div");
    div.id = "contadores";
    div.innerHTML = `
      <div style="display:flex;gap:10px;margin-bottom:10px;">
        <span>🕓 Aguardando: <strong id="contadorAguardando">0</strong></span>
        <span>✅ Confirmado: <strong id="contadorConfirmado">0</strong></span>
        <span>📅 Reagendado: <strong id="contadorReagendado">0</strong></span>
        <span>❌ Cancelado: <strong id="contadorCancelado">0</strong></span>
      </div>`;
    document.body.insertBefore(div, tabela);
  }

  const fileInput = document.getElementById("fileInput");
  fileInput.addEventListener("change", handleFileUpload);

  let corpoTabela;
  if (tabela.tagName === "TABLE") {
    corpoTabela = tabela.querySelector("tbody");
    if (!corpoTabela) {
      corpoTabela = document.createElement("tbody");
      tabela.appendChild(corpoTabela);
    }
  } else {
    corpoTabela = tabela;
  }

// --- Importar CSV ---
function importarCSV(event){
  const file=event.target.files[0]; if(!file) return;
  Papa.parse(file,{header:true,skipEmptyLines:true,complete:function(results){
    results.data.forEach(row=>{
      if(row.Nome && row.Celular){
        clientes.push({
          nome: row.Nome || row.nome || "",
          celular: row.Celular || row.celular || "",
          contrato: row.Contrato || row.contrato || "",
          data: row.Data || row.data || "",
          // --- CORREÇÃO AQUI ---
          // Agora ele procura por "Periodo", "periodo", "Período" ou "período"
          periodo: row.Periodo || row.periodo || row.Período || row.período || "", 
          // E também por "Endereco", "endereco", "Endereço" ou "endereço"
          endereco: row.Endereco || row.endereco || row.Endereço || row.endereço || "", 
          // --- FIM DA CORREÇÃO ---
          bairro: row.Bairro || row.bairro || "",
          status: "Importado"
        });
      }
    }); atualizarTabela(); salvarLocal();
  }});
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
          status: "Aguardando",
          periodo: "Tarde"
        };
      }).filter(d => d.contrato && d.celular);

      if (dados.length === 0) return alert("Nenhum dado válido encontrado!");

      alert("✅ Planilha importada com sucesso!");
      atualizarTabela();
      atualizarContadores();
    };

    reader.readAsText(file, "UTF-8");
  }

  function atualizarTabela() {
    corpoTabela.innerHTML = "";
    dados.forEach((d, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.contrato}</td>
        <td>${d.cliente}</td>
        <td>${d.celular}</td>
        <td>${d.data}</td>
        <td>${d.endereco}</td>
        <td>${d.bairro}</td>
        <td>${d.status}</td>
        <td>
          <select id="periodo_${i}">
            <option ${d.periodo === "Manhã" ? "selected" : ""}>Manhã</option>
            <option ${d.periodo === "Tarde" ? "selected" : ""}>Tarde</option>
            <option ${d.periodo === "Noite" ? "selected" : ""}>Noite</option>
          </select>
        </td>
        <td>
          <button onclick="previewMensagem(${i})">Prévia</button>
          <button onclick="enviarWhatsApp(${i})">Enviar</button>
          <button onclick="alterarStatus(${i},'Confirmado')">✅</button>
          <button onclick="alterarStatus(${i},'Reagendado')">📅</button>
          <button onclick="alterarStatus(${i},'Cancelado')">❌</button>
        </td>
      `;
      corpoTabela.appendChild(tr);
    });
  }

  window.previewMensagem = function (i) {
    const d = dados[i];
    const tipo = prompt("Escolha o tipo de mensagem:\n1 - Antecipação\n2 - Confirmação\n3 - Técnico em frente", "1");
    let msg = "";

    switch (tipo) {
      case "1":
        msg = `Olá, Prezado(a) Cliente Ligga!\nAqui é do agendamento da Ligga Telecom, tudo bem? 😊\n\nIdentificamos a oportunidade de antecipar o seu atendimento para hoje!\n\n📅 Data: ${d.data}\n⏰ Período: ${d.periodo}\n\nPodemos confirmar a antecipação de agenda? ✅\n1. CONFIRMAR\n2. PERMANECER DATA ATUAL AGENDADA\n(Nosso sistema não suporta chamadas e áudios)`;
        break;
      case "2":
        msg = `Olá, tudo bem?\nMeu contato é referente à Confirmação de Agendamento – Instalação de Internet | Ligga Telecom.\n\n📅 Agendado: ${d.data}\n\n1️⃣ Confirmar atendimento\n2️⃣ Preciso reagendar\n3️⃣ Já cancelei os serviços\n\nObs.: Nosso sistema não aceita áudios ou chamadas telefônicas.\nAguardamos sua resposta!\nEquipe Ligga Telecom`;
        break;
      case "3":
        msg = `Um técnico a serviço da Ligga Telecom está em frente à sua residência para realizar a visita técnica.\n\n⚠️ Pedimos que haja alguém maior de 18 anos no local durante o atendimento. ⚠️`;
        break;
      default:
        msg = "Tipo inválido.";
    }

    alert("📩 Prévia da mensagem:\n\n" + msg);
  };
// --- Envio individual ---
function enviarMensagem(i){
  const c = clientes[i];
  const numero = c.celular;
  const msg = c.mensagem || gerarMensagem(c);
  window.open(`https://web.whatsapp.com/send?phone=55${numero}&text=${encodeURIComponent(msg)}`, "whatsapp_sender"); // <-- ALTERADO
  c.status = "Mensagem enviada";
  atualizarTabela(); salvarLocal();

    switch (tipo) {
      case "1":
        mensagem = `Olá, Prezado(a) Cliente Ligga!\nAqui é do agendamento da Ligga Telecom, tudo bem? 😊\n\nIdentificamos a oportunidade de antecipar o seu atendimento para hoje!\n\n📅 Data: ${d.data}\n⏰ Período: ${d.periodo}\n\nPodemos confirmar a antecipação de agenda? ✅\n1. CONFIRMAR\n2. PERMANECER DATA ATUAL AGENDADA\n(Nosso sistema não suporta chamadas e áudios)`;
        break;
      case "2":
        mensagem = `Olá, tudo bem?\nMeu contato é referente à Confirmação de Agendamento – Instalação de Internet | Ligga Telecom.\n\n📅 Agendado: ${d.data}\n\n1️⃣ Confirmar atendimento\n2️⃣ Preciso reagendar\n3️⃣ Já cancelei os serviços\n\nObs.: Nosso sistema não aceita áudios ou chamadas telefônicas.\nAguardamos sua resposta!\nEquipe Ligga Telecom`;
        break;
      case "3":
        mensagem = `Um técnico a serviço da Ligga Telecom está em frente à sua residência para realizar a visita técnica.\n\n⚠️ Pedimos que haja alguém maior de 18 anos no local durante o atendimento. ⚠️`;
        break;
      default:
        alert("Tipo inválido.");
        return;
    }

    const link = `https://api.whatsapp.com/send?phone=55${numero}&text=${encodeURIComponent(msg)}`;


    try {
      window.location.assign(url);
      setTimeout(() => {
        if (document.visibilityState !== "hidden") {
          navigator.clipboard.writeText(mensagem);
          alert("⚠️ O navegador bloqueou a abertura direta.\nMensagem copiada — basta colar no WhatsApp já aberto.");
        }
      }, 1500);
    } catch (e) {
      navigator.clipboard.writeText(mensagem);
      alert("⚠️ Não foi possível abrir o WhatsApp automaticamente.\nMensagem copiada — basta colar no app.");
    }

    alterarStatus(i, "Confirmado");
  };

  window.alterarStatus = function (i, status) {
    dados[i].status = status;
    atualizarTabela();
    atualizarContadores();
  };

  function atualizarContadores() {
    const aguardando = dados.filter(d => d.status === "Aguardando").length;
    const confirmados = dados.filter(d => d.status === "Confirmado").length;
    const reagendados = dados.filter(d => d.status === "Reagendado").length;
    const cancelados = dados.filter(d => d.status === "Cancelado").length;

    document.getElementById("contadorAguardando").innerText = aguardando;
    document.getElementById("contadorConfirmado").innerText = confirmados;
    document.getElementById("contadorReagendado").innerText = reagendados;
    document.getElementById("contadorCancelado").innerText = cancelados;
  }
});



