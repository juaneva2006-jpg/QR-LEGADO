'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Trash2, TrendingUp, ShoppingBag, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [ventasData, setVentasData] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    
    // Cargar Pedidos
    const { data: pData } = await supabase
      .from('pedidos')
      .select(`
        *,
        mesas ( numero ),
        clientes ( nombre, telefono )
      `)
      .order('created_at', { ascending: false })
    
    if (pData) setPedidos(pData)

    // Cargar Productos para gráfica de ventas
    const { data: prodData } = await supabase
      .from('productos')
      .select('nombre, ventas_totales')
      .order('ventas_totales', { ascending: false })
      .limit(5)

    if (prodData) {
      setVentasData(prodData.map(p => ({
        name: p.nombre.length > 15 ? p.nombre.substring(0, 15) + '...' : p.nombre,
        ventas: p.ventas_totales || 0
      })))
    }
    
    setLoading(false)
  }

  async function deletePedido(id: string) {
    if (confirm('¿Seguro que deseas eliminar este pedido?')) {
      await supabase.from('pedidos').delete().eq('id', id)
      loadData()
    }
  }

  if (loading) {
    return <div className="p-8 text-legado-cream flex justify-center mt-20">Cargando datos...</div>
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-3xl text-legado-cream mb-2">Historial de Pedidos</h1>
          <p className="text-legado-cream-muted">Analítica y registro de todos los pedidos realizados.</p>
        </div>
      </div>

      {/* Gráfica de Ventas */}
      <div className="bg-[#1A1208] border border-[#4A3D2C] rounded-2xl p-6">
        <h2 className="font-playfair text-xl text-legado-gold mb-6 flex items-center gap-2">
          <TrendingUp size={20} />
          Top 5 Productos Más Vendidos
        </h2>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ventasData}>
              <XAxis dataKey="name" stroke="#C9C0B0" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#C9C0B0" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(232, 118, 58, 0.1)' }}
                contentStyle={{ background: '#2A1F10', border: '1px solid #4A3D2C', borderRadius: '8px', color: '#FFF' }}
              />
              <Bar dataKey="ventas" fill="#E8763A" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de Pedidos */}
      <div className="bg-[#1A1208] border border-[#4A3D2C] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#4A3D2C]">
          <h2 className="font-playfair text-xl text-legado-gold flex items-center gap-2">
            <ShoppingBag size={20} />
            Todos los Pedidos
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#2A1F10] text-legado-cream-muted text-sm border-b border-[#4A3D2C]">
                <th className="p-4 font-medium">Fecha</th>
                <th className="p-4 font-medium">Cliente</th>
                <th className="p-4 font-medium">Mesa</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4 font-medium text-right">Total</th>
                <th className="p-4 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="border-b border-[#4A3D2C] last:border-0 hover:bg-[#2A1F10]/50 transition-colors">
                  <td className="p-4 text-sm text-legado-cream">
                    {format(new Date(pedido.created_at), 'dd MMM HH:mm', { locale: es })}
                  </td>
                  <td className="p-4 text-sm text-legado-cream">
                    {pedido.clientes?.nombre || 'Anónimo'}
                    {pedido.clientes?.telefono && <span className="block text-xs text-legado-cream-muted">{pedido.clientes.telefono}</span>}
                  </td>
                  <td className="p-4 text-sm text-legado-cream">
                    {pedido.mesas?.numero ? `Mesa ${pedido.mesas.numero}` : 'Barra'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${
                      pedido.estado === 'completado' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      pedido.estado === 'preparando' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {pedido.estado.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-legado-cream font-medium text-right">
                    {pedido.total.toFixed(2)} €
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => deletePedido(pedido.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Borrar Pedido"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {pedidos.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-legado-cream-muted">
                    No hay pedidos registrados aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
