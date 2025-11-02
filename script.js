let clientes = [];

function salvarLocal() { localStorage.setItem('clientes', JSON.stringify(clientes)); }
function carregarLocal() { const data = localStorage.getItem('clientes'); if(data){ clientes = JSON.parse(data); atualizarTabela(); } }
window.onload = () => { carregarLocal(); atualizarMensagemPadrao(); };

function adicionarCliente() {
  const nome = document.getElementById('cliente').value;
  const celular = document.getElementById('celular').value;
  const contrato = document.getElementById('contrato').value;
  const data = document.getElementById('data').value;
  const periodo = document.getElementById('periodo').value;
  const endereco = document.getElementById('endereco').value;
  if (!nome || !celular || !contrato || !data || !periodo || !endereco) { alert("Preencha todos os campos!"); return; }
  clientes.push({ nome, celular, contrato, data, periodo, endereco, status:"Aguardando", selected:false });
  atualizarTabela(); limparCampos(); salvarLocal();
}
function limparCampos(){
  ['cliente','celular','contrato','data','periodo','endereco'].forEach(id=>document.getElementById(id).value="");
}

function gerarMensagem(c){
  const tipo = document.getElementById('tipoMensagem').value;
  if(tipo==="antecipacao"){
    const novaData = prompt("Digite a nova data para antecipação (ex: 05/11/2025):", c.data);
    return `Olá, Prezado(a) ${c.nome}!

Aqui é da Ligga Telecom, tudo bem? 😊

Identificamos a possibilidade de antecipar o seu atendimento!

📅 Data: ${novaData || c.data}
⏰ Período: ${c.periodo}
📍 Endereço: ${c.endereco}

Você confirma a antecipação do seu atendimento? ✅
1. SIM, CONFIRMAR
2. NÃO, MANTER DATA ATUAL

(Nosso sistema não suporta chamadas ou áudios)`;
  } else if(tipo==="confirmacao"){
    return `Olá, tudo bem ${c.nome}?

Meu contato é referente à Confirmação de Agendamento – Instalação de Internet | Ligga Telecom.

📅 Agendado: ${c.data}
⏰ Período: ${c.periodo}
📍 Endereço: ${c.endereco}

Por favor, selecione uma das opções abaixo:
1️⃣ Confirmar atendimento
2️⃣ Preciso reagendar (escolher nova data)
3️⃣ Cancelar visita

Aguardamos sua resposta!
Equipe Ligga Telecom`;
  } else if(tipo==="chegada"){
    return `Olá, ${c.nome}!

Aqui é da Ligga Telecom. Nosso técnico está em frente ao seu endereço para realizar a visita técnica. 🚀

⚠️ Certifique-se que haja alguém maior de 18 anos no local. ⚠️

Agradecemos a sua atenção!
Equipe Ligga Telecom`;
  }
}

function atualizarMensagemPadrao(){
  const c = {nome:"Cliente",data:"dd/mm/aaaa",periodo:"Manhã",endereco:"Rua Exemplo"};
  document.getElementById('mensagemPadrao').value = gerarMensagem(c);
}

function atualizarTabela() {
  const tbody = document.querySelector("#tabela tbody");
  tbody.innerHTML = "";
  clientes.forEach((c,i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type='checkbox' ${c.selected?'checked':''} onchange='toggleSelect(${i},this)'></td>
      <td>${c.nome}</td>
      <td contenteditable='true' onblur='alterarCampo(${i},"celular",this.innerText)'>${c.celular}</td>
      <td>${c.contrato}</td>
      <td>${c.data}</td>
      <td>${c.periodo}</td>
      <td>${c.endereco}</td>
      <td>${c.status}</td>
      <td>
        <button onclick='enviarMensagem(${i})'>📤 Enviar</button>
        <button onclick='atualizarStatus(${i},"Confirmado")'>✅</button>
        <button onclick='atualizarStatus(${i},"Reagendado")'>📅</button>
        <button onclick='atualizarStatus(${i},"Cancelado")'>❌</button>
        <button onclick='excluirContato(${i})'>🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });
  atualizarContadores(); salvarLocal();
}

