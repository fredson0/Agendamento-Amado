import express from 'express'
import supabase from '../supabaseClient.js'
import { authenticateToken } from '../middlewares/authMiddleware.js'
import { checkAdmin } from '../middlewares/adminMiddleware.js'

const router = express.Router()

// Enviar mensagem de contato - qualquer usuário autenticado
router.post('/', authenticateToken, async (req, res) => {
  const { assunto, mensagem, categoria } = req.body
  const id_usuario = req.user.id

  if (!assunto || !mensagem) {
    return res.status(400).json({ error: 'Assunto e mensagem são obrigatórios' })
  }

  try {
    // Buscar dados do usuário para completar a mensagem
    const { data: usuario, error: userError } = await supabase
      .from('usuario')
      .select('nome, email')
      .eq('id', id_usuario)
      .single()

    if (userError) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    // Criar nova mensagem de contato
    const { data: novaMensagem, error } = await supabase
      .from('contatos')
      .insert([{
        id_usuario,
        nome_usuario: usuario.nome,
        email_usuario: usuario.email,
        assunto,
        mensagem,
        categoria: categoria || 'geral',
        status: 'pendente',
        data_criacao: new Date().toISOString()
      }])
      .select()

    if (error) {
      console.error('Erro ao criar mensagem de contato:', error)
      return res.status(500).json({ error: 'Erro ao enviar mensagem' })
    }

    res.status(201).json({ 
      message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
      contato: novaMensagem[0]
    })
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro interno no servidor' })
  }
})

// Listar minhas mensagens de contato - usuário autenticado
router.get('/minhas', authenticateToken, async (req, res) => {
  const id_usuario = req.user.id

  try {
    const { data, error } = await supabase
      .from('contatos')
      .select('*')
      .eq('id_usuario', id_usuario)
      .order('data_criacao', { ascending: false })

    if (error) {
      console.error('Erro ao buscar mensagens:', error)
      return res.status(500).json({ error: 'Erro ao buscar mensagens' })
    }

    res.json(data)
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro interno no servidor' })
  }
})

// Buscar mensagem específica - usuário pode ver apenas suas mensagens
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params
  const id_usuario = req.user.id

  try {
    const { data, error } = await supabase
      .from('contatos')
      .select('*')
      .eq('id_contato', id)
      .single()

    if (error) {
      return res.status(404).json({ error: 'Mensagem não encontrada' })
    }

    // Verificar se é admin ou dono da mensagem
    if (req.user.role !== 'admin' && data.id_usuario !== id_usuario) {
      return res.status(403).json({ error: 'Acesso negado' })
    }

    res.json(data)
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro interno no servidor' })
  }
})

// ========== ROTAS ADMINISTRATIVAS ==========

// Listar todas as mensagens - apenas admins
router.get('/', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { status, categoria, limite = 50 } = req.query

    let query = supabase
      .from('contatos')
      .select('*')
      .order('data_criacao', { ascending: false })
      .limit(parseInt(limite))

    // Filtros opcionais
    if (status) {
      query = query.eq('status', status)
    }
    if (categoria) {
      query = query.eq('categoria', categoria)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar todas as mensagens:', error)
      return res.status(500).json({ error: 'Erro ao buscar mensagens' })
    }

    res.json(data)
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro interno no servidor' })
  }
})

// Atualizar status da mensagem - apenas admins
router.put('/:id/status', authenticateToken, checkAdmin, async (req, res) => {
  const { id } = req.params
  const { status, resposta_admin } = req.body

  if (!status || !['pendente', 'em_andamento', 'respondida', 'resolvida'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido. Use: pendente, em_andamento, respondida, resolvida' })
  }

  try {
    const updateData = {
      status,
      data_resposta: new Date().toISOString()
    }

    // Se houver resposta do admin, incluir
    if (resposta_admin) {
      updateData.resposta_admin = resposta_admin
    }

    const { data, error } = await supabase
      .from('contatos')
      .update(updateData)
      .eq('id_contato', id)
      .select()

    if (error) {
      console.error('Erro ao atualizar status:', error)
      return res.status(500).json({ error: 'Erro ao atualizar status' })
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Mensagem não encontrada' })
    }

    res.json({ 
      message: 'Status atualizado com sucesso',
      contato: data[0]
    })
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro interno no servidor' })
  }
})

// Deletar mensagem - apenas admins
router.delete('/:id', authenticateToken, checkAdmin, async (req, res) => {
  const { id } = req.params

  try {
    const { data, error } = await supabase
      .from('contatos')
      .delete()
      .eq('id_contato', id)
      .select()

    if (error) {
      console.error('Erro ao deletar mensagem:', error)
      return res.status(500).json({ error: 'Erro ao deletar mensagem' })
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Mensagem não encontrada' })
    }

    res.json({ message: 'Mensagem deletada com sucesso' })
  } catch (err) {
    console.error('Erro interno:', err)
    res.status(500).json({ error: 'Erro interno no servidor' })
  }
})

// Estatísticas de contato - apenas admins
router.get('/admin/stats', authenticateToken, checkAdmin, async (req, res) => {
  try {
    // Total de mensagens
    const { count: totalMensagens, error: errorTotal } = await supabase
      .from('contatos')
      .select('*', { count: 'exact', head: true })

    // Mensagens pendentes
    const { count: pendentes, error: errorPendentes } = await supabase
      .from('contatos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente')

    // Mensagens por categoria
    const { data: categorias, error: errorCategorias } = await supabase
      .from('contatos')
      .select('categoria')

    const categoriasCounts = categorias?.reduce((acc, msg) => {
      acc[msg.categoria] = (acc[msg.categoria] || 0) + 1
      return acc
    }, {}) || {}

    // Mensagens dos últimos 7 dias
    const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count: recenteMensagens, error: errorRecente } = await supabase
      .from('contatos')
      .select('*', { count: 'exact', head: true })
      .gte('data_criacao', seteDiasAtras)

    if (errorTotal || errorPendentes || errorCategorias || errorRecente) {
      throw new Error('Erro ao buscar estatísticas')
    }

    res.json({
      totalMensagens,
      pendentes,
      resolvidas: totalMensagens - pendentes,
      recenteMensagens,
      categorias: Object.entries(categoriasCounts).map(([categoria, count]) => ({
        categoria,
        count
      }))
    })
  } catch (err) {
    console.error('Erro ao buscar estatísticas:', err)
    res.status(500).json({ error: 'Erro ao buscar estatísticas' })
  }
})

export default router