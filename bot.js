// bot.js - Chatbot Ligga Telecom (Venom Bot)
const venom = require('venom-bot');
const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.json());
app.use(require('cors')());

let clientes = [];

// Carrega dados dos clientes (salvos pelo painel)
function carregarClientes() {
  if (fs.existsSync('clientes.json')) {
    clientes = JSON.parse(fs.readFileSync('clientes.json'));
  }
}
carregarClientes();

// Salva alterações
function salvarClientes() {
  fs.writeFileSync('clientes.json', JSON.stringify(clientes, null, 2));
}

// Inicia o bot
venom.create({ session: 'ligga_cop' })
  .then(client => start(client))
  .catch(err => console.error(err));

function start(client) {
  console.log("🤖 Ligga Bot iniciado com sucesso!");

  client.onMessage(message => {
    const numero = message.from.replace(/\D/g, '');
    const cliente = clientes.find(c => c.celular && c.celular.includes(numero.slice(-8)));

    if (!cliente) return;

    const texto = message.body.trim();

    if (texto === '1') {
      cliente.status = "Confirmado";
      client.sendText(message.from, "✅ Atendimento confirmado com sucesso!\nA Ligga Telecom agradece o retorno. 🟠");
    } else if (texto === '2') {
      cliente.status = "Reagendado";
      client.sendText(message.from, "📅 Solicitação de reagendamento recebida!\nNosso time entrará em contato para definir nova data.");
    } else if (texto === '3') {
      cliente.status = "Cancelado";
      client.sendText(message.from, "❌ Cancelamento confirmado.\nEsperamos atender você novamente em breve!");
    } else {
      client.sendText(message.from, "Olá! 👋\nResponda com o número correspondente:\n1️⃣ Confirmar atendimento\n2️⃣ Reagendar\n3️⃣ Cancelar");
    }

    salvarClientes();
  });
}

// API para o painel web acessar os dados
app.get('/clientes', (req, res) => res.json(clientes));
app.post('/clientes', (req, res) => {
  clientes = req.body;
  salvarClientes();
  res.json({ msg: "Clientes atualizados com sucesso!" });
});

app.listen(3000, () => console.log("🌐 API LiggaBot rodando em http://localhost:3000"));
