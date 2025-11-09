// script.js

// Funções utilitárias de LocalStorage (CENTRALIZADAS AQUI)
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

// Variáveis globais para o controle de estoque
let produtos = obterDados("produtos") || {};
let produtoEmEdicao = null; // Armazena o CÓDIGO do produto que está sendo verificado/editado

// Funções de Mensagens
// Funções de Mensagens (MODIFICADA)
function showMessage(msg, isError = false) {
  showCustomAlert(msg, isError); // Agora chama o modal central
}
function exibirMensagemBaixa(mensagem) {
  const mensagemBaixaDiv = document.getElementById('mensagemBaixa');
  if (mensagemBaixaDiv) {
    mensagemBaixaDiv.innerText = mensagem;
    mensagemBaagemBaixa.style.display = 'block';
    mensagemBaixaDiv.style.opacity = '1';
    setTimeout(() => {
      mensagemBaixaDiv.style.opacity = '0';
      setTimeout(() => {
        mensagemBaixaDiv.style.display = 'none';
      }, 300);
    }, 3000);
  }
}

// Funções de Gerenciamento de Produtos
function autoDecrementStock() {
  const barcodeInput = document.getElementById("barcode");
  const barcode = barcodeInput.value.trim();

  if (produtos[barcode]) {
    if (produtos[barcode].quantidade > 0) {
      produtos[barcode].quantidade--;
      salvarDados("produtos", produtos);
      showMessage(`Estoque de "${produtos[barcode].nome}" decrementado para ${produtos[barcode].quantidade}.`);
      if (produtos[barcode].quantidade <= 5 && produtos[barcode].quantidade > 0) {
        exibirMensagemBaixa(`Estoque baixo: ${produtos[barcode].nome} tem ${produtos[barcode].quantidade} unidades.`);
      } else if (produtos[barcode].quantidade === 0) {
        exibirMensagemBaixa(`Estoque esgotado: ${produtos[barcode].nome}.`);
      }
      updateLowStockList();
    } else {
      showMessage("Estoque insuficiente.", true);
    }
  } else {
    showMessage("Produto não encontrado.", true);
  }
  barcodeInput.value = "";
}

function updateLowStockList() {
  const lowStockList = document.getElementById("low-stock-list");
  if (!lowStockList) return;

  lowStockList.innerHTML = "";
  const lowStockProducts = Object.values(produtos).filter(p => p.quantidade <= 5 && p.quantidade > 0);

  if (lowStockProducts.length === 0) {
    lowStockList.innerHTML = "<p>Nenhum produto com estoque baixo.</p>";
    return;
  }

  lowStockProducts.forEach(p => {
    const pElement = document.createElement("p");
    pElement.textContent = `${p.nome}: ${p.quantidade} unidades restantes`;
    lowStockList.appendChild(pElement);
  });
}

// Mantenha esta função toggleSection apenas para seções que ainda são expandíveis/retráteis
// como 'low-stock-section' no index.html
function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    // Alterna a visibilidade para flex (se estiver oculto) ou none (se estiver visível)
    section.style.display = (section.style.display === "flex") ? "none" : "flex";
  }
}


function handleKeyPress(event, callback) {
  if (event.key === "Enter") {
    callback();
  }
}

// === FUNÇÕES PARA MODAIS DE VERIFICAR E REGISTRAR PRODUTO ===

function abrirModalVerificarQuantidade() {
    document.getElementById('modalEditarProduto').style.display = 'flex';
    document.getElementById('editProdutoCodigo').value = '';
    document.getElementById('editProdutoNome').value = '';
    document.getElementById('editProdutoQuantidade').value = '';
    document.getElementById('editProdutoPreco').value = '';
    
    // Título e botão para a função de verificação inicial
    document.querySelector('#modalEditarProduto h2').innerText = 'Verificar e Editar Produto';
    // Remove readonly para permitir a digitação inicial do código
    document.getElementById('editProdutoCodigo').removeAttribute('readonly'); 
    document.getElementById('editProdutoNome').setAttribute('readonly', 'true');
    document.getElementById('editProdutoQuantidade').setAttribute('readonly', 'true');
    document.getElementById('editProdutoPreco').setAttribute('readonly', 'true');

    document.getElementById('editProdutoCodigo').focus();
    
    // Listener para carregar o produto ao digitar o código no modal
    document.getElementById('editProdutoCodigo').onkeypress = function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const barcode = this.value.trim();
            if (produtos[barcode]) {
                const produto = produtos[barcode];
                document.getElementById('editProdutoNome').value = produto.nome;
                document.getElementById('editProdutoQuantidade').value = produto.quantidade;
                document.getElementById('editProdutoPreco').value = produto.valor;
                produtoEmEdicao = barcode; // Define o produto em edição
                // Torna os campos não-editáveis novamente após carregar, até a senha ser digitada
                document.getElementById('editProdutoCodigo').setAttribute('readonly', 'true');
                document.getElementById('editProdutoNome').setAttribute('readonly', 'true');
                document.getElementById('editProdutoQuantidade').setAttribute('readonly', 'true');
                document.getElementById('editProdutoPreco').setAttribute('readonly', 'true');
            } else {
                alert("Produto não encontrado.");
                this.value = '';
                document.getElementById('editProdutoNome').value = '';
                document.getElementById('editProdutoQuantidade').value = '';
                document.getElementById('editProdutoPreco').value = '';
                produtoEmEdicao = null; // Reseta produto em edição
                this.focus();
            }
        }
    };
}

