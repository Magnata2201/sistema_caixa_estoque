// Variáveis globais
let vendaAtual = [];
let totalVenda = 0;
let resumoFormas = obterDados("resumoFormas") || {
  Pix: 0,
  Crédito: 0,
  Débito: 0,
  Dinheiro: 0,
  Cheque: 0,
  VR: 0,
  Misto: 0
};
let itemParaCancelar = null;

// As funções obterDados e salvarDados são carregadas de script.js

// Função para atualizar o total da venda exibido e garantir consistência
function atualizarResumoVenda() {
    document.getElementById("total-geral").innerText = totalVenda.toFixed(2);
    document.getElementById("total-geral-lado").innerText = totalVenda.toFixed(2);
    // Se o modal de desconto estiver aberto, atualiza o total lá também
    const descontoTotalElement = document.getElementById('desconto-valor-total-venda');
    if (descontoTotalElement) {
        descontoTotalElement.innerText = totalVenda.toFixed(2);
    }
}


function adicionarItemVenda() {
  const codigo = document.getElementById("codigo-barra").value.trim();
  const quantidade = parseInt(document.getElementById("quantidade-produto").value.trim()) || 1;
  const produtos = obterDados("produtos");

  if (!produtos || !produtos[codigo]) {
    alert("Produto não encontrado!");
    return;
  }

  if (produtos[codigo].quantidade < quantidade) {
    alert("Estoque insuficiente!");
    return;
  }

  produtos[codigo].quantidade -= quantidade;
  salvarDados("produtos", produtos);

  const produto = produtos[codigo];
  vendaAtual.push({ codigo, nome: produto.nome, valor: produto.valor, quantidade });

  atualizarTabela(); // Isso já chama atualizarResumoVenda internamente para o total da venda atual
  document.getElementById("codigo-barra").value = "";
  document.getElementById("quantidade-produto").value = "1";
  document.getElementById("codigo-barra").focus();
}

