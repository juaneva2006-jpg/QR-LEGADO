'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, Bell, Clock, CheckCircle, RotateCcw, Settings, ArrowLeft, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Pedido, OrderStatus } from '@/types'
import { ORDER_STATUS_CONFIG } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

// ============================================================
// KDS PAGE — Kitchen Display System con Realtime WebSockets
// ============================================================

const STATUS_COLUMNS: OrderStatus[] = ['pendiente', 'en_preparacion', 'listo']

export default function CocinaPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  // Cargar pedidos activos
  const loadPedidos = useCallback(async () => {
    const { data } = await supabase
      .from('pedidos')
      .select(`
        *,
        mesa:mesas(*),
        cliente:clientes(*),
        items:pedido_items(*, producto:productos(*))
      `)
      .in('estado', ['pendiente', 'en_preparacion', 'listo'])
      .eq('pago_estado', 'completado')
      .order('created_at', { ascending: true })

    setPedidos(data || [])
    setLastUpdated(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    loadPedidos()
    if (typeof window !== 'undefined') {
      setIsAdmin(localStorage.getItem('legado_role') === 'admin')
    }

    // Suscripción Realtime
    const channel = supabase
      .channel('kds-pedidos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        (payload) => {
          // Nuevo pedido
          if (payload.eventType === 'INSERT') {
            toast('🔔 Nuevo pedido recibido!', {
              icon: '🍽️',
              duration: 5000,
            })
            loadPedidos()
          }
          // Pedido actualizado
          if (payload.eventType === 'UPDATE') {
            loadPedidos()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadPedidos])

  async function updateStatus(pedidoId: string, newStatus: OrderStatus) {
    const pedido = pedidos.find(p => p.id === pedidoId)
    const updates: Partial<Pedido> = { estado: newStatus }
    
    if (newStatus === 'en_preparacion') {
      updates.tiempo_preparacion_inicio = new Date().toISOString()
    }
    if (newStatus === 'entregado') {
      updates.tiempo_entrega = new Date().toISOString()
    }

    const { error } = await supabase
      .from('pedidos')
      .update(updates)
      .eq('id', pedidoId)

    if (!error) {
      const config = ORDER_STATUS_CONFIG[newStatus]
      toast.success(`Estado → ${config.label}`)
      loadPedidos()
      
      // Enviar SMS si hay teléfono del cliente
      if (pedido?.cliente?.telefono && (newStatus === 'en_preparacion' || newStatus === 'listo')) {
        const mesaStr = pedido.mesa?.numero ? `Mesa ${pedido.mesa.numero}` : 'Barra'
        const body = newStatus === 'en_preparacion' 
          ? `¡Hola ${pedido.cliente.nombre}! Tu pedido en la ${mesaStr} de Legado Gastrobar ya se está preparando 🍳 Te avisamos cuando esté listo.`
          : `¡Hola ${pedido.cliente.nombre}! Tu pedido en la ${mesaStr} de Legado Gastrobar YA ESTÁ LISTO 🚀 ¡A disfrutar!`
        
        try {
          const res = await fetch('/api/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: pedido.cliente.telefono, body })
          })
          
          if (!res.ok) {
            const data = await res.json()
            toast.error(`Aviso SMS falló: ${data.error}`)
          } else {
            toast.success('SMS enviado al cliente 📱')
          }
        } catch (err) {
          console.error(err)
        }
      }
    }
  }

  const pedidosPorStatus = STATUS_COLUMNS.reduce((acc, status) => {
    acc[status] = pedidos.filter(p => p.estado === status)
    return acc
  }, {} as Record<OrderStatus, Pedido[]>)

  function handleLogout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('legado_role')
      router.push('/login')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <ChefHat size={48} color="#E8763A" className="mx-auto mb-4 animate-pulse" />
          <p className="text-legado-cream-muted">Cargando KDS...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ---- HEADER ---- */}
      <header className="flex items-center justify-between px-6 py-4 border-b"
              style={{ background: '#1A1208', borderColor: '#4A3D2C' }}>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link href="/admin" className="p-2 text-legado-cream-muted hover:text-legado-cream hover:bg-[#2A1F10] rounded-xl transition-colors mr-2" title="Volver al administrador">
              <ArrowLeft size={20} />
            </Link>
          )}
          <ChefHat size={24} color="#E8763A" />
          <div>
            <h1 className="font-playfair text-xl text-legado-cream font-bold">Cocina · KDS</h1>
            <p className="text-xs text-legado-cream-muted">
              Actualizado {formatDistanceToNow(lastUpdated, { locale: es, addSuffix: true })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Contadores rápidos */}
          {STATUS_COLUMNS.map(status => {
            const count = pedidosPorStatus[status]?.length || 0
            const cfg = ORDER_STATUS_CONFIG[status]
            return (
              <div key={status} className="text-center px-3 py-2 rounded-xl"
                   style={{ background: cfg.bgColor + '20', border: `1px solid ${cfg.color}30` }}>
                <div className="text-xl font-bold" style={{ color: cfg.color }}>{count}</div>
                <div className="text-xs" style={{ color: cfg.color }}>{cfg.label}</div>
              </div>
            )
          })}
          
          <button onClick={loadPedidos} className="btn-ghost p-2" title="Refrescar">
            <RotateCcw size={18} />
          </button>
          
          <button onClick={handleLogout} className="btn-ghost p-2 text-red-400 hover:text-red-300" title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ---- KDS BOARD ---- */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-3 h-full gap-0" style={{ borderTop: '1px solid #4A3D2C' }}>
          {STATUS_COLUMNS.map((status, colIdx) => {
            const cfg = ORDER_STATUS_CONFIG[status]
            const columnPedidos = pedidosPorStatus[status] || []

            return (
              <div
                key={status}
                className="flex flex-col overflow-hidden"
                style={{ borderRight: colIdx < 2 ? '1px solid #4A3D2C' : 'none' }}
              >
                {/* Column Header */}
                <div className="px-4 py-3 border-b"
                     style={{ borderColor: '#4A3D2C', background: cfg.bgColor + '15' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: cfg.color }} />
                      <span className="font-semibold text-legado-cream text-sm">{cfg.label}</span>
                    </div>
                    <span className="badge text-xs"
                          style={{ background: cfg.bgColor + '30', color: cfg.color, border: `1px solid ${cfg.color}40` }}>
                      {columnPedidos.length}
                    </span>
                  </div>
                </div>

                {/* Pedidos */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  <AnimatePresence>
                    {columnPedidos.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-center">
                        <div className="text-3xl mb-2 opacity-30">🍽️</div>
                        <p className="text-legado-cream-muted text-xs">Sin pedidos</p>
                      </div>
                    ) : (
                      columnPedidos.map(pedido => (
                        <motion.div
                          key={pedido.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          layout
                        >
                          <KDSCard
                            pedido={pedido}
                            onUpdateStatus={(status) => updateStatus(pedido.id, status)}
                          />
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---- KDS Card ----
function KDSCard({ pedido, onUpdateStatus }: { pedido: Pedido; onUpdateStatus: (s: OrderStatus) => void }) {
  const [elapsed, setElapsed] = useState(0)
  
  const createdAt = new Date(pedido.created_at)
  const isNew = Date.now() - createdAt.getTime() < 60000 // < 1 min

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - createdAt.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [pedido.created_at])

  const elapsedMin = Math.floor(elapsed / 60)
  const timerClass = elapsedMin < 5 ? 'timer-ok' : elapsedMin < 10 ? 'timer-warning' : 'timer-critical'
  
  const nextStatus = ORDER_STATUS_CONFIG[pedido.estado]?.next

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className={`kds-card ${isNew ? 'is-new' : ''}`}>
      {/* Card Header */}
      <div className="px-3 py-2 flex items-center justify-between border-b"
           style={{ borderColor: '#4A3D2C' }}>
        <div className="flex items-center gap-2">
          <span className="font-playfair font-bold text-legado-orange text-lg">
            Mesa {pedido.mesa?.numero}
          </span>
          <span className="text-xs badge badge-orange capitalize">{pedido.mesa?.zona}</span>
        </div>
        <div className={`flex items-center gap-1 text-sm font-mono font-bold ${timerClass}`}>
          <Clock size={13} />
          {formatTime(elapsed)}
        </div>
      </div>

      {/* Items */}
      <div className="px-3 py-2 space-y-1">
        {pedido.items?.map(item => (
          <div key={item.id} className="flex items-start gap-2 text-sm">
            <span className="text-legado-orange font-bold text-base leading-tight w-6 text-center">
              {item.cantidad}
            </span>
            <div className="flex-1">
              <p className="text-legado-cream leading-tight">{item.producto?.nombre}</p>
              {item.notas && (
                <p className="text-yellow-400 text-xs">⚠️ {item.notas}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cliente */}
      {pedido.cliente && (
        <div className="px-3 py-1 text-xs text-legado-cream-muted border-t" style={{ borderColor: '#4A3D2C' }}>
          👤 {pedido.cliente.nombre}
        </div>
      )}

      {/* Action Button */}
      {nextStatus && (
        <div className="p-2 border-t" style={{ borderColor: '#4A3D2C' }}>
          <button
            onClick={() => onUpdateStatus(nextStatus)}
            className="btn-primary w-full justify-center text-xs py-2"
            style={{
              background: ORDER_STATUS_CONFIG[nextStatus]?.color,
            }}
          >
            → {ORDER_STATUS_CONFIG[nextStatus]?.label}
          </button>
        </div>
      )}
      
      {/* Entregado */}
      {pedido.estado === 'listo' && (
        <div className="p-2 border-t" style={{ borderColor: '#4A3D2C' }}>
          <button
            onClick={() => onUpdateStatus('entregado')}
            className="btn-primary w-full justify-center text-xs py-2"
            style={{ background: '#6B7280' }}
          >
            <CheckCircle size={13} /> Marcar Entregado
          </button>
        </div>
      )}
    </div>
  )
}
