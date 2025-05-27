import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

async function test() {
  const { data, error } = await supabase.from('usuario').select('*')
  if (error) {
    console.error('Erro ao conectar no Supabase:', error)
  } else {
    console.log('Conexão bem-sucedida! Dados:', data)
  }
}

test()