function atualizarTabela() {
  const tbody = document.getElementById("itens-venda");
  tbody.innerHTML = "";
  totalVenda = 0; // Recalcula o total a partir dos itens em vendaAtual

  vendaAtual.forEach((item, index) => {
    const subtotal = item.valor * item.quantidade;
    totalVenda += subtotal;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="width: 30%;">${item.nome}</td>
      <td style="width: 20%;">${item.codigo}</td>
      <td style="width: 10%;">${item.quantidade}</td>
      <td style="width: 20%;">R$ ${item.valor.toFixed(2)}</td>
      <td style="width: 20%;">R$ ${subtotal.toFixed(2)}</td>
    `;
    tr.style.cursor = "pointer";
    tr.title = "Clique para cancelar este item";
    tr.onclick = () => solicitarSenha(index);
    tbody.appendChild(tr);
  });

  // Atualiza o total exibido na interface
  atualizarResumoVenda(); 
}

function solicitarSenha(index) {
  itemParaCancelar = index;
  document.getElementById('modal-senha-cancelar').style.display = 'flex';
  document.getElementById('senha-cancelar-input').focus();
}

function confirmarCancelamento() {
  const senha = document.getElementById("senha-cancelar-input").value;
  if (senha === "2201") { // Senha de cancelamento
    if (itemParaCancelar !== null) {
      cancelarItemReal(itemParaCancelar);
      itemParaCancelar = null;
    }
    fecharModalSenhaCancelar();
  } else {
    alert("Senha incorreta para cancelamento!");
    document.getElementById("senha-cancelar-input").value = "";
    document.getElementById("senha-cancelar-input").focus();
  }
}

function fecharModalSenhaCancelar() {
  document.getElementById("modal-senha-cancelar").style.display = "none";
  document.getElementById("senha-cancelar-input").value = "";
  document.getElementById("codigo-barra").focus();
}

function cancelarItemReal(index) {
  const itemCancelado = vendaAtual.splice(index, 1)[0];
  const produtos = obterDados("produtos");

  if (produtos && produtos[itemCancelado.codigo]) {
    produtos[itemCancelado.codigo].quantidade += itemCancelado.quantidade;
    salvarDados("produtos", produtos);
  }
  atualizarTabela(); // Recalcula e redesenha a tabela
}

function abrirOpcoesPagamento() {
  if (vendaAtual.length === 0) {
    alert("Nenhum item adicionado.");
    return;
  }
  document.getElementById("modal-pagamento").style.display = "flex";
}

function fecharModalPagamento() {
  document.getElementById("modal-pagamento").style.display = "none";
  document.getElementById("codigo-barra").focus();
}

// Substitua a função finalizarVenda (linha 127) por esta:

function finalizarVenda(formaPagamento, valorRecebido = null, pagamentosDetalhados = null, dadosCliente = null) {
  const data = new Date();
  const dataAtual = data.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  const horaAtual = data.toLocaleTimeString();
  const usuario = localStorage.getItem("usuarioLogado") || "desconhecido";
  const movimentacoes = obterDados("movimentacoes") || {};
  if (!movimentacoes[dataAtual]) movimentacoes[dataAtual] = [];

  const idCupom = `CUPOM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  vendaAtual.forEach((item) => {
    movimentacoes[dataAtual].push({
      produto: item.nome,
      codigo: item.codigo,
      quantidade: item.quantidade,
      valor: item.valor,
      usuario: usuario,
      hora: horaAtual,
      formaPagamento: formaPagamento,
      idCupom: idCupom,
      tipoMovimento: 'venda',
      data: data.toISOString(), // Salva a data completa
      // --- ADIÇÃO PARA O FIADO ---
      clienteId: dadosCliente ? dadosCliente.id : null,
      clienteNome: dadosCliente ? dadosCliente.nome : null
      // --- FIM DA ADIÇÃO ---
    });
  });

  // --- MODIFICAÇÃO PARA O FIADO ---
  // Só adiciona ao caixa se NÃO for Fiado
  if (formaPagamento !== "Fiado") {
    if (pagamentosDetalhados) {
      for (const forma in pagamentosDetalhados) {
        if (resumoFormas.hasOwnProperty(forma)) {
          resumoFormas[forma] += pagamentosDetalhados[forma];
        }
      }
    } else {
      if (resumoFormas.hasOwnProperty(formaPagamento)) {
          resumoFormas[formaPagamento] += totalVenda;
      }
    }
    salvarDados("resumoFormas", resumoFormas);
  }
  // --- FIM DA MODIFICAÇÃO ---

  salvarDados("movimentacoes", movimentacoes);
  imprimirCupom(vendaAtual, totalVenda, formaPagamento, valorRecebido, pagamentosDetalhados, idCupom);

  vendaAtual = [];
  atualizarTabela(); // Redesenha a tabela e zera o total
  fecharModalPagamento();
  
  if (formaPagamento !== "Fiado") {
    showCustomAlert("Venda finalizada com sucesso!", false);
  }
  
  document.getElementById("codigo-barra").focus();
}

function imprimirCupom(itens, total, formaPagamento, valorRecebido = null, pagamentosDetalhados = null, idCupom = null) {
  const iframe = document.getElementById("iframe-impressao");
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  const usuario = localStorage.getItem("usuarioLogado") || "desconhecido";
  const nomeLoja = localStorage.getItem("nomeLoja") || "Nome da Loja";
  
  salvarDados("ultimaVenda", {
    itens: [...itens],
    total: total,
    formaPagamento: formaPagamento,
    valorRecebido: valorRecebido,
    pagamentosDetalhados: pagamentosDetalhados,
    idCupom: idCupom
  });

  doc.open();
  doc.write("<html><head><title>Cupom</title>");
  doc.write("<style>body { font-family: 'Courier New', monospace; font-size: 12pt; }</style>");
  doc.write("</head><body>");
  doc.write(`<h3>${nomeLoja} - Cupom Sem Valor Fiscal</h3><hr>`);
  if (idCupom) {
    doc.write(`<p><strong>ID Cupom:</strong> ${idCupom}</p><hr>`);
  }
  itens.forEach(i => {
    doc.write(`<p>${i.nome} (${i.codigo}) - Qtd: ${i.quantidade} - R$ ${(i.valor * i.quantidade).toFixed(2)}</p>`);
  });
  doc.write(`<hr><p><strong>Total:</strong> R$ ${total.toFixed(2)}</p>`);
  
  if (formaPagamento === "Misto" && pagamentosDetalhados) {
    doc.write(`<p><strong>Pagamento Misto:</strong></p>`);
    for (const forma in pagamentosDetalhados) {
      if (pagamentosDetalhados[forma] > 0) {
        doc.write(`<p>- ${forma}: R$ ${pagamentosDetalhados[forma].toFixed(2)}</p>`);
      }
    }
  } else {
    doc.write(`<p><strong>Pagamento:</strong> ${formaPagamento}</p>`);
  }

  if (formaPagamento === "Dinheiro" && valorRecebido !== null) {
    const troco = valorRecebido - total;
    doc.write(`<p><strong>Recebido:</strong> R$ ${valorRecebido.toFixed(2)}</p>`);
    doc.write(`<p><strong>Troco:</strong> R$ ${troco.toFixed(2)}</p>`);
  }
  doc.write(`<p><strong>Atendido por:</strong> ${usuario}</p>`);
  doc.write("<p style='text-align:center;'>Obrigado!</p></body></html>");
  doc.close();
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }, 300);
}

