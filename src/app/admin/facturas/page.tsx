'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Download, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { generateInvoicePDF } from '@/lib/pdf'
import toast from 'react-hot-toast'

export default function FacturasPage() {
  const [facturas, setFacturas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const dateInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadFacturas()
  }, [selectedDate])

  async function loadFacturas() {
    setLoading(true)
    
    // Crear rango de fechas (todo el día seleccionado)
    const startOfDay = new Date(selectedDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(selectedDate)
    endOfDay.setHours(23, 59, 59, 999)

    const { data } = await supabase
      .from('facturas')
      .select(`
        id,
        numero_factura,
        created_at,
        pedido:pedidos (
          id, total, subtotal, iva, estado, created_at,
          cliente:clientes (nombre, telefono),
          mesa:mesas (numero, zona),
          items:pedido_items (
            cantidad,
            producto:productos (nombre, precio)
          )
        )
      `)
      // .gte('created_at', startOfDay.toISOString())
      // .lte('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: false })
      
    // Filtro por fecha manual porque supabase rpc/join puede ser complicado si 'created_at' difiere
    // Usamos el filtro de Supabase en 'facturas.created_at'
    const { data: dateData } = await supabase
      .from('facturas')
      .select(`
        id, numero_factura, created_at,
        pedido:pedidos (
          id, total, subtotal, iva, estado, created_at,
          cliente:clientes (nombre, telefono),
          mesa:mesas (numero, zona),
          items:pedido_items (
            cantidad,
            producto:productos (nombre, precio)
          )
        )
      `)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: false })
      
    setFacturas(dateData || [])
    setLoading(false)
  }

  function handleDownload(factura: any) {
    try {
      generateInvoicePDF({
        facturaNumero: factura.numero_factura,
        mesa: factura.pedido.mesa,
        cliente: factura.pedido.cliente,
        items: factura.pedido.items,
        total: factura.pedido.total,
        subtotal: factura.pedido.subtotal,
        iva: factura.pedido.iva
      })
      toast.success('Factura descargada')
    } catch (err) {
      toast.error('Error al generar el PDF')
      console.error(err)
    }
  }

  const facturacionTotal = facturas.reduce((sum, f) => sum + (f.pedido?.total || 0), 0)

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair text-3xl text-legado-cream mb-2">Facturas Emitidas</h1>
          <p className="text-legado-cream-muted">Registro oficial de tickets de caja y comprobantes.</p>
        </div>
        
        <div 
          onClick={() => {
            if (dateInputRef.current) {
              try { dateInputRef.current.showPicker() } catch (e) { dateInputRef.current.focus() }
            }
          }}
          className="flex items-center gap-3 bg-[#1A1208] border border-[#4A3D2C] p-2 rounded-xl cursor-pointer hover:border-legado-orange transition-colors"
        >
          <Calendar size={20} className="text-legado-orange ml-2 pointer-events-none" />
          <input 
            ref={dateInputRef}
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-legado-cream outline-none border-none cursor-pointer"
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1A1208] border border-[#4A3D2C] p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-legado-cream-muted text-sm">Facturado este día</p>
            <p className="font-playfair text-3xl font-bold text-legado-orange mt-1">
              {facturacionTotal.toFixed(2)} €
            </p>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(232, 118, 58, 0.1)' }}>
            <FileText size={24} color="#E8763A" />
          </div>
        </div>
        <div className="bg-[#1A1208] border border-[#4A3D2C] p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-legado-cream-muted text-sm">Tickets emitidos</p>
            <p className="font-playfair text-3xl font-bold text-legado-cream mt-1">
              {facturas.length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(201, 168, 76, 0.1)' }}>
            <FileText size={24} color="#C9A84C" />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-[#1A1208] border border-[#4A3D2C] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#2A1F10] text-legado-cream-muted text-sm border-b border-[#4A3D2C]">
                <th className="p-4 font-medium">Factura Nº</th>
                <th className="p-4 font-medium">Hora</th>
                <th className="p-4 font-medium">Cliente / Mesa</th>
                <th className="p-4 font-medium">Productos</th>
                <th className="p-4 font-medium text-right">Total</th>
                <th className="p-4 font-medium text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-legado-cream-muted">Cargando facturas...</td>
                </tr>
              ) : facturas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-legado-cream-muted">
                    No hay facturas registradas en la fecha seleccionada.
                  </td>
                </tr>
              ) : facturas.map((factura) => (
                <tr key={factura.id} className="border-b border-[#4A3D2C] last:border-0 hover:bg-[#2A1F10]/50 transition-colors">
                  <td className="p-4 text-sm font-mono text-legado-cream">
                    {factura.numero_factura}
                  </td>
                  <td className="p-4 text-sm text-legado-cream-muted">
                    {format(new Date(factura.created_at), 'HH:mm')}
                  </td>
                  <td className="p-4 text-sm text-legado-cream">
                    {factura.pedido?.cliente?.nombre || 'Anónimo'}
                    <span className="block text-xs text-legado-cream-muted">
                      {factura.pedido?.mesa?.numero ? `Mesa ${factura.pedido.mesa.numero}` : 'Barra'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-legado-cream-muted max-w-[200px] truncate">
                    {factura.pedido?.items?.map((i: any) => `${i.cantidad}x ${i.producto.nombre}`).join(', ')}
                  </td>
                  <td className="p-4 text-sm text-legado-orange font-bold text-right">
                    {factura.pedido?.total?.toFixed(2)} €
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleDownload(factura)}
                      className="p-2 text-legado-cream hover:text-legado-orange bg-[#2A1F10] hover:bg-legado-orange/10 rounded-lg transition-colors inline-flex items-center gap-2"
                      title="Descargar PDF"
                    >
                      <Download size={16} /> <span className="text-xs hidden md:inline">PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
