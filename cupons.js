// cupons.js

// Funções utilitárias de LocalStorage (replicadas para serem independentes, ou pode ser um arquivo de utils compartilhado)
function obterDados(chave) {
    const dados = localStorage.getItem(chave);
    try {
        return dados ? JSON.parse(dados) : null;
    } catch (e) {
        console.error("Erro ao parsear dados do localStorage para a chave:", chave, e);
        return null;
    }
}

function salvarDados(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
}

let cuponsDisponiveis = []; // Armazenará os cupons formatados
let cupomParaAcao = null; // Armazena o cupom selecionado para cancelamento/detalhes
const ITENS_POR_PAGINA = 10; // Variável não usada no código atual, mas mantida para referência
let paginaAtual = 1; // Variável não usada no código atual, mas mantida para referência

document.addEventListener("DOMContentLoaded", function() {
    carregarTodosCupons();
});

function agruparMovimentacoesPorCupom() {
    const movimentacoesBrutas = obterDados("movimentacoes") || {};
    const tempCuponsMap = new Map(); // Use um mapa temporário para construir os dados

    // Primeira passada: agregar todas as movimentações por idCupom
    for (const dataKey in movimentacoesBrutas) { // dataKey já está no formato YYYY-MM-DD
        if (Array.isArray(movimentacoesBrutas[dataKey])) {
            movimentacoesBrutas[dataKey].forEach(mov => {
                if (mov.idCupom) {
                    if (!tempCuponsMap.has(mov.idCupom)) {
                        tempCuponsMap.set(mov.idCupom, {
                            id: mov.idCupom,
                            // Use a data da chave ou a data específica do movimento, garantindo YYYY-MM-DD
                            data: mov.data || dataKey, // Prioriza mov.data se for consistente, senão usa a chave
                            hora: mov.hora,
                            usuario: mov.usuario,
                            formaPagamento: mov.formaPagamento,
                            valorTotalVendaOriginal: 0,
                            valorTotalDevolvido: 0, // Rastreia o valor total devolvido/descartado
                            itensVendaOriginal: [], // Itens da venda original (para exibição)
                            temDevolucao: false,
                            temTroca: false,
                            temDescarte: false,
                            movimentosParaStatus: [] // Guarda todos os movimentos para determinar status
                        });
                    }
                    const cupomTemp = tempCuponsMap.get(mov.idCupom);
                    
                    // Adiciona o movimento atual para posterior determinação de status
                    cupomTemp.movimentosParaStatus.push(mov);

                    if (typeof mov.valor === 'number' && typeof mov.quantidade === 'number') {
                        // O valor total de cada item. Para cálculos, usamos o valor absoluto da quantidade.
                        // A propriedade 'quantidade' no movimento é que indicará se é uma venda (positiva) ou devolução (negativa).
                        const valorItemCalculado = mov.valor * Math.abs(mov.quantidade); 

                        if (mov.tipoMovimento === 'venda' || !mov.tipoMovimento) { // Se não tiver tipo, assume venda
                            cupomTemp.valorTotalVendaOriginal += valorItemCalculado;
                            
                            // Adiciona itens à lista de itens originais da venda para o modal de detalhes/cancelamento
                            const itemExistente = cupomTemp.itensVendaOriginal.find(item => item.codigo === mov.codigo && item.valor === mov.valor);
                            if (itemExistente) {
                                itemExistente.quantidade += mov.quantidade; // Soma diretamente para ver o líquido
                            } else {
                                cupomTemp.itensVendaOriginal.push({
                                    codigo: mov.codigo,
                                    nome: mov.produto,
                                    valor: mov.valor,
                                    quantidade: mov.quantidade // Armazena a quantidade da movimentação
                                });
                            }
                        } else if (mov.tipoMovimento === 'DEVOLUCAO') {
                            cupomTemp.valorTotalDevolvido += valorItemCalculado;
                            cupomTemp.temDevolucao = true;
                        } else if (mov.tipoMovimento === 'TROCA') {
                            cupomTemp.temTroca = true;
                        } else if (mov.tipoMovimento === 'DESCARTE') {
                            cupomTemp.valorTotalDevolvido += valorItemCalculado;
                            cupomTemp.temDescarte = true;
                        }
                    } else {
                        console.warn(`Dados inválidos para cálculo em mov. idCupom: ${mov.idCupom}, codigo: ${mov.codigo}`);
                    }
                }
            });
        }
    }

    // Segunda passada: determinar o status final e preparar para exibição
    const finalCupons = [];
    tempCuponsMap.forEach(cupomTemp => {
        let status = 'Ativo';
        let valorParaDisplay = cupomTemp.valorTotalVendaOriginal;

        if (cupomTemp.temDevolucao || cupomTemp.temDescarte) {
            // Usa uma pequena tolerância para comparações de ponto flutuante
            if (Math.abs(cupomTemp.valorTotalVendaOriginal - cupomTemp.valorTotalDevolvido) < 0.01) {
                status = 'Cancelado Totalmente';
                valorParaDisplay = 0; // Se totalmente cancelado, o valor final para display é 0
            } else {
                status = 'Devolvido Parcialmente';
                valorParaDisplay = cupomTemp.valorTotalVendaOriginal - cupomTemp.valorTotalDevolvido;
            }
        } else if (cupomTemp.temTroca) {
            status = 'Troca'; // Uma troca não muda o valor financeiro do cupom
        }

        // Filtra itens originais para o display, removendo aqueles que foram totalmente devolvidos/descartados
        // Essa parte é um pouco mais complexa para ser 100% precisa se um item foi parcialmente devolvido.
        // Por simplicidade, vamos apenas garantir que a quantidade seja positiva para exibição.
        const itensFiltradosParaDisplay = cupomTemp.itensVendaOriginal.filter(item => item.quantidade > 0);


        finalCupons.push({
            id: cupomTemp.id,
            // A data do cupom será a data da primeira movimentação (venda) para consistência
            data: cupomTemp.data, 
            hora: cupomTemp.hora,
            usuario: cupomTemp.usuario,
            formaPagamento: cupomTemp.formaPagamento,
            valorTotal: valorParaDisplay, // Valor original ou líquido após devolução
            itens: itensFiltradosParaDisplay, // Usa os itens liquidados para exibição no detalhes
            status: status
        });
    });

    // Filtra os cupons que foram 'Cancelado Totalmente' para que "sumam" da lista principal (se quiser)
    // Se você quer que eles apareçam, remova esta linha:
    const cuponsParaExibir = finalCupons.filter(cupom => cupom.status !== 'Cancelado Totalmente');

    // Ordena do mais recente para o mais antigo (adaptação para YYYY-MM-DD e HH:MM:SS)
    return cuponsParaExibir.sort((a, b) => {
        // Assume que a.data e b.data estão em YYYY-MM-DD
        const dateTimeA = new Date(`${a.data}T${a.hora}`);
        const dateTimeB = new Date(`${b.data}T${b.hora}`);
        return dateTimeB.getTime() - dateTimeA.getTime();
    });
}