function abrirModalPagamentoMisto() {
  if (vendaAtual.length === 0) {
    alert("Nenhum item adicionado para pagamento misto.");
    return;
  }
  document.getElementById("modal-pagamento").style.display = "none";
  document.getElementById("modal-pagamento-misto").style.display = "flex";
  document.getElementById("total-misto").innerText = totalVenda.toFixed(2);

  document.getElementById("pg-pix").value = "0.00";
  document.getElementById("pg-credito").value = "0.00";
  document.getElementById("pg-debito").value = "0.00";
  document.getElementById("pg-dinheiro").value = "0.00";
  document.getElementById("pg-cheque").value = "0.00";
  document.getElementById("pg-vr").value = "0.00";
}

function confirmarPagamentoMisto() {
  const pix = parseFloat(document.getElementById('pg-pix').value) || 0;
  const credito = parseFloat(document.getElementById('pg-credito').value) || 0;
  const debito = parseFloat(document.getElementById('pg-debito').value) || 0;
  const dinheiro = parseFloat(document.getElementById('pg-dinheiro').value) || 0;
  const cheque = parseFloat(document.getElementById('pg-cheque').value) || 0;
  const vr = parseFloat(document.getElementById('pg-vr').value) || 0;

  const totalPagoMisto = pix + credito + debito + dinheiro + cheque + vr;

  if (totalPagoMisto < totalVenda) {
    alert("O valor total pago é menor que o total da venda!");
    return;
  }

  const pagamentosDetalhados = {
    Pix: pix,
    Crédito: credito,
    Débito: debito,
    Dinheiro: dinheiro,
    Cheque: cheque,
    VR: vr
  };

  let trocoMisto = 0;
  if (dinheiro > 0 && totalPagoMisto > totalVenda) {
    trocoMisto = totalPagoMisto - totalVenda;
    alert(`Troco: R$ ${trocoMisto.toFixed(2)}`);
  }

  finalizarVenda('Misto', trocoMisto > 0 ? dinheiro : null, pagamentosDetalhados);
  document.getElementById('modal-pagamento-misto').style.display = 'none';
}

const valorRecebidoInput = document.getElementById("valor-recebido");
if (valorRecebidoInput) {
    valorRecebidoInput.addEventListener("input", function () {
        const total = parseFloat(document.getElementById("total-em-dinheiro").textContent.replace("R$", "").replace(",", "."));
        const valorRecebido = parseFloat(this.value);
        const troco = valorRecebido - total;
        document.getElementById("valor-troco").textContent = `R$ ${troco.toFixed(2).replace(".", ",")}`;
    });
}

function confirmarTroco() {
  const recebido = parseFloat(document.getElementById("valor-recebido").value) || 0;
  if (recebido < totalVenda) {
    alert("Valor recebido é menor que o total.");
    return;
  }
  finalizarVenda('Dinheiro', recebido);
  fecharModalTroco();
}

function fecharModalTroco() {
  document.getElementById("modal-troco").style.display = "none";
  document.getElementById("codigo-barra").focus();
}

function reimprimirUltimoCupom() {
  const dados = obterDados("ultimaVenda");
  if (!dados || !dados.itens || dados.itens.length === 0) {
    alert("Nenhuma venda registrada para reimpressão.");
    return;
  }

  imprimirCupom(dados.itens, dados.total, dados.formaPagamento, dados.valorRecebido, dados.pagamentosDetalhados, dados.idCupom);
}

function fecharCaixa() {
  document.getElementById("modal-senha-fechamento").style.display = "flex";
  setTimeout(() => document.getElementById("input-senha-fechar").focus(), 100);
}

