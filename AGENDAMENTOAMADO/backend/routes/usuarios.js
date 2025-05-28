import express from 'express'
import bcrypt from 'bcrypt'
import supabase from '../supabaseClient.js'

const router = express.Router()

router.post('/usuarios', async (req, res) => {
  const { nome, email, senha, role } = req.body

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' })
  }

  try {
    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(senha, 10)

    // Role padrão é 'user', mas se voce quiser colocar 'admin" muda
    const userRole = role === 'admin' ? 'admin' : 'user'

    const { data, error } = await supabase
      .from('usuarios')
      .insert([{ nome, email, senha: hashedPassword, role: userRole }])
      .select()

    if (error) {
      console.error('Erro ao cadastrar usuário:', error)
      return res.status(500).json({ error: 'Erro ao cadastrar usuário' })
    }

    res.status(201).json({ message: 'Usuário criado com sucesso', usuario: data[0] })
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro interno ao cadastrar usuário' })
  }
})

export default router
