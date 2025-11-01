<script>
let clientes = [];

// --- Salvamento e carregamento local ---
function salvarLocal() { localStorage.setItem('clientes', JSON.stringify(clientes)); }
function carregarLocal() { const data = localStorage.getItem('clientes'); if(data){ clientes = JSON.parse(data); atualizarTabela(); } }
window.onload = () => { carregarLocal(); atualizarMensagemPadrao(); };

// --- Adicionar cliente manual ---
function adicionarCliente() {
  const nome = document.getElementById('cliente').value;
  const celular = document.getElementById('celular').value;
  const contrato = document.getElementById('contrato').value;
  const data = document.getElementById('data').value;
  const periodo = document.getElementById('periodo').value;
  const endereco = document.getElementById('endereco').value;
  const bairro = document.getElementById('bairro').value;
  if (!nome || !celular || !contrato || !data || !periodo || !endereco || !bairro) { 
    alert("Preencha todos os campos!"); return; 
  }
  clientes.push({ nome, celular, contrato, data, periodo, endereco, bairro, status:"Aguardando" });
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
  if(tipo==="antecipacao"){
    return `Olá, Prezado(a) ${c.nome}!\n\nAqui é da Ligga Telecom, tudo bem? 😊\n\nIdentificamos a possibilidade de antecipar o seu atendimento para hoje!\n\n📅 Data: ${c.data}\n⏰ Período: ${c.periodo}\n\nVocê confirma a antecipação do seu atendimento? ✅\n1. SIM, CONFIRMAR\n2. NÃO, MANTER DATA ATUAL\n\n(Nosso sistema não suporta chamadas ou áudios)`;
  } else if(tipo==="confirmacao"){
    return `Olá, tudo bem?\n\nMeu contato é referente à Confirmação de Agendamento – Instalação de Internet | Ligga Telecom.\n\n📅 Agendado: ${c.data}\n\nPor favor, selecione uma das opções abaixo para que possamos dar andamento:\n1️⃣ Confirmar atendimento\n2️⃣ Preciso reagendar\n3️⃣ Já cancelei os serviços\n\nObs.: Nosso sistema não aceita áudios ou chamadas telefônicas.\n\nAguardamos sua resposta!\nEquipe Ligga Telecom\n\nUm técnico a serviço da Ligga Telecom está a caminho da sua residência para realizar a visita técnica.\n\n⚠️ Pedimos que haja alguém maior de 18 anos no local durante o atendimento. ⚠️`;
  } else if(tipo==="chegada"){
    return `Olá, ${c.nome}!\n\nAqui é da Ligga Telecom. Informamos que nosso técnico está em frente ao seu endereço para realizar a visita técnica. 🚀\n\n⚠️ Por favor, certifique-se que haja alguém maior de 18 anos no local durante o atendimento. ⚠️\n\nAgradecemos a sua atenção!\nEquipe Ligga Telecom`;
  }
}

// --- Atualizar mensagem padrão ---
function atualizarMensagemPadrao(){
  const c = {nome:"Cliente",data:"dd/mm/aaaa",periodo:"Período"};
  document.getElementById('mensagemPadrao').value = gerarMensagem(c);
}

// --- Atualizar tabela ---
function atualizarTabela() {
  const tbody = document.querySelector("#tabela tbody");
  tbody.innerHTML = "";
  clientes.forEach((c,i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
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
function alterarNumero(i, numero){ clientes[i].celular = numero; salvarLocal(); }
function alterarContrato(i, valor){ clientes[i].contrato = valor; salvarLocal(); }
function alterarEndereco(i,endereco){ clientes[i].endereco=endereco; salvarLocal(); }
function alterarBairro(i, bairro){ clientes[i].bairro = bairro; salvarLocal(); }
function atualizarStatus(i,status){ clientes[i].status=status; atualizarTabela(); salvarLocal(); }
function excluirContato(i){ if(confirm("Deseja realmente excluir este contato?")){ clientes.splice(i,1); atualizarTabela(); salvarLocal(); } }

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

// --- Envio individual (WhatsApp App + texto pronto) ---
function enviarMensagem(i){
  const c = clientes[i];
  const numero = c.celular.replace(/\D/g, "");
  const msg = gerarMensagem(c);
  if (!numero){ alert("Número inválido!"); return; }

  const link = `https://wa.me/55${numero}?text=${encodeURIComponent(msg)}`;
  try {
    const a = document.createElement("a");
    a.href = link;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      if (document.visibilityState !== "hidden") {
        navigator.clipboard.writeText(msg);
        alert("⚠️ O WhatsApp abriu, mas sem o texto.\nA mensagem foi copiada — basta colar no campo de envio.");
      }
    }, 1500);
  } catch (e) {
    navigator.clipboard.writeText(msg);
    alert("⚠️ Não foi possível abrir o WhatsApp automaticamente.\nMensagem copiada — cole manualmente no app.");
  }

  c.status = "Mensagem enviada";
  atualizarTabela(); salvarLocal();
}

// --- Filtro por contrato ---
function filtrarPorContrato() {
  const filtro = document.getElementById("filtroContrato").value.trim().toLowerCase();
  const linhas = document.querySelectorAll("#tabela tbody tr");
  linhas.forEach(linha => {
    const contrato = linha.children[2].innerText.toLowerCase();
    linha.style.display = contrato.includes(filtro) ? "" : "none";
  });
}

// --- Exportar CSV (sem duplicados) ---
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
      if(row.Nome && row.Celular){
        clientes.push({
          nome: row.Nome || row.nome || "",
          celular: row.Celular || row.celular || "",
          contrato: row.Contrato || row.contrato || "",
          data: row.Data || row.data || "",
          periodo: row.Periodo || row.periodo || "",
          endereco: row.Endereco || row.endereco || "",
          bairro: row.Bairro || row.bairro || "",
          status: "Importado"
        });
      }
    }); atualizarTabela(); salvarLocal();
  }});
}
</script>