function confirmarFechamentoCaixa() {
  const senha = document.getElementById('input-senha-fechar').value;
  if (senha !== "2201") {
    alert("Senha incorreta!");
    document.getElementById("input-senha-fechar").value = "";
    document.getElementById("input-senha-fechar").focus();
    return;
  }

  fecharModalSenhaFechamento();

  const aberturaCaixa = parseFloat(localStorage.getItem("valorAberturaCaixa") || "0");
  const formasAcumuladas = obterDados("resumoFormas") || { Pix: 0, Crédito: 0, Débito: 0, Dinheiro: 0, Cheque: 0, VR: 0, Misto: 0 };
  let totalEntradas = aberturaCaixa;
  for (const forma in formasAcumuladas) {
    totalEntradas += formasAcumuladas[forma];
  }

  const movimentosCaixa = obterDados("movimentosCaixa") || [];
  let totalSangrias = 0;
  let totalSuprimentos = 0;

  movimentosCaixa.forEach(mov => {
    if (mov.tipo === 'sangria') {
      totalSangrias += mov.valor;
    } else if (mov.tipo === 'suprimento') {
      totalSuprimentos += mov.valor;
    }
  });

  const iframe = document.getElementById("iframe-impressao");
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  const nomeLoja = localStorage.getItem("nomeLoja") || "Nome da Loja";

  doc.open();
  doc.write("<html><head><title>Fechamento de Caixa</title>");
  doc.write("<style>body { font-family: 'Courier New', monospace; font-size: 12pt; }</style>");
  doc.write("</head><body>");
  doc.write(`<h3>💰 Fechamento de Caixa - ${nomeLoja} 💰</h3><hr>`);
  doc.write("<p><strong>Data:</strong> " + new Date().toLocaleDateString() + "</p>");
  doc.write("<p><strong>Hora:</strong> " + new Date().toLocaleTimeString() + "</p>");
  doc.write("<p><strong>Atendente:</strong> " + (localStorage.getItem("usuarioLogado") || "desconhecido") + "</p>");
  doc.write("<hr>");

  doc.write("<h4>Valores do Caixa:</h4>");
  doc.write(`<p><strong>Valor de Abertura:</strong> R$ ${aberturaCaixa.toFixed(2)}</p>`);

  doc.write("<h4>Total Recebido por Forma de Pagamento:</h4>");
  for (const forma in formasAcumuladas) {
    if (formasAcumuladas[forma] !== 0) {
      doc.write(`<p>${forma}: R$ ${formasAcumuladas[forma].toFixed(2)}</p>`);
    }
  }
  doc.write(`<hr><p><strong>Total de Entradas (Vendas + Abertura):</strong> R$ ${totalEntradas.toFixed(2)}</p>`);

  if (totalSangrias > 0 || totalSuprimentos > 0) {
      doc.write("<h4>Movimentações Avulsas:</h4>");
      if (totalSangrias > 0) {
          doc.write(`<p><strong>Total de Sangrias:</strong> R$ ${totalSangrias.toFixed(2)}</p>`);
          movimentosCaixa.filter(m => m.tipo === 'sangria').forEach(s => {
              doc.write(`<p style="margin-left: 15px; font-size: 11pt;">- ${s.data}: R$ ${s.valor.toFixed(2)} (${s.motivo})</p>`);
          });
      }
      if (totalSuprimentos > 0) {
          doc.write(`<p><strong>Total de Suprimentos:</strong> R$ ${totalSuprimentos.toFixed(2)}</p>`);
          movimentosCaixa.filter(m => m.tipo === 'suprimento').forEach(s => {
              doc.write(`<p style="margin-left: 15px; font-size: 11pt;">- ${s.data}: R$ ${s.valor.toFixed(2)} (${s.motivo})</p>`);
          });
      }
      doc.write("<hr>");
  }

  // AVISO: A limpeza de resumoFormas e movimentosCaixa aqui apaga o histórico
  // Para relatórios históricos, a lógica de fechamento de caixa precisaria ser diferente,
  // salvando um "resumo diário" e não apagando os movimentos brutos.
  // Mantenho a lógica atual para a compatibilidade com o que já foi construído,
  // mas é um ponto a ser refinado para um sistema mais robusto.
  localStorage.removeItem("resumoFormas");
  localStorage.removeItem("movimentosCaixa");
  localStorage.removeItem("valorAberturaCaixa");
  localStorage.removeItem("caixaAbertoData");

  resumoFormas = { Pix: 0, Crédito: 0, Débito: 0, Dinheiro: 0, Cheque: 0, VR: 0, Misto: 0 };

  doc.write("<p style='text-align:center;'>--- Fechamento Concluído ---</p>");
  doc.write("</body></html>");
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    window.location.href = "login.html";
  }, 300);
}

function fecharModalSenhaFechamento() {
  document.getElementById("modal-senha-fechamento").style.display = "none";
  document.getElementById("input-senha-fechar").value = "";
}

function abrirModalAbertura() {
  document.getElementById('modal-abertura').style.display = 'flex';
  setTimeout(() => document.getElementById('valor-abertura').focus(), 100);
}

