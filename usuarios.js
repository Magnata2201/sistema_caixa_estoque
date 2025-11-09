// Funções para abrir os modais
function abrirModalCriarUsuario() {
  document.getElementById('modalCriarUsuario').style.display = 'flex';
}

function abrirModalEditarUsuario() {
  document.getElementById('modalEditarUsuario').style.display = 'flex';
}

function abrirModalExcluirUsuario() {
  document.getElementById('modalExcluirUsuario').style.display = 'flex';
}

function abrirModalListarUsuarios() {
  document.getElementById('modalListarUsuarios').style.display = 'flex';
  listarUsuarios();
}

// Função para fechar os modais
function fecharModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

// Criar usuário
function criarUsuario() {
  const nome = document.getElementById('nomeUsuario').value.trim();
  const senha = document.getElementById('senhaUsuario').value.trim();

  if (!nome || !senha) {
    alert('Por favor, preencha todos os campos.');
    return;
  }

  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  // Verificar se usuário já existe
  const usuarioExistente = usuarios.find(u => u.usuario === nome);
  if (usuarioExistente) {
    alert('Usuário já existe.');
    return;
  }

  usuarios.push({ usuario: nome, senha });
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
  alert('Usuário criado com sucesso!');

  // Limpar campos
  document.getElementById('nomeUsuario').value = '';
  document.getElementById('senhaUsuario').value = '';

  fecharModal('modalCriarUsuario');
}

// Editar usuário
function editarUsuario() {
  const nome = document.getElementById('nomeUsuarioEditar').value.trim();
  const novaSenha = document.getElementById('senhaUsuarioEditar').value.trim();

  if (!nome || !novaSenha) {
    alert('Preencha todos os campos.');
    return;
  }

  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  const usuario = usuarios.find(u => u.usuario === nome);
  if (usuario) {
    usuario.senha = novaSenha;
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    alert('Senha alterada com sucesso!');
    fecharModal('modalEditarUsuario');
  } else {
    alert('Usuário não encontrado.');
  }
}

// Excluir usuário
function excluirUsuario() {
  const nome = document.getElementById('nomeUsuarioExcluir').value.trim();

  if (!nome) {
    alert('Informe o nome do usuário.');
    return;
  }

  if (nome === "admin") {
    alert("O usuário admin não pode ser excluído.");
    return;
  }

  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  const novosUsuarios = usuarios.filter(u => u.usuario !== nome);

  if (novosUsuarios.length === usuarios.length) {
    alert('Usuário não encontrado.');
    return;
  }

  localStorage.setItem("usuarios", JSON.stringify(novosUsuarios));
  alert('Usuário excluído com sucesso!');
  fecharModal('modalExcluirUsuario');
}

// Listar usuários
function listarUsuarios() {
  const container = document.getElementById('user-list');
  container.innerHTML = '';

  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  usuarios.forEach(u => {
    const div = document.createElement('div');
    div.textContent = `Usuário: ${u.usuario}`;
    container.appendChild(div);
  });
}
