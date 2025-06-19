// FORÇAR API_URL CORRETO
const API_URL = 'http://127.0.0.1:3001';

// Verificação de segurança
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  console.warn('ATENÇÃO: Página não está sendo servida do localhost!');
}

console.log('=== CONFIGURAÇÃO DA API ===');
console.log('API_URL definido como:', API_URL);
console.log('Window location:', window.location.href);
console.log('Hostname:', window.location.hostname);

// Helper: get token
function getToken() {
  return localStorage.getItem('token');
}

// Helper: set token
function setToken(token) {
  localStorage.setItem('token', token);
}

// Helper: remove token
function removeToken() {
  localStorage.removeItem('token');
}

// Função para atualizar o menu de navegação
function updateNavMenu() {
  const nav = document.querySelector('nav ul');
  if (!nav) return;
  const userEmail = localStorage.getItem('userEmail');
  const token = localStorage.getItem('token');
  // Remove botões duplicados
  nav.querySelectorAll('.welcome-button, .logout-option').forEach(e => e.parentElement.remove());
  if (token && userEmail) {
    // Usuário logado: mostra botão Bem-vindo e Sair
    const li = document.createElement('li');
    li.className = 'relative';
    const welcomeButton = document.createElement('button');
    welcomeButton.textContent = `Bem-vindo, ${userEmail}`;
    welcomeButton.className = 'welcome-button text-white bg-purple-500 px-4 py-2 rounded-lg transition hover:bg-purple-600 cursor-pointer';
    const logoutOption = document.createElement('button');
    logoutOption.textContent = 'Sair';
    logoutOption.className = 'logout-option absolute bg-red-500 text-white px-4 py-2 rounded-lg mt-2 transition hover:bg-red-600 cursor-pointer';
    logoutOption.style.right = '0';
    logoutOption.style.top = '100%';
    logoutOption.style.display = 'none';
    welcomeButton.addEventListener('mouseenter', () => { logoutOption.style.display = 'block'; });
    welcomeButton.addEventListener('mouseleave', () => { setTimeout(() => { if (!logoutOption.matches(':hover')) logoutOption.style.display = 'none'; }, 200); });
    logoutOption.addEventListener('mouseenter', () => { logoutOption.style.display = 'block'; });
    logoutOption.addEventListener('mouseleave', () => { logoutOption.style.display = 'none'; });
    logoutOption.addEventListener('click', () => { window.logout(); });
    li.appendChild(welcomeButton);
    li.appendChild(logoutOption);
    nav.appendChild(li);
    // Remove links de login/cadastro
    nav.querySelectorAll('a[href="login.html"], a[href="cadastro.html"]').forEach(e => e.parentElement.remove());
  } else {
    // Se não logado, garantir que links de login/cadastro existam
    if (!nav.querySelector('a[href="login.html"]')) {
      const loginLi = document.createElement('li');
      loginLi.innerHTML = `<a href="login.html" class="hover:border-b-4 hover:border-purple-400 pb-1 transition hover:text-white cursor-pointer">Entrar</a>`;
      nav.appendChild(loginLi);
    }
    if (!nav.querySelector('a[href="cadastro.html"]')) {
      const cadastroLi = document.createElement('li');
      cadastroLi.innerHTML = `<a href="cadastro.html" class="hover:border-b-4 hover:border-purple-400 pb-1 transition hover:text-white cursor-pointer">Cadastro</a>`;
      nav.appendChild(cadastroLi);
    }
  }
}

// Atualizar menu ao carregar página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateNavMenu);
} else {
  updateNavMenu();
}

// Atualizar menu após login/logout
window.updateNavMenu = updateNavMenu;

// LOGIN
if (document.getElementById('login-form')) {
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const senha = document.getElementById('password').value;
    try {
      const res = await fetch('http://127.0.0.1:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        localStorage.setItem('userEmail', data.usuario.email);
        localStorage.setItem('userName', data.usuario.nome);
        window.updateNavMenu && window.updateNavMenu();
        window.location.href = 'meus-agendamentos.html'; // Redireciona direto para Meus Agendamentos
      } else {
        alert(data.error || 'Falha no login.');
      }
    } catch (err) {
      alert('Erro de conexão.');
    }
  });
}

