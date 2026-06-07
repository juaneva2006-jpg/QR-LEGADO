'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, CheckCircle, Loader, FileText, MessageSquare, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateInvoicePDF } from '@/lib/pdf'
import { useCartStore } from '@/store/cartStore'
import type { Mesa } from '@/types'
import toast from 'react-hot-toast'

// ============================================================
// CHECKOUT MODAL — PayPal simulado + Post-pago (PDF + SMS)
// ============================================================

type CheckoutStep = 'summary' | 'payment' | 'processing' | 'success'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  mesa: Mesa | null
}

export default function CheckoutModal({ open, onClose, onSuccess, mesa }: Props) {
  const [step, setStep] = useState<CheckoutStep>('summary')
  const [pedidoId, setPedidoId] = useState<string | null>(null)
  const [facturaNumero, setFacturaNumero] = useState<string | null>(null)

  const { items, getSubtotal, getIVA, getTotal, mesa_id, cliente, clearCart } = useCartStore()
  const supabase = createClient()

  async function handlePayment() {
    setStep('processing')
    
    try {
      // Simular demora PayPal (800ms)
      await new Promise(r => setTimeout(r, 800))
      
      // 1. Crear pedido en BD
      const subtotal = getSubtotal()
      const iva = getIVA()
      const total = getTotal()

      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          mesa_id,
          cliente_id: cliente?.id,
          estado: 'pendiente',
          pago_estado: 'completado',
          pago_id: `PAYPAL_SIM_${Date.now()}`,
          subtotal,
          iva,
          total,
        })
        .select()
        .single()

      if (pedidoError || !pedido) {
        throw new Error('Error creando el pedido')
      }

      // 2. Insertar items del pedido
      const itemsToInsert = items.map(item => ({
        pedido_id: pedido.id,
        producto_id: item.producto.id,
        cantidad: item.cantidad,
        precio_unitario: item.producto.precio,
        notas: item.notas,
      }))

      const { error: itemsError } = await supabase
        .from('pedido_items')
        .insert(itemsToInsert)

      if (itemsError) throw new Error('Error guardando items')

      // 3. Actualizar contador ventas_totales de productos
      for (const item of items) {
        try {
          await supabase.rpc('increment_ventas', {
            producto_id: item.producto.id,
            cantidad: item.cantidad
          })
        } catch {
          // Ignorar si la función no existe aún
        }
      }

      setPedidoId(pedido.id)

      // 4. Generar número de factura (simulado)
      const facturaNum = `LG-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`
      
      // 5. Crear factura en BD
      const { data: factura } = await supabase
        .from('facturas')
        .insert({
          pedido_id: pedido.id,
          numero_factura: facturaNum,
          sms_enviado: true, // simulado
          sms_sid: `SM${Date.now()}`,
        })
        .select()
        .single()

      setFacturaNumero(facturaNum)

      // 6. Simular SMS
      console.log(`[SMS SIMULADO] Factura ${facturaNum} enviada a ${cliente?.telefono}`)
      
      setStep('success')
    } catch (err) {
      console.error(err)
      toast.error('Error procesando el pago. Inténtalo de nuevo.')
      setStep('payment')
    }
  }

  function handleClose() {
    if (step === 'processing') return // No cerrar durante proceso
    setStep('summary')
    onClose()
    if (step === 'success') {
      clearCart()
      onSuccess()
    }
  }

  function generatePDF() {
    generateInvoicePDF({
      facturaNumero: facturaNumero || '---',
      mesa,
      cliente,
      items,
      total: getTotal(),
      subtotal: getSubtotal(),
      iva: getIVA()
    })
    toast.success('Factura descargada')
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-2 bottom-2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-50 rounded-3xl overflow-y-auto max-h-[96vh]"
            style={{ background: '#1A1208', border: '1px solid #4A3D2C' }}
          >
            <div className="flex justify-center pt-2 md:hidden bg-[#1A1208] z-20 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ background: '#4A3D2C' }} />
            </div>

            <div className="flex flex-col max-h-[85vh] overflow-hidden">
              {/* Contenedor principal con scroll */}
              <div className="px-5 pb-24 pt-1 overflow-y-auto flex-1">
              {/* STEP: Summary */}
              {step === 'summary' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-playfair text-2xl text-legado-cream font-bold">Resumen</h2>
                    <button onClick={handleClose}><X size={20} color="#C9C0B0" /></button>
                  </div>

                  <div className="space-y-1 mb-3">
                    {items.map(item => (
                      <div key={item.producto.id} className="flex justify-between text-sm">
                        <span className="text-legado-cream-muted">
                          {item.cantidad}x {item.producto.nombre}
                        </span>
                        <span className="text-legado-cream">
                          {(item.producto.precio * item.cantidad).toFixed(2)} €
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl p-3 space-y-1.5 mb-4"
                       style={{ background: '#2A1F10', border: '1px solid #4A3D2C' }}>
                    <div className="flex justify-between text-sm text-legado-cream-muted">
                      <span>Subtotal</span><span>{getSubtotal().toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm text-legado-cream-muted">
                      <span>IVA 10%</span><span>{getIVA().toFixed(2)} €</span>
                    </div>
                    <div className="h-px" style={{ background: '#4A3D2C' }} />
                    <div className="flex justify-between font-bold">
                      <span className="font-playfair text-legado-cream">TOTAL</span>
                      <span className="font-playfair text-xl text-legado-orange">{getTotal().toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP: Payment (Pasarela de Prueba) */}
              {step === 'payment' && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => setStep('summary')} className="btn-ghost p-1">←</button>
                    <h2 className="font-playfair text-2xl text-legado-cream font-bold">Pago</h2>
                  </div>

                  <div className="rounded-2xl p-4 mb-4 text-center"
                       style={{ background: '#2A1F10', border: '2px solid #E8763A' }}>
                    <div className="text-xl font-bold text-legado-orange mb-1">Pasarela Simulada</div>
                    <p className="text-legado-cream-muted text-xs mb-3">Entorno seguro (No requiere datos)</p>
                    
                    <div className="space-y-2 text-left">
                      <div className="bg-black/30 rounded-lg p-3 border border-white/5 text-sm text-legado-cream">
                        <div className="flex justify-between mb-2">
                          <span className="text-legado-cream-muted">Concepto:</span>
                          <span>Pedido Mesa {mesa?.numero}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-legado-cream-muted">Importe Total:</span>
                          <span className="font-bold">{getTotal().toFixed(2)} €</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl p-3 mb-4 flex items-center gap-3"
                       style={{ background: 'rgba(232, 118, 58, 0.08)', border: '1px solid rgba(232, 118, 58, 0.2)' }}>
                    <span className="text-2xl">⚠️</span>
                    <p className="text-xs text-legado-cream-muted leading-tight">
                      <strong className="text-legado-orange">Modo Pruebas:</strong> Al confirmar simularemos un pago exitoso.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP: Processing */}
              {step === 'processing' && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader size={48} color="#E8763A" />
                  </motion.div>
                  <h2 className="font-playfair text-xl text-legado-cream font-bold text-center">
                    Procesando tu pago...
                  </h2>
                  <p className="text-legado-cream-muted text-sm text-center">
                    Por favor no cierres esta ventana
                  </p>
                </div>
              )}

              {/* STEP: Success */}
              {step === 'success' && (
                <div className="flex flex-col items-center text-center py-4 gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10 }}
                  >
                    <CheckCircle size={64} color="#10B981" />
                  </motion.div>
                  
                  <h2 className="font-playfair text-2xl text-legado-cream font-bold">
                    ¡Pedido Confirmado! 🎉
                  </h2>
                  
                  <p className="text-legado-cream-muted text-sm">
                    Tu pedido ya está en cocina. Te avisaremos cuando esté listo.
                  </p>

                  <div className="w-full rounded-xl p-4 space-y-3"
                       style={{ background: '#2A1F10', border: '1px solid #4A3D2C' }}>
                    <div className="flex items-center gap-3 text-sm">
                      <FileText size={16} color="#E8763A" />
                      <div className="text-left">
                        <p className="text-legado-cream font-medium">Factura generada</p>
                        <p className="text-legado-cream-muted text-xs">Nº {facturaNumero}</p>
                      </div>
                      <button 
                        onClick={generatePDF}
                        className="ml-auto badge cursor-pointer flex items-center gap-1 transition-colors"
                        style={{ background: '#E8763A', color: 'white', border: 'none' }}
                      >
                        <Download size={12} /> PDF
                      </button>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <MessageSquare size={16} color="#E8763A" />
                      <div className="text-left">
                        <p className="text-legado-cream font-medium">Notificaciones SMS activas</p>
                        <p className="text-legado-cream-muted text-xs">Avisaremos a {cliente?.telefono || 'tu móvil'} con los cambios</p>
                      </div>
                      <span className="ml-auto badge badge-orange">✓</span>
                    </div>
                  </div>
                </div>
              )}
              </div>

              {/* FOOTER PEGAJOSO CON BOTONES */}
              <div className="absolute bottom-0 left-0 w-full p-4 bg-[#1A1208] border-t border-[#4A3D2C] z-30 shadow-[0_-10px_20px_rgba(26,18,8,0.8)]">
                {step === 'summary' && (
                  <button
                    onClick={() => setStep('payment')}
                    className="btn-primary w-full justify-center py-3.5"
                  >
                    <CreditCard size={18} />
                    Proceder al Pago
                  </button>
                )}
                {step === 'payment' && (
                  <button onClick={handlePayment} className="btn-primary w-full justify-center py-3.5 text-base">
                    💳 Confirmar Pago · {getTotal().toFixed(2)} €
                  </button>
                )}
                {step === 'success' && (
                  <button onClick={handleClose} className="btn-primary w-full justify-center py-3.5">
                    Volver al menú
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
