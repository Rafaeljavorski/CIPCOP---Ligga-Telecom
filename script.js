// Array global para armazenar os dados importados
let dados = [];

// Função para anexar event listeners e iniciar o script após o DOM carregar
document.addEventListener("DOMContentLoaded", function() {
    const csvFileInput = document.getElementById("csvFile");
    if (csvFileInput) {
        csvFileInput.addEventListener("change", handleFileUpload);
        console.log("Event listener anexado ao #csvFile.");
    } else {
        console.error("ERRO: Elemento com ID 'csvFile' não encontrado no HTML.");
    }

    // Inicializa a tabela e contadores caso já haja dados (opcional, mas bom)
    // atualizarTabela(); 
    // atualizarContadores();
});


/**
 * Manipula o upload do arquivo CSV, lê o conteúdo e chama as funções de processamento.
 * @param {Event} event - O evento 'change' do input de arquivo.
 */
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        alert("Nenhum arquivo selecionado!");
        return;
    }

    const reader = new FileReader();
    
    reader.onload = function(e) {
        const text = e.target.result;
        processarCSV(text);
    };

    reader.onerror = function() {
        alert("Erro ao ler o arquivo.");
        console.error("Erro na leitura do arquivo:", reader.error);
    };

    // Tenta ler o arquivo como UTF-8 para melhor compatibilidade com acentuação
    reader.readAsText(file, "UTF-8");
}


/**
 * Processa o texto do CSV, extrai os dados e atualiza a interface.
 * @param {string} text - O conteúdo de texto do arquivo CSV.
 */
function processarCSV(text) {
    // 1. Detecta automaticamente o separador (ponto e vírgula ou vírgula)
    const separador = text.includes(";") ? ";" : ",";
    
    // 2. Limpa e divide as linhas
    // Usa uma regex para lidar com diferentes quebras de linha (\r\n, \r, \n) e remove linhas vazias
    const linhas = text.split(/[\r\n]+/)
                       .map(l => l.trim())
                       .filter(l => l.length > 0);
    
    if (linhas.length === 0) {
        alert("O arquivo CSV está vazio.");
        return;
    }

    // 3. Processa Cabeçalho
    const cabecalho = linhas[0].split(separador).map(c => c.trim());
    const linhasDados = linhas.slice(1);

    // 4. Define e mapeia colunas esperadas
    const camposEsperados = ["Contrato", "Cliente", "Celular", "Data Agendamento", "Endereço", "Bairro"];
    const indices = camposEsperados.map(campo => cabecalho.indexOf(campo));

    if (indices.includes(-1)) {
        alert("Colunas inválidas! Verifique se o CSV contém: " + camposEsperados.join(", "));
        console.error("Cabeçalho lido:", cabecalho);
        return;
    }

    // 5. Mapeia as linhas para o array de objetos 'dados'
    dados = linhasDados.map(linha => {
        const cols = linha.split(separador);
        
        // Usa desestruturação para garantir que o acesso ao índice não cause erro
        // e garante que o valor seja trimado (removido espaços) ou seja uma string vazia
        return {
            contrato: cols[indices[0]]?.trim() || "",
            cliente: cols[indices[1]]?.trim() || "",
            celular: cols[indices[2]]?.trim() || "",
            data: cols[indices[3]]?.trim() || "",
            endereco: cols[indices[4]]?.trim() || "",
            bairro: cols[indices[5]]?.trim() || "",
            status: "Aguardando" // Status inicial
        };
    })
    // Filtra linhas que não têm Contrato ou Celular (dados inválidos/incompletos)
    .filter(d => d.contrato && d.celular);

    if (dados.length === 0) {
        alert("Nenhum dado válido encontrado no CSV! Verifique se as colunas 'Contrato' e 'Celular' estão preenchidas.");
        return;
    }

    console.log(`Importação bem-sucedida! ${dados.length} registros carregados.`);
    alert("Planilha importada com sucesso!");
    
    // 6. Atualiza a interface
    atualizarTabela();
    atualizarContadores();
}


/**
 * Atualiza o conteúdo da tabela HTML com os dados carregados.
 */
function atualizarTabela() {
    const tabelaBody = document.getElementById("tabelaDados");
    if (!tabelaBody) {
        console.error("ERRO: Elemento com ID 'tabelaDados' não encontrado. A tabela não pode ser atualizada.");
        return;
    }

    // Limpa o conteúdo atual
    tabelaBody.innerHTML = ''; 

    // Cria o cabeçalho (idealmente, o cabeçalho estaria no <thead> do HTML)
    const cabecalhoHTML = `
        <tr>
            <th>Contrato</th>
            <th>Cliente</th>
            <th>Celular</th>
            <th>Data Agendamento</th>
            <th>Endereço</th>
            <th>Bairro</th>
            <th>Status</th>
        </tr>
    `;
    tabelaBody.innerHTML = cabecalhoHTML;


    // Adiciona as linhas de dados
    dados.forEach(d => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${d.contrato}</td>
            <td>${d.cliente}</td>
            <td>${d.celular}</td>
            <td>${d.data}</td>
            <td>${d.endereco}</td>
            <td>${d.bairro}</td>
            <td>${d.status}</td>
        `;
        tabelaBody.appendChild(tr);
    });
}


/**
 * Atualiza os contadores de status na interface HTML.
 */
function atualizarContadores() {
    // Calcula a contagem de cada status
    let aguardando = dados.filter(d => d.status === "Aguardando").length;
    let confirmados = dados.filter(d => d.status === "Confirmado").length;
    let cancelados = dados.filter(d => d.status === "Cancelado").length;
    let reagendados = dados.filter(d => d.status === "Reagendado").length;

    // Função auxiliar para atualizar um contador específico
    const setCounter = (id, count) => {
        const element = document.getElementById(id);
        if (element) {
            element.innerText = count;
        } else {
            console.warn(`Aviso: Contador com ID '${id}' não encontrado.`);
        }
    };

    setCounter("contadorAguardando", aguardando);
    setCounter("contadorConfirmado", confirmados);
    setCounter("contadorCancelado", cancelados);
    setCounter("contadorReagendado", reagendados);
}
