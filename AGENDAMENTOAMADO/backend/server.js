import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import supabase from './supabaseClient.js'

import authRoutes from './routes/auth.js'
import agendamentoRoutes from './routes/agendamentos.js' 
import servicosRoutes from './routes/servicos.js'
import dashboardRoutes from './routes/dashboard.js'
import contatoRoutes from './routes/contato.js'

const app = express()
const port = 3001

// Permite CORS apenas para o frontend local
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost', 'http://127.0.0.1'],
  credentials: true
}))
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/agendamentos', agendamentoRoutes)  
app.use('/servicos', servicosRoutes)
app.use('/dashboard', dashboardRoutes)
app.use('/contato', contatoRoutes)

app.get('/', (req, res) => {
  res.send('API do Núcleo AMADO rodando!')
})

// ROTA SIMPLES PARA TESTAR
app.get('/ping', (req, res) => {
  res.json({ 
    message: 'pong', 
    timestamp: new Date().toISOString(),
    status: 'OK'
  })
})

// ROTA DE TESTE DE BANCO - TEMPORÁRIA
app.get('/test-db', async (req, res) => {
  try {
    console.log('=== TESTE DIRETO NO SERVER ===')
    
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_KEY
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Testar todos os agendamentos
    const { data: todosAgendamentos, error: errorTodos } = await supabase
      .from('agendamentos')
      .select('*')
    
    console.log('Todos os agendamentos:', todosAgendamentos)
    console.log('Erro todos:', errorTodos)
    
    res.json({
      message: 'Teste direto do banco de dados',
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey,
      agendamentos: {
        total: todosAgendamentos?.length || 0,
        dados: todosAgendamentos,
        erro: errorTodos?.message
      }
    })
  } catch (error) {
    console.error('Erro no teste direto:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/usuario', async (req, res) => {
  const { data, error } = await supabase.from('usuario').select('*')

  if (error) {
    console.error('Erro ao buscar usuário:', error)
    return res.status(500).json({ error: 'Erro ao buscar usuário' })
  }

  res.json(data)
})

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`)
})