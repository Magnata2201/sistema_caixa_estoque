// Inicializa o localStorage com array vazio se estiver inválido
function inicializarLocalStorage() {
  try {
    const dados = JSON.parse(localStorage.getItem("impressoras"));
    if (!Array.isArray(dados)) {
      localStorage.setItem("impressoras", JSON.stringify([]));
    }
  } catch {
    localStorage.setItem("impressoras", JSON.stringify([]));
  }
}

// Carrega e exibe os registros na tabela
function carregarRegistros() {
  const tabela = document.querySelector("#registros tbody");
  tabela.innerHTML = "";

  let registros = [];

  try {
    const dados = JSON.parse(localStorage.getItem("impressoras"));
    if (Array.isArray(dados)) {
      registros = dados;
    } else {
      throw new Error("Formato inválido");
    }
  } catch (e) {
    registros = [];
    console.warn("Registros corrompidos ou inválidos. Resetando...");
    localStorage.setItem("impressoras", JSON.stringify([]));
  }

  if (registros.length === 0) {
    const row = tabela.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 6;
    cell.textContent = "Nenhum registro encontrado.";
    cell.style.textAlign = "center";
    return;
  }

  registros.forEach((r, index) => {
    const row = tabela.insertRow();

    row.innerHTML = `
      <td>${r.modelo}</td>
      <td>${r.cliente}</td>
      <td>${r.pavilhao}</td>
      <td>${r.box}</td>
      <td>${r.data}</td>
      <td>
        <button class="action-btn edit-btn" onclick="editarRegistro(${index})">Editar</button>
        <button class="action-btn delete-btn" onclick="excluirRegistro(${index})">Excluir</button>
      </td>
    `;
  });
}

// Salva novo registro ou atualiza existente
function salvarRegistro(event) {
  event.preventDefault();

  const modelo = document.getElementById("modelo").value.trim();
  const cliente = document.getElementById("cliente").value.trim();
  const pavilhao = document.getElementById("pavilhao").value.trim();
  const box = document.getElementById("box").value.trim();
  const data = document.getElementById("data").value;
  const editIndex = document.getElementById("editIndex").value;

  if (!modelo || !cliente || !pavilhao || !box || !data) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  const registros = JSON.parse(localStorage.getItem("impressoras")) || [];

  if (editIndex !== "") {
    registros[editIndex] = { modelo, cliente, pavilhao, box, data };
  } else {
    registros.push({ modelo, cliente, pavilhao, box, data });
  }

  localStorage.setItem("impressoras", JSON.stringify(registros));
  document.getElementById("printerForm").reset();
  document.getElementById("editIndex").value = "";
  carregarRegistros();
}

// Preenche formulário para edição
function editarRegistro(index) {
  const registros = JSON.parse(localStorage.getItem("impressoras")) || [];
  const r = registros[index];

  document.getElementById("modelo").value = r.modelo;
  document.getElementById("cliente").value = r.cliente;
  document.getElementById("pavilhao").value = r.pavilhao;
  document.getElementById("box").value = r.box;
  document.getElementById("data").value = r.data;
  document.getElementById("editIndex").value = index;
}

// Exclui registro após confirmação
function excluirRegistro(index) {
  if (!confirm("Tem certeza que deseja excluir este registro?")) return;

  const registros = JSON.parse(localStorage.getItem("impressoras")) || [];
  registros.splice(index, 1);
  localStorage.setItem("impressoras", JSON.stringify(registros));
  carregarRegistros();
}

// Inicialização
window.onload = () => {
  inicializarLocalStorage();
  carregarRegistros();

  document.getElementById("printerForm").addEventListener("submit", salvarRegistro);
};
// No impressoras.js, dentro de carregarRegistros()
// ...
registros.forEach((r, index) => {
  const row = tabela.insertRow();

  row.innerHTML = `
    <td data-label="Modelo">${r.modelo}</td>
    <td data-label="Cliente">${r.cliente}</td>
    <td data-label="Pavilhão">${r.pavilhao}</td>
    <td data-label="Box">${r.box}</td>
    <td data-label="Data">${r.data}</td>
    <td data-label="Ações">
      <button class="action-btn edit-btn" onclick="editarRegistro(${index})">Editar</button>
      <button class="action-btn delete-btn" onclick="excluirRegistro(${index})">Excluir</button>
    </td>
  `;
});
// ...