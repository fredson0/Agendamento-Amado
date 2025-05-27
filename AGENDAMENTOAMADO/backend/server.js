import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import supabase from './supabaseClient.js'
import authRoutes from './routes/auth.js'

const app = express()
const port = 3001

app.use(cors())
app.use(express.json())

app.use('/auth', authRoutes)

app.get('/', (req, res) => {
  res.send('API do Núcleo AMADO rodando!')
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