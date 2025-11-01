// Final script.js - removes bairro, adds select-all, date choice for antecipacao, sends to WhatsApp Desktop app with fallback
let clientes = [];

// local storage
function salvarLocal() { localStorage.setItem('clientes', JSON.stringify(clientes)); }
function carregarLocal() { const data = localStorage.getItem('clientes'); if(data){ clientes = JSON.parse(data); atualizarTabela(); } }
window.onload = () => { carregarLocal(); atualizarMensagemPadrao(); };

// add client
function adicionarCliente() {
  const nome = document.getElementById('cliente').value.trim();
  const celular = document.getElementById('celular').value.trim();
  const contrato = document.getElementById('contrato').value.trim();
  const data = document.getElementById('data').value;
  const periodo = document.getElementById('periodo').value;
  const endereco = document.getElementById('endereco').value.trim();
  if (!nome || !celular || !contrato || !data || !periodo || !endereco) { 
    alert("Preencha todos os campos!"); return; 
  }
  clientes.push({ nome, celular, contrato, data, periodo, endereco, status:"Aguardando", selecionado:false });
  atualizarTabela(); limparCampos(); salvarLocal();
}
function limparCampos(){
  document.getElementById('cliente').value = "";
  document.getElementById('celular').value = "";
  document.getElementById('contrato').value = "";
  document.getElementById('data').value = "";
  document.getElementById('periodo').value = "";
  document.getElementById('endereco').value = "";
}

// messages
function gerarMensagem(c, opts = {}){
  const tipo = document.getElementById('tipoMensagem').value;
  // normalize period to Manhã/Tarde
  const periodo = (c.periodo && c.periodo.toLowerCase().includes('man')) ? 'Manhã' : 'Tarde';
  const dataParaUsar = opts.dateOverride || c.data || '';
  if(tipo==="antecipacao"){
    return `Olá, Prezado(a) ${c.nome}!\n\nAqui é da Ligga Telecom, tudo bem? 😊\n\nIdentificamos a possibilidade de antecipar o seu atendimento.\n\n📅 Data: ${dataParaUsar}\n⏰ Período: ${periodo}\n📍 Endereço: ${c.endereco}\n\nVocê confirma a antecipação do seu atendimento? ✅\n1. SIM, CONFIRMAR\n2. NÃO, MANTER DATA ATUAL\n\n(Nosso sistema não suporta chamadas ou áudios)`;
  } else if(tipo==="confirmacao"){
    return `Olá, tudo bem?\n\nMeu contato é referente à Confirmação de Agendamento – Instalação de Internet | Ligga Telecom.\n\n📅 Agendado: ${dataParaUsar}\n⏰ Período: ${periodo}\n📍 Endereço: ${c.endereco}\n\nPor favor, selecione uma das opções abaixo para que possamos dar andamento:\n1️⃣ Confirmar atendimento\n2️⃣ Preciso reagendar (responda com a nova data)\n3️⃣ Já cancelei os serviços\n\nObs.: Nosso sistema não aceita áudios ou chamadas telefônicas.\n\nAguardamos sua resposta!\nEquipe Ligga Telecom`;
  } else if(tipo==="chegada"){
    return `Olá, ${c.nome}!\n\nAqui é da Ligga Telecom. Informamos que nosso técnico está em frente ao seu endereço para realizar a visita técnica. 🚀\n\n📅 Data: ${dataParaUsar}\n⏰ Período: ${periodo}\n📍 Endereço: ${c.endereco}\n\n⚠️ Por favor, certifique-se que haja alguém maior de 18 anos no local durante o atendimento. ⚠️\n\nAgradecemos a sua atenção!\nEquipe Ligga Telecom`;
  }
}

// update default message preview
function atualizarMensagemPadrao(){
  const c = {nome:"Cliente",data:"dd/mm/aaaa",periodo:"Período", endereco:"Endereço"};
  document.getElementById('mensagemPadrao').value = gerarMensagem(c);
}

// update table
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

// edit functions
function alterarNumero(i, numero){ clientes[i].celular = numero.trim(); salvarLocal(); }
function alterarContrato(i, valor){ clientes[i].contrato = valor.trim(); salvarLocal(); }
function alterarEndereco(i,endereco){ clientes[i].endereco=endereco.trim(); salvarLocal(); }
function atualizarStatus(i,status){ clientes[i].status=status; atualizarTabela(); salvarLocal(); }
function excluirContato(i){ if(confirm("Deseja realmente excluir este contato?")){ clientes.splice(i,1); atualizarTabela(); salvarLocal(); } }

