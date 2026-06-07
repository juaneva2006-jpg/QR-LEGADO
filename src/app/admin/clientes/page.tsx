'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Calendar, ShoppingBag, Search, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// ============================================================
// ADMIN CLIENTES — CRM (Customer Relationship Management)
// ============================================================

interface ClienteCRM {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  created_at: string
  pedidos: {
    id: string
    created_at: string
    total: number
    mesa: { numero: number } | null
    items: {
      cantidad: number
      producto: { nombre: string } | null
    }[]
  }[]
  total_gastado: number
  total_pedidos: number
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteCRM[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    loadClientes()
  }, [])

  async function loadClientes() {
    // 1. Obtener todos los clientes
    const { data: clientesData } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })

    // 2. Obtener todos los pedidos con sus items y mesas
    const { data: pedidosData } = await supabase
      .from('pedidos')
      .select(`
        id,
        created_at,
        total,
        cliente_id,
        mesa:mesas(numero),
        items:pedido_items(cantidad, producto:productos(nombre))
      `)
      .order('created_at', { ascending: false })

    if (clientesData) {
      const crmData: ClienteCRM[] = clientesData.map(c => {
        const misPedidos = (pedidosData || []).filter(p => p.cliente_id === c.id)
        const total_gastado = misPedidos.reduce((sum, p) => sum + (p.total || 0), 0)
        return {
          ...c,
          pedidos: misPedidos,
          total_gastado,
          total_pedidos: misPedidos.length
        }
      })
      setClientes(crmData)
    }
    setLoading(false)
  }

  const filtered = clientes.filter(c => 
    c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.telefono?.includes(searchTerm)
  )

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-playfair text-3xl text-legado-cream font-bold">Base de Datos de Clientes</h1>
          <p className="text-legado-cream-muted text-sm mt-1">{clientes.length} clientes registrados</p>
        </div>

        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-legado-cream-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="input-legado pl-9 w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(cliente => (
            <div key={cliente.id} className="card overflow-hidden">
              <div 
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedId(expandedId === cliente.id ? null : cliente.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-legado-surface-2 flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-legado-orange" />
                  </div>
                  <div>
                    <h3 className="font-playfair text-legado-cream font-bold text-lg leading-none mb-1">
                      {cliente.nombre || 'Sin nombre'}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-legado-cream-muted">
                      {cliente.telefono && <span>📞 {cliente.telefono}</span>}
                      {cliente.email && <span>✉️ {cliente.email}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <div className="text-legado-cream-muted text-xs">Total Gastado</div>
                    <div className="font-bold text-legado-orange">{cliente.total_gastado.toFixed(2)} €</div>
                  </div>
                  <div className="text-right">
                    <div className="text-legado-cream-muted text-xs">Pedidos</div>
                    <div className="text-legado-cream font-medium flex items-center gap-1 justify-end">
                      <ShoppingBag size={14} /> {cliente.total_pedidos}
                    </div>
                  </div>
                  <div className="text-right hidden md:block">
                    <div className="text-legado-cream-muted text-xs">Registro</div>
                    <div className="text-legado-cream flex items-center gap-1 justify-end">
                      <Calendar size={14} /> {format(new Date(cliente.created_at), 'dd MMM yyyy', { locale: es })}
                    </div>
                  </div>
                  
                  {/* Delete Customer Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('¿Seguro que deseas eliminar este cliente? Se borrará todo su historial.')) {
                        supabase.from('clientes').delete().eq('id', cliente.id).then(() => {
                          loadClientes();
                        });
                      }
                    }}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors ml-2"
                    title="Borrar Cliente"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="text-legado-cream-muted pl-2">
                    {expandedId === cliente.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

              {/* Pedidos Desplegables */}
              {expandedId === cliente.id && (
                <div className="border-t px-4 py-4 bg-black/20 space-y-4" style={{ borderColor: '#4A3D2C' }}>
                  <h4 className="text-sm font-semibold text-legado-cream-muted mb-3 uppercase tracking-wider">Historial de Pedidos</h4>
                  
                  {cliente.pedidos.length === 0 ? (
                    <p className="text-sm text-legado-cream-muted">No hay pedidos registrados.</p>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {cliente.pedidos.map(pedido => (
                        <div key={pedido.id} className="p-3 rounded-lg border bg-legado-dark/50" style={{ borderColor: '#4A3D2C' }}>
                          <div className="flex justify-between items-center mb-2 pb-2 border-b" style={{ borderColor: '#4A3D2C' }}>
                            <div className="text-xs text-legado-cream-muted">
                              {format(new Date(pedido.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                            </div>
                            <div className="badge badge-gold text-xs">Mesa {pedido.mesa?.numero || '?'}</div>
                            <div className="font-bold text-legado-orange text-sm">{pedido.total.toFixed(2)} €</div>
                          </div>
                          <ul className="text-xs text-legado-cream-muted space-y-1 mt-2">
                            {pedido.items.map((item, idx) => (
                              <li key={idx} className="flex justify-between">
                                <span>{item.cantidad}x {item.producto?.nombre}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
