// clientes.js

let clienteEmEdicao = null; // Armazena o ID do cliente em edição/pagamento
let clientes = obterDados("clientes") || []; // Obtém do script.js

// Função para "limpar" valores (R$, vírgula)
function cleanValue(val) {
    if (typeof val === 'number') return val;
    if (typeof val !== 'string') return 0;
    const cleaned = val.replace("R$", "").trim().replace(",", ".");
    return parseFloat(cleaned) || 0;
}

// Recalcula o saldo de um cliente lendo todas as movimentações
function calcularSaldoDevedor(clienteId) {
    const movimentacoes = obterDados("movimentacoes") || {};
    let saldo = 0;
    
    Object.values(movimentacoes).forEach(dia => {
        dia.forEach(mov => {
            if (mov.clienteId === clienteId) {
                // Soma Vendas Fiado (positivas) e Pagamentos (negativos)
                saldo += (cleanValue(mov.valor) * mov.quantidade);
            }
        });
    });
    return saldo;
}

// Carrega e exibe os clientes na tabela
function carregarClientes() {
    const tabela = document.querySelector("#registros tbody");
    tabela.innerHTML = "";
    clientes = obterDados("clientes") || []; // Recarrega do storage

    if (clientes.length === 0) {
        tabela.innerHTML = `<tr><td colspan="5" style="text-align:center;">Nenhum cliente cadastrado.</td></tr>`;
        return;
    }

    clientes.forEach((cliente, index) => {
        const saldo = calcularSaldoDevedor(cliente.id);
        const row = tabela.insertRow();
        
        row.innerHTML = `
            <td>${cliente.nome}</td>
            <td>${cliente.identificador}</td>
            <td>${cliente.endereco || 'N/A'}</td>
            <td class="${saldo > 0 ? 'saldo-devedor' : 'saldo-pago'}">
                R$ ${saldo.toFixed(2)}
            </td>
            <td>
                <button class="action-btn pay-btn" onclick="abrirModalPagamento(${index})">Ver/Pagar</button>
                <button class="action-btn edit-btn" onclick="prepararEdicao(${index})">Editar</button>
                <button class="action-btn delete-btn" onclick="excluirCliente(${index})">Excluir</button>
            </td>
        `;
    });
}

// Salva um novo cliente ou atualiza um existente
function salvarCliente(event) {
    event.preventDefault();
    
    const nome = document.getElementById("nome").value.trim();
    const identificador = document.getElementById("identificador").value.trim();
    const endereco = document.getElementById("endereco").value.trim();
    const editIndex = document.getElementById("editIndex").value;

    if (!nome || !identificador) {
        alert("Nome e Identificador (Telefone/CPF) são obrigatórios.");
        return;
    }

    if (editIndex !== "") {
        // Editando
        clientes[editIndex].nome = nome;
        clientes[editIndex].identificador = identificador;
        clientes[editIndex].endereco = endereco;
    } else {
        // Criando novo
        const novoCliente = {
            id: `CLIENTE-${Date.now()}`, // ID Único
            nome: nome,
            identificador: identificador,
            endereco: endereco
        };
        clientes.push(novoCliente);
    }

    salvarDados("clientes", clientes);
    document.getElementById("clientForm").reset();
    document.getElementById("editIndex").value = "";
    carregarClientes(); // Recarrega a tabela
}

// Prepara o formulário para edição
function prepararEdicao(index) {
    const cliente = clientes[index];
    document.getElementById("nome").value = cliente.nome;
    document.getElementById("identificador").value = cliente.identificador;
    document.getElementById("endereco").value = cliente.endereco;
    document.getElementById("editIndex").value = index; // Armazena o índice
    window.scrollTo(0, 0); // Rola para o topo (onde está o formulário)
}

// Exclui um cliente
function excluirCliente(index) {
    const cliente = clientes[index];
    const saldo = calcularSaldoDevedor(cliente.id);

    if (saldo > 0) {
        alert(`Não é possível excluir ${cliente.nome}. O cliente possui um saldo devedor de R$ ${saldo.toFixed(2)}.`);
        return;
    }
    
    if (!confirm(`Tem certeza que deseja excluir ${cliente.nome}?`)) {
        return;
    }

    clientes.splice(index, 1);
    salvarDados("clientes", clientes);
    carregarClientes();
}

// --- Funções do Modal de Pagamento/Histórico ---

function fecharModalPagamento() {
    document.getElementById("modal-pagamento-divida").style.display = "none";
    clienteEmEdicao = null;
}