function toggleSelecionado(i, checked){
  clientes[i].selecionado = !!checked;
  document.getElementById('selectAll').checked = clientes.every(c => c.selecionado);
  salvarLocal();
}
function toggleSelectAll(checked){
  clientes.forEach(c=> c.selecionado = !!checked);
  atualizarTabela();
  salvarLocal();
}

// counters
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

// choose date helper: prompts user for date in YYYY-MM-DD, default to current or existing
function escolherData(defaultDate){
  const def = defaultDate || new Date().toISOString().slice(0,10);
  let resp = prompt("Digite a nova data para antecipação (YYYY-MM-DD):", def);
  if(!resp) return null;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(resp)){
    alert("Formato inválido. Use YYYY-MM-DD.");
    return null;
  }
  return resp;
}

// send single message
function enviarMensagem(i){
  const c = clientes[i];
  const numero = c.celular.replace(/\D/g, "");
  if(!numero){ alert("Número inválido!"); return; }

  const tipo = document.getElementById('tipoMensagem').value;

  let dateToUse = c.data;
  if(tipo === "antecipacao"){
    const nova = escolherData(c.data);
    if(nova !== null && nova !== "") dateToUse = nova;
  }

  const msg = gerarMensagem(c, { dateOverride: dateToUse });

  const linkApp = `whatsapp://send?phone=55${numero}&text=${encodeURIComponent(msg)}`;
  const linkWeb = `https://wa.me/55${numero}?text=${encodeURIComponent(msg)}`;

  try {
    const a = document.createElement("a");
    a.href = linkApp;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(()=>{
      if(document.visibilityState !== "hidden"){
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
  } catch(e){
    navigator.clipboard.writeText(msg);
    alert("⚠️ Não foi possível abrir o WhatsApp.\nMensagem copiada — cole manualmente no app.");
  }

  c.status = "Mensagem enviada";
  atualizarTabela(); salvarLocal();
}

// send selected with delay
async function enviarSelecionados(){
  const selecionados = clientes.map((c,i)=> ({c,i})).filter(x=>x.c.selecionado);
  if(selecionados.length===0){ alert("Nenhum contrato selecionado."); return; }
  const delayMs = 1400;
  for(const item of selecionados){
    enviarMensagem(item.i);
    await new Promise(r=>setTimeout(r, delayMs));
  }
}

// excluir selecionados
function excluirSelecionados(){
  if(!confirm("Deseja excluir todos os contatos selecionados?")) return;
  clientes = clientes.filter(c => !c.selecionado);
  document.getElementById('selectAll').checked = false;
  atualizarTabela(); salvarLocal();
}

// filter by contract
function filtrarPorContrato() {
  const filtro = document.getElementById("filtroContrato").value.trim().toLowerCase();
  const linhas = document.querySelectorAll("#tabela tbody tr");
  linhas.forEach(linha => {
    const contrato = linha.children[3].innerText.toLowerCase();
    linha.style.display = contrato.includes(filtro) ? "" : "none";
  });
}

// export CSV without duplicates (no bairro column)
function exportarCSV(){
  const clientesUnicos = clientes.filter((c, index, self) =>
    index === self.findIndex(t => t.contrato === c.contrato)
  );
  let csv = "Cliente,Celular,Contrato,Data,Período,Endereço,Status
";
  clientesUnicos.forEach(c => {
    const linha = [
      `"${c.nome}"`,
      `"${c.celular}"`,
      `"${c.contrato}"`,
      `"${c.data}"`,
      `"${c.periodo}"`,
      `"${c.endereco}"`,
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

// import CSV (flexible headers)
function importarCSV(event){
  const file=event.target.files[0]; if(!file) return;
  Papa.parse(file,{header:true,skipEmptyLines:true,complete:function(results){
    results.data.forEach(row=>{
      const nome = row.Nome || row.nome || row.Cliente || row.cliente || "";
      const celular = row.Celular || row.celular || row.Telefone || row.telefone || "";
      const contrato = row.Contrato || row.contrato || row.Contract || "";
      const data = row['Data Agendamento'] || row.Data || row.data || row['data agendamento'] || "";
      const periodo = row.Periodo || row.periodo || row['Período'] || "";
      const endereco = row.Endereco || row.endereco || row.Endereço || row['Endereço'] || "";
      if(nome && celular){
        clientes.push({
          nome: nome.trim(),
          celular: String(celular).trim(),
          contrato: String(contrato).trim(),
          data: String(data).trim(),
          periodo: (String(periodo).trim() || "Tarde"),
          endereco: String(endereco).trim(),
          status: "Importado",
          selecionado:false
        });
      }
    }); atualizarTabela(); salvarLocal();
  }});
}
