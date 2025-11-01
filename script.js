// script.js - updated: sends to WhatsApp Desktop app first, includes address and period, allows multiple selection
let clientes = [];

// --- Salvamento e carregamento local ---
function salvarLocal() { localStorage.setItem('clientes', JSON.stringify(clientes)); }
function carregarLocal() { const data = localStorage.getItem('clientes'); if(data){ clientes = JSON.parse(data); atualizarTabela(); } }
window.onload = () => { carregarLocal(); atualizarMensagemPadrao(); };

// --- Adicionar cliente manual ---
function adicionarCliente() {
  const nome = document.getElementById('cliente').value.trim();
  const celular = document.getElementById('celular').value.trim();
  const contrato = document.getElementById('contrato').value.trim();
  const data = document.getElementById('data').value;
  const periodo = document.getElementById('periodo').value;
  const endereco = document.getElementById('endereco').value.trim();
  const bairro = document.getElementById('bairro').value.trim();
  if (!nome || !celular || !contrato || !data || !periodo || !endereco || !bairro) { 
    alert("Preencha todos os campos!"); return; 
  }
  clientes.push({ nome, celular, contrato, data, periodo, endereco, bairro, status:"Aguardando", selecionado:false });
  atualizarTabela(); limparCampos(); salvarLocal();
}

// --- Limpar campos ---
function limparCampos(){
  document.getElementById('cliente').value = "";
  document.getElementById('celular').value = "";
  document.getElementById('contrato').value = "";
  document.getElementById('data').value = "";
  document.getElementById('periodo').value = "";
  document.getElementById('endereco').value = "";
  document.getElementById('bairro').value = "";
}

// --- Mensagens dinâmicas ---
function gerarMensagem(c){
  const tipo = document.getElementById('tipoMensagem').value;
  // ensure period shows only Manhã or Tarde in message
  const periodo = (c.periodo && c.periodo.toLowerCase().includes('man')) ? 'Manhã' : 'Tarde';
  if(tipo==="antecipacao"){
    return `Olá, Prezado(a) ${c.nome}!\n\nAqui é da Ligga Telecom, tudo bem? 😊\n\nIdentificamos a possibilidade de antecipar o seu atendimento para hoje!\n\n📅 Data: ${c.data}\n⏰ Período: ${periodo}\n📍 Endereço: ${c.endereco} - ${c.bairro}\n\nVocê confirma a antecipação do seu atendimento? ✅\n1. SIM, CONFIRMAR\n2. NÃO, MANTER DATA ATUAL\n\n(Nosso sistema não suporta chamadas ou áudios)`;
  } else if(tipo==="confirmacao"){
    return `Olá, tudo bem?\n\nMeu contato é referente à Confirmação de Agendamento – Instalação de Internet | Ligga Telecom.\n\n📅 Agendado: ${c.data}\n⏰ Período: ${periodo}\n📍 Endereço: ${c.endereco} - ${c.bairro}\n\nPor favor, selecione uma das opções abaixo para que possamos dar andamento:\n1️⃣ Confirmar atendimento\n2️⃣ Preciso reagendar\n3️⃣ Já cancelei os serviços\n\nObs.: Nosso sistema não aceita áudios ou chamadas telefônicas.\n\nAguardamos sua resposta!\nEquipe Ligga Telecom`;
  } else if(tipo==="chegada"){
    return `Olá, ${c.nome}!\n\nAqui é da Ligga Telecom. Informamos que nosso técnico está em frente ao seu endereço para realizar a visita técnica. 🚀\n\n📅 Data: ${c.data}\n⏰ Período: ${periodo}\n📍 Endereço: ${c.endereco} - ${c.bairro}\n\n⚠️ Por favor, certifique-se que haja alguém maior de 18 anos no local durante o atendimento. ⚠️\n\nAgradecemos a sua atenção!\nEquipe Ligga Telecom`;
  }
}

