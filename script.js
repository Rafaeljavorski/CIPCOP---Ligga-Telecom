let clientes = [];
let tipoMensagem = "antecipacao";

function salvarLocal() { localStorage.setItem('clientes', JSON.stringify(clientes)); }
function carregarLocal() { const data = localStorage.getItem('clientes'); if(data){ clientes = JSON.parse(data); atualizarTabela(); } }
window.onload = () => { carregarLocal(); atualizarMensagemPadrao(); };

function selecionarTipo(tipo){
  tipoMensagem = tipo;
  document.querySelectorAll(".msg-btn").forEach(b=>b.classList.remove("ativo"));
  document.getElementById("btn"+tipo.charAt(0).toUpperCase()+tipo.slice(1)).classList.add("ativo");
  atualizarMensagemPadrao();
}

function gerarMensagem(c){
  const hoje = new Date().toLocaleDateString('pt-BR');
  const laranja = "🟠";
  if(tipoMensagem==="antecipacao"){
    return `Olá, Prezado(a) ${c.nome}!\n\nAqui é da Ligga Telecom, tudo bem? 😊\n\nIdentificamos a possibilidade de antecipar o seu atendimento para hoje!\n\n📅 Data: ${hoje}\n⏰ Período: ${c.periodo}\n📍 Endereço: ${c.endereco}\n\nVocê confirma a antecipação do seu atendimento? ✅\n1️⃣ SIM, CONFIRMAR\n2️⃣ NÃO, MANTER DATA ATUAL\n\n(Nosso sistema não suporta chamadas ou áudios)\n\n${laranja}\nLigga Telecom`;
  } else if(tipoMensagem==="confirmacao"){
    return `Olá, tudo bem?\n\nMeu contato é referente à Confirmação de Agendamento – Instalação de Internet | Ligga Telecom.\n\n📅 Agendado: ${c.data}\n⏰ Período: ${c.periodo}\n📍 Endereço: ${c.endereco}\n\nPor favor, selecione uma das opções abaixo:\n1️⃣ Confirmar atendimento\n2️⃣ Reagendar\n3️⃣ Cancelar visita\n\nObs.: Nosso sistema não aceita áudios.\n\n${laranja}\nLigga Telecom`;
  } else {
    return `Olá, ${c.nome}!\n\nAqui é da Ligga Telecom. Nosso técnico está a caminho do endereço abaixo:\n📍 ${c.endereco}\n\n⚠️ Por favor, certifique-se que haja alguém maior de 18 anos no local.\n\nAgradecemos a sua atenção!\nEquipe Ligga Telecom\n\n${laranja}\nLigga Telecom`;
  }
}

function atualizarMensagemPadrao(){
  const c = {nome:"Cliente",data:"dd/mm/aaaa",periodo:"Período",endereco:"Endereço"};
  document.getElementById('mensagemPadrao').value = gerarMensagem(c);
}

function atualizarTabela() {
  const tbody = document.querySelector("#tabela tbody");
  tbody.innerHTML = "";
  clientes.forEach((c,i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" class="checkCliente" data-index="${i}"></td>
      <td>${c.nome}</td>
      <td>${c.celular}</td>
      <td>${c.contrato}</td>
      <td>${c.data}</td>
      <td>${c.periodo}</td>
      <td>${c.endereco}</td>
      <td>${c.status}</td>
      <td><button onclick="enviarMensagem(${i})">📤 WhatsApp</button></td>`;
    tbody.appendChild(tr);
  });
  atualizarContadores();
  salvarLocal();
}

function enviarMensagem(i){
  const c = clientes[i];
  const numero = c.celular;
  const msg = gerarMensagem(c);
  window.open(`https://web.whatsapp.com/send?phone=55${numero}&text=${encodeURIComponent(msg)}`, "_blank");
  c.status = "Mensagem enviada";
  atualizarTabela();
}

function importarCSV(event){
  const file=event.target.files[0]; if(!file) return;
  Papa.parse(file,{header:true,skipEmptyLines:true,complete:function(results){
    results.data.forEach(row=>{
      let nome = row.Nome || row["Nome"] || row["Nome Solicitante"] || "";
      let celular = row.Celular || row["Celular"] || row["Telefone do Solicitante"] || "";
      let contrato = row.Contrato || row["Contrato"] || "";
      let data = row["Data agendada"] || row["Data"] || "";
      let periodo = row["Período Agendado"] || row["Periodo Agendado"] || "";
      let endereco = row.Endereço || row["Endereço"] || row["Endereço do Contrato"] || "";

      if(nome && celular){
        if(periodo.toLowerCase().includes("manhã") || periodo.includes("8") || periodo.includes("12")) periodo="Manhã";
        else periodo="Tarde";
        clientes.push({ nome, celular, contrato, data, periodo, endereco, status:"Importado" });
      }
    });
    atualizarTabela();
  }});
}

function exportarCSV(){
  const clientesUnicos = clientes.filter((c, i, arr)=> i === arr.findIndex(t=>t.contrato===c.contrato));
  let csv = "Cliente,Celular,Contrato,Data,Período,Endereço,Status\n";
  clientesUnicos.forEach(c=>{
    csv += `"${c.nome}","${c.celular}","${c.contrato}","${c.data}","${c.periodo}","${c.endereco}","${c.status}"\n`;
  });
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "relatorio_visitas.csv";
  link.click();
}

function excluirSelecionados(){
  const selecionados = document.querySelectorAll(".checkCliente:checked");
  if(!selecionados.length) return alert("Nenhum cliente selecionado.");
  if(!confirm("Deseja excluir os selecionados?")) return;
  const indices = Array.from(selecionados).map(c=>parseInt(c.dataset.index));
  clientes = clientes.filter((_,i)=>!indices.includes(i));
  atualizarTabela();
}

function toggleSelecionarTodos(chk){
  document.querySelectorAll(".checkCliente").forEach(c=>c.checked = chk.checked);
}

function atualizarContadores(){
  const cont = {aguardando:0,confirmado:0,reagendado:0,cancelado:0};
  clientes.forEach(c=>{
    if(c.status==="Confirmado") cont.confirmado++;
    else if(c.status==="Reagendado") cont.reagendado++;
    else if(c.status==="Cancelado") cont.cancelado++;
    else cont.aguardando++;
  });
  document.getElementById("contAguardando").innerText = cont.aguardando;
  document.getElementById("contConfirmado").innerText = cont.confirmado;
  document.getElementById("contReagendado").innerText = cont.reagendado;
  document.getElementById("contCancelado").innerText = cont.cancelado;
}

function filtrarPorContrato(){
  const termo = document.getElementById("pesquisa").value.toLowerCase();
  document.querySelectorAll("#tabela tbody tr").forEach(linha=>{
    const contrato = linha.children[3].innerText.toLowerCase();
    linha.style.display = contrato.includes(termo) ? "" : "none";
  });
}
