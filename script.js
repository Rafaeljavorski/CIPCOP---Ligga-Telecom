// VARIÁVEIS GLOBAIS
// O array principal de dados de atendimento
let dadosAtendimento = [];
// As colunas que o CSV deve ter
const CAMPOS_CSV_ESPERADOS = ["Contrato", "Cliente", "Celular", "Data Agendamento", "Endereço", "Bairro", "Período"];
// As mensagens de WhatsApp (Pode ser estendido ou movido para JSON)
const MENSAGENS = {
    antecipacao: "Olá [NOME] da [CONTRATO], somos da Ligga. Notamos que seu agendamento de [Data Agendamento] pode ser antecipado. Confirma?",
    confirmacao: "Olá [NOME] da [CONTRATO], somos da Ligga. Confirmamos o agendamento do técnico para [Data Agendamento] no [PERIODO] no endereço [ENDERECO].",
    chegada: "Olá [NOME], o técnico [BAIRRO] já está em frente à sua residência para o atendimento [CONTRATO]."
};
let selecionarTodosEstado = false; // Estado do botão 'Selecionar Todos'

// ----------------------------------------------------------------------
// 1. INICIALIZAÇÃO E EVENTOS
// ----------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", function() {
    // Anexa listeners para os inputs de filtro e seleção.
    // O listener de CSV está no HTML: onchange="importarCSV(event)"
    const filtroInput = document.getElementById("filtroContrato");
    if (filtroInput) {
        filtroInput.addEventListener("input", filtrarTabela);
    }
    
    // Simula a carga inicial dos dados (para teste)
    // Se você usa localStorage, carregaria aqui.
    // dadosAtendimento = JSON.parse(localStorage.getItem('dadosAtendimento')) || [];
    // atualizarDashboard(); 
});


// ----------------------------------------------------------------------
// 2. IMPORTAÇÃO E PROCESSAMENTO CSV (Requer Papa Parse)
// ----------------------------------------------------------------------

/**
 * Função chamada pelo onchange do input #arquivoCSV no HTML.
 * @param {Event} event - O evento de mudança de arquivo.
 */
function importarCSV(event) {
    const file = event.target.files[0];
    if (!file) {
        alert("Nenhum arquivo selecionado!");
        return;
    }

    // Verifica se Papa Parse está carregado
    if (typeof Papa === 'undefined') {
        alert("Erro: A biblioteca Papa Parse não foi carregada. Verifique o link <script> no seu HTML.");
        return;
    }

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: "utf-8", // Tenta UTF-8 para acentuação
        complete: function(results) {
            processarDadosCSV(results.data);
            // Limpa o input para permitir carregar o mesmo arquivo novamente
            event.target.value = ''; 
        },
        error: function(error) {
            console.error("Erro ao ler CSV:", error);
            alert("Falha ao ler o arquivo CSV. Verifique o formato e tente novamente.");
        }
    });
}

/**
 * Processa e valida os dados lidos pelo Papa Parse.
 * @param {Array<Object>} dadosLidos - Dados brutos lidos.
 */
function processarDadosCSV(dadosLidos) {
    const cabecalho = dadosLidos.length > 0 ? Object.keys(dadosLidos[0]) : [];

    // Valida se as colunas esperadas existem
    const colunasFaltando = CAMPOS_CSV_ESPERADOS.filter(campo => !cabecalho.includes(campo));
    if (colunasFaltando.length > 0) {
        alert(`Colunas inválidas no CSV! Faltam: ${colunasFaltando.join(", ")}. Verifique o cabeçalho.`);
        return;
    }

    // Mapeia e filtra os dados
    const novosDados = dadosLidos
        .map(d => ({
            // Mapeamento e limpeza (trim) dos campos
            contrato: d["Contrato"]?.trim() || "",
            cliente: d["Cliente"]?.trim() || "",
            celular: d["Celular"]?.trim() || "",
            data: d["Data Agendamento"]?.trim() || "",
            periodo: d["Período"]?.trim() || "Comercial", // Assume padrão se vazio
            endereco: d["Endereço"]?.trim() || "",
            bairro: d["Bairro"]?.trim() || "",
            // Campos de controle
            status: d["Status"]?.trim() || "Aguardando", // Mantém status do CSV, senão 'Aguardando'
            selecionado: false,
            id: Date.now() + Math.random() // ID único
        }))
        .filter(d => d.contrato && d.celular); // Filtra por campos essenciais

    if (novosDados.length === 0) {
        alert("Nenhum dado válido encontrado no CSV! Verifique as colunas 'Contrato' e 'Celular'.");
        return;
    }

    dadosAtendimento = novosDados; // Substitui os dados
    alert(`Importação concluída: ${dadosAtendimento.length} registros carregados.`);
    atualizarDashboard();
}

// ----------------------------------------------------------------------
// 3. GERENCIAMENTO DE DADOS (Adicionar / Limpar / Exportar)
// ----------------------------------------------------------------------

