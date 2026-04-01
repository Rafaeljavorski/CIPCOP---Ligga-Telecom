let clientes = [];

function abrirAbaWhatsApp(){
  window.open("https://web.whatsapp.com");
}

function adicionarCliente(){
  const c = {
    nome: cliente.value,
    celular: celular.value,
    contrato: contrato.value,
    data: data.value,
    periodo: periodo.value,
    status: "Aguardando"
  };
  clientes.push(c);
  atualizarTabela();
}

function atualizarTabela(){
  const tbody = document.querySelector("tbody");
  tbody.innerHTML = "";
  clientes.forEach((c,i)=>{
    tbody.innerHTML += `
    <tr>
      <td><input type="checkbox"></td>
      <td>${c.nome}</td>
      <td>${c.celular}</td>
      <td>${c.contrato}</td>
      <td>${c.data}</td>
      <td>${c.periodo}</td>
      <td>${c.status}</td>
      <td><button onclick="enviar(${i})">Enviar</button></td>
    </tr>`;
  });
}

function enviar(i){
  const c = clientes[i];
  const url = `https://web.whatsapp.com/send?phone=55${c.celular}&text=Olá ${c.nome}`;
  window.open(url);
}

function filtrarPorContrato(){
  const termo = buscaContrato.value.toLowerCase();
  document.querySelectorAll("tbody tr").forEach(tr=>{
    tr.style.display = tr.innerText.toLowerCase().includes(termo) ? "" : "none";
  });
}