// Função para fechar o modal de edição de produto
function fecharModalEditarProduto() {
    document.getElementById('modalEditarProduto').style.display = 'none';
    // Limpa o listener onkeypress para evitar problemas em outras aberturas
    document.getElementById('editProdutoCodigo').onkeypress = null; 
    produtoEmEdicao = null; // Reseta o produto em edição
    // Foca na barra de scan principal após fechar
    const barcodeInput = document.getElementById("barcode");
    if (barcodeInput) barcodeInput.focus();
}


function abrirModalRegistrarProduto() {
    document.getElementById('modalRegistrarProduto').style.display = 'flex';
    document.getElementById('newBarcodeModal').value = '';
    document.getElementById('newNameModal').value = '';
    document.getElementById('newStockModal').value = '1';
    document.getElementById('newPriceModal').value = '';
    document.getElementById('newBarcodeModal').focus();
}

function fecharModalRegistrarProduto() {
    document.getElementById('modalRegistrarProduto').style.display = 'none';
    const barcodeInput = document.getElementById("barcode");
    if (barcodeInput) barcodeInput.focus();
}

function registerProductModal() {
  const newBarcode = document.getElementById("newBarcodeModal").value.trim();
  const newName = document.getElementById("newNameModal").value.trim();
  const newStock = parseInt(document.getElementById("newStockModal").value.trim());
  const newPrice = parseFloat(document.getElementById("newPriceModal").value.trim());

  if (!newBarcode || !newName || isNaN(newStock) || newStock <= 0 || isNaN(newPrice) || newPrice <= 0) {
    showMessage("Por favor, preencha todos os campos corretamente.", true);
    return;
  }

  if (produtos[newBarcode]) {
    showMessage("Código de barras já existe. Use a função de edição de estoque.", true);
    return;
  }

  produtos[newBarcode] = {
    nome: newName,
    quantidade: newStock,
    valor: newPrice
  };
  salvarDados("produtos", produtos);
  showMessage(`Produto "${newName}" registrado com sucesso!`);
  fecharModalRegistrarProduto();
  updateLowStockList();
}


// === Funções de Edição de Estoque/Produto (com senha) ===

// Esta função é chamada ao clicar em "Editar Informações" dentro do modalEditarProduto
function solicitarSenha() {
  if (produtoEmEdicao) { // O produto precisa estar carregado no modal
    const senhaModal = document.getElementById("senhaModal");
    if (senhaModal) {
      senhaModal.style.display = "flex";
      document.getElementById("senhaInput").value = "";
      setTimeout(() => document.getElementById("senhaInput").focus(), 100);
    }
  } else {
    alert("Por favor, carregue um produto no modal para editar.");
  }
}

function verificarSenha(event) {
  if (event.key === "Enter") {
    const senha = document.getElementById("senhaInput").value;
    if (senha === "1996") { // Senha de administrador
      closeSenhaModal();
      // Torna os campos editáveis após a senha correta
      document.getElementById('editProdutoCodigo').removeAttribute('readonly'); // Permite editar o código
      document.getElementById('editProdutoNome').removeAttribute('readonly');
      document.getElementById('editProdutoQuantidade').removeAttribute('readonly');
      document.getElementById('editProdutoPreco').removeAttribute('readonly');
      document.getElementById('editProdutoNome').focus(); // Foca no nome para edição
    } else {
      alert("Senha incorreta!");
      document.getElementById("senhaInput").value = "";
    }
  }
}

// Fechar o modal de senha
function closeSenhaModal() {
  const senhaModal = document.getElementById("senhaModal");
  if (senhaModal) {
    senhaModal.style.display = "none";
  }
}

function salvarEdicaoProduto() {
    const codigo = document.getElementById('editProdutoCodigo').value.trim();
    const nome = document.getElementById('editProdutoNome').value.trim();
    const quantidade = parseInt(document.getElementById('editProdutoQuantidade').value);
    const preco = parseFloat(document.getElementById('editProdutoPreco').value);

    if (!codigo || !nome || isNaN(quantidade) || quantidade < 0 || isNaN(preco) || preco <= 0) {
        alert("Por favor, preencha todos os campos corretamente. Quantidade não pode ser negativa e preço deve ser positivo.");
        return;
    }

    // Se o código foi editado e é diferente do produtoEmEdicao original, precisamos verificar se o novo código já existe
    if (codigo !== produtoEmEdicao && produtos[codigo]) {
        alert(`O código de barras "${codigo}" já está em uso por outro produto.`);
        return;
    }

    // Se o código foi alterado, remove o antigo
    if (produtoEmEdicao && codigo !== produtoEmEdicao) { // Só deleta se havia um produto em edição e o código mudou
        delete produtos[produtoEmEdicao];
    }

    produtos[codigo] = {
        nome: nome,
        quantidade: quantidade,
        valor: preco
    };
    salvarDados("produtos", produtos);

    showMessage(`Produto "${nome}" (${codigo}) atualizado com sucesso!`);
    fecharModalEditarProduto(); // Fecha o modal
    updateLowStockList(); // Atualiza a lista de estoque baixo
}

// Funções de Relatório Diário
// Substitua a função showReport() original em script.js por esta:

// Substitua a função showReport() original em script.js por esta:

// COLE ISTO NO SEU SCRIPT.JS (substituindo o bloco das linhas 300-494)

