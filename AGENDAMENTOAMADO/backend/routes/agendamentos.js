import express from 'express'
import supabase from '../supabaseClient.js'
import { authenticateToken } from '../middlewares/authMiddleware.js'
import { checkAdmin } from '../middlewares/adminMiddleware.js'

const router = express.Router()

// Criar novo agendamento - qualquer usuário autenticado
router.post('/', authenticateToken, async (req, res) => {
  const { id_servico, data, hora, status } = req.body
  const id_usuario = req.user.id

  if (!id_servico || !data || !hora) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' })
  }

  try {
    // Verificar se o serviço existe
    const { data: servico, error: servicoError } = await supabase
      .from('servicos')
      .select('id_serv')
      .eq('id_serv', id_servico)
      .single()

    if (servicoError || !servico) {
      return res.status(400).json({ error: 'Serviço não encontrado' })
    }

    // Verificar se já existe agendamento no mesmo horário
    const { data: conflito, error: conflitoError } = await supabase
      .from('agendamentos')
      .select('id_agend')
      .eq('data', data)
      .eq('hora', hora)
      .eq('status', 'agendado')

    if (conflito && conflito.length > 0) {
      return res.status(400).json({ error: 'Horário já ocupado' })
    }

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

// Listar agendamentos do usuário logado
router.get('/meus', authenticateToken, async (req, res) => {
  const id_usuario = req.user.id

  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('id_usuario', id_usuario)
      .order('data', { ascending: true })
      .order('hora', { ascending: true })

    if (error) {
      console.error('Erro ao buscar meus agendamentos:', error)
      return res.status(500).json({ error: 'Erro ao buscar agendamentos' })
    }

    res.json(data)
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro interno no servidor' })
  }
})

// Listar todos os agendamentos - apenas admins
router.get('/', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        id_agend,
        data,
        hora,
        status,
        id_usuario,
        id_servico,
        usuario (
          id,
          nome,
          email
        )
      `)
      .order('data', { ascending: true })
      .order('hora', { ascending: true })

    if (error) {
      console.error('Erro ao buscar agendamentos:', error)
      return res.status(500).json({ error: 'Erro ao buscar agendamentos' })
    }

    // Buscar dados dos serviços separadamente
    const agendamentosComServicos = await Promise.all(data.map(async (agendamento) => {
      const { data: servico } = await supabase
        .from('servicos')
        .select('id_serv, nome_serv, descricao')
        .eq('id_serv', agendamento.id_servico)
        .single()
      
      return {
        ...agendamento,
        servicos: servico
      }
    }))

    res.json(agendamentosComServicos)
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro interno no servidor' })
  }
})

// Buscar agendamento por ID - usuário autenticado
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params

  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('id_agend', id)
      .single()

    if (error) {
      console.error('Erro ao buscar agendamento:', error)
      return res.status(404).json({ error: 'Agendamento não encontrado' })
    }

    // Verificar permissão: admin ou dono
    if (req.user.role !== 'admin' && req.user.id !== data.id_usuario) {
      return res.status(403).json({ error: 'Acesso negado' })
    }

    // Buscar dados do usuário e serviço
    const { data: usuario } = await supabase
      .from('usuario')
      .select('id, nome, email')
      .eq('id', data.id_usuario)
      .single()

    const { data: servico } = await supabase
      .from('servicos')
      .select('id_serv, nome_serv, descricao')
      .eq('id_serv', data.id_servico)
      .single()

    res.json({
      ...data,
      usuario,
      servicos: servico
    })
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
      .eq('id_agend', id)
      .single()

    if (findError) {
      return res.status(404).json({ error: 'Agendamento não encontrado' })
    }

    // Verifica permissão: admin ou dono
    if (req.user.role !== 'admin' && req.user.id !== agendamento.id_usuario) {
      return res.status(403).json({ error: 'Acesso negado' })
    }

    // Se for mudança de data/hora, verificar conflito
    if ((data && data !== agendamento.data) || (hora && hora !== agendamento.hora)) {
      const { data: conflito, error: conflitoError } = await supabase
        .from('agendamentos')
        .select('id_agend')
        .eq('data', data || agendamento.data)
        .eq('hora', hora || agendamento.hora)
        .eq('status', 'agendado')
        .neq('id_agend', id)

      if (conflito && conflito.length > 0) {
        return res.status(400).json({ error: 'Horário já ocupado' })
      }
    }

    // Atualiza
    const { data: updated, error } = await supabase
      .from('agendamentos')
      .update({ id_servico, data, hora, status })
      .eq('id_agend', id)
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
      .eq('id_agend', id)
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
      .eq('id_agend', id)
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