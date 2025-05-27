import express from 'express'
import supabase from '../supabaseClient.js'
import { authenticateToken } from '../middlewares/authMiddleware.js'

const router = express.Router()

// ROTA: Listar agendamentos do usuário logado
router.get('/minhas-sessoes', authenticateToken, async (req, res) => {
  const id_usuario = req.user.id

  const { data, error } = await supabase
    .from('agendamentos')
    .select('*')
    .eq('id_usuario', id_usuario)

  if (error) {
    console.error('Erro ao buscar agendamentos:', error)
    return res.status(500).json({ error: 'Erro ao buscar agendamentos' })
  }

  res.status(200).json({ agendamentos: data })
})

// ROTA: Criar um novo agendamento
router.post('/', authenticateToken, async (req, res) => {
  const { id_servico, data, hora } = req.body
  const id_usuario = req.user.id

  // Validação de campos obrigatórios
  if (!id_servico || !data || !hora) {
    return res.status(400).json({ error: 'Campos obrigatórios: id_servico, data, hora' })
  }

  try {
    // Importante: usar .select() após insert para retornar os dados inseridos
    const { data: novoAgendamento, error } = await supabase
      .from('agendamentos')
      .insert([{ id_usuario, id_servico, data, hora, status: 'pendente' }])
      .select()

    if (error) {
      console.error('Erro ao criar agendamento:', error)
      return res.status(500).json({ error: 'Erro ao criar agendamento' })
    }

    res.status(201).json({
      message: 'Agendamento criado com sucesso',
      agendamento: novoAgendamento[0]
    })
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro interno no servidor' })
  }
})

// ROTA: Cancelar um agendamento
router.put('/:id/cancelar', authenticateToken, async (req, res) => {
  const id_agendamento = req.params.id
  const id_usuario = req.user.id

  try {
    // Verifica se o agendamento existe e pertence ao usuário
    const { data: agendamentoExistente, error: findError } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('id', id_agendamento)
      .eq('id_usuario', id_usuario)
      .single()

    if (findError || !agendamentoExistente) {
      return res.status(404).json({ error: 'Agendamento não encontrado' })
    }

    // Atualiza o status para cancelado
    const { data, error } = await supabase
      .from('agendamentos')
      .update({ status: 'cancelado' })
      .eq('id', id_agendamento)
      .eq('id_usuario', id_usuario)
      .select()

    if (error) {
      console.error('Erro ao cancelar agendamento:', error)
      return res.status(500).json({ error: 'Erro ao cancelar agendamento' })
    }

    res.status(200).json({ message: 'Agendamento cancelado com sucesso', data: data[0] })
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro interno no servidor' })
  }
})

export default router