function exibirCupons(cuponsFiltrados) {
    const cuponsListDiv = document.getElementById("cupons-list");
    const noCuponsMessageDiv = document.getElementById("no-cupons-message");

    if (cuponsListDiv) {
        cuponsListDiv.innerHTML = "";
    }

    if (noCuponsMessageDiv) {
        noCuponsMessageDiv.style.display = "none";
    }

    if (cuponsFiltrados.length === 0) {
        if (noCuponsMessageDiv) {
            noCuponsMessageDiv.style.display = "block";
            noCuponsMessageDiv.innerText = "Nenhum cupom encontrado."; // Atualiza a mensagem
        }
        return;
    }

    cuponsFiltrados.forEach(cupom => {
        const cupomDiv = document.createElement("div");
        cupomDiv.classList.add("cupom-item");
        // Adiciona uma classe CSS baseada no status para estilização visual (opcional)
        // Isso requer que você adicione essas classes no seu style.css ou no <style> de cupons.html
        cupomDiv.classList.add(`status-${cupom.status.replace(/\s/g, '-')}`); // Ex: status-Cancelado-Totalmente
        
        let itensHtml = cupom.itens.map(item => {
            const itemValorDisplay = typeof item.valor === 'number' ? item.valor.toFixed(2) : 'N/A';
            return `
                <p><strong>${item.quantidade}x ${item.produto}</strong> (Cód: ${item.codigo}) - R$ ${itemValorDisplay}/un.</p>
            `;
        }).join('');

        const totalVendaDisplay = typeof cupom.valorTotal === 'number' ? cupom.valorTotal.toFixed(2) : 'N/A';

        cupomDiv.innerHTML = `
            <h3>Cupom ID: ${cupom.id} <span class="cupom-status status-${cupom.status.replace(/\s/g, '-')}">(${cupom.status})</span></h3>
            <p><strong>Data:</strong> ${cupom.data} <strong>Hora:</strong> ${cupom.hora}</p>
            <p><strong>Total da Venda:</strong> R$ ${totalVendaDisplay}</p>
            <p><strong>Forma de Pagamento:</strong> ${cupom.formaPagamento}</p>
            <p><strong>Operador:</strong> ${cupom.usuario}</p>
            <hr>
            <h4>Itens da Venda:</h4>
            ${itensHtml}
            <div class="cupom-actions">
                <button class="btn-view" onclick="abrirModalDetalhesCupom('${cupom.id}')">Detalhes</button>
                ${cupom.status === 'Cancelado Totalmente' || cupom.status === 'Troca' ? // Troca também desabilita cancelamento de valor
                    '<button class="btn-cancel" disabled title="Cupom não pode ser cancelado (totalmente cancelado ou troca)">Indisponível</button>' : 
                    `<button class="btn-cancel" onclick="abrirModalCancelamento('${cupom.id}')">Cancelar</button>`
                }
            </div>
        `;
        if (cuponsListDiv) {
            cuponsListDiv.appendChild(cupomDiv);
        }
    });
}

