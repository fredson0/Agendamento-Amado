import express from 'express'
import supabase from '../supabaseClient.js'
import { authenticateToken } from '../middlewares/authMiddleware.js'
import { checkAdmin } from '../middlewares/adminMiddleware.js'

const router = express.Router()

// Criar novo agendamento - qualquer usuário autenticado
router.post('/', authenticateToken, async (req, res) => {
  const { id_usuario, id_servico, data, hora, status } = req.body

  if (!id_usuario || !id_servico || !data || !hora) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' })
  }

  try {
    const { data: novoAgendamento, error } = await supabase
      .from('agendamentos')
      .insert([{ id_usuario, id_servico, data, hora, status }])
      .select()

    if (error) {
      console.error('Erro ao criar agendamento:', error)
      return res.status(500).json({ error: 'Erro ao criar agendamento' })
    }

    res.status(201).json({ message: 'Agendamento criado com sucesso', agendamento: novoAgendamento[0] })
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro interno no servidor' })
  }
})

// Listar todos os agendamentos - apenas admins
router.get('/', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('agendamentos').select('*')

    if (error) {
      console.error('Erro ao buscar agendamentos:', error)
      return res.status(500).json({ error: 'Erro ao buscar agendamentos' })
    }

    res.json(data)
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro interno no servidor' })
  }
})

// Buscar agendamento por ID - usuário autenticado (pode ser só o dono ou admin, aqui permito admin)
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params

  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar agendamento:', error)
      return res.status(404).json({ error: 'Agendamento não encontrado' })
    }

    // Se quiser restringir acesso: se não for admin e não for dono, bloqueia
    if (req.user.role !== 'admin' && req.user.id !== data.id_usuario) {
      return res.status(403).json({ error: 'Acesso negado' })
    }

    res.json(data)
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro interno no servidor' })
  }
})

// Atualizar agendamento pelo ID - só admin ou dono pode atualizar
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params
  const { id_servico, data, hora, status } = req.body

  try {
    // Busca agendamento para verificar dono
    const { data: agendamento, error: findError } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('id', id)
      .single()

    if (findError) {
      return res.status(404).json({ error: 'Agendamento não encontrado' })
    }

    // Verifica permissão: admin ou dono
    if (req.user.role !== 'admin' && req.user.id !== agendamento.id_usuario) {
      return res.status(403).json({ error: 'Acesso negado' })
    }

    // Atualiza
    const { data: updated, error } = await supabase
      .from('agendamentos')
      .update({ id_servico, data, hora, status })
      .eq('id', id)
      .select()

    if (error) {
      return res.status(500).json({ error: 'Erro ao atualizar agendamento' })
    }

    res.json({ message: 'Agendamento atualizado com sucesso', agendamento: updated[0] })
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro interno no servidor' })
  }
})

// Deletar agendamento pelo ID - só admin ou dono pode deletar
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params

  try {
    // Busca agendamento para verificar dono
    const { data: agendamento, error: findError } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('id', id)
      .single()

    if (findError) {
      return res.status(404).json({ error: 'Agendamento não encontrado' })
    }

    // Verifica permissão: admin ou dono
    if (req.user.role !== 'admin' && req.user.id !== agendamento.id_usuario) {
      return res.status(403).json({ error: 'Acesso negado' })
    }

    // Deleta
    const { data, error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', id)
      .select()

    if (error) {
      return res.status(500).json({ error: 'Erro ao deletar agendamento' })
    }

    res.json({ message: 'Agendamento deletado com sucesso' })
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro interno no servidor' })
  }
})

export default router
