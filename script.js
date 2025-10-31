document.getElementById('fileInput').addEventListener('change', handleFile);

// Função principal para ler o CSV
function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        delimiter: detectDelimiter(file.name),
        complete: function(results) {
            const data = results.data.filter(row => row.Contrato && row.Cliente);
            if (data.length === 0) {
                alert('⚠️ Nenhum dado válido encontrado. Verifique o separador (vírgula ou ponto e vírgula) e o nome das colunas.');
                return;
            }

            alert('✅ Planilha importada com sucesso!');
            renderTable(data);
            updateStatusCounters(data);
        },
        error: function(error) {
            console.error('Erro ao ler CSV:', error);
            alert('❌ Erro ao ler o arquivo CSV.');
        }
    });
}

// Detecta o delimitador automaticamente (vírgula ou ponto e vírgula)
function detectDelimiter(filename) {
    return filename.endsWith('.csv') ? ',' : ';';
}

// Renderiza a tabela na tela
function renderTable(data) {
    const table = document.getElementById('dataTable');
    table.innerHTML = '';

    const headers = Object.keys(data[0]);
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    data.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header];
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
}

// Atualiza os contadores de status (reagendado, cancelado, confirmado)
function updateStatusCounters(data) {
    const total = data.length;
    document.getElementById('contadorTotal').textContent = total;
    document.getElementById('contadorConfirmado').textContent = data.filter(r => r.Status === 'Confirmado').length;
    document.getElementById('contadorReagendado').textContent = data.filter(r => r.Status === 'Reagendado').length;
    document.getElementById('contadorCancelado').textContent = data.filter(r => r.Status === 'Cancelado').length;
}
