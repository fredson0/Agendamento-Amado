import express from 'express'
import supabase from '../supabaseClient.js'
import { authenticateToken } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/', authenticateToken, async (req, res) => {
  const id_usuario = req.user.id
  console.log('ID do usuário no token:', id_usuario)

  try {
    // Total de agendamentos do usuário
    const { count, error: errorCount } = await supabase
      .from('agendamentos')
      .select('*', { count: 'exact', head: true })
      .eq('id_usuario', id_usuario)

    if (errorCount) {
      console.error('Erro no totalAgendamentos:', errorCount)
      throw errorCount
    }

    // Próximos agendamentos futuros, ordenados por data e hora, limitados a 5
    const { data: proximosAgendamentos, error: errorProximos } = await supabase
      .from('agendamentos')
      .select('id_agend, id_servico, data, hora, status') // corrigido aqui
      .eq('id_usuario', id_usuario)
      .gte('data', new Date().toISOString().split('T')[0])
      .order('data', { ascending: true })
      .order('hora', { ascending: true })
      .limit(5)

    if (errorProximos) {
      console.error('Erro nos proximosAgendamentos:', errorProximos)
      throw errorProximos
    }

    // Contar status manualmente
    const { data: allAgendamentos, error: errorAll } = await supabase
      .from('agendamentos')
      .select('status')
      .eq('id_usuario', id_usuario)

    if (errorAll) {
      console.error('Erro ao buscar agendamentos para statusCounts:', errorAll)
      throw errorAll
    }

    const statusCounts = allAgendamentos.reduce((acc, ag) => {
      acc[ag.status] = (acc[ag.status] || 0) + 1
      return acc
    }, {})

    const statusCountsArray = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))

    res.json({
      totalAgendamentos: count,
      proximosAgendamentos,
      statusCounts: statusCountsArray
    })
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard' })
  }
})

export default router