function confirmarAbertura() {
  const valor = parseFloat(document.getElementById('valor-abertura').value);

  if (isNaN(valor) || valor <= 0) {
    alert("Informe um valor válido para abertura do caixa.");
    return;
  }

  localStorage.setItem("valorAberturaCaixa", valor.toFixed(2));
  localStorage.setItem("caixaAbertoData", new Date().toLocaleDateString());

  document.getElementById('modal-abertura').style.display = 'none';
  document.getElementById('bloqueio-tela').style.display = 'none';

  let formasIniciais = obterDados("resumoFormas");
  if (!formasIniciais) {
      salvarDados("resumoFormas", { Pix: 0, Crédito: 0, Débito: 0, Dinheiro: 0, Cheque: 0, VR: 0, Misto: 0 });
      resumoFormas = obterDados("resumoFormas");
  }

  atualizarTopBar();
  alert("Caixa aberto com R$ " + valor.toFixed(2));
  document.getElementById("codigo-barra").focus();
}

function abrirModalSangria() {
  document.getElementById('valor-sangria').value = '';
  document.getElementById('motivo-sangria').value = '';
  document.getElementById('modal-sangria').style.display = 'flex';
  setTimeout(() => document.getElementById('valor-sangria').focus(), 100);
}

// Substitua a função confirmarSangria() inteira no caixa.js por esta:

function confirmarSangria() {
  // Pega o valor como TEXTO (requer type="text" no HTML, como já ajustamos)
  const valorInput = document.getElementById('valor-sangria').value;
  const motivo = document.getElementById('motivo-sangria').value.trim();

  // Limpa o valor (remove R$, espaços, troca vírgula por ponto)
  const valorLimpo = valorInput.replace("R$", "").trim().replace(",", ".");
  
  // Converte o texto limpo para número
  const valor = parseFloat(valorLimpo); 

  if (isNaN(valor) || valor <= 0 || motivo === '') {
    alert("Preencha corretamente o valor e o motivo da sangria.");
    return;
  }

  const sangria = {
    tipo: 'sangria',
    valor: valor, // Salva o número limpo
    motivo: motivo,
    data: new Date().toISOString() // <-- A CORREÇÃO DA DATA ESTÁ AQUI
  };

  let movimentos = obterDados("movimentosCaixa") || [];
  movimentos.push(sangria);
  salvarDados("movimentosCaixa", movimentos);

  alert("Sangria registrada com sucesso.");
  document.getElementById('modal-sangria').style.display = 'none';
  document.getElementById("codigo-barra").focus();
}

function abrirModalConfiguracoes() {
  const nomeAtual = localStorage.getItem("nomeLoja") || "Nome da Loja";
  document.getElementById("nome-loja-input").value = nomeAtual;
  document.getElementById("modal-configuracoes").style.display = "flex";
  setTimeout(() => document.getElementById("nome-loja-input").focus(), 100);
}

function fecharModalConfiguracoes() {
  document.getElementById("modal-configuracoes").style.display = "none";
  document.getElementById("nome-loja-input").value = "";
  document.getElementById("codigo-barra").focus();
}

function salvarConfiguracoesLoja() {
  const novoNome = document.getElementById("nome-loja-input").value.trim();
  if (novoNome) {
    localStorage.setItem("nomeLoja", novoNome);
    atualizarTopBar();
    alert("Nome da loja atualizado com sucesso!");
    fecharModalConfiguracoes();
  } else {
    alert("Por favor, digite um nome para a loja.");
    document.getElementById("nome-loja-input").focus();
  }
}

function setBackground() {
  const fileInput = document.getElementById('background-upload');
  const file = fileInput.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64Image = e.target.result;
      localStorage.setItem('caixaBackground', base64Image);
      applyBackground(base64Image);
      alert('Fundo de caixa definido com sucesso!');
    };
    reader.readAsDataURL(file);
  } else {
    alert('Por favor, selecione uma imagem.');
  }
}

