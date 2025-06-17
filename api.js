const API_URL = "http://<IP-PUBLICO-EC2>:3000"; // Substitua pelo IP público da instância EC2

// Função para cadastrar um usuário
export const cadastrarUsuario = async (nome, email, senha) => {
  try {
    const response = await fetch(`${API_URL}/cadastro`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nome, email, senha }),
    });

    if (!response.ok) {
      throw new Error("Erro ao cadastrar usuário");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro:", error);
    throw error;
  }
};

// Função para criar um agendamento
export const criarAgendamento = async (usuarioId, data, horario) => {
  try {
    const response = await fetch(`${API_URL}/agendamento`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ usuarioId, data, horario }),
    });

    if (!response.ok) {
      throw new Error("Erro ao criar agendamento");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro:", error);
    throw error;
  }
};