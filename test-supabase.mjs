import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lcolbdlzyhwjwotyhqwt.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb2xiZGx6eWh3andvdHlocXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTgwMzQsImV4cCI6MjA5NjMzNDAzNH0.MCaQqjOpoFsFb0OKuDOJ_FQmE6aIZQ0w--i5uvI0WAo'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testQuery() {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      id, created_at, total, subtotal, iva, estado, updated_at,
      mesa:mesas(numero, zona),
      cliente:clientes(nombre, telefono),
      facturas(numero_factura),
      items:pedido_items(cantidad, producto:productos(nombre, precio))
    `)
    .eq('pago_estado', 'completado')
    .order('created_at', { ascending: false })
    .limit(1)

  console.dir(data, { depth: null })
  console.error(error)
}

testQuery()
