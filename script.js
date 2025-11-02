let clientes = [];
let abaWhatsApp = null;

function salvarLocal() { localStorage.setItem('clientes', JSON.stringify(clientes)); }
function carregarLocal() { const data = localStorage.getItem('clientes'); if(data){ clientes = JSON.parse(data); atualizarTabela(); } }
window.onload = () => { carregarLocal(); atualizarMensagemPadrao(); };

function adicionarCliente() {
  const nome = document.getElementById('cliente').value.trim();
  const celular = document.getElementById('celular').value.trim();
  const contrato = document.getElementById('contrato').value.trim();
  const data = document.getElementById('data').value;
  const periodo = document.getElementById('periodo').value;
  const endereco = document.getElementById('endereco').value.trim();
  if (!nome || !celular || !contrato || !data || !periodo || !endereco) return alert("Preencha todos os campos!");
  clientes.push({ nome, celular, contrato, data, periodo, endereco, status:"Aguardando" });
  atualizarTabela(); salvarLocal();
}

function gerarMensagem(c){
  const tipo = document.getElementById('tipoMensagem').value;
  if(tipo==="antecipacao"){
    return `Olá, Prezado(a) ${c.nome}!\n\nAqui é da Ligga Telecom, tudo bem? 😊\n\nIdentificamos a possibilidade de antecipar o seu atendimento para hoje!\n\n📅 Data: ${c.data}\n⏰ Período: ${c.periodo}\n🏠 Endereço: ${c.endereco}\n\nVocê confirma a antecipação? ✅\n1. SIM, CONFIRMAR\n2. NÃO, MANTER DATA ATUAL`;
  } else if(tipo==="confirmacao"){
    return `Olá, ${c.nome}!\n\nSou da Ligga Telecom. Confirmamos o seu agendamento para:\n📅 ${c.data}\n⏰ ${c.periodo}\n🏠 ${c.endereco}\n\nSelecione uma das opções:\n1️⃣ Confirmar atendimento\n2️⃣ Preciso reagendar\n3️⃣ Já cancelei os serviços`;
  } else {
    return `Olá, ${c.nome}!\n\nNosso técnico está em frente ao seu endereço (${c.endereco}) para realizar a visita técnica. 🚀\n\nPor favor, certifique-se que haja alguém maior de 18 anos no local.`;
  }
}

function atualizarMensagemPadrao(){
  const c = {nome:"Cliente",data:"dd/mm/aaaa",periodo:"Período",endereco:"Rua Exemplo, 123"};
  document.getElementById('mensagemPadrao').value = gerarMensagem(c);
}

function atualizarTabela() {
  const tbody = document.querySelector("#tabela tbody");
  tbody.innerHTML = "";
  clientes.forEach((c,i)=>{
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
        <button onclick="enviarMensagem(${i})">📤 Enviar</button>
        <button onclick="atualizarStatus(${i},'Confirmado')">✅</button>
        <button onclick="atualizarStatus(${i},'Reagendado')">📅</button>
        <button onclick="atualizarStatus(${i},'Cancelado')">❌</button>
      </td>`;
    tbody.appendChild(tr);
  });
  atualizarContadores(); salvarLocal();
}

function atualizarStatus(i, status){ clientes[i].status=status; atualizarTabela(); salvarLocal(); }

// ✅ CORREÇÃO: Mantém apenas uma aba do WhatsApp aberta e reusa nas próximas mensagens
let abaWhatsApp = null;

function abrirAbaWhatsApp() {
  // Abre uma aba fixa do WhatsApp Web uma única vez
  if (!abaWhatsApp || abaWhatsApp.closed) {
    abaWhatsApp = window.open("https://web.whatsapp.com", "whatsappWindow");
    alert("Aba do WhatsApp aberta. Agora envie mensagens normalmente.");
  } else {
    abaWhatsApp.focus();
  }
}

function enviarMensagem(i) {
  const c = clientes[i];
  const numero = c.celular.replace(/\D/g, "");
  const msg = gerarMensagem(c);
  const link = `https://web.whatsapp.com/send?phone=55${numero}&text=${encodeURIComponent(msg)}`;

  if (abaWhatsApp && !abaWhatsApp.closed) {
    abaWhatsApp.location.href = link; // envia pra mesma aba
    abaWhatsApp.focus();
  } else {
    alert("Abra primeiro o WhatsApp Web clicando em '🟢 Abrir WhatsApp Web'.");
  }

  clientes[i].status = "Mensagem enviada";
  atualizarTabela();
  salvarLocal();
}


function exportarCSV(){
  const clientesUnicos = clientes.filter((c, index, self) => index === self.findIndex(t => t.contrato === c.contrato));
  let csv = "Cliente,Celular,Contrato,Data,Período,Endereço,Status\n";
  clientesUnicos.forEach(c => csv += `"${c.nome}","${c.celular}","${c.contrato}","${c.data}","${c.periodo}","${c.endereco}","${c.status}"\n`);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "relatorio_visitas.csv";
  link.click();
}

function importarCSV(e){
  const file=e.target.files[0]; if(!file) return;
  Papa.parse(file,{header:true,skipEmptyLines:true,complete:function(r){
    r.data.forEach(row=>{
      if(row.Contrato || row.contrato){
        clientes.push({
          nome: row.Nome || row.nome || "",
          celular: row.Celular || row.celular || "",
          contrato: row.Contrato || row.contrato || "",
          data: row["Data agendada"] || row.data || "",
          periodo: formatarPeriodo(row["Período Agendado"] || ""),
          endereco: row.Endereço || row.endereco || row["Endereço do Contrato"] || "",
          status: "Importado"
        });
      }
    });
    atualizarTabela(); salvarLocal();
  }});
}

function formatarPeriodo(p){
  if(!p) return "Tarde";
  const hora = p.match(/\d+/);
  if(hora && parseInt(hora[0]) <= 13) return "Manhã";
  return "Tarde";
}

function selecionarTodosClientes(checkbox){
  document.querySelectorAll(".checkContato").forEach(cb => cb.checked = checkbox.checked);
}

function excluirSelecionados(){
  const selecionados = Array.from(document.querySelectorAll(".checkContato:checked")).map(cb => parseInt(cb.dataset.index));
  if(selecionados.length === 0) return alert("Nenhum contato selecionado!");
  if(!confirm("Excluir contatos selecionados?")) return;
  clientes = clientes.filter((_,i)=>!selecionados.includes(i));
  atualizarTabela(); salvarLocal();
}

function filtrarPorContrato(){
  const termo = document.getElementById("buscaContrato").value.toLowerCase();
  const linhas = document.querySelectorAll("#tabela tbody tr");
  linhas.forEach(l=>{
    const contrato = l.children[3].innerText.toLowerCase();
    l.style.display = contrato.includes(termo) ? "" : "none";
  });
}

function atualizarContadores(){
  let cts={Aguardando:0,Confirmado:0,Reagendado:0,Cancelado:0};
  clientes.forEach(c=>{ cts[c.status] = (cts[c.status]||0)+1; });
  contAguardando.innerText=cts.Aguardando||0;
  contConfirmado.innerText=cts.Confirmado||0;
  contReagendado.innerText=cts.Reagendado||0;
  contCancelado.innerText=cts.Cancelado||0;
}
