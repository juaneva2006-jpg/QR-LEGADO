import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lcolbdlzyhwjwotyhqwt.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb2xiZGx6eWh3andvdHlocXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTgwMzQsImV4cCI6MjA5NjMzNDAzNH0.MCaQqjOpoFsFb0OKuDOJ_FQmE6aIZQ0w--i5uvI0WAo'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function seedMesas() {
  const mesasToInsert = []
  
  // Mesas 2 a 10
  for (let i = 2; i <= 10; i++) {
    mesasToInsert.push({
      numero: i,
      zona: i <= 5 ? 'sala' : 'terraza',
      capacidad: i % 2 === 0 ? 4 : 2,
      activa: true,
      qr_token: `token-mesa-${i}-${Date.now()}`
    })
  }

  console.log('Inserting mesas...')
  const { data, error } = await supabase.from('mesas').insert(mesasToInsert)
  
  if (error) {
    console.error('Error inserting mesas:', error)
  } else {
    console.log('Mesas inserted successfully!')
  }
}

seedMesas()