function showReport() {
    const reportDateInput = document.getElementById("report-date");
    const reportContentDiv = document.getElementById("report-content");

    if (!reportDateInput || !reportContentDiv) return;

    const selectedDate = reportDateInput.value; // Formato YYYY-MM-DD

    // --- FUNÇÃO HELPER (1): Limpa valores monetários ---
    // Esta é a função que está faltando no seu script.js atual
    function cleanValue(val) {
        if (typeof val === 'number') return val;
        if (typeof val !== 'string') return 0;
        const cleaned = val.replace("R$", "").trim().replace(",", ".");
        return parseFloat(cleaned) || 0;
    }

    // --- FUNÇÃO HELPER (2): Corrige datas salvas erradas (ex: "08/11/2025") ---
    function normalizarDataParaComparacao(dataString) {
        if (!dataString) return null;
        if (dataString.includes('-') && dataString.length >= 10) {
            return dataString.split('T')[0]; // Retorna "YYYY-MM-DD"
        }
        if (dataString.includes('/')) {
            const partes = dataString.split(' ')[0].split('/');
            if (partes.length === 3) {
                const dia = partes[0].padStart(2, '0');
                const mes = partes[1].padStart(2, '0');
                const ano = partes[2];
                if (ano.length === 4) { 
                    return `${ano}-${mes}-${dia}`; // Converte para "YYYY-MM-DD"
                }
            }
        }
        return null;
    }
    
    // 1. OBTER DADOS
    
    // Valor de Abertura
    const dataAberturaSalva = localStorage.getItem("caixaAbertoData");
    let valorAbertura = 0;
    
    if (normalizarDataParaComparacao(dataAberturaSalva) === selectedDate) {
        valorAbertura = cleanValue(localStorage.getItem("valorAberturaCaixa"));
    }

    // Movimentações (Vendas, Devoluções)
    const movimentacoes = obterDados("movimentacoes") || {};
    // CORREÇÃO: Busca por ambas as chaves de data (a nova 'YYYY-MM-DD' e a antiga 'DD/MM/YYYY')
    const movimentosDoDia = movimentacoes[selectedDate] || movimentacoes[formatarDataParaExibicao(selectedDate)] || [];

    // Movimentos de Caixa (Sangria, Suprimento)
    const movimentosCaixa = obterDados("movimentosCaixa") || [];
    
    const movimentosCaixaDoDia = movimentosCaixa.filter(mov => {
        const movDateLocal = normalizarDataParaComparacao(mov.data);
        return movDateLocal === selectedDate;
    });

    // 2. PROCESSAR DADOS
    
    let totalVendasBrutas = 0;
    let totalEstornosEDescontos = 0;
    let totalSangrias = 0;
    let totalSuprimentos = 0;

    let itensVendidos = []; 
    let itensCancelados = []; 
    let sangriasDetalhadas = [];
    let suprimentosDetalhados = [];

    const vendasPorFormaPagamento = {
        Pix: 0, Crédito: 0, Débito: 0, Dinheiro: 0, Cheque: 0, VR: 0, Misto: 0
    };

    // Processa Vendas e Devoluções
    movimentosDoDia.forEach(mov => {
        // CORREÇÃO: Usa cleanValue para garantir que o valor é um número
        const valorUnitario = cleanValue(mov.valor); 
        const valorTotalItem = valorUnitario * Math.abs(mov.quantidade); 
        const formaPagamento = mov.formaPagamento || 'Dinheiro';

        if (mov.tipoMovimento === 'venda' || !mov.tipoMovimento) {
            totalVendasBrutas += valorTotalItem;
            vendasPorFormaPagamento[formaPagamento] += valorTotalItem;
            itensVendidos.push(mov); 
        } else if (mov.tipoMovimento === 'DEVOLUCAO' || mov.tipoMovimento === 'DESCARTE') {
            totalEstornosEDescontos += valorTotalItem;
            vendasPorFormaPagamento[formaPagamento] -= valorTotalItem;
            itensCancelados.push({
                nome: mov.produto,
                codigo: mov.codigo || 'N/A',
                valor: valorTotalItem * -1 
            });
        } else if (mov.tipoMovimento === 'DESCONTO') {
            const valorDesconto = Math.abs(cleanValue(mov.valor)); 
            totalEstornosEDescontos += valorDesconto;
            vendasPorFormaPagamento[formaPagamento] -= valorDesconto; 
            itensCancelados.push({
                nome: mov.produto, 
                codigo: mov.codigo || 'N/A',
                valor: valorDesconto * -1 // Garante que seja negativo
            });
        }
    });

    // Processa Sangrias e Suprimentos
    movimentosCaixaDoDia.forEach(mov => {
        const valorMovimento = cleanValue(mov.valor);
        const detalhe = {
            hora: new Date(mov.data).toLocaleTimeString('pt-BR'), 
            motivo: mov.motivo,
            valor: valorMovimento
        };
        if (mov.tipo === 'sangria') {
            totalSangrias += valorMovimento;
            sangriasDetalhadas.push(detalhe);
        } else if (mov.tipo === 'suprimento') {
            totalSuprimentos += valorMovimento;
            suprimentosDetalhados.push(detalhe);
        }
    });

    // 3. CALCULAR TOTAIS
    const totalVendasLiquidas = totalVendasBrutas - totalEstornosEDescontos;
    const totalEsperadoEmCaixa = valorAbertura + totalVendasLiquidas + totalSuprimentos - totalSangrias;

    // 4. FUNÇÃO PARA CRIAR TABELAS
    function criarTabelaHTML(id, headers, dataRows, footer) {
        if (dataRows.length === 0) return '<p>Nenhum lançamento.</p>';
        let html = `<table class="report-table" id="${id}"><thead><tr>`;
        headers.forEach(h => html += `<th>${h}</th>`);
        html += '</tr></thead><tbody>';
        dataRows.forEach(row => {
            html += '<tr>';
            row.forEach(cell => html += `<td>${cell}</td>`);
            html += '</tr>';
        });
        html += '</tbody>';
        if (footer) {
            html += `<tfoot><tr><td colspan="${headers.length}">${footer}</td></tr></tfoot>`;
        }
        html += '</table>';
        return html;
    }

    // 5. MONTAR SEÇÕES DO HTML
    const resumoHtml = `
        <div class="resumo-financeiro">
            <div class="resumo-item positivo">
                <span>(+) Valor de Abertura:</span>
                <strong>R$ ${valorAbertura.toFixed(2)}</strong>
            </div>
            <div class="resumo-item positivo">
                <span>(+) Total de Vendas Brutas:</span>
                <strong>R$ ${totalVendasBrutas.toFixed(2)}</strong>
            </div>
            <div class="resumo-item positivo">
                <span>(+) Total de Suprimentos:</span>
                <strong>R$ ${totalSuprimentos.toFixed(2)}</strong>
            </div>
            <div class="resumo-item negativo">
                <span>(-) Total de Sangrias:</span>
                <strong>R$ ${totalSangrias.toFixed(2)}</strong>
            </div>
            <div class="resumo-item negativo">
                <span>(-) Total de Estornos/Descontos:</span>
                <strong>R$ ${totalEstornosEDescontos.toFixed(2)}</strong>
            </div>
            <hr>
            <div class="resumo-item total-liquido">
                <span>(=) Total Líquido de Vendas:</span>
                <strong>R$ ${totalVendasLiquidas.toFixed(2)}</strong>
            </div>
            <div class="resumo-item total-final">
                <span>(=) Saldo Esperado em Caixa:</span>
                <strong>R$ ${totalEsperadoEmCaixa.toFixed(2)}</strong>
            </div>
        </div>
    `;

    // Seção 2: Planilha de Itens Vendidos
    const headersVendas = ['Produto', 'Código', 'Forma Pgto', 'Qtd', 'Valor Total (R$)'];
    const rowsVendas = itensVendidos.map(item => [
        item.produto,
        item.codigo || 'N/A',
        item.formaPagamento || 'Dinheiro',
        item.quantidade,
        // CORREÇÃO: Usa cleanValue aqui também para garantir
        `<span class="valor-positivo">R$ ${(cleanValue(item.valor) * item.quantidade).toFixed(2)}</span>`
    ]);
    const planilhaVendasHtml = criarTabelaHTML('tabela-vendas', headersVendas, rowsVendas);

    // Seção 3: Planilha de Devoluções e Descontos
    const headersCancelados = ['Produto/Motivo', 'Código', 'Valor (R$)'];
    const rowsCancelados = itensCancelados.map(item => [
        item.nome,
        item.codigo,
        `<span class="valor-negativo">R$ ${item.valor.toFixed(2)}</span>`
    ]);
    const planilhaCanceladosHtml = criarTabelaHTML('tabela-cancelados', headersCancelados, rowsCancelados);

    // Seção 4: Totais por Forma de Pagamento
    let formasPagamentoHtml = '';
    for (const forma in vendasPorFormaPagamento) {
        if (vendasPorFormaPagamento[forma] !== 0) {
            formasPagamentoHtml += `<p><strong>${forma}:</strong> R$ ${vendasPorFormaPagamento[forma].toFixed(2)}</p>`;
        }
    }
    if (formasPagamentoHtml === '') formasPagamentoHtml = '<p>Nenhum lançamento.</p>';

    // Seção 5: Detalhes de Sangrias e Suprimentos
    const headersCaixa = ['Horário', 'Motivo', 'Valor (R$)'];
    const rowsSuprimentos = suprimentosDetalhados.map(s => [ s.hora, s.motivo, `<span class="valor-positivo">R$ ${s.valor.toFixed(2)}</span>` ]);
    const planilhaSuprimentosHtml = criarTabelaHTML('tabela-suprimentos', headersCaixa, rowsSuprimentos);
    
    const rowsSangrias = sangriasDetalhadas.map(s => [ s.hora, s.motivo, `<span class="valor-negativo">R$ ${s.valor.toFixed(2)}</span>` ]);
    const planilhaSangriasHtml = criarTabelaHTML('tabela-sangrias', headersCaixa, rowsSangrias);

    // 6. RENDERIZAR HTML FINAL
    reportContentDiv.innerHTML = `
        <h2>Relatório Diário - ${formatarDataParaExibicao(selectedDate)}</h2>
        <h3>Resumo do Fechamento de Caixa</h3>
        ${resumoHtml}
        <hr class="section-divider">
        <h3>Planilha de Itens Vendidos</h3>
        ${planilhaVendasHtml}
        <hr class="section-divider">
        <h3>Planilha de Devoluções e Descontos</h3>
        ${planilhaCanceladosHtml}
        <hr class="section-divider">
        <h3>Total por Forma de Pagamento (Líquido)</h3>
        ${formasPagamentoHtml}
        <hr class="section-divider">
        <h3>Detalhes de Suprimentos (Entradas)</h3>
        ${planilhaSuprimentosHtml}
        <h3>Detalhes de Sangrias (Saídas)</h3>
        ${planilhaSangriasHtml}
    `;
}

