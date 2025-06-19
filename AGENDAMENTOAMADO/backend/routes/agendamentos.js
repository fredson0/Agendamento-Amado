import express from 'express'
import supabase from '../supabaseClient.js'
import { authenticateToken } from '../middlewares/authMiddleware.js'
import { checkAdmin } from '../middlewares/adminMiddleware.js'

const router = express.Router()

// Criar agendamento
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { id_servico, data, hora, status = 'agendado' } = req.body
    const id_usuario = req.user.id

    console.log('Dados recebidos para agendamento:', { id_servico, data, hora, id_usuario, status })

    if (!id_servico || !data || !hora) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' })
    }

    // Verificar se o serviço existe
    const { data: servico, error: errorServico } = await supabase
      .from('servicos')
      .select('*')
      .eq('id_serv', id_servico)
      .single()

    if (errorServico || !servico) {
      console.error('Erro ao verificar serviço:', errorServico)
      return res.status(400).json({ error: 'Serviço não encontrado' })
    }

    // Verificar se já existe agendamento para o mesmo usuário, data e hora
    const { data: agendamentoExistente, error: errorCheck } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('id_usuario', id_usuario)
      .eq('data', data)
      .eq('hora', hora)

    if (errorCheck) {
      console.error('Erro ao verificar agendamento existente:', errorCheck)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }

    if (agendamentoExistente && agendamentoExistente.length > 0) {
      return res.status(400).json({ error: 'Você já tem um agendamento para esta data e hora' })
    }

    // Criar o agendamento
    const { data: novoAgendamento, error } = await supabase
      .from('agendamentos')
      .insert([{
        id_usuario,
        id_servico: parseInt(id_servico),
        data,
        hora,
        status
      }])
      .select()

    if (error) {
      console.error('Erro ao criar agendamento:', error)
      return res.status(500).json({ error: 'Erro ao criar agendamento: ' + error.message })
    }

    console.log('Agendamento criado com sucesso:', novoAgendamento)
    res.status(201).json({ 
      message: 'Agendamento criado com sucesso!', 
      agendamento: novoAgendamento[0] 
    })
  } catch (error) {
    console.error('Erro geral ao criar agendamento:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Buscar agendamentos do usuário logado
router.get('/meus', authenticateToken, async (req, res) => {
  try {
    const id_usuario = req.user.id

    console.log('Buscando agendamentos para usuário:', id_usuario)

    const { data: agendamentos, error } = await supabase
      .from('agendamentos')
      .select(`
        *,
        servicos (
          id_serv,
          nome_serv,
          descricao
        )
      `)
      .eq('id_usuario', id_usuario)
      .order('data', { ascending: true })

    if (error) {
      console.error('Erro ao buscar agendamentos:', error)
      return res.status(500).json({ error: 'Erro ao buscar agendamentos: ' + error.message })
    }

    console.log('Agendamentos encontrados:', agendamentos)
    res.json(agendamentos || [])
  } catch (error) {
    console.error('Erro geral ao buscar agendamentos:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Buscar todos os agendamentos (admin)
router.get('/', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { data: agendamentos, error } = await supabase
      .from('agendamentos')
      .select(`
        *,
        servicos (
          id_serv,
          nome_serv,
          descricao
        ),
        usuario (
          id,
          nome,
          email
        )
      `)
      .order('data', { ascending: true })

    if (error) {
      console.error('Erro ao buscar todos os agendamentos:', error)
      return res.status(500).json({ error: 'Erro ao buscar agendamentos: ' + error.message })
    }

    res.json(agendamentos || [])
  } catch (error) {
    console.error('Erro geral ao buscar todos os agendamentos:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// ROTA DE TESTE SEM AUTENTICAÇÃO - TEMPORÁRIA
router.get('/test-db-public', async (req, res) => {
  try {
    console.log('=== TESTE DE BANCO DE DADOS (PÚBLICO) ===')
    
    // Testar estrutura da tabela agendamentos
    const { data: estruturaAgendamentos, error: errorEstrutura } = await supabase
      .from('agendamentos')
      .select('*')
      .limit(5)
    
    console.log('Estrutura agendamentos:', estruturaAgendamentos)
    console.log('Erro estrutura:', errorEstrutura)
    
    // Testar todos os agendamentos
    const { data: todosAgendamentos, error: errorTodos } = await supabase
      .from('agendamentos')
      .select('*')
    
    console.log('Todos os agendamentos:', todosAgendamentos)
    console.log('Erro todos:', errorTodos)
    
    // Testar estrutura da tabela servicos
    const { data: estruturaServicos, error: errorServicos } = await supabase
      .from('servicos')
      .select('*')
      .limit(3)
      console.log('Estrutura serviços:', estruturaServicos)
    console.log('Erro serviços:', errorServicos)
    
    // Testar estrutura da tabela usuario
    const { data: estruturaUsuario, error: errorUsuario } = await supabase
      .from('usuario')
      .select('id, nome, email')
      .limit(3)
    
    console.log('Estrutura usuários:', estruturaUsuario)
    console.log('Erro usuários:', errorUsuario)
    
    res.json({
      message: 'Teste do banco de dados',
      agendamentos: {
        total: todosAgendamentos?.length || 0,
        dados: estruturaAgendamentos,
        erro: errorEstrutura?.message
      },
      servicos: {
        total: estruturaServicos?.length || 0,
        dados: estruturaServicos,
        erro: errorServicos?.message
      },
      usuarios: {
        dados: estruturaUsuario,
        erro: errorUsuario?.message
      }
    })
  } catch (error) {
    console.error('Erro no teste:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router