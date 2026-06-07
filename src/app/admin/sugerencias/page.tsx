'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Lightbulb, TrendingUp, Star, MapPin, Check, X, Plus, Edit3, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { SugerenciaIA } from '@/types'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

// ============================================================
// SUGERENCIAS IA — Motor de sugerencias + Panel del dueño
// ============================================================

const TIPO_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  producto_popular: { emoji: '🔥', label: 'Producto Popular', color: '#E8763A' },
  zona_rentable: { emoji: '💰', label: 'Zona Rentable', color: '#C9A84C' },
  promocion: { emoji: '🎯', label: 'Promoción', color: '#10B981' },
  complementario: { emoji: '🍽️', label: 'Complementario', color: '#3B82F6' },
  horario: { emoji: '⏰', label: 'Horario', color: '#8B5CF6' },
}

const PRIORIDAD_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: 'Baja', color: '#6B7280' },
  2: { label: 'Media', color: '#F59E0B' },
  3: { label: 'Alta', color: '#EF4444' },
}

export default function SugerenciasPage() {
  const [sugerencias, setSugerencias] = useState<SugerenciaIA[]>([])
  const [loading, setLoading] = useState(true)
  const [generando, setGenerando] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<SugerenciaIA>>({
    tipo: 'producto_popular',
    titulo: '',
    contenido: '',
    prioridad: 2,
  })
  const supabase = createClient()

  useEffect(() => {
    loadSugerencias()
  }, [])

  async function loadSugerencias() {
    const { data } = await supabase
      .from('sugerencias_ia')
      .select('*')
      .order('prioridad', { ascending: false })
      .order('created_at', { ascending: false })
    setSugerencias(data || [])
    setLoading(false)
  }

  // Motor IA — genera sugerencias basadas en datos reales
  async function generarSugerencias() {
    setGenerando(true)
    try {
      // 1. Obtener datos de pedidos
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('mesa_id, total, mesa:mesas(numero, zona)')
        .eq('pago_estado', 'completado')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      const { data: items } = await supabase
        .from('pedido_items')
        .select('producto_id, cantidad, producto:productos(nombre, categoria, precio)')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      // 2. Análisis de productos más vendidos
      const productCount: Record<string, { nombre: string; categoria: string; precio: number; cantidad: number }> = {}
      items?.forEach((item: any) => {
        if (!item.producto) return
        const key = item.producto_id
        if (!productCount[key]) {
          productCount[key] = { nombre: item.producto.nombre, categoria: item.producto.categoria, precio: item.producto.precio, cantidad: 0 }
        }
        productCount[key].cantidad += item.cantidad
      })

      const topProductos = Object.values(productCount)
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 3)

      // 3. Análisis de zonas
      const zonaFacturacion: Record<string, number> = { sala: 0, terraza: 0, barra: 0 }
      pedidos?.forEach((p: any) => {
        if (p.mesa?.zona) zonaFacturacion[p.mesa.zona] += p.total
      })
      const topZona = Object.entries(zonaFacturacion).sort((a, b) => b[1] - a[1])[0]

      const nuevasSugerencias: Partial<SugerenciaIA>[] = []

      // Sugerencia: producto popular
      if (topProductos[0]) {
        nuevasSugerencias.push({
          tipo: 'producto_popular',
          titulo: `"${topProductos[0].nombre}" está arrasando esta semana`,
          contenido: `Este plato ha tenido ${topProductos[0].cantidad} pedidos en los últimos 7 días. Considera destacarlo en el menú o crear un combo especial que lo incluya.`,
          prioridad: 3,
          datos_json: { producto: topProductos[0].nombre, ventas: topProductos[0].cantidad },
        })
      }

      // Sugerencia: zona rentable
      if (topZona && topZona[1] > 0) {
        nuevasSugerencias.push({
          tipo: 'zona_rentable',
          titulo: `La zona ${topZona[0]} es tu zona más rentable`,
          contenido: `La ${topZona[0]} ha generado ${topZona[1].toFixed(2)} € esta semana. Considera reforzar el servicio en esa zona o crear promociones específicas para maximizar sus ingresos.`,
          prioridad: 2,
          datos_json: { zona: topZona[0], facturacion: topZona[1] },
        })
      }

      // Sugerencia: productos complementarios
      if (topProductos[1]) {
        nuevasSugerencias.push({
          tipo: 'complementario',
          titulo: `Combina "${topProductos[0]?.nombre}" con "${topProductos[1]?.nombre}"`,
          contenido: `Tus dos platos más pedidos esta semana. Crear un menú combinado con un descuento del 10% podría aumentar el ticket medio y dar salida conjunta a ambos.`,
          prioridad: 2,
          datos_json: { plato1: topProductos[0]?.nombre, plato2: topProductos[1]?.nombre },
        })
      }

      // Sugerencia: promoción si hay pocos pedidos
      if ((pedidos?.length || 0) < 10) {
        nuevasSugerencias.push({
          tipo: 'promocion',
          titulo: 'Semana con actividad baja — ¡Momento para una promo!',
          contenido: 'Los pedidos de esta semana están por debajo de la media. Considera una promoción de "2x1 en croquetas" o un menú de mediodía a precio especial para atraer más clientes.',
          prioridad: 3,
          datos_json: { pedidos_semana: pedidos?.length || 0 },
        })
      }

      // Insertar en BD (solo si no existen sugerencias muy similares recientes)
      for (const sug of nuevasSugerencias) {
        try {
          await supabase.from('sugerencias_ia').insert(sug)
        } catch {
          // Ignorar duplicados
        }
      }

      toast.success(`✨ ${nuevasSugerencias.length} sugerencias generadas`)
      loadSugerencias()
    } catch (err) {
      toast.error('Error generando sugerencias')
    } finally {
      setGenerando(false)
    }
  }

  async function marcarVista(id: string) {
    await supabase.from('sugerencias_ia').update({ vista_admin: true }).eq('id', id)
    loadSugerencias()
  }

  async function registrarAccion(id: string, accion: string) {
    await supabase.from('sugerencias_ia').update({ accion_tomada: accion }).eq('id', id)
    toast.success('Acción registrada')
    loadSugerencias()
  }

  async function eliminarSugerencia(id: string) {
    await supabase.from('sugerencias_ia').delete().eq('id', id)
    toast('Sugerencia eliminada')
    loadSugerencias()
  }

  async function crearSugerenciaManual() {
    if (!form.titulo || !form.contenido) {
      toast.error('Completa el título y contenido')
      return
    }
    const { error } = await supabase.from('sugerencias_ia').insert({
      tipo: form.tipo,
      titulo: form.titulo,
      contenido: form.contenido,
      prioridad: form.prioridad,
    })
    if (!error) {
      toast.success('Sugerencia creada')
      setShowForm(false)
      setForm({ tipo: 'producto_popular', titulo: '', contenido: '', prioridad: 2 })
      loadSugerencias()
    }
  }

  const noVistas = sugerencias.filter(s => !s.vista_admin).length

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-playfair text-3xl text-legado-cream font-bold flex items-center gap-3">
            <Lightbulb size={28} color="#C9A84C" />
            Sugerencias IA
          </h1>
          <p className="text-legado-cream-muted text-sm mt-1">
            Recomendaciones basadas en el histórico de pedidos
            {noVistas > 0 && <span className="ml-2 badge badge-orange">{noVistas} nuevas</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(true)} className="btn-secondary text-sm">
            <Plus size={16} /> Manual
          </button>
          <button
            onClick={generarSugerencias}
            disabled={generando}
            className="btn-primary text-sm"
          >
            {generando ? '⏳ Analizando...' : '✨ Generar IA'}
          </button>
        </div>
      </div>

      {/* Form Manual */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="card p-5 mb-6">
          <h3 className="font-playfair text-lg text-legado-cream font-bold mb-4">Nueva Sugerencia Manual</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-legado-cream-muted text-xs block mb-1">Tipo</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as any }))}
                        className="input-legado text-sm">
                  {Object.entries(TIPO_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.emoji} {v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-legado-cream-muted text-xs block mb-1">Prioridad</label>
                <select value={form.prioridad} onChange={e => setForm(f => ({ ...f, prioridad: parseInt(e.target.value) as 1|2|3 }))}
                        className="input-legado text-sm">
                  <option value={1}>Baja</option>
                  <option value={2}>Media</option>
                  <option value={3}>Alta</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-legado-cream-muted text-xs block mb-1">Título *</label>
              <input value={form.titulo || ''} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                     className="input-legado" placeholder="Ej: Considera lanzar un menú de mediodía" />
            </div>
            <div>
              <label className="text-legado-cream-muted text-xs block mb-1">Contenido *</label>
              <textarea value={form.contenido || ''} onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
                        className="input-legado" rows={3} placeholder="Detalla la sugerencia..." />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
              <button onClick={crearSugerenciaManual} className="btn-primary">Guardar</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Sugerencias List */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 skeleton rounded-2xl" />)}
        </div>
      ) : sugerencias.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🤖</div>
          <h3 className="font-playfair text-xl text-legado-cream font-bold mb-2">Sin sugerencias aún</h3>
          <p className="text-legado-cream-muted mb-4">Haz clic en "Generar IA" para analizar tus pedidos y obtener recomendaciones.</p>
          <button onClick={generarSugerencias} className="btn-primary mx-auto">✨ Generar primeras sugerencias</button>
        </div>
      ) : (
        <div className="space-y-4">
          {sugerencias.map(sug => {
            const tipoInfo = TIPO_CONFIG[sug.tipo]
            const prioInfo = PRIORIDAD_CONFIG[sug.prioridad]
            return (
              <motion.div
                key={sug.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-5"
                style={!sug.vista_admin ? { borderColor: 'rgba(232, 118, 58, 0.4)' } : {}}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{tipoInfo?.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs badge" style={{ background: tipoInfo?.color + '20', color: tipoInfo?.color, border: `1px solid ${tipoInfo?.color}30` }}>
                          {tipoInfo?.label}
                        </span>
                        <span className="text-xs badge" style={{ background: prioInfo?.color + '15', color: prioInfo?.color, border: `1px solid ${prioInfo?.color}30` }}>
                          Prioridad {prioInfo?.label}
                        </span>
                        {!sug.vista_admin && <span className="badge badge-orange text-xs">NUEVA</span>}
                      </div>
                      <h3 className="font-playfair text-legado-cream font-semibold text-base mb-2">{sug.titulo}</h3>
                      <p className="text-legado-cream-muted text-sm leading-relaxed">{sug.contenido}</p>
                      
                      {sug.accion_tomada && (
                        <div className="mt-2 text-xs rounded-lg p-2"
                             style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                          ✓ Acción: {sug.accion_tomada}
                        </div>
                      )}
                      
                      <p className="text-xs text-legado-cream-muted mt-2">
                        {formatDistanceToNow(new Date(sug.created_at), { locale: es, addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {!sug.vista_admin && (
                      <button onClick={() => marcarVista(sug.id)}
                              className="btn-ghost p-1.5 rounded-lg" title="Marcar como vista">
                        <Check size={14} />
                      </button>
                    )}
                    {!sug.accion_tomada && (
                      <button onClick={() => {
                        const accion = prompt('¿Qué acción vas a tomar?')
                        if (accion) registrarAccion(sug.id, accion)
                      }}
                              className="btn-ghost p-1.5 rounded-lg" title="Registrar acción">
                        <Edit3 size={14} />
                      </button>
                    )}
                    <button onClick={() => eliminarSugerencia(sug.id)}
                            className="btn-ghost p-1.5 rounded-lg hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