function formatarDataParaExibicao(dataIso) {
  if (!dataIso) return '';
  const dataObj = new Date(dataIso + 'T00:00:00'); 
  return dataObj.toLocaleDateString('pt-BR');
}

// FIM DO BLOCO PARA COLAR

// Funções de Backup
function exportarBackup() {
  const data = {
    produtos: obterDados("produtos"),
    usuarios: obterDados("usuarios"),
    movimentacoes: obterDados("movimentacoes"),
    resumoFormas: obterDados("resumoFormas"),
    ultimaVenda: obterDados("ultimaVenda"),
    movimentosCaixa: obterDados("movimentosCaixa"),
    clientes: obterDados("clientes"), // <-- ADICIONE AQUI
    valorAberturaCaixa: localStorage.getItem("valorAberturaCaixa"),
    caixaAbertoData: localStorage.getItem("caixaAbertoData"),
    nomeLoja: localStorage.getItem("nomeLoja"),
    caixaBackground: localStorage.getItem("caixaBackground")
  };
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup_estoque_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showMessage("Backup exportado com sucesso!");
}

function importarBackup(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const importedData = JSON.parse(e.target.result);
        if (confirm("Tem certeza que deseja importar este backup? Isso substituirá todos os dados atuais.")) {
          for (const key in importedData) {
            if (typeof importedData[key] === 'object' && importedData[key] !== null) {
                salvarDados(key, importedData[key]);
            } else {
                localStorage.setItem(key, importedData[key]);
            }
          }
          produtos = obterDados("produtos") || {};
          showMessage("Backup importado com sucesso! A página será recarregada.");
          setTimeout(() => location.reload(), 1500);
        }
      } catch (error) {
        showMessage("Erro ao importar backup: " + error.message, true);
        console.error("Erro ao importar backup:", error);
      }
    };
    reader.readAsText(file);
  }
}