function abrirModalPagamento(index) {
    const cliente = clientes[index];
    clienteEmEdicao = cliente.id; // Salva o ID do cliente que estamos vendo

    const movimentacoes = obterDados("movimentacoes") || {};
    const historicoDiv = document.getElementById("historico-divida");
    historicoDiv.innerHTML = "";
    let saldoTotal = 0;
    
    document.getElementById("nome-cliente-modal").innerText = `Histórico de: ${cliente.nome}`;
    
    Object.values(movimentacoes).forEach(dia => {
        dia.forEach(mov => {
            if (mov.clienteId === cliente.id) {
                const valorMov = cleanValue(mov.valor) * mov.quantidade;
                saldoTotal += valorMov;
                
                const item = document.createElement("div");
                item.classList.add("historico-item");
                
                if (mov.tipoMovimento === "PAGAMENTO_FIADO") {
                    item.classList.add("pagamento");
                    item.innerHTML = `
                        <span>${new Date(mov.data).toLocaleDateString('pt-BR')} - Pagamento</span>
                        <span>R$ ${valorMov.toFixed(2)}</span>
                    `;
                } else {
                    item.classList.add("compra");
                    item.innerHTML = `
                        <span>${new Date(mov.data).toLocaleDateString('pt-BR')} - ${mov.produto}</span>
                        <span>R$ ${valorMov.toFixed(2)}</span>
                    `;
                }
                historicoDiv.appendChild(item);
            }
        });
    });

    if (historicoDiv.innerHTML === "") {
        historicoDiv.innerHTML = "<p>Nenhuma transação encontrada.</p>";
    }
    
    document.getElementById("saldo-total-modal").innerText = `R$ ${saldoTotal.toFixed(2)}`;
    document.getElementById("valor-pagamento").value = "";
    document.getElementById("modal-pagamento-divida").style.display = "flex";
}

function confirmarPagamentoFiado() {
    const valorPagoInput = document.getElementById("valor-pagamento").value;
    const valorPago = cleanValue(valorPagoInput);

    if (isNaN(valorPago) || valorPago <= 0) {
        alert("Digite um valor de pagamento válido.");
        return;
    }
    
    const cliente = clientes.find(c => c.id === clienteEmEdicao);
    if (!cliente) {
        alert("Erro: Cliente não encontrado.");
        return;
    }

    // 1. Registra o pagamento como uma movimentação negativa
    const movimentacoes = obterDados("movimentacoes") || {};
    const data = new Date();
    const dataAtual = data.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!movimentacoes[dataAtual]) movimentacoes[dataAtual] = [];

    movimentacoes[dataAtual].push({
        tipoMovimento: "PAGAMENTO_FIADO",
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        produto: "Pagamento de Dívida",
        valor: -valorPago, // Valor NEGATIVO
        quantidade: 1,
        formaPagamento: "Dinheiro", // Assume que pagamento de dívida é em dinheiro
        data: data.toISOString(), // Salva data completa
        hora: data.toLocaleTimeString()
    });
    salvarDados("movimentacoes", movimentacoes);

    // 2. Adiciona o valor pago ao caixa do dia (como um Suprimento/Entrada)
    const movimentosCaixa = obterDados("movimentosCaixa") || [];
    movimentosCaixa.push({
        tipo: 'suprimento',
        valor: valorPago, // Valor POSITIVO
        motivo: `Pgto. Fiado: ${cliente.nome}`,
        data: data.toISOString()
    });
    salvarDados("movimentosCaixa", movimentosCaixa);
    
    alert("Pagamento registrado com sucesso! O valor foi adicionado ao caixa.");
    fecharModalPagamento();
    carregarClientes(); // Recarrega a tabela principal
}

// Inicialização
window.onload = () => {
    carregarClientes();
    document.getElementById("clientForm").addEventListener("submit", salvarCliente);
};
// Substitua a função carregarClientes() inteira por esta:

function carregarClientes(filtro = "") { // Adiciona o parâmetro 'filtro'
    const tabela = document.querySelector("#registros tbody");
    tabela.innerHTML = "";
    clientes = obterDados("clientes") || []; // Recarrega do storage

    // --- LÓGICA DO FILTRO (NOVA) ---
    const filtroNormalizado = filtro.toLowerCase().trim();
    const clientesFiltrados = clientes.filter(cliente =>
        cliente.nome.toLowerCase().includes(filtroNormalizado) ||
        cliente.identificador.toLowerCase().includes(filtroNormalizado)
    );
    // --- FIM DA LÓGICA DO FILTRO ---

    if (clientesFiltrados.length === 0) { // Usa a lista filtrada
        tabela.innerHTML = `<tr><td colspan="5" style="text-align:center;">Nenhum cliente encontrado.</td></tr>`;
        return;
    }

    clientesFiltrados.forEach((cliente) => { // Usa a lista filtrada
        // Encontra o índice original do cliente no array 'clientes'
        // Isso é crucial para que os botões de Editar/Excluir funcionem
        const originalIndex = clientes.findIndex(c => c.id === cliente.id);

        const saldo = calcularSaldoDevedor(cliente.id);
        const row = tabela.insertRow();
        
        row.innerHTML = `
            <td>${cliente.nome}</td>
            <td>${cliente.identificador}</td>
            <td>${cliente.endereco || 'N/A'}</td>
            <td class="${saldo > 0 ? 'saldo-devedor' : 'saldo-pago'}">
                R$ ${saldo.toFixed(2)}
            </td>
            <td>
                <button class="action-btn pay-btn" onclick="abrirModalPagamento(${originalIndex})">Ver/Pagar</button>
                <button class="action-btn edit-btn" onclick="prepararEdicao(${originalIndex})">Editar</button>
                <button class="action-btn delete-btn" onclick="excluirCliente(${originalIndex})">Excluir</button>
            </td>
        `;
    });
}