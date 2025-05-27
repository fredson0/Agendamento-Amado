import express from 'express'
import supabase from '../supabaseClient.js'
import { authenticateToken } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Criar um novo serviço (ex: atendimento psicológico, jurídico, etc)
router.post('/', authenticateToken, async (req, res) => {
  const { nome, descricao } = req.body

  if (!nome) {
    return res.status(400).json({ error: 'Campo nome é obrigatório' })
  }

  const { data, error } = await supabase
    .from('servicos')
    .insert([{ nome, descricao }])
    .select() // Para retornar o registro inserido

  if (error) {
    console.error('Erro ao criar serviço:', error)
    return res.status(500).json({ error: 'Erro ao criar serviço' })
  }

  res.status(201).json({ message: 'Serviço criado com sucesso', servico: data[0] })
})

// Listar todos os serviços
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('servicos').select('*')

  if (error) {
    console.error('Erro ao buscar serviços:', error)
    return res.status(500).json({ error: 'Erro ao buscar serviços' })
  }

  res.json(data)
})

export default router