// Funções de Usuário (centralizadas a partir de usuarios.js)
// Funções de Usuário (centralizadas a partir de usuarios.js)
function verificarAdmin() {
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  const userRole = localStorage.getItem('userRole'); // Obtém a role do usuário
  
  const apagarAdminContainer = document.getElementById('apagarAdminContainer');
  if (apagarAdminContainer) {
    if (userRole === 'admin') {
      apagarAdminContainer.style.display = 'block';
    } else {
      apagarAdminContainer.style.display = 'none';
    }
  }

  const userMenuContainerGlobal = document.getElementById('userMenuContainerGlobal');
  if (userMenuContainerGlobal) {
      if (userRole === 'admin') {
          userMenuContainerGlobal.style.display = 'block'; // Usar 'block' para o position:fixed
      } else {
          userMenuContainerGlobal.style.display = 'none';
      }
  }

  // NOVO: Controle de visibilidade do botão de configurações da página (para admin)
  const btnConfigIndex = document.getElementById('btn-config-index');
  if (btnConfigIndex) {
      if (userRole === 'admin') {
          btnConfigIndex.style.display = 'flex'; // Usa 'flex' para botões para manter alinhamento
      } else {
          btnConfigIndex.style.display = 'none'; // Oculta para outros usuários
      }
  }

  // Controle de visibilidade da área de upload de imagem para Admin (a div #custom-image-display-area)
  const customImageDisplayArea = document.getElementById('custom-image-display-area');
  if (customImageDisplayArea) {
      if (userRole === 'admin') {
          customImageDisplayArea.style.display = 'flex'; /* Mostra a área para admin */
      } else {
          customImageDisplayArea.style.display = 'none'; /* Oculta para outros usuários */
      }
  }
}

// ... (Restante do seu script.js) ...

function criarUsuario() {
    const nomeUsuario = document.getElementById('nomeUsuario').value;
    const senhaUsuario = document.getElementById('senhaUsuario').value;
    if (nomeUsuario && senhaUsuario) {
        let usuarios = obterDados('usuarios') || [];
        if (usuarios.some(u => u.usuario === nomeUsuario)) {
            alert('Usuário já existe!');
            return;
        }
        usuarios.push({ usuario: nomeUsuario, senha: senhaUsuario });
        salvarDados('usuarios', usuarios);
        alert('Usuário criado com sucesso!');
        fecharModal('modalCriarUsuario');
        document.getElementById('nomeUsuario').value = '';
        document.getElementById('senhaUsuario').value = '';
    } else {
        alert('Por favor, preencha o nome e a senha do usuário.');
    }
}

function abrirModalCriarUsuario() {
  document.getElementById('modalCriarUsuario').style.display = 'flex';
}

function fecharModalCriarUsuario() {
    document.getElementById('modalCriarUsuario').style.display = 'none';
    document.getElementById('nomeUsuario').value = '';
    document.getElementById('senhaUsuario').value = '';
}

function abrirModalEditarUsuario() {
    const usuarios = obterDados('usuarios') || [];
    const nomeUsuarioEditarSelect = document.createElement('select');
    nomeUsuarioEditarSelect.id = 'selectUsuarioEditar';
    let optionsHtml = '<option value="">Selecione um usuário</option>';
    usuarios.forEach(user => {
        optionsHtml += `<option value="${user.usuario}">${user.usuario}</option>`;
    });
    nomeUsuarioEditarSelect.innerHTML = optionsHtml;

    const modalContent = document.querySelector('#modalEditarUsuario .modal-content');
    const existingSelect = document.getElementById('selectUsuarioEditar');
    if (existingSelect) {
        modalContent.replaceChild(nomeUsuarioEditarSelect, existingSelect);
    } else {
        const labelNomeUsuario = modalContent.querySelector('label[for="nomeUsuarioEditar"]');
        if (labelNomeUsuario) {
            labelNomeUsuario.parentNode.insertBefore(nomeUsuarioEditarSelect, labelNomeUsuario.nextSibling);
        }
    }

    document.getElementById('modalEditarUsuario').style.display = 'flex';
    document.getElementById('senhaUsuarioEditar').value = '';
}

