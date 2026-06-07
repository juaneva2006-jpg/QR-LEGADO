'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, ShoppingBag, Clock, Euro, Star, AlertTriangle, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

// ============================================================
// ADMIN DASHBOARD — Métricas, Analytics y Vista Rápida
// ============================================================

interface DashboardStats {
  totalPedidosHoy: number
  facturacionHoy: number
  facturacionTotal: number
  tiempoMedioServicio: number
  pedidosPendientes: number
  topProductos: { nombre: string; ventas: number; categoria: string }[]
  mesasRentables: { numero: number; zona: string; total: number }[]
  pedidosRecientes: Array<{
    id: string
    created_at: string
    total: number
    estado: string
    mesa_numero: number
    cliente_nombre: string
  }>
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Pedidos de hoy
      const { data: pedidosHoy } = await supabase
        .from('pedidos')
        .select('total, estado, created_at, tiempo_preparacion_inicio, tiempo_entrega')
        .eq('pago_estado', 'completado')
        .gte('created_at', today.toISOString())

      // Todos los pedidos completados
      const { data: todosLosPedidos } = await supabase
        .from('pedidos')
        .select(`
          id, created_at, total, estado, updated_at,
          mesa:mesas(numero, zona),
          cliente:clientes(nombre)
        `)
        .eq('pago_estado', 'completado')
        .order('created_at', { ascending: false })
        .limit(10)

      // Top productos
      const { data: topProductos } = await supabase
        .from('productos')
        .select('nombre, ventas_totales, categoria')
        .order('ventas_totales', { ascending: false })
        .limit(5)

      // Mesas rentables (sum de pedidos por mesa)
      const { data: mesasData } = await supabase
        .from('pedidos')
        .select('mesa_id, total, mesa:mesas(numero, zona)')
        .eq('pago_estado', 'completado')

      // Calcular mesas rentables
      const mesasTotales = mesasData?.reduce((acc: Record<string, { numero: number; zona: string; total: number }>, p: any) => {
        if (p.mesa) {
          const key = p.mesa_id
          if (!acc[key]) acc[key] = { numero: p.mesa.numero, zona: p.mesa.zona, total: 0 }
          acc[key].total += p.total
        }
        return acc
      }, {})

