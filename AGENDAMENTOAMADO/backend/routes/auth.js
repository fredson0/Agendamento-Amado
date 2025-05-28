import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import supabase from '../supabaseClient.js'

const router = express.Router()

// ROTA DE CADASTRO
router.post('/register', async (req, res) => {
  const { nome, email, senha, role } = req.body

  // Validação simples do role
  const validRoles = ['user', 'admin']
  const userRole = validRoles.includes(role) ? role : 'user'

  try {
    // Verifica se o email já está cadastrado
    const { data: existente, error: errorExistente } = await supabase
      .from('usuario')
      .select('*')
      .eq('email', email)
      .single()

    if (errorExistente === null && existente) {
      return res.status(409).json({ error: 'Email já cadastrado' })
    }

    // Gera hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10)

    // Insere novo usuário no banco e retorna os dados
    const { data, error } = await supabase
      .from('usuario')
      .insert([{ nome, email, senha: hashedPassword, role: userRole }])
      .select()

    if (error) {
      console.error('Erro ao inserir:', error)
      return res.status(400).json({ error: error.message })
    }

    res.status(201).json({ message: 'Usuário cadastrado com sucesso', data })
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro no servidor' })
  }
})

// ROTA DE LOGIN
router.post('/login', async (req, res) => {
  const { email, senha } = req.body

  try {
    // Busca usuário pelo email
    const { data: usuario, error } = await supabase
      .from('usuario')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !usuario) {
      return res.status(401).json({ error: 'Email ou senha inválidos' })
    }

    // Compara senha recebida com hash do banco
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha)

    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Email ou senha inválidos' })
    }

    // Gera token JWT incluindo role
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, role: usuario.role },
      process.env.JWT_SECRET,
      { expiresIn: '23h' }
    )

    // Remove a senha do objeto usuário antes de retornar
    const { senha: _, ...usuarioSemSenha } = usuario

    res.json({ message: 'Login realizado com sucesso', token, usuario: usuarioSemSenha })
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro no servidor' })
  }
})

export default router