function toggleSelect(i, el){ clientes[i].selected = el.checked; salvarLocal(); }
function toggleSelectAll(el){ clientes.forEach(c=>c.selected=el.checked); atualizarTabela(); }

function enviarMensagem(i){
  const c = clientes[i];
  const numero = c.celular.replace(/\D/g,'');
  const msg = gerarMensagem(c);
  const linkApp = `whatsapp://send?phone=55${numero}&text=${encodeURIComponent(msg)}`;
  const linkWeb = `https://wa.me/55${numero}?text=${encodeURIComponent(msg)}`;
  window.location.href = linkApp;
  setTimeout(()=>window.open(linkWeb, '_blank'),1500);
  c.status = "Mensagem enviada";
  atualizarTabela(); salvarLocal();
}

function enviarSelecionados(){
  const selecionados = clientes.filter(c=>c.selected);
  if(selecionados.length===0){ alert("Nenhum contato selecionado."); return; }
  selecionados.forEach((c,i)=>setTimeout(()=>enviarMensagem(clientes.indexOf(c)), i*1400));
}

function excluirSelecionados(){
  clientes = clientes.filter(c=>!c.selected);
  atualizarTabela(); salvarLocal();
}

function alterarCampo(i, campo, valor){ clientes[i][campo]=valor; salvarLocal(); }
function atualizarStatus(i,status){ clientes[i].status=status; atualizarTabela(); salvarLocal(); }
function excluirContato(i){ if(confirm("Deseja realmente excluir este contato?")){ clientes.splice(i,1); atualizarTabela(); salvarLocal(); } }

function atualizarContadores(){
  const cont={aguardando:0,confirmado:0,reagendado:0,cancelado:0};
  clientes.forEach(c=>{
    if(c.status.includes("Aguardando")||c.status=="Mensagem enviada") cont.aguardando++;
    else if(c.status=="Confirmado") cont.confirmado++;
    else if(c.status=="Reagendado") cont.reagendado++;
    else if(c.status=="Cancelado") cont.cancelado++;
  });
  document.getElementById("contAguardando").innerText=cont.aguardando;
  document.getElementById("contConfirmado").innerText=cont.confirmado;
  document.getElementById("contReagendado").innerText=cont.reagendado;
  document.getElementById("contCancelado").innerText=cont.cancelado;
}

function exportarCSV(){
  const clientesUnicos = clientes.filter((c, index, self)=>index===self.findIndex(t=>t.contrato===c.contrato));
  let csv = "Cliente,Celular,Contrato,Data,Período,Endereço,Status\n";
  clientesUnicos.forEach(c=>csv+=`"${c.nome}","${c.celular}","${c.contrato}","${c.data}","${c.periodo}","${c.endereco}","${c.status}"\n`);
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'relatorio_visitas.csv';
  link.click();
}

function importarCSV(event){
  const file=event.target.files[0]; if(!file) return;
  Papa.parse(file,{header:true,skipEmptyLines:true,complete:function(results){
    results.data.forEach(row=>{
      const nome=row.Nome||row.Cliente||row["Nome do Cliente"]||"";
      const celular=row.Celular||row.Telefone||row["Telefone Contato"]||"";
      const contrato=row.Contrato||row["ID Sistema Externo"]||"";
      const data=row["Data agendada"]||row["Data Agendamento"]||row.Data||"";
      const endereco=row["Endereço do Contrato"]||row.Endereço||row["Endereco"]||"";
      let periodo=row["Período Agendado"]||row.Período||"";
      if(periodo && typeof periodo==='string'){
        periodo = periodo.includes('13')||periodo.includes('14')||periodo.includes('Tarde')?'Tarde':'Manhã';
      }
      if(nome&&celular) clientes.push({nome,celular,contrato,data,periodo,endereco,status:"Importado",selected:false});
    }); atualizarTabela(); salvarLocal();
  }});
}