function editarUsuario() {
    const selectUsuario = document.getElementById('selectUsuarioEditar');
    const nomeUsuarioSelecionado = selectUsuario.value;
    const novaSenha = document.getElementById('senhaUsuarioEditar').value;

    if (!nomeUsuarioSelecionado) {
        alert('Por favor, selecione um usuário para editar.');
        return;
    }
    if (!novaSenha) {
        alert('Por favor, digite a nova senha.');
        return;
    }

    let usuarios = obterDados('usuarios') || [];
    const index = usuarios.findIndex(u => u.usuario === nomeUsuarioSelecionado);

    if (index !== -1) {
        usuarios[index].senha = novaSenha;
        salvarDados('usuarios', usuarios);
        alert('Senha do usuário atualizada com sucesso!');
        fecharModal('modalEditarUsuario');
    } else {
        alert('Usuário não encontrado!');
    }
}

function abrirModalExcluirUsuario() {
    const usuarios = obterDados('usuarios') || [];
    const nomeUsuarioExcluirSelect = document.createElement('select');
    nomeUsuarioExcluirSelect.id = 'selectUsuarioExcluir';
    let optionsHtml = '<option value="">Selecione um usuário</option>';
    usuarios.forEach(user => {
        optionsHtml += `<option value="${user.usuario}">${user.usuario}</option>`;
    });
    nomeUsuarioExcluirSelect.innerHTML = optionsHtml;

    const modalContent = document.querySelector('#modalExcluirUsuario .modal-content');
    const existingSelect = document.getElementById('selectUsuarioExcluir');
    if (existingSelect) {
        modalContent.replaceChild(nomeUsuarioExcluirSelect, existingSelect);
    } else {
        const labelNomeUsuario = modalContent.querySelector('label[for="nomeUsuarioExcluir"]');
        if (labelNomeUsuario) {
            labelNomeUsuario.parentNode.insertBefore(nomeUsuarioExcluirSelect, labelNomeUsuario.nextSibling);
        }
    }

    document.getElementById('modalExcluirUsuario').style.display = 'flex';
}

function fecharModalExcluirUsuario() {
    document.getElementById('modalExcluirUsuario').style.display = 'none';
}

function excluirUsuario() {
    const selectUsuario = document.getElementById('selectUsuarioExcluir');
    const nomeUsuarioSelecionado = selectUsuario.value;

    if (!nomeUsuarioSelecionado) {
        alert('Por favor, selecione um usuário para excluir.');
        return;
    }
    if (nomeUsuarioSelecionado === 'admin') {
        alert('O usuário "admin" não pode ser excluído.');
        return;
    }
    if (!confirm(`Tem certeza que deseja excluir o usuário "${nomeUsuarioSelecionado}"?`)) {
        return;
    }

    let usuarios = obterDados('usuarios') || [];
    const usuariosFiltrados = usuarios.filter(u => u.usuario !== nomeUsuarioSelecionado);

    if (usuariosFiltrados.length < usuarios.length) {
        salvarDados('usuarios', usuariosFiltrados);
        alert('Usuário excluído com sucesso!');
        fecharModal('modalExcluirUsuario');
    } else {
        alert('Usuário não encontrado!');
    }
}

function abrirModalListarUsuarios() {
    const usuarios = obterDados('usuarios') || [];
    const userListDiv = document.getElementById('user-list');
    if (userListDiv) {
        userListDiv.innerHTML = "";

        if (usuarios.length === 0) {
            userListDiv.innerHTML = "<p>Nenhum usuário cadastrado.</p>";
        } else {
            const ul = document.createElement('ul');
            usuarios.forEach(user => {
                const li = document.createElement('li');
                li.textContent = user.usuario;
                ul.appendChild(li);
            });
            userListDiv.appendChild(ul);
        }
    }
    document.getElementById('modalListarUsuarios').style.display = 'flex';
}

function fecharModalListarUsuarios() {
    document.getElementById('modalListarUsuarios').style.display = 'none';
}

function fecharModal(idModal) {
  document.getElementById(idModal).style.display = 'none';
}

function logoutUsuario() {
  localStorage.removeItem("usuarioLogado");
  localStorage.removeItem("userRole");
  window.location.href = "login.html";
}