// --- Atualizar mensagem padrão ---
function atualizarMensagemPadrao(){
  const c = {nome:"Cliente",data:"dd/mm/aaaa",periodo:"Período", endereco:"Endereço", bairro:"Bairro"};
  document.getElementById('mensagemPadrao').value = gerarMensagem(c);
}

// --- Atualizar tabela ---
function atualizarTabela() {
  const tbody = document.querySelector("#tabela tbody");
  tbody.innerHTML = "";
  clientes.forEach((c,i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" onchange="toggleSelecionado(${i}, this.checked)" ${c.selecionado ? "checked" : ""}></td>
      <td>${c.nome}</td>
      <td contenteditable="true" onblur="alterarNumero(${i},this.innerText)">${c.celular}</td>
      <td contenteditable="true" onblur="alterarContrato(${i},this.innerText)">${c.contrato}</td>
      <td>${c.data}</td>
      <td>${c.periodo}</td>
      <td contenteditable="true" onblur="alterarEndereco(${i},this.innerText)">${c.endereco}</td>
      <td contenteditable="true" onblur="alterarBairro(${i},this.innerText)">${c.bairro}</td>
      <td>${c.status}</td>
      <td>
        <button onclick="enviarMensagem(${i})">📤 Enviar</button>
        <button onclick="atualizarStatus(${i},'Confirmado')">✅</button>
        <button onclick="atualizarStatus(${i},'Reagendado')">📅</button>
        <button onclick="atualizarStatus(${i},'Cancelado')">❌</button>
        <button onclick="excluirContato(${i})">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });
  atualizarContadores(); salvarLocal();
}

// --- Edição e exclusão ---
function alterarNumero(i, numero){ clientes[i].celular = numero.trim(); salvarLocal(); }
function alterarContrato(i, valor){ clientes[i].contrato = valor.trim(); salvarLocal(); }
function alterarEndereco(i,endereco){ clientes[i].endereco=endereco.trim(); salvarLocal(); }
function alterarBairro(i, bairro){ clientes[i].bairro = bairro.trim(); salvarLocal(); }
function atualizarStatus(i,status){ clientes[i].status=status; atualizarTabela(); salvarLocal(); }
function excluirContato(i){ if(confirm("Deseja realmente excluir este contato?")){ clientes.splice(i,1); atualizarTabela(); salvarLocal(); } }

// toggle checkbox
function toggleSelecionado(i, checked){
  clientes[i].selecionado = !!checked;
  salvarLocal();
}

// --- Contadores ---
function atualizarContadores(){
  const cont={aguardando:0,confirmado:0,reagendado:0,cancelado:0};
  clientes.forEach(c=>{
    if(c.status.includes("Aguardando") || c.status=="Mensagem enviada") cont.aguardando++;
    else if(c.status=="Confirmado") cont.confirmado++;
    else if(c.status=="Reagendado") cont.reagendado++;
    else if(c.status=="Cancelado") cont.cancelado++;
  });
  document.getElementById("contAguardando").innerText=cont.aguardando;
  document.getElementById("contConfirmado").innerText=cont.confirmado;
  document.getElementById("contReagendado").innerText=cont.reagendado;
  document.getElementById("contCancelado").innerText=cont.cancelado;
}