function carregarTodosCupons() {
    cuponsDisponiveis = agruparMovimentacoesPorCupom();
    paginaAtual = 1; // Reseta a página para a primeira ao recarregar
    exibirCupons(cuponsDisponiveis);
}

function buscarCupom() {
    const termoBusca = document.getElementById("cupom-id-input").value.trim();
    if (!termoBusca) {
        carregarTodosCupons();
        return;
    }

    // A busca agora é feita nos cuponsDisponiveis já filtrados por status
    const cuponsFiltrados = cuponsDisponiveis.filter(cupom => 
        cupom.id.toLowerCase().includes(termoBusca.toLowerCase())
    );
    paginaAtual = 1; // Reseta a página para a primeira ao buscar
    exibirCupons(cuponsFiltrados);
}

function renderizarPaginacao(totalCupons) {
    // Esta função não está sendo usada atualmente, mas pode ser implementada para paginação real
    const paginacaoDiv = document.getElementById("pagination-controls");
    if (paginacaoDiv) {
        paginacaoDiv.innerHTML = "";
    }

    const totalPaginas = Math.ceil(totalCupons / ITENS_POR_PAGINA);

    for (let i = 1; i <= totalPaginas; i++) {
        const button = document.createElement("button");
        button.innerText = i;
        button.classList.toggle("active", i === paginaAtual);
        button.onclick = () => {
            paginaAtual = i;
            exibirCupons(cuponsDisponiveis); // Chama exibirCupons com a página atual
        };
        if (paginacaoDiv) {
            paginacaoDiv.appendChild(button);
        }
    }
}

// Funções de Modal de Detalhes
function abrirModalDetalhesCupom(idCupom) {
    cupomParaAcao = cuponsDisponiveis.find(cupom => cupom.id === idCupom);
    if (!cupomParaAcao) {
        alert("Cupom não encontrado.");
        return;
    }

    const detalhesBody = document.getElementById("detalhes-cupom-body");
    const valorTotalDetalhes = typeof cupomParaAcao.valorTotal === 'number' ? cupomParaAcao.valorTotal.toFixed(2) : 'N/A';
    
    detalhesBody.innerHTML = `
        <p><strong>ID:</strong> ${cupomParaAcao.id}</p>
        <p><strong>Data:</strong> ${cupomParaAcao.data}</p>
        <p><strong>Hora:</strong> ${cupomParaAcao.hora}</p>
        <p><strong>Atendente:</strong> ${cupomParaAcao.usuario}</p>
        <p><strong>Total da Venda:</strong> R$ ${valorTotalDetalhes}</p>
        <p><strong>Forma de Pagamento:</strong> ${cupomParaAcao.formaPagamento}</p>
        <p><strong>Status:</strong> ${cupomParaAcao.status}</p>
        <hr>
        <h4>Itens Vendidos:</h4>
        ${cupomParaAcao.itens.map(item => {
            const itemValorCalculado = typeof item.valor === 'number' && typeof item.quantidade === 'number' ? 
                                       (item.valor * item.quantidade).toFixed(2) : 'N/A';
            return `
                <p class="item">${item.nome} (${item.codigo}) - Qtd: ${item.quantidade} - R$ ${itemValorCalculado}</p>
            `;
        }).join('')}
    `;

    document.getElementById("modal-detalhes-cupom").style.display = "flex";
}