// Funções de Inicialização e Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Inicializa o admin se não existir
  let usuarios = obterDados("usuarios") || [];
  const adminExiste = usuarios.some(u => u.usuario === "admin");
  if (!adminExiste) {
    usuarios.push({ usuario: "admin", senha: "1996" });
    salvarDados("usuarios", usuarios);
  }

  // Define a data atual como padrão no input do relatório (se estiver em relatorio.html, este bloco não fará nada no index.html)
  const reportDateInput = document.getElementById("report-date");
  if (reportDateInput) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    reportDateInput.value = `${year}-${month}-${day}`;
    reportDateInput.addEventListener("change", showReport);
    showReport();
  }
  
  updateLowStockList(); // Atualiza a lista de estoque baixo na seção

  // Lógica para mostrar/ocultar o contêiner global do menu de usuário e o botão Apagar Registros (baseado na role do usuário)
  verificarAdmin(); // Chama a função no DOMContentLoaded para que a visibilidade seja definida

  // Lógica de click para o submenu do usuário
  const userMenu = document.getElementById('userMenu');
  if (userMenu) {
    userMenu.addEventListener('click', function(event) {
        const submenu = document.getElementById('userMenuOptions');
        if (submenu) {
            submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
        }
        event.stopPropagation(); // Impede o fechamento imediato do submenu ao clicar no botão
    });
    // Fecha o submenu se o clique for fora dele
    document.addEventListener('click', function(event) {
        const submenu = document.getElementById('userMenuOptions');
        // Verifica se o clique não foi no próprio userMenu (botão) e se o submenu está aberto
        if (submenu && submenu.style.display === 'block' && !userMenu.contains(event.target) && !submenu.contains(event.target)) {
            submenu.style.display = 'none';
        }
    });
  }

  const inputBackup = document.getElementById('inputBackup');
  if (inputBackup) {
    inputBackup.addEventListener('change', importarBackup);
  }

  const rodapeFixo = document.getElementById("rodapeFixo");
  if (rodapeFixo) {
    const isLoginPage = window.location.pathname.endsWith('/login.html');
    rodapeFixo.style.display = isLoginPage ? 'none' : 'block';
  }
});

// script.js

// ... (código anterior) ...

// Funções de Inicialização e Event Listeners (onde confirmarApagarDados é definida)
// ...

function confirmarApagarDados() {
  if (confirm("ATENÇÃO: Esta ação irá apagar TODOS os registros do sistema (produtos, usuários, movimentações, etc.). Esta ação é irreversível. Tem certeza que deseja continuar?")) {
    const senha = prompt("Por favor, digite a senha de administrador para confirmar a exclusão de todos os dados:");
    if (senha === "1996") { // Senha de administrador
      localStorage.clear();
      // Opcional: Recriar o usuário admin após limpar tudo
      let usuarios = [];
      usuarios.push({ usuario: "admin", senha: "1996" });
      salvarDados("usuarios", usuarios);
      alert("Todos os dados foram apagados com sucesso! O sistema será recarregado.");
      location.reload();
    } else {
      alert("Senha incorreta. A exclusão foi cancelada.");
    }
  }
}

// ... (código posterior) ...

// script.js

// ... (seu código existente) ...

// Funções de Gerenciamento de Imagem Personalizada
function salvarImageDisplay() {
    const fileInput = document.getElementById('image-upload-input');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Image = e.target.result;
            localStorage.setItem('displayImage', base64Image); // Salva em localStorage
            aplicarImageDisplay(base64Image); // Aplica imediatamente
            showMessage('Imagem definida com sucesso!');
        };
        reader.readAsDataURL(file);
    } else {
        showMessage('Por favor, selecione uma imagem.', true);
    }
}

function aplicarImageDisplay(base64Image) {
    const imgElement = document.getElementById('custom-display-image'); // Esta é a linha anterior à 772
    const placeholderElement = document.getElementById('image-placeholder');

    console.log("aplicarImageDisplay: base64Image recebido:", base64Image ? "SIM" : "NÃO");
    console.log("aplicarImageDisplay: imgElement:", imgElement); // <--- VERIFIQUE O QUE ISSO MOSTRA
    console.log("aplicarImageDisplay: placeholderElement:", placeholderElement); // <--- VERIFIQUE O QUE ISSO MOSTRA

    if (imgElement && placeholderElement) { 
        if (base64Image) {
            imgElement.src = base64Image; // Linha que causa o erro
            imgElement.style.display = 'block';
            placeholderElement.style.display = 'none';
            console.log("aplicarImageDisplay: Imagem definida e visível. Placeholder oculto.");
        } else {
            imgElement.src = '';
            imgElement.style.display = 'none';
            placeholderElement.style.display = 'block';
            console.log("aplicarImageDisplay: Imagem limpa. Placeholder visível.");
        }
    } else {
        console.error("ERRO: Elementos 'custom-display-image' ou 'image-placeholder' não encontrados no DOM.");
    }
}

function limparImageDisplay() {
    if (confirm("Tem certeza que deseja remover a imagem customizada?")) {
        localStorage.removeItem('displayImage'); // Remove do localStorage
        aplicarImageDisplay(null); // Limpa a exibição
        showMessage('Imagem removida.');
    }
}

// === Funções para o NOVO MODAL DE CONFIGURAÇÕES DO INDEX ===
function abrirModalConfiguracoesIndex() {
    document.getElementById('modal-configuracoes-index').style.display = 'flex';
    // Ao abrir, garante que a imagem atual esteja pré-carregada para visualização
    const savedImage = localStorage.getItem('displayImage');
    const imgPreview = document.getElementById('custom-display-image-preview'); // Se você tiver uma pré-visualização no modal
    const placeholderPreview = document.getElementById('image-placeholder-preview'); // Placeholder no modal
    
    if (savedImage) {
        // Se houver um preview da imagem dentro do modal de configurações, ajuste aqui
        // No HTML do modal: <img id="custom-display-image-preview" src="" alt="Pré-visualização">
        // Se não tiver, essas linhas podem ser ignoradas ou a lógica de aplicarImageDisplay será suficiente.
    }
}

function fecharModalConfiguracoesIndex() {
    document.getElementById('modal-configuracoes-index').style.display = 'none';
}

// script.js

// ... (seu código existente, incluindo funções obterDados, salvarDados, showMessage, etc.) ...