function applyBackground(base64Image) {
  if (base64Image) {
    document.body.style.backgroundImage = `url('${base64Image}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
  } else {
    document.body.style.backgroundImage = 'none';
  }
}

function clearBackground() {
  localStorage.removeItem('caixaBackground');
  applyBackground(null);
  alert('Fundo de caixa removido!');
}

function checkAdminStatus() {
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin';

  const settingsButton = document.querySelector('.settings-button');
  if (settingsButton) {
    settingsButton.style.display = isAdmin ? 'flex' : 'none';
  }
}

function atualizarTopBar() {
    const horarioElement = document.getElementById('display-horario');
    const operadorElement = document.getElementById('display-operador');
    const statusCaixaElement = document.getElementById('display-status-caixa');
    const nomeLojaElement = document.getElementById('display-nome-loja');

    const now = new Date();
    horarioElement.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const usuarioLogado = localStorage.getItem("usuarioLogado") || "Não Logado";
    operadorElement.innerText = usuarioLogado;

    const nomeLoja = localStorage.getItem("nomeLoja") || "Nome da Loja";
    nomeLojaElement.innerText = nomeLoja;

    const dataHoje = new Date().toLocaleDateString();
    const caixaAbertoHoje = localStorage.getItem("caixaAbertoData") === dataHoje;
    const valorAberturaExistente = localStorage.getItem("valorAberturaCaixa");

    if (caixaAbertoHoje && valorAberturaExistente) {
        statusCaixaElement.innerText = "Aberto";
        statusCaixaElement.classList.remove('status-fechado');
        statusCaixaElement.classList.add('status-aberto');
    } else {
        statusCaixaElement.innerText = "Fechado";
        statusCaixaElement.classList.remove('status-aberto');
        statusCaixaElement.classList.add('status-fechado');
    }
}

document.addEventListener("DOMContentLoaded", function() {
  atualizarTopBar();
  setInterval(atualizarTopBar, 1000);

  const dataHoje = new Date().toLocaleDateString();
  const caixaAbertoHoje = localStorage.getItem("caixaAbertoData") === dataHoje;
  const valorAberturaExistente = localStorage.getItem("valorAberturaCaixa");

  if (!caixaAbertoHoje || !valorAberturaExistente) {
    document.getElementById('bloqueio-tela').style.display = 'flex';
  } else {
    document.getElementById('bloqueio-tela').style.display = 'none';
    document.getElementById('codigo-barra').focus();
  }

  const btnAbrirCaixa = document.getElementById('btn-abrir-caixa');
  if (btnAbrirCaixa) {
      btnAbrirCaixa.addEventListener('click', function() {
          abrirModalAbertura();
      });
  }

  const setBackgroundButton = document.getElementById('set-background-button');
  if (setBackgroundButton) {
    setBackgroundButton.addEventListener('click', setBackground);
  }

  const clearBackgroundButton = document.getElementById('clear-background-button');
  if (clearBackgroundButton) {
    clearBackgroundButton.addEventListener('click', clearBackground);
  }

  const savedBackground = localStorage.getItem('caixaBackground');
  if (savedBackground) {
      applyBackground(savedBackground);
  }

  checkAdminStatus();
});

document.addEventListener("keydown", function(event) {
  const modalPagamento = document.getElementById("modal-pagamento");
  const modalTroco = document.getElementById("modal-troco");
  const modalPagamentoMisto = document.getElementById("modal-pagamento-misto");

  if (modalPagamento && (modalPagamento.style.display === "flex" || modalPagamento.style.display === "block")) {
    const tecla = event.code;
    switch (tecla) {
      case "Digit1": case "Numpad1": finalizarVenda("Pix"); break;
      case "Digit2": case "Numpad2": finalizarVenda("Crédito"); break;
      case "Digit3": case "Numpad3": finalizarVenda("Débito"); break;
      case "Digit4": case "Numpad4":
        fecharModalPagamento();
        document.getElementById("total-em-dinheiro").innerText = totalVenda.toFixed(2);
        document.getElementById("valor-recebido").value = "";
        document.getElementById("valor-troco").innerText = "R$ 0,00";
        document.getElementById("modal-troco").style.display = "flex";
        setTimeout(() => document.getElementById("valor-recebido").focus(), 100);
        break;
      case "Digit5": case "Numpad5": finalizarVenda("Cheque"); break;
      case "Digit6": case "Numpad6": finalizarVenda("VR"); break;
      case "Digit7": case "Numpad7": abrirModalPagamentoMisto(); break;
      case "Digit8": case "Numpad8": abrirModalFiado(); break;
    }
  } else if (modalTroco && modalTroco.style.display === "flex" && event.key === "Enter") {
    confirmarTroco();
  } else if (modalPagamentoMisto && modalPagamentoMisto.style.display === "flex" && event.key === "Enter") {
    confirmarPagamentoMisto();
  }
});
// ... (Seu código existente do caixa.js, antes das novas funções) ...

// --- Funções de Desconto ---

function abrirModalDesconto() {
    // Atualiza o valor total da venda no modal antes de abrir
    document.getElementById('desconto-valor-total-venda').innerText = totalVenda.toFixed(2);
    document.getElementById('senha-desconto').value = ''; // Limpa o campo da senha
    document.getElementById('valor-desconto').value = ''; // Limpa o campo do valor
    document.getElementById('modal-desconto').style.display = 'flex';
    setTimeout(() => document.getElementById('senha-desconto').focus(), 100);
}

function fecharModalDesconto() {
    document.getElementById('modal-desconto').style.display = 'none';
}

function confirmarDesconto() {
    const senhaDigitada = document.getElementById('senha-desconto').value;
    const valorDesconto = parseFloat(document.getElementById('valor-desconto').value);
    const senhaAdmin = "2201"; // Senha fixa para o desconto

    if (senhaDigitada !== senhaAdmin) {
        alert("Senha incorreta. Desconto não aplicado.");
        return;
    }

    if (isNaN(valorDesconto) || valorDesconto <= 0) {
        alert("Por favor, insira um valor de desconto válido e positivo.");
        return;
    }

    if (valorDesconto > totalVenda) {
        alert("O valor do desconto não pode ser maior que o total da venda.");
        return;
    }

    // Aplica o desconto
    totalVenda -= valorDesconto;
    if (totalVenda < 0) totalVenda = 0; // Garante que o total não fique negativo

    // Atualiza a exibição do total da venda na tela
    atualizarResumoVenda(); // Esta função precisa existir e atualizar os displays do total

    // Registra a movimentação de desconto
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toISOString().split('T')[0]; // YYYY-MM-DD
    const horaAtual = dataAtual.toLocaleTimeString();
    const usuario = localStorage.getItem("usuarioLogado") || "desconhecido";

    let movimentacoes = obterDados("movimentacoes") || {};
    if (!movimentacoes[dataFormatada]) {
        movimentacoes[dataFormatada] = [];
    }

    movimentacoes[dataFormatada].push({
        idCupom: "DESCONTO-" + Date.now(), // ID único para o desconto
        produto: "Desconto Aplicado",
        codigo: "DESCONTO",
        quantidade: 1,
        valor: -valorDesconto, // Valor negativo para representar o desconto
        tipoMovimento: "DESCONTO",
        motivo: `Desconto de R$ ${valorDesconto.toFixed(2)}`,
        usuario: usuario,
        hora: horaAtual,
        data: dataFormatada
    });
    salvarDados("movimentacoes", movimentacoes);

    alert(`Desconto de R$ ${valorDesconto.toFixed(2)} aplicado com sucesso! Novo total: R$ ${totalVenda.toFixed(2)}`);
    fecharModalDesconto();
}

// ... (Seu código existente do caixa.js continua aqui) ...

// COLE ISTO DENTRO DE CAIXA.JS (após a função confirmarSangria)

function abrirModalSuprimento() {
  document.getElementById('valor-suprimento').value = '';
  document.getElementById('motivo-suprimento').value = '';
  document.getElementById('modal-suprimento').style.display = 'flex';
  setTimeout(() => document.getElementById('valor-suprimento').focus(), 100);
}

function confirmarSuprimento() {
  // Pega o valor como TEXTO
  const valorInput = document.getElementById('valor-suprimento').value;
  const motivo = document.getElementById('motivo-suprimento').value.trim();

  // Limpa o valor (remove R$, espaços, troca vírgula por ponto)
  const valorLimpo = valorInput.replace("R$", "").trim().replace(",", ".");

  // Converte o texto limpo para número
  const valor = parseFloat(valorLimpo); 

  if (isNaN(valor) || valor <= 0 || motivo === '') {
    alert("Preencha corretamente o valor e o motivo do suprimento.");
    return;
  }

  // Define o tipo como 'suprimento'
  const suprimento = {
    tipo: 'suprimento', 
    valor: valor, // Salva o número limpo
    motivo: motivo,
    data: new Date().toISOString() // Salva a data no formato correto
  };

  let movimentos = obterDados("movimentosCaixa") || [];
  movimentos.push(suprimento);
  salvarDados("movimentosCaixa", movimentos);

  alert("Suprimento registrado com sucesso.");
  document.getElementById('modal-suprimento').style.display = 'none';
  document.getElementById("codigo-barra").focus();
}
// --- FUNÇÕES DE FIADO (NOVAS) ---

function abrirModalFiado() {
    if (vendaAtual.length === 0) {
        showCustomAlert("Nenhum item na venda para marcar como fiado.", true);
        return;
    }
    
    const clientes = obterDados("clientes") || [];
    const select = document.getElementById("select-cliente-fiado");
    select.innerHTML = '<option value="">Selecione um cliente...</option>'; // Limpa opções

    if (clientes.length === 0) {
        select.innerHTML = '<option value="">Nenhum cliente cadastrado</option>';
    } else {
        clientes.forEach((cliente, index) => {
            select.innerHTML += `<option value="${index}">${cliente.nome} - (${cliente.identificador})</option>`;
        });
    }

    document.getElementById("total-venda-fiado").innerText = `R$ ${totalVenda.toFixed(2)}`;
    fecharModalPagamento(); // Fecha o modal de formas de pagamento
    document.getElementById("modal-selecionar-cliente").style.display = "flex";
}

function fecharModalFiado() {
    document.getElementById("modal-selecionar-cliente").style.display = "none";
    document.getElementById("codigo-barra").focus();
}

function confirmarVendaFiado() {
    const select = document.getElementById("select-cliente-fiado");
    const clienteId = select.value; // Agora pegamos o ID direto do value

    if (clienteId === "") {
        showCustomAlert("Selecione um cliente para continuar.", true);
        return;
    }

    const clientes = obterDados("clientes") || [];
    // Encontra o cliente pelo ID salvo no 'value'
    const clienteSelecionado = clientes.find(c => c.id === clienteId); 

    if (!clienteSelecionado) {
        showCustomAlert("Erro ao encontrar cliente. Tente novamente.", true);
        return;
    }

    // Chama a finalizarVenda modificada, passando os dados do cliente
    finalizarVenda("Fiado", null, null, {
        id: clienteSelecionado.id,
        nome: clienteSelecionado.nome
    });

    fecharModalFiado();
    showCustomAlert(`Venda registrada para ${clienteSelecionado.nome} (Fiado).`, false);
}
// ... (fim da função confirmarDesconto)

// --- FUNÇÕES DE FIADO (NOVAS, COM FILTRO) ---

// Popula a lista de clientes baseado no filtro
function popularListaClientesFiado(filtro = "") {
    const clientes = obterDados("clientes") || [];
    const select = document.getElementById("select-cliente-fiado");
    select.innerHTML = ''; // Limpa opções antigas

    const filtroNormalizado = filtro.toLowerCase().trim();
    const clientesFiltrados = clientes.filter(cliente =>
        cliente.nome.toLowerCase().includes(filtroNormalizado) ||
        cliente.identificador.toLowerCase().includes(filtroNormalizado)
    );

    if (clientesFiltrados.length === 0) {
        select.innerHTML = '<option value="">Nenhum cliente encontrado</option>';
        return;
    }

    select.innerHTML = '<option value="">Selecione um cliente...</option>';
    clientesFiltrados.forEach((cliente) => {
        // O 'value' do option deve ser o ID único do cliente
        select.innerHTML += `<option value="${cliente.id}">${cliente.nome} - (${cliente.identificador})</option>`;
    });
}

// Abre o modal e ativa o filtro
function abrirModalFiado() {
    if (vendaAtual.length === 0) {
        showCustomAlert("Nenhum item na venda para marcar como fiado.", true);
        return;
    }
    
    const filtroInput = document.getElementById("filtro-cliente-fiado");
    filtroInput.value = "";
    popularListaClientesFiado(); // Popula a lista inicial

    // Adiciona o "escutador" de evento ao filtro
    filtroInput.oninput = () => {
        popularListaClientesFiado(filtroInput.value);
    };

    document.getElementById("total-venda-fiado").innerText = `R$ ${totalVenda.toFixed(2)}`;
    fecharModalPagamento(); // Fecha o modal de formas de pagamento
    document.getElementById("modal-selecionar-cliente").style.display = "flex";
    
    setTimeout(() => filtroInput.focus(), 100); 
}

function fecharModalFiado() {
    document.getElementById("modal-selecionar-cliente").style.display = "none";
    document.getElementById("codigo-barra").focus();
}

// ESTA É A FUNÇÃO QUE CAUSA O ERRO (ESTAVA FALTANDO/INCORRETA)
function confirmarVendaFiado() {
    const select = document.getElementById("select-cliente-fiado");
    const clienteId = select.value; // Pega o ID direto do value

    if (clienteId === "") {
        showCustomAlert("Selecione um cliente para continuar.", true);
        return;
    }

    const clientes = obterDados("clientes") || [];
    // Encontra o cliente pelo ID salvo no 'value'
    const clienteSelecionado = clientes.find(c => c.id === clienteId); 

    if (!clienteSelecionado) {
        // Este é o erro que você está vendo. 
        // Acontece porque a lista de clientes não foi carregada corretamente
        // ou a função "find" falhou. Esta versão corrigida deve funcionar.
        showCustomAlert("Erro ao encontrar cliente. Tente novamente.", true);
        return;
    }

    // Chama a finalizarVenda modificada, passando os dados do cliente
    finalizarVenda("Fiado", null, null, {
        id: clienteSelecionado.id,
        nome: clienteSelecionado.nome
    });

    fecharModalFiado();
    showCustomAlert(`Venda registrada para ${clienteSelecionado.nome} (Fiado).`, false);
}


// --- FUNÇÕES DE ALERTA CUSTOMIZADO ---
// (As funções showCustomAlert e fecharCustomAlert devem estar aqui no final)