// --- Envio individual (WhatsApp Desktop app preferred, fallback to web) ---
function enviarMensagem(i){
  const c = clientes[i];
  const numero = c.celular.replace(/\D/g, "");
  const msg = gerarMensagem(c);
  if (!numero){ alert("Número inválido!"); return; }

  const linkApp = `whatsapp://send?phone=55${numero}&text=${encodeURIComponent(msg)}`;
  const linkWeb = `https://wa.me/55${numero}?text=${encodeURIComponent(msg)}`;

  try {
    // try app
    const a = document.createElement("a");
    a.href = linkApp;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // fallback to web if app didn't open
    setTimeout(() => {
      if (document.visibilityState !== "hidden") {
        // open web and copy text
        const b = document.createElement("a");
        b.href = linkWeb;
        b.target = "_blank";
        b.rel = "noopener noreferrer";
        b.style.display = "none";
        document.body.appendChild(b);
        b.click();
        document.body.removeChild(b);

        navigator.clipboard.writeText(msg);
        alert("⚠️ O aplicativo do WhatsApp não abriu automaticamente.\nAbrimos o WhatsApp Web e copiamos a mensagem — basta colar.");
      }
    }, 1200);
  } catch (e) {
    // final fallback
    navigator.clipboard.writeText(msg);
    alert("⚠️ Não foi possível abrir o WhatsApp.\nMensagem copiada — cole manualmente no app.");
  }

  c.status = "Mensagem enviada";
  atualizarTabela(); salvarLocal();
}

// --- Enviar selecionados (one by one with delay) ---
async function enviarSelecionados(){
  const selecionados = clientes.map((c,i)=> ({c,i})).filter(x=>x.c.selecionado);
  if(selecionados.length===0){ alert("Nenhum contrato selecionado."); return; }
  const delayMs = 1400;
  for(const item of selecionados){
    enviarMensagem(item.i);
    await new Promise(r=>setTimeout(r, delayMs));
  }
}

// --- Excluir selecionados ---
function excluirSelecionados(){
  if(!confirm("Deseja excluir todos os contatos selecionados?")) return;
  clientes = clientes.filter(c => !c.selecionado);
  atualizarTabela(); salvarLocal();
}

// --- Filtro por contrato ---
function filtrarPorContrato() {
  const filtro = document.getElementById("filtroContrato").value.trim().toLowerCase();
  const linhas = document.querySelectorAll("#tabela tbody tr");
  linhas.forEach(linha => {
    const contrato = linha.children[3].innerText.toLowerCase();
    linha.style.display = contrato.includes(filtro) ? "" : "none";
  });
}

// --- Exportar CSV ---
function exportarCSV(){
  const clientesUnicos = clientes.filter((c, index, self) =>
    index === self.findIndex(t => t.contrato === c.contrato)
  );
  let csv = "Cliente,Celular,Contrato,Data,Período,Endereço,Bairro,Status\n";
  clientesUnicos.forEach(c => {
    const linha = [
      `"${c.nome}"`,
      `"${c.celular}"`,
      `"${c.contrato}"`,
      `"${c.data}"`,
      `"${c.periodo}"`,
      `"${c.endereco}"`,
      `"${c.bairro}"`,
      `"${c.status}"`
    ].join(",");
    csv += linha + "\n";
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.setAttribute("href", URL.createObjectURL(blob));
  link.setAttribute("download", "relatorio_visitas.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- Importar CSV ---
function importarCSV(event){
  const file=event.target.files[0]; if(!file) return;
  Papa.parse(file,{header:true,skipEmptyLines:true,complete:function(results){
    results.data.forEach(row=>{
      // try multiple header name variations
      const nome = row.Nome || row.nome || row.Cliente || row.cliente || "";
      const celular = row.Celular || row.celular || row.Celular1 || "";
      const contrato = row.Contrato || row.contrato || row.Contract || "";
      const data = row.Data || row.data || row['Data Agendamento'] || "";
      const periodo = row.Periodo || row.periodo || row['Período'] || "";
      const endereco = row.Endereco || row.endereco || "";
      const bairro = row.Bairro || row.bairro || "";
      if(nome && celular){
        clientes.push({
          nome: nome.trim(),
          celular: String(celular).trim(),
          contrato: String(contrato).trim(),
          data: String(data).trim(),
          periodo: (String(periodo).trim() || "Tarde"),
          endereco: String(endereco).trim(),
          bairro: String(bairro).trim(),
          status: "Importado",
          selecionado:false
        });
      }
    }); atualizarTabela(); salvarLocal();
  }});
}
