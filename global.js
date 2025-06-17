document.addEventListener('DOMContentLoaded', () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const userEmail = localStorage.getItem('userEmail');

  const nav = document.querySelector('nav ul');

  if (nav) {
    // Remover duplicações existentes
    const existingWelcomeButton = nav.querySelector('.welcome-button');
    const existingLogoutOption = nav.querySelector('.logout-option');
    const existingLoginLink = nav.querySelector('li a[href="login.html"]');
    const existingCadastroLink = nav.querySelector('li a[href="cadastro.html"]');

    if (existingWelcomeButton) existingWelcomeButton.parentElement.remove();
    if (existingLogoutOption) existingLogoutOption.parentElement.remove();
    if (existingLoginLink) existingLoginLink.parentElement.remove();
    if (existingCadastroLink) existingCadastroLink.parentElement.remove();

    if (isLoggedIn) {
      // Criar botão "Bem-vindo"
      const li = document.createElement('li');
      li.className = 'relative'; // Classe para posicionamento
      const welcomeButton = document.createElement('button');
      welcomeButton.textContent = `Bem-vindo, ${userEmail}`;
      welcomeButton.className = 'welcome-button text-white bg-purple-500 px-4 py-2 rounded-lg transition hover:bg-purple-600 cursor-pointer';

      // Dropdown para logout
      const logoutOption = document.createElement('button');
      logoutOption.textContent = 'Sair';
      logoutOption.className = 'logout-option absolute bg-red-500 text-white px-4 py-2 rounded-lg mt-2 transition hover:bg-red-600 cursor-pointer';
      logoutOption.style.right = '0'; // Posiciona à direita
      logoutOption.style.top = '100%'; // Posiciona abaixo do botão "Bem-vindo"
      logoutOption.style.display = 'none'; // Inicialmente escondido

      // Mostrar o botão "Sair" ao passar o mouse sobre o botão "Bem-vindo"
      welcomeButton.addEventListener('mouseenter', () => {
        logoutOption.style.display = 'block';
      });

      // Esconder o botão "Sair" ao sair do botão "Bem-vindo"
      welcomeButton.addEventListener('mouseleave', () => {
        setTimeout(() => {
          if (!logoutOption.matches(':hover')) {
            logoutOption.style.display = 'none';
          }
        }, 200); // Delay para permitir o hover no botão "Sair"
      });

      // Garantir que o botão "Sair" permaneça visível enquanto o mouse estiver sobre ele
      logoutOption.addEventListener('mouseenter', () => {
        logoutOption.style.display = 'block';
      });

      logoutOption.addEventListener('mouseleave', () => {
        logoutOption.style.display = 'none';
      });

      logoutOption.addEventListener('click', () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        window.location.href = 'login.html'; // Redirecionar para a página de login
      });

      li.appendChild(welcomeButton);
      li.appendChild(logoutOption);
      nav.appendChild(li);
    } else {
      // Caso o usuário não esteja logado, garantir que as abas de Login e Cadastro estejam visíveis
      const loginLi = document.createElement('li');
      loginLi.innerHTML = `<a href="login.html" class="hover:border-b-4 hover:border-purple-400 pb-1 transition hover:text-white cursor-pointer">Entrar</a>`;
      nav.appendChild(loginLi);

      const cadastroLi = document.createElement('li');
      cadastroLi.innerHTML = `<a href="cadastro.html" class="hover:border-b-4 hover:border-purple-400 pb-1 transition hover:text-white cursor-pointer">Cadastro</a>`;
      nav.appendChild(cadastroLi);
    }
  }
});

document.getElementById('formCadastro').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('nome').value;
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  const response = await fetch('http://<IP-PUBLICO-EC2>:3000/cadastro', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nome, email, senha }),
  });

  if (response.ok) {
    alert('Usuário cadastrado com sucesso!');
    window.location.href = 'login.html';
  } else {
    alert('Erro ao cadastrar usuário.');
  }
});

document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  try {
    const response = await fetch('http://<IP-PUBLICO-EC2>:3000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, senha }),
    });

    if (!response.ok) {
      throw new Error('Email ou senha inválidos.');
    }

    const data = await response.json();
    localStorage.setItem('isLoggedIn', true); // Armazena o estado de login
    localStorage.setItem('userEmail', email); // Armazena o email do usuário
    localStorage.setItem('usuarioId', data.id); // Armazena o ID do usuário
    alert('Login realizado com sucesso!');
    window.location.href = 'meus-agendamentos.html'; // Redireciona para "Meus Agendamentos"
  } catch (error) {
    console.error(error);
    alert('Erro ao fazer login.');
  }
});

document.getElementById('formAgendamento').addEventListener('submit', async function (e) {
  e.preventDefault();

  const nome = document.getElementById('nome').value;
  const email = document.getElementById('email').value;
  const data = document.getElementById('data').value;
  const hora = document.getElementById('hora').value;

  const response = await fetch('http://<IP-PUBLICO-EC2>:3000/agendamento', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ usuarioId: 1, data, horario: hora }),
  });

  if (response.ok) {
    alert(`✅ Agendamento confirmado para ${nome} em ${data} às ${hora}.`);
    this.reset();
  } else {
    alert('Erro ao criar agendamento.');
  }
});