// CADASTRO
if (document.getElementById('register-form')) {
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('password').value;
    try {
      const res = await fetch('http://127.0.0.1:3001/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Cadastro realizado! Faça login.');
        window.location.href = 'login.html';
      } else {
        alert(data.error || 'Erro no cadastro.');
      }
    } catch (err) {
      alert('Erro de conexão.');
    }
  });
}

// LISTAR SERVIÇOS
if (document.getElementById('servicos-list')) {
  console.log('Tentando listar serviços...');
  document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('servicos-list');
    try {
      const res = await fetch('http://127.0.0.1:3001/servicos');
      const data = await res.json();
      if (res.ok) {
        container.innerHTML = data.map(s => `
          <div class="mb-4 p-4 bg-white/20 rounded-lg shadow-md">
            <h3 class="font-bold text-lg text-purple-200">${s.nome_serv}</h3>
            <p class="text-purple-100">${s.descricao}</p>
          </div>
        `).join('');
      } else {
        container.innerHTML = '<p>Erro ao carregar serviços.</p>';
      }
    } catch {
      container.innerHTML = '<p>Erro de conexão.</p>';
    }
  });
}

// POPULAR SERVIÇOS NO FORMULÁRIO DE AGENDAMENTO
function popularServicosSelect() {
  console.log('Tentando popular select de serviços...');
  const select = document.getElementById('servico');
  if (!select) {
    console.error('Select de serviços não encontrado no DOM!');
    return;
  }
  fetch('http://127.0.0.1:3001/servicos')
    .then(res => {
      if (!res.ok) throw new Error('Erro HTTP ao buscar serviços');
      return res.json();
    })
    .then(data => {
      console.log('Dados recebidos para o select:', data);
      if (!Array.isArray(data) || data.length === 0) {
        select.innerHTML = '<option value="">Nenhum serviço disponível</option>';
        console.warn('Nenhum serviço retornado da API.');
        return;
      }
      select.innerHTML = '<option value="" disabled selected>Selecione um serviço</option>';
      data.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id_serv;
        opt.textContent = s.nome_serv;
        select.appendChild(opt);
      });
      console.log('Serviços carregados no select:', data);
    })
    .catch((err) => {
      select.innerHTML = '<option value="">Erro ao carregar serviços</option>';
      console.error('Erro ao buscar serviços:', err);
    });
}

// Garante execução após DOM estar pronto
function onReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

onReady(() => {
  const select = document.getElementById('servico');
  if (select) {
    popularServicosSelect();
  }
});

// AGENDAMENTO
document.addEventListener('DOMContentLoaded', () => {
  const agendamentoForm = document.getElementById('agendamento-form') || document.getElementById('formAgendamento');
  console.log('Procurando formulário de agendamento...');
  console.log('Form encontrado:', agendamentoForm);
  
  if (agendamentoForm) {
    console.log('✅ Formulário de agendamento encontrado:', agendamentoForm);
    
    agendamentoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('=== INICIANDO AGENDAMENTO ===');
    console.log('Submit do formulário de agendamento disparado!');
    
    const id_servico = document.getElementById('servico').value;
    const data = document.getElementById('data').value;
    const hora = document.getElementById('hora').value;
    const token = getToken();
    
    console.log('Dados do agendamento:', { id_servico, data, hora });
    console.log('Token disponível:', !!token);
    console.log('Token valor (primeiros 20 chars):', token ? token.substring(0, 20) + '...' : 'null');
    console.log('API_URL:', API_URL);
    
    if (!token) {
      console.error('Sem token! Redirecionando para login...');
      alert('Você precisa estar logado para fazer um agendamento.');
      window.location.href = 'login.html';
      return;
    }
    
    if (!id_servico || !data || !hora) {
      console.error('Campos obrigatórios faltando:', { id_servico, data, hora });
      alert('Por favor, preencha todos os campos.');
      return;
    }
    
    const requestData = { 
      id_servico: parseInt(id_servico), 
      data, 
      hora, 
      status: 'agendado' 
    };
      console.log('Dados que serão enviados:', requestData);
    
    // VERIFICAÇÃO DE SEGURANÇA - FORÇAR URL CORRETO
    const finalURL = 'http://127.0.0.1:3001/agendamentos';
    console.log('URL FORÇADO:', finalURL);
    console.log('API_URL original:', API_URL);
    
    if (!finalURL.includes('127.0.0.1:3001')) {
      console.error('ERRO: URL incorreto detectado!');
      alert('Erro de configuração detectado. Recarregue a página.');
      return;
    }
    
    try {
      console.log('Fazendo requisição para URL FORÇADO:', finalURL);
      
      const res = await fetch(finalURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(requestData)
      });
      
      console.log('Status da resposta:', res.status);
      console.log('Status text:', res.statusText);
      console.log('Headers da resposta:', Array.from(res.headers.entries()));
      
      const dataRes = await res.json();
      console.log('Resposta do servidor:', dataRes);
      
      if (res.ok) {
        console.log('Agendamento criado com sucesso!');
        alert('Agendamento realizado com sucesso!');
        // Limpar o formulário
        agendamentoForm.reset();
        // Redirecionar para meus agendamentos
        window.location.href = 'meus-agendamentos.html';
      } else {
        console.error('Erro na resposta:', dataRes);
        alert('Erro ao agendar: ' + (dataRes.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro de conexão completo:', error);
      console.error('Stack trace:', error.stack);
      alert('Erro de conexão: ' + error.message);
    }  });
  } else {
    console.error('❌ Formulário de agendamento NÃO encontrado!');
  }
});