function fecharModalDetalhesCupom() {
    document.getElementById("modal-detalhes-cupom").style.display = "none";
}


// Funções de Modal de Cancelamento/Devolução
// Funções de Modal de Cancelamento/Devolução
function abrirModalCancelamento(idCupom) {
    cupomParaAcao = cuponsDisponiveis.find(cupom => cupom.id === idCupom);
    if (!cupomParaAcao) {
        alert("Cupom não encontrado.");
        return;
    }

    if (cupomParaAcao.status === 'Cancelado Totalmente') {
        alert("Este cupom já foi totalmente cancelado e não pode ser alterado.");
        return;
    }

    const cancelCupomTotalDisplay = typeof cupomParaAcao.valorTotal === 'number' ? cupomParaAcao.valorTotal.toFixed(2) : 'N/A';
    document.getElementById("cancel-cupom-id").innerText = cupomParaAcao.id;
    document.getElementById("cancel-cupom-total").innerText = cancelCupomTotalDisplay;
    document.getElementById("senha-cancelamento").value = "";
    document.getElementById("motivo-cancelamento").value = "";

    const itensParaCancelarDiv = document.getElementById("itens-para-cancelar");
    itensParaCancelarDiv.innerHTML = "<h4>Itens do Cupom:</h4>";
    cupomParaAcao.itens.forEach((item, index) => {
        // CORREÇÃO: Declare itemDiv AQUI
        const itemDiv = document.createElement("div"); 
        const itemValorDisplay = typeof item.valor === 'number' ? item.valor.toFixed(2) : 'N/A';
        itemDiv.innerHTML = `
            <input type="checkbox" id="item-${index}" data-codigo="${item.codigo}" data-quantidade="${item.quantidade}" data-valor="${item.valor}" checked>
            <label for="item-${index}">${item.nome} (Qtd: ${item.quantidade}) - R$ ${itemValorDisplay}</label>
        `;
        itensParaCancelarDiv.appendChild(itemDiv);
    });

    document.getElementById("modal-cancelamento").style.display = "flex";
    setTimeout(() => document.getElementById("senha-cancelamento").focus(), 100);
}

function fecharModalCancelamento() {
    document.getElementById("modal-cancelamento").style.display = "none";
    cupomParaAcao = null;
}

