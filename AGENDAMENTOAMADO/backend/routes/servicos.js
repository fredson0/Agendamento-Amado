import express from 'express'
import supabase from '../supabaseClient.js'
import { authenticateToken } from '../middlewares/authMiddleware.js'
import { checkAdmin } from '../middlewares/adminMiddleware.js'

const router = express.Router()

// Listar todos os serviços - acesso público
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('servicos')
      .select('*')
      .order('nome_serv', { ascending: true })

    if (error) {
      console.error('Erro ao buscar serviços:', error)
      return res.status(500).json({ error: 'Erro ao buscar serviços' })
    }

    res.json(data)
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro interno no servidor' })
  }
})

// Buscar serviço por ID - acesso público
router.get('/:id', async (req, res) => {
  const { id } = req.params

  try {
    const { data, error } = await supabase
      .from('servicos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar serviço:', error)
      return res.status(404).json({ error: 'Serviço não encontrado' })
    }

    res.json(data)
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro interno no servidor' })
  }
})

// Criar um novo serviço - apenas admin
router.post('/', authenticateToken, checkAdmin, async (req, res) => {
  const { nome_serv, descricao } = req.body

  if (!nome_serv || nome_serv.trim() === '') {
    return res.status(400).json({ error: 'Campo nome_serv é obrigatório' })
  }

  try {
    const { data, error } = await supabase
      .from('servicos')
      .insert([{ nome_serv: nome_serv.trim(), descricao }])
      .select()

    if (error) {
      console.error('Erro ao criar serviço:', error)
      return res.status(500).json({ error: 'Erro ao criar serviço' })
    }

    res.status(201).json({ message: 'Serviço criado com sucesso', servico: data[0] })
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro interno no servidor' })
  }
})

// Editar serviço pelo id - protegido para admins
router.put('/:id', authenticateToken, checkAdmin, async (req, res) => {
  const { id } = req.params
  const { nome_serv, descricao } = req.body

  if (!nome_serv || nome_serv.trim() === '') {
    return res.status(400).json({ error: 'Campo nome_serv é obrigatório para atualização' })
  }

  try {
    const { data, error } = await supabase
      .from('servicos')
      .update({ nome_serv: nome_serv.trim(), descricao })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Erro ao atualizar serviço:', error)
      return res.status(500).json({ error: 'Erro ao atualizar serviço' })
    }

    if (data.length === 0) {
      return res.status(404).json({ error: 'Serviço não encontrado' })
    }

    res.json({ message: 'Serviço atualizado com sucesso', servico: data[0] })
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro interno no servidor' })
  }
})

// Deletar serviço pelo id - protegido para admins
router.delete('/:id', authenticateToken, checkAdmin, async (req, res) => {
  const { id } = req.params

  try {
    const { data, error } = await supabase
      .from('servicos')
      .delete()
      .eq('id', id)
      .select()

    if (error) {
      console.error('Erro ao deletar serviço:', error)
      return res.status(500).json({ error: 'Erro ao deletar serviço' })
    }

    if (data.length === 0) {
      return res.status(404).json({ error: 'Serviço não encontrado' })
    }

    res.json({ message: 'Serviço deletado com sucesso' })
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro interno no servidor' })
  }
})

export default router