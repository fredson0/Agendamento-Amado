const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();
app.use(express.json());

// Configuração do banco de dados
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    process.exit(1);
  }
  console.log('Conectado ao banco de dados!');
});


// Endpoint de cadastro de usuários
app.post('/cadastro', async (req, res) => {
  const { nome, email, senha } = req.body;

  // Verificar se o email já existe
  const checkEmailQuery = 'SELECT * FROM usuarios WHERE email = ?';
  db.query(checkEmailQuery, [email], async (err, result) => {
    if (err) {
      console.error('Erro ao verificar email:', err);
      return res.status(500).send('Erro ao verificar email.');
    }

    if (result.length > 0) {
      return res.status(400).send('Email já está cadastrado.');
    }

    // Se o email não existir, cadastrar o usuário
    const hashedSenha = await bcrypt.hash(senha, 10);
    const insertQuery = 'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)';
    db.query(insertQuery, [nome, email, hashedSenha], (err, result) => {
      if (err) {
        console.error('Erro ao cadastrar usuário:', err);
        return res.status(500).send('Erro ao cadastrar usuário.');
      }
      res.status(201).send('Usuário cadastrado com sucesso!');
    });
  });
});

// Endpoint de agendamento
app.post('/agendamento', (req, res) => {
  const { usuarioId, data, horario } = req.body;

  const query = 'INSERT INTO agendamentos (usuario_id, data, horario) VALUES (?, ?, ?)';
  db.query(query, [usuarioId, data, horario], (err, result) => {
    if (err) {
      console.error('Erro ao criar agendamento:', err);
      return res.status(500).send('Erro ao criar agendamento.');
    }

    res.status(201).send('Agendamento criado com sucesso!');
  });
});
app.get('/agendamentos', (req, res) => {
  const { usuarioId } = req.query;

  if (!usuarioId) {
    return res.status(400).send('ID do usuário é obrigatório.');
  }

  const query = 'SELECT * FROM agendamentos WHERE usuario_id = ?';
  db.query(query, [usuarioId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar agendamentos:', err);
      return res.status(500).send('Erro ao buscar agendamentos.');
    }
    res.status(200).json(results);
  });
});
// Endpoint para testar conexão com o banco de dados
app.get('/test-db', (req, res) => {
  db.query('SELECT 1', (err, result) => {
    if (err) {
      console.error('Erro ao conectar ao banco de dados:', err);
      return res.status(500).send('Erro ao conectar ao banco de dados.');
    }
    res.status(200).send('Conexão com o banco de dados está funcionando!');
  });
});
const jwt = require('jsonwebtoken');

// Endpoint de login
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  const query = 'SELECT * FROM usuarios WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err);
      return res.status(500).send('Erro ao buscar usuário.');
    }

    if (results.length === 0) {
      return res.status(401).send('Email ou senha inválidos.');
    }

    const usuario = results[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).send('Email ou senha inválidos.');
    }

    // Gerar token JWT
    const token = jwt.sign({ id: usuario.id, email: usuario.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
  });
});

// Middleware para verificar o token
const autenticar = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).send('Acesso negado.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).send('Token inválido.');
  }
};

// Endpoint protegido para buscar agendamentos
app.get('/agendamentos', (req, res) => {
  const { usuarioId } = req.query; // Receber o ID do usuário via query string

  if (!usuarioId) {
    return res.status(400).send('ID do usuário é obrigatório.');
  }

  const query = 'SELECT * FROM agendamentos WHERE usuario_id = ?';
  db.query(query, [usuarioId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar agendamentos:', err);
      return res.status(500).send('Erro ao buscar agendamentos.');
    }
    res.status(200).json(results);
  });
});
// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});