// Funções de Fundo da PÁGINA PRINCIPAL (index.html)
function salvarBackgroundIndex() {
    const fileInput = document.getElementById('background-upload-index');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Image = e.target.result;
            localStorage.setItem('indexBackground', base64Image); // Salva para o fundo do index
            aplicarBackgroundIndex(base64Image); // Aplica no body
            showMessage('Fundo da página definido com sucesso!');
            fecharModalConfiguracoesIndex();
        };
        reader.readAsDataURL(file);
    } else {
        showMessage('Por favor, selecione uma imagem.', true);
    }
}

function aplicarBackgroundIndex(base64Image) {
    if (base64Image) {
        document.body.style.backgroundImage = `url('${base64Image}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        // Opcional: ajustar cor de texto principal para contraste
        // document.body.style.color = 'white'; 
    } else {
        document.body.style.backgroundImage = 'none';
        // document.body.style.color = '#333'; // Volta à cor padrão
    }
}

function limparBackgroundIndex() {
    if (confirm("Tem certeza que deseja remover a imagem de fundo da página?")) {
        localStorage.removeItem('indexBackground'); // Remove do localStorage
        aplicarBackgroundIndex(null); // Limpa o fundo
        showMessage('Fundo da página removido.');
        fecharModalConfiguracoesIndex();
    }
}

// ... (Restante das suas funções, como salvarImageDisplay, aplicarImageDisplay para a imagem customizada dentro do container) ...


// === Funções para o NOVO MODAL DE CONFIGURAÇÕES DO INDEX ===
function abrirModalConfiguracoesIndex() {
    document.getElementById('modal-configuracoes-index').style.display = 'flex';
    // O input type="file" já limpa automaticamente ao abrir, então não precisa limpar o value
}

function fecharModalConfiguracoesIndex() {
    document.getElementById('modal-configuracoes-index').style.display = 'none';
}

// ... (Restante do script.js, incluindo verificarAdmin, DOMContentLoaded) ...

// Event Listeners (no DOMContentLoaded)
document.addEventListener("DOMContentLoaded", () => {
  // ... (código de inicialização existente) ...

  // Aplica a imagem salva na área principal da página ao carregar
  const savedDisplayImage = localStorage.getItem('displayImage'); // Esta é a imagem DENTRO da área demarcada
  aplicarImageDisplay(savedDisplayImage);

  // NOVO: Aplica o background da PÁGINA salvo ao carregar
  const savedIndexBackground = localStorage.getItem('indexBackground');
  aplicarBackgroundIndex(savedIndexBackground);


  // Adiciona event listeners para os botões de upload/limpeza da IMAGEM NA ÁREA DEMARCADA
  const setDisplayImageButton = document.getElementById('set-display-image-button');
  if (setDisplayImageButton) {
      setDisplayImageButton.addEventListener('click', salvarImageDisplay);
  }

  const clearDisplayImageButton = document.getElementById('clear-display-image-button');
  if (clearDisplayImageButton) {
      clearDisplayImageButton.addEventListener('click', limparImageDisplay);
  }

  // NOVO: Adiciona event listeners para os botões de BACKGROUND da PÁGINA (no modal de configurações)
  const setBackgroundIndexButton = document.getElementById('set-background-index-button');
  if (setBackgroundIndexButton) {
      setBackgroundIndexButton.addEventListener('click', salvarBackgroundIndex);
  }

  const clearBackgroundIndexButton = document.getElementById('clear-background-index-button');
  if (clearBackgroundIndexButton) {
      clearBackgroundIndexButton.addEventListener('click', limparBackgroundIndex);
  }

  // ... (restante do DOMContentLoaded) ...
});

// === FUNÇÕES GLOBAIS DE PDF (WEB) ===
// (Já inclusas nos HTMLs acima, mas pode deixar aqui como fallback)

// Função genérica (opcional)
function salvarComoPDF(elemento, nomeArquivo) {
  const opt = {
    margin: 10,
    filename: nomeArquivo,
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(elemento).save();
}

// CORREÇÃO: Define a data de HOJE corretamente (local, sem timezone bug)
function getHojeLocal() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0'); // Meses começam em 0
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// No DOMContentLoaded ou carregarTudo():
document.addEventListener("DOMContentLoaded", () => {
  // ... seu código existente ...
  
  // Aplica data de HOJE no filtro
  const filtroData = document.getElementById('filtroData');
  if (filtroData) {
    filtroData.value = getHojeLocal(); // Força data local de hoje
  }
  
  // Renderiza o relatório com a data correta
  renderizarVendas(); // Sua função de relatório
});

// --- FUNÇÕES DE ALERTA CUSTOMIZADO (NOVAS) ---

function showCustomAlert(message, isError = false) {
  const modal = document.getElementById('modal-custom-alert');
  // Verifica se o modal existe na página atual
  if (!modal) {
    alert(message); // Fallback para o alerta padrão se o modal não estiver no HTML
    return;
  }

  const messageEl = document.getElementById('custom-alert-message');
  const modalContent = modal.querySelector('.modal-content-alert');

  messageEl.innerText = message;

  if (isError) {
    modalContent.classList.add('error');
    modalContent.classList.remove('success');
  } else {
    modalContent.classList.add('success');
    modalContent.classList.remove('error');
  }

  modal.style.display = 'flex';

  setTimeout(() => document.getElementById('custom-alert-button').focus(), 100);
}

function fecharCustomAlert() {
  const modal = document.getElementById('modal-custom-alert');
  if (modal) {
    modal.style.display = 'none';
  }

  // Tenta focar em um input principal (opcional)
  const barcodeInput = document.getElementById("barcode");
  if (barcodeInput) barcodeInput.focus();
}