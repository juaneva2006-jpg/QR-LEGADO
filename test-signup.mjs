import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lcolbdlzyhwjwotyhqwt.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb2xiZGx6eWh3andvdHlocXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTgwMzQsImV4cCI6MjA5NjMzNDAzNH0.MCaQqjOpoFsFb0OKuDOJ_FQmE6aIZQ0w--i5uvI0WAo'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function test() {
  const { data, error } = await supabase.auth.signUp({
    email: 'admin2@legadogastrobar.com',
    password: 'admin1234'
  })
  
  console.log('Signup result:', data)
  console.log('Signup error:', error ? error.message : 'SUCCESS')
}

test()