      const mesasRentables = Object.values(mesasTotales || {})
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 5)

      // Calcular tiempo medio de servicio
      const pedidosConTiempo = pedidosHoy?.filter(p => p.tiempo_entrega && p.tiempo_preparacion_inicio) || []
      const tiempoMedio = pedidosConTiempo.length > 0
        ? pedidosConTiempo.reduce((sum: number, p: any) => {
            const inicio = new Date(p.tiempo_preparacion_inicio).getTime()
            const fin = new Date(p.tiempo_entrega).getTime()
            return sum + (fin - inicio) / 60000
          }, 0) / pedidosConTiempo.length
        : 0

      const facturacionHoy = pedidosHoy?.reduce((sum, p) => sum + (p.total || 0), 0) || 0

      setStats({
        totalPedidosHoy: pedidosHoy?.length || 0,
        facturacionHoy,
        facturacionTotal: (todosLosPedidos?.reduce((sum: number, p: any) => sum + (p.total || 0), 0)) || 0,
        tiempoMedioServicio: Math.round(tiempoMedio),
        pedidosPendientes: pedidosHoy?.filter(p => p.estado === 'pendiente' || p.estado === 'en_preparacion').length || 0,
        topProductos: topProductos?.map(p => ({ nombre: p.nombre, ventas: p.ventas_totales, categoria: p.categoria })) || [],
        mesasRentables: mesasRentables as any,
        pedidosRecientes: (todosLosPedidos || []).map((p: any) => ({
          id: p.id,
          created_at: p.created_at,
          total: p.total,
          estado: p.estado,
          mesa_numero: p.mesa?.numero || 0,
          cliente_nombre: p.cliente?.nombre || 'Anónimo'
        }))
      })
    } catch (err) {
      console.error('Error cargando stats:', err)
    } finally {
      setLoading(false)
    }
  }

  async function deletePedido(id: string) {
    if (confirm('¿Seguro que deseas eliminar este pedido?')) {
      await supabase.from('pedidos').delete().eq('id', id)
      loadStats()
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 skeleton rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2].map(i => <div key={i} className="h-64 skeleton rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-3xl text-legado-cream font-bold">Dashboard</h1>
          <p className="text-legado-cream-muted text-sm mt-1">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={loadStats} className="btn-secondary text-sm">
          ↻ Actualizar
        </button>
      </div>

      {/* ---- KPIs ---- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={<ShoppingBag size={20} color="#E8763A" />}
          label="Pedidos hoy"
          value={stats?.totalPedidosHoy || 0}
          suffix=""
          trend={stats?.pedidosPendientes ? `${stats.pedidosPendientes} en curso` : undefined}
        />
        <KPICard
          icon={<Euro size={20} color="#C9A84C" />}
          label="Facturación hoy"
          value={stats?.facturacionHoy?.toFixed(2) || '0.00'}
          suffix=" €"
          highlight
        />
        <KPICard
          icon={<Clock size={20} color="#3B82F6" />}
          label="Tiempo medio"
          value={stats?.tiempoMedioServicio || 0}
          suffix=" min"
        />
        <KPICard
          icon={<TrendingUp size={20} color="#10B981" />}
          label="Facturación total"
          value={stats?.facturacionTotal?.toFixed(2) || '0.00'}
          suffix=" €"
        />
      </div>

      {/* ---- Grids ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Productos */}
        <div className="card p-5">
          <h3 className="font-playfair text-lg text-legado-cream font-bold mb-4 flex items-center gap-2">
            <Star size={18} color="#C9A84C" /> Top Productos
          </h3>
          <div className="space-y-3">
            {stats?.topProductos.length === 0 ? (
              <p className="text-legado-cream-muted text-sm text-center py-4">Sin datos aún</p>
            ) : (
              stats?.topProductos.map((prod, idx) => (
                <div key={prod.nombre} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: idx === 0 ? '#C9A84C' : idx === 1 ? '#9CA3AF' : '#92400E', color: 'white' }}>
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-legado-cream text-sm font-medium">{prod.nombre}</p>
                    <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: '#4A3D2C' }}>
                      <div className="h-full rounded-full"
                           style={{
                             background: 'linear-gradient(90deg, #E8763A, #C9A84C)',
                             width: `${Math.min(100, (prod.ventas / (stats.topProductos[0]?.ventas || 1)) * 100)}%`
                           }} />
                    </div>
                  </div>
                  <span className="text-legado-orange font-bold text-sm">{prod.ventas}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mesas Rentables */}
        <div className="card p-5">
          <h3 className="font-playfair text-lg text-legado-cream font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={18} color="#10B981" /> Mesas más Rentables
          </h3>
          <div className="space-y-3">
            {stats?.mesasRentables.length === 0 ? (
              <p className="text-legado-cream-muted text-sm text-center py-4">Sin datos aún</p>
            ) : (
              stats?.mesasRentables.map((mesa, idx) => (
                <div key={mesa.numero} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                       style={{ background: 'rgba(232, 118, 58, 0.15)', color: '#E8763A' }}>
                    {mesa.numero}
                  </div>
                  <div className="flex-1">
                    <p className="text-legado-cream text-sm font-medium capitalize">Mesa {mesa.numero} · {mesa.zona}</p>
                    <p className="text-legado-cream-muted text-xs">{mesa.zona === 'terraza' ? '☀️ Terraza' : '🏠 Sala'}</p>
                  </div>
                  <span className="font-playfair font-bold text-legado-orange">{mesa.total?.toFixed(2)} €</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pedidos Recientes */}
      <div className="card p-5">
        <h3 className="font-playfair text-lg text-legado-cream font-bold mb-4">Pedidos Recientes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #4A3D2C' }}>
                {['Mesa', 'Cliente', 'Total', 'Estado', 'Hace', ''].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-legado-cream-muted font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats?.pedidosRecientes.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-legado-cream-muted">Sin pedidos aún</td></tr>
              ) : (
                stats?.pedidosRecientes.map(pedido => (
                  <tr key={pedido.id} className="border-b hover:bg-white/5 transition-colors"
                      style={{ borderColor: '#4A3D2C22' }}>
                    <td className="py-3 px-3">
                      <span className="badge badge-orange">Mesa {pedido.mesa_numero}</span>
                    </td>
                    <td className="py-3 px-3 text-legado-cream">{pedido.cliente_nombre}</td>
                    <td className="py-3 px-3 font-bold text-legado-orange">{pedido.total?.toFixed(2)} €</td>
                    <td className="py-3 px-3">
                      <span className="badge text-xs capitalize"
                            style={{ background: '#2A1F10', color: '#C9C0B0', border: '1px solid #4A3D2C' }}>
                        {pedido.estado}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-legado-cream-muted text-xs">
                      {formatDistanceToNow(new Date(pedido.created_at), { locale: es, addSuffix: true })}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button 
                        onClick={() => deletePedido(pedido.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Borrar Pedido"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ---- KPI Card ----
function KPICard({ icon, label, value, suffix, trend, highlight = false }: {
  icon: React.ReactNode
  label: string
  value: string | number
  suffix: string
  trend?: string
  highlight?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4"
      style={highlight ? { borderColor: 'rgba(201, 168, 76, 0.4)' } : {}}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-xl" style={{ background: 'rgba(232, 118, 58, 0.1)' }}>
          {icon}
        </div>
      </div>
      <div className="font-playfair text-2xl font-bold text-legado-cream">
        {value}{suffix}
      </div>
      <div className="text-legado-cream-muted text-xs mt-1">{label}</div>
      {trend && <div className="text-legado-orange text-xs mt-1">{trend}</div>}
    </motion.div>
  )
}
