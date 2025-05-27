import express from 'express'
import supabase from '../supabaseClient.js'

const router = express.Router()

router.post('/register', async (req, res) => {
  const { nome, email, senha } = req.body
  const { data, error } = await supabase
    .from('usuario')
    .insert([{ nome, email, senha }])

  if (error) {
    console.error('Erro detalhado:', error)
    return res.status(400).json({ error: error.message })
  }
  res.status(201).json({ message: 'Usuário cadastrado com sucesso', data })
})

router.post('/login', async (req, res) => {
  const { email, senha } = req.body
  const { data, error } = await supabase
    .from('usuario')
    .select('*')
    .eq('email', email)
    .eq('senha', senha)
    .single()

  if (error || !data) return res.status(401).json({ error: 'Credenciais inválidas' })
  res.json({ message: 'Login realizado com sucesso', usuario: data })
})

export default router