function confirmarCancelamentoCupom() {
    const senha = document.getElementById("senha-cancelamento").value;
    const motivo = document.getElementById("motivo-cancelamento").value;

    const senhaAdmin = "2201";

    if (senha !== senhaAdmin) {
        alert("Senha de administrador incorreta!");
        return;
    }
    if (!motivo) {
        alert("Por favor, selecione um motivo para o cancelamento/devolução.");
        return;
    }
    if (!cupomParaAcao) {
        alert("Nenhum cupom selecionado para ação.");
        return;
    }

    const itensSelecionados = [];
    document.querySelectorAll('#itens-para-cancelar input[type="checkbox"]:checked').forEach(checkbox => {
        itensSelecionados.push({
            codigo: checkbox.dataset.codigo,
            quantidade: parseInt(checkbox.dataset.quantidade),
            valor: parseFloat(checkbox.dataset.valor) // Obter o valor também
        });
    });

    if (itensSelecionados.length === 0) {
        alert("Selecione ao menos um item para cancelar/devolver.");
        return;
    }

    let produtos = obterDados("produtos") || {};
    let movimentacoes = obterDados("movimentacoes") || {};
    let resumoFormas = obterDados("resumoFormas") || { Pix: 0, Crédito: 0, Débito: 0, Dinheiro: 0, Cheque: 0, VR: 0, Misto: 0 }; // Garante Misto
    
    // DATA DO CANCELAMENTO: Usar o formato YYYY-MM-DD
    // No cupons.js, dentro da função 'confirmarCancelamentoCupom()'

// ... outras variáveis e verificações ...

const dataCancelamento = new Date();
// Trecho CORRETO para formatar a data como YYYY-MM-DD
const dataAtualFormatted = dataCancelamento.toISOString().split('T')[0]; // Ex: "2025-07-16"
const horaAtual = dataCancelamento.toLocaleTimeString(); // Ex: "17:07:45"
const usuario = localStorage.getItem("usuarioLogado") || "desconhecido";

if (!movimentacoes[dataAtualFormatted]) movimentacoes[dataAtualFormatted] = [];

let valorTotalDevolvidoOuDescartado = 0;

itensSelecionados.forEach(itemSelecionado => {
    const valorItem = itemSelecionado.valor * itemSelecionado.quantidade; // Valor base para o item
    
    let acaoRealizada = '';
    let quantidadeParaRegistro = itemSelecionado.quantidade; // Quantidade original

    if (motivo === 'devolucao') {
        if (produtos[itemSelecionado.codigo]) {
            produtos[itemSelecionado.codigo].quantidade += itemSelecionado.quantidade;
        }
        acaoRealizada = 'DEVOLUCAO';
        quantidadeParaRegistro = -itemSelecionado.quantidade; // Registra como negativo para estorno
        valorTotalDevolvidoOuDescartado += valorItem; // Soma para o total de cancelamentos
    } else if (motivo === 'troca') {
        acaoRealizada = 'TROCA';
        // Troca não afeta o total financeiro de cancelamentos
    } else if (motivo.startsWith('descarte')) {
        acaoRealizada = 'DESCARTE';
        quantidadeParaRegistro = -itemSelecionado.quantidade; // Registra como negativo para estorno
        valorTotalDevolvidoOuDescartado += valorItem; // Soma para o total de cancelamentos
    }

    // Adiciona a movimentação de cancelamento/devolução
    movimentacoes[dataAtualFormatted].push({
        idCupom: cupomParaAcao.id,
        produto: itemSelecionado.nome || `Produto ${itemSelecionado.codigo}`,
        codigo: itemSelecionado.codigo,
        quantidade: quantidadeParaRegistro, // Pode ser negativa agora
        valor: itemSelecionado.valor,
        tipoMovimento: acaoRealizada,
        motivo: motivo,
        usuario: usuario,
        hora: horaAtual,
        data: dataAtualFormatted // <--- ESTE É O TRECHO CRÍTICO: Garante que a data no objeto de movimento está no formato YYYY-MM-DD
    });
});

// ... restante da função confirmarCancelamentoCupom() ...

    // Ajusta os valores financeiros no resumoFormas apenas para devolução/descarte
    // para a forma de pagamento original do cupom.
    // Lógica para Pagamento Misto ainda é complexa e precisa ser refinada se for vital
    if (cupomParaAcao.formaPagamento !== 'Misto' && resumoFormas.hasOwnProperty(cupomParaAcao.formaPagamento) && typeof valorTotalDevolvidoOuDescartado === 'number') {
        resumoFormas[cupomParaAcao.formaPagamento] -= valorTotalDevolvidoOuDescartado;
        if (resumoFormas[cupomParaAcao.formaPagamento] < 0) resumoFormas[cupomParaAcao.formaPagamento] = 0; // Evita negativos
    } else if (cupomParaAcao.formaPagamento === 'Misto' && valorTotalDevolvidoOuDescartado > 0) {
        // Se for misto, subtraímos do total 'Misto'.
        // Isso é uma simplificação. Um sistema robusto precisaria de proporções.
        resumoFormas['Misto'] -= valorTotalDevolvidoOuDescartado;
        if (resumoFormas['Misto'] < 0) resumoFormas['Misto'] = 0;
    }


    salvarDados("produtos", produtos);
    salvarDados("movimentacoes", movimentacoes);
    salvarDados("resumoFormas", resumoFormas);

    alert(`Ação de '${motivo}' realizada para os itens selecionados do cupom ${cupomParaAcao.id}.`);
    fecharModalCancelamento();
    carregarTodosCupons(); // Recarrega a lista para refletir as mudanças
}