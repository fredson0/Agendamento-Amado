import express from 'express'
import supabase from '../supabaseClient.js'
import { authenticateToken } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Dashboard do usuário - completo conforme script
router.get('/', authenticateToken, async (req, res) => {
  const id_usuario = req.user.id

  try {
    // Dados do usuário para boas-vindas
    const { data: usuario, error: errorUsuario } = await supabase
      .from('usuario')
      .select('nome, email')
      .eq('id', id_usuario)
      .single()

    if (errorUsuario) {
      throw errorUsuario
    }

    // Total de agendamentos do usuário
    const { count: totalAgendamentos, error: errorCount } = await supabase
      .from('agendamentos')
      .select('*', { count: 'exact', head: true })
      .eq('id_usuario', id_usuario)

    if (errorCount) {
      throw errorCount
    }

    // Próximos agendamentos (máximo 5)
    const { data: proximosAgendamentos, error: errorProximos } = await supabase
      .from('agendamentos')
      .select('id_agend, id_servico, data, hora, status')
      .eq('id_usuario', id_usuario)
      .gte('data', new Date().toISOString().split('T')[0])
      .order('data', { ascending: true })
      .order('hora', { ascending: true })
      .limit(5)

    if (errorProximos) {
      throw errorProximos
    }

    // Últimos agendamentos (histórico recente - incluindo passados)
    const { data: ultimosAgendamentos, error: errorUltimos } = await supabase
      .from('agendamentos')
      .select('id_agend, id_servico, data, hora, status')
      .eq('id_usuario', id_usuario)
      .order('data', { ascending: false })
      .order('hora', { ascending: false })
      .limit(3)

    if (errorUltimos) {
      throw errorUltimos
    }

    // Buscar dados dos serviços para próximos agendamentos
    const proximosComServicos = await Promise.all(
      proximosAgendamentos.map(async (agendamento) => {
        const { data: servico } = await supabase
          .from('servicos')
          .select('nome_serv, descricao')
          .eq('id_serv', agendamento.id_servico)
          .single()
        
        return {
          ...agendamento,
          servico: servico
        }
      })
    )

    // Buscar dados dos serviços para últimos agendamentos
    const ultimosComServicos = await Promise.all(
      ultimosAgendamentos.map(async (agendamento) => {
        const { data: servico } = await supabase
          .from('servicos')
          .select('nome_serv')
          .eq('id_serv', agendamento.id_servico)
          .single()
        
        return {
          ...agendamento,
          servico: servico
        }
      })
    )

    // Status dos agendamentos do usuário
    const { data: statusData, error: errorStatus } = await supabase
      .from('agendamentos')
      .select('status')
      .eq('id_usuario', id_usuario)

    if (errorStatus) {
      throw errorStatus
    }

    const statusCounts = statusData.reduce((acc, ag) => {
      acc[ag.status] = (acc[ag.status] || 0) + 1
      return acc
    }, {})

    res.json({
      // Dados do usuário para boas-vindas
      usuario: {
        nome: usuario.nome,
        email: usuario.email
      },
      
      // Estatísticas
      totalAgendamentos,
      proximosAgendamentos: proximosComServicos,
      historicoRecente: ultimosComServicos,
      
      statusResumo: {
        agendado: statusCounts.agendado || 0,
        concluido: statusCounts.concluido || 0,
        cancelado: statusCounts.cancelado || 0,
        pendente: statusCounts.pendente || 0
      },

      // Informações do Núcleo AMADO
      contato: {
        telefone: "(71) 99999-9999",
        email: "contato@amadounijorge.edu.br",
        endereco: "Unijorge - Salvador, BA",
        horarios: "Segunda a Sexta: 8h às 17h"
      },

      // Links de navegação rápida (para o frontend usar)
      acoesSugeridas: [
        { acao: "novo_agendamento", titulo: "Agendar Novo Atendimento" },
        { acao: "meus_agendamentos", titulo: "Ver Todos Meus Agendamentos" },
        { acao: "servicos", titulo: "Ver Serviços Disponíveis" },
        { acao: "contato", titulo: "Entrar em Contato" }
      ]
    })
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard' })
  }
})

export default router