function adicionarCliente() {
    const contrato = document.getElementById("inputContrato").value.trim();
    const cliente = document.getElementById("inputCliente").value.trim();
    const celular = document.getElementById("inputCelular").value.trim();
    const data = document.getElementById("inputData").value.trim();
    const endereco = document.getElementById("inputEndereco").value.trim();
    const bairro = document.getElementById("inputBairro").value.trim();
    
    // Adicione mais validações aqui, se necessário (ex: formato de celular)
    if (!contrato || !cliente || !celular || !data) {
        alert("Preencha Contrato, Cliente, Celular e Data para adicionar.");
        return;
    }

    const novoCliente = {
        contrato, cliente, celular, data, endereco, bairro,
        periodo: "Manhã", // Padrão, pode ser um input também
        status: "Aguardando",
        selecionado: false,
        id: Date.now() + Math.random()
    };

    dadosAtendimento.push(novoCliente);
    // Limpar os inputs após adicionar
    document.querySelectorAll('.panel input:not([type="file"]):not([type="date"]), .panel textarea').forEach(input => input.value = '');

    atualizarDashboard();
}

function limparTodos() {
    if (confirm("Tem certeza que deseja limpar TODOS os dados?")) {
        dadosAtendimento = [];
        atualizarDashboard();
    }
}

function limparSelecionados() {
    if (dadosAtendimento.some(d => d.selecionado) && confirm("Tem certeza que deseja EXCLUIR os clientes selecionados?")) {
        dadosAtendimento = dadosAtendimento.filter(d => !d.selecionado);
        atualizarDashboard();
    }
}

function exportarCSV() {
    // Prepara os dados para exportação (remove campos internos como 'selecionado' e 'id')
    const dadosParaExportar = dadosAtendimento.map(d => ({
        "Contrato": d.contrato,
        "Cliente": d.cliente,
        "Celular": d.celular,
        "Data Agendamento": d.data,
        "Período": d.periodo,
        "Endereço": d.endereco,
        "Bairro": d.bairro,
        "Status": d.status
    }));

    // Requer Papa Parse
    if (typeof Papa === 'undefined') {
        alert("Erro: Papa Parse é necessário para exportar CSV.");
        return;
    }

    const csv = Papa.unparse(dadosParaExportar, {
        quotes: true,
        delimiter: ";", // Usa ponto e vírgula como padrão de exportação
        header: true
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "dados_ligga_export_" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ----------------------------------------------------------------------
// 4. ATUALIZAÇÃO DA INTERFACE (Dashboard, Tabela, Contadores)
// ----------------------------------------------------------------------

/**
 * Ponto central de atualização da interface.
 */
function atualizarDashboard() {
    atualizarTabela();
    atualizarContadores();
    // Se você tivesse gráficos (Chart.js), chamaria a atualização deles aqui.
}

/**
 * Filtra a tabela baseada no input de busca.
 */
function filtrarTabela() {
    atualizarTabela(); // A função atualizarTabela agora lida com o filtro
}

/**
 * Atualiza o conteúdo da tabela HTML (com filtros e ações).
 */
function atualizarTabela() {
    const tbody = document.querySelector("#tabela tbody");
    if (!tbody) return;

    const termoBusca = document.getElementById("filtroContrato").value.toLowerCase();

    tbody.innerHTML = '';
    
    // Filtra antes de renderizar
    const dadosFiltrados = dadosAtendimento.filter(d => 
        !termoBusca || 
        d.contrato.toLowerCase().includes(termoBusca) || 
        d.cliente.toLowerCase().includes(termoBusca)
    );

    dadosFiltrados.forEach(d => {
        const tr = document.createElement("tr");
        const statusClass = d.status === 'Confirmado' ? 'ok' : d.status === 'Cancelado' ? 'err' : d.status === 'Reagendado' ? 'warn' : 'info';

        tr.innerHTML = `
            <td class="sel-col checkbox-center"><input type="checkbox" onchange="toggleSelecao('${d.id}')" ${d.selecionado ? 'checked' : ''}></td>
            <td>${d.contrato}</td>
            <td>${d.cliente}</td>
            <td>${d.celular}</td>
            <td>${d.data}</td>
            <td>${d.periodo}</td>
            <td>${d.endereco}</td>
            <td>${d.bairro}</td>
            <td><span class="badge ${statusClass}">${d.status}</span></td>
            <td>
                <button class="small-btn info" onclick="enviarWhatsIndividual('${d.id}')">📲 Enviar</button>
                <button class="small-btn ok" onclick="mudarStatus('${d.id}', 'Confirmado')">✅ Confirmar</button>
                <button class="small-btn warn" onclick="mudarStatus('${d.id}', 'Reagendado')">🔁 Reagendar</button>
                <button class="small-btn err" onclick="mudarStatus('${d.id}', 'Cancelado')">❌ Cancelar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Atualiza o checkbox de seleção global
    const selTodosTop = document.getElementById("selTodosTop");
    if (selTodosTop) {
        const todosSelecionados = dadosAtendimento.length > 0 && dadosAtendimento.every(d => d.selecionado);
        selTodosTop.checked = todosSelecionados;
        selecionarTodosEstado = todosSelecionados;
    }
}

/**
 * Atualiza os contadores de status.
 */
function atualizarContadores() {
    const contadores = {
        Aguardando: dadosAtendimento.filter(d => d.status === "Aguardando").length,
        Confirmado: dadosAtendimento.filter(d => d.status === "Confirmado").length,
        Reagendado: dadosAtendimento.filter(d => d.status === "Reagendado").length,
        Cancelado: dadosAtendimento.filter(d => d.status === "Cancelado").length,
    };

    // Mapeia os IDs do HTML para os status
    document.getElementById("contAguardando").innerText = contadores.Aguardando || 0;
    document.getElementById("contConfirmado").innerText = contadores.Confirmado || 0;
    document.getElementById("contReagendado").innerText = contadores.Reagendado || 0;
    document.getElementById("contCancelado").innerText = contadores.Cancelado || 0;
    
    // Salva no LocalStorage (opcional)
    // localStorage.setItem('dadosAtendimento', JSON.stringify(dadosAtendimento));
}

// ----------------------------------------------------------------------
// 5. AÇÕES (Seleção, Status, WhatsApp)
// ----------------------------------------------------------------------

function mudarStatus(id, novoStatus) {
    const cliente = dadosAtendimento.find(d => d.id == id);
    if (cliente) {
        cliente.status = novoStatus;
        atualizarDashboard();
    }
}

function toggleSelecao(id) {
    const cliente = dadosAtendimento.find(d => d.id == id);
    if (cliente) {
        cliente.selecionado = !cliente.selecionado;
        atualizarDashboard();
    }
}

function toggleSelecionarTodosTop(checkbox) {
    selecionarTodosEstado = checkbox.checked;
    selecionarTodosToggle();
}

function selecionarTodosToggle() {
    selecionarTodosEstado = !selecionarTodosEstado;
    dadosAtendimento.forEach(d => d.selecionado = selecionarTodosEstado);
    atualizarDashboard();
}

/**
 * Gera a mensagem formatada para um cliente específico.
 * @param {Object} cliente - O objeto cliente.
 * @param {string} tipo - O tipo de mensagem (antecipacao, confirmacao, chegada).
 * @returns {string} - A mensagem formatada.
 */
function gerarMensagem(cliente, tipo) {
    let mensagem = MENSAGENS[tipo] || "";
    
    // Substituições de placeholders
    mensagem = mensagem.replace(/\[NOME\]/g, cliente.cliente.split(' ')[0] || "");
    mensagem = mensagem.replace(/\[Data Agendamento\]/g, cliente.data || "");
    mensagem = mensagem.replace(/\[PERIODO\]/g, cliente.periodo || "");
    mensagem = mensagem.replace(/\[ENDERECO\]/g, cliente.endereco || "");
    mensagem = mensagem.replace(/\[CONTRATO\]/g, cliente.contrato || "");
    mensagem = mensagem.replace(/\[BAIRRO\]/g, cliente.bairro || "");

    return encodeURIComponent(mensagem); // Codifica para URL
}

function gerarPreviewSelecionados() {
    const tipo = document.getElementById("tipoMensagem").value;
    const selecionados = dadosAtendimento.filter(d => d.selecionado);

    if (selecionados.length === 0) {
        alert("Selecione pelo menos um cliente para pré-visualizar.");
        return;
    }

    let preview = "";
    selecionados.forEach((cliente, index) => {
        const msg = decodeURIComponent(gerarMensagem(cliente, tipo));
        preview += `--- Cliente ${index + 1} (${cliente.cliente} - ${cliente.contrato}) ---\n${msg}\n\n`;
    });

    // Exibe em um alerta ou cria um modal/área de preview no HTML
    alert("Pré-visualização:\n\n" + preview);
    console.log(preview); // Útil para debug
}

function enviarWhatsIndividual(id) {
    const cliente = dadosAtendimento.find(d => d.id == id);
    if (!cliente) return;
    
    const tipo = document.getElementById("tipoMensagem").value;
    const celularFormatado = cliente.celular.replace(/\D/g, ""); // Remove não-dígitos
    
    if (celularFormatado.length < 10) {
        alert(`Celular inválido para ${cliente.cliente}: ${cliente.celular}`);
        return;
    }

    const mensagemCodificada = gerarMensagem(cliente, tipo);
    const url = `https://web.whatsapp.com/send?phone=55${celularFormatado}&text=${mensagemCodificada}`;
    window.open(url, '_blank');
}


function enviarSelecionadosAbrirWhats() {
    const selecionados = dadosAtendimento.filter(d => d.selecionado);

    if (selecionados.length === 0) {
        alert("Selecione pelo menos um cliente para enviar.");
        return;
    }
    
    alert(`Serão abertas ${selecionados.length} janelas/abas do WhatsApp. Certifique-se de ter o WhatsApp Web aberto.`);

    selecionados.forEach(cliente => {
        // Delay opcional para evitar bloqueio de pop-up, embora a navegação já ajude
        setTimeout(() => {
            enviarWhatsIndividual(cliente.id);
        }, 300); // 300ms de intervalo
    });
}