// LISTAR MEUS AGENDAMENTOS
if (document.getElementById('agendamentos-list')) {
  document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('agendamentos-list');
    const token = getToken();
    
    console.log('Iniciando busca de agendamentos...');
    console.log('Token disponível:', !!token);
    
    if (!token) {
      container.innerHTML = '<p>Você precisa estar logado para ver seus agendamentos.</p>';
      return;
    }
      try {      const finalURL = 'http://127.0.0.1:3001/agendamentos/meus';
      console.log('Fazendo requisição para URL FORÇADO:', finalURL);
      const res = await fetch(finalURL, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      console.log('Status da resposta:', res.status);
      
      const data = await res.json();
      console.log('Dados recebidos:', data);
      
      if (res.ok) {
        if (data.length === 0) {
          container.innerHTML = '<p>Nenhum agendamento encontrado.</p>';        } else {
          console.log('Renderizando agendamentos:', data);
          container.innerHTML = data.map(a => {
            console.log('Processando agendamento:', a);
            const nomeServico = a.servicos?.nome_serv || a.servicos?.descricao || 'Serviço não informado';
            console.log('Nome do serviço:', nomeServico);
            
            return `
            <div class="mb-4 p-4 bg-white/20 rounded-lg shadow-md">
              <p><strong>Serviço:</strong> ${nomeServico}</p>
              <p><strong>Data:</strong> ${a.data}</p>
              <p><strong>Hora:</strong> ${a.hora}</p>
              <p><strong>Status:</strong> ${a.status}</p>
            </div>
          `;
          }).join('');
        }
      } else {
        console.error('Erro na resposta:', data);
        container.innerHTML = '<p>Erro ao carregar agendamentos: ' + (data.error || 'Erro desconhecido') + '</p>';
      }    } catch (error) {
      console.error('Erro de conexão:', error);
      container.innerHTML = '<p>Erro de conexão.</p>';
    }
  });
}

// CONTATO
if (document.getElementById('contato-form')) {
  document.getElementById('contato-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const assunto = document.getElementById('assunto').value;
    const mensagem = document.getElementById('mensagem').value;
    const categoria = document.getElementById('categoria')?.value;
    try {
      const res = await fetch(`${API_URL}/contato`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + getToken()
        },
        body: JSON.stringify({ assunto, mensagem, categoria })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Mensagem enviada!');
        document.getElementById('contato-form').reset();
      } else {
        alert(data.error || 'Erro ao enviar mensagem.');
      }
    } catch {
      alert('Erro de conexão.');
    }
  });
}

// LOGOUT (pode ser chamado de qualquer lugar)
window.logout = function() {
  removeToken();
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  window.updateNavMenu && window.updateNavMenu();
  window.location.href = 'login.html';
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('Acolhe+ está pronto!');
});