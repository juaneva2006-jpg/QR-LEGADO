'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag, Trash2, CreditCard, TableProperties } from 'lucide-react'
import Image from 'next/image'
import { useCartStore } from '@/store/cartStore'
import type { Mesa } from '@/types'
import toast from 'react-hot-toast'
import CheckoutModal from './CheckoutModal'

// ============================================================
// CART DRAWER — Carrito deslizante con desglose de precios
// ============================================================

interface Props {
  open: boolean
  onClose: () => void
  mesa: Mesa | null
  onNeedRegister: () => void
}

export default function CartDrawer({ open, onClose, mesa, onNeedRegister }: Props) {
  const [showCheckout, setShowCheckout] = useState(false)
  const { items, removeItem, updateQuantity, getSubtotal, getIVA, getTotal, cliente } = useCartStore()

  const subtotal = getSubtotal()
  const iva = getIVA()
  const total = getTotal()

  function handleCheckout() {
    if (!cliente) {
      onClose()
      onNeedRegister()
      return
    }
    if (items.length === 0) {
      toast.error('Añade productos antes de confirmar')
      return
    }
    setShowCheckout(true)
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col"
            style={{ background: '#1A1208', borderLeft: '1px solid #4A3D2C' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b"
                 style={{ borderColor: '#4A3D2C' }}>
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} color="#E8763A" />
                <h2 className="font-playfair text-xl text-legado-cream font-bold">Tu Pedido</h2>
              </div>
              <button onClick={onClose} className="btn-ghost p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Mesa badge */}
            {mesa && (
              <div className="px-5 py-3 flex items-center gap-2 border-b"
                   style={{ borderColor: '#4A3D2C', background: 'rgba(232, 118, 58, 0.05)' }}>
                <TableProperties size={14} color="#E8763A" />
                <span className="text-legado-cream-muted text-sm">Mesa</span>
                <span className="badge badge-orange">{mesa.numero} — {mesa.zona}</span>
                <span className="text-legado-cream-muted text-xs ml-auto">🔒 Bloqueada</span>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <div className="text-5xl mb-4">🛒</div>
                  <p className="text-legado-cream-muted">Tu carrito está vacío</p>
                  <p className="text-legado-cream-muted text-sm mt-1">Añade platos del menú</p>
                </div>
              ) : (
                items.map(item => (
                  <CartItemRow
                    key={item.producto.id}
                    item={item}
                    onUpdateQty={(qty) => updateQuantity(item.producto.id, qty)}
                    onRemove={() => removeItem(item.producto.id)}
                  />
                ))
              )}
            </div>

            {/* Price Summary */}
            {items.length > 0 && (
              <div className="border-t px-5 pt-4 pb-6 space-y-3 safe-bottom"
                   style={{ borderColor: '#4A3D2C' }}>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-legado-cream-muted">
                    <span>Subtotal</span>
                    <span>{subtotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm text-legado-cream-muted">
                    <span>IVA (10%)</span>
                    <span>{iva.toFixed(2)} €</span>
                  </div>
                  <div className="h-px" style={{ background: '#4A3D2C' }} />
                  <div className="flex justify-between font-bold text-legado-cream">
                    <span className="font-playfair text-lg">Total</span>
                    <span className="font-playfair text-xl text-legado-orange">
                      {total.toFixed(2)} €
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="btn-primary w-full justify-center py-4 text-base"
                >
                  <CreditCard size={18} />
                  {cliente ? 'Confirmar y Pagar' : 'Identificarse y Pagar'}
                </button>
                
                <p className="text-center text-xs text-legado-cream-muted">
                  🔒 Pago seguro · El pedido se envía a cocina tras el pago
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <CheckoutModal
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSuccess={() => {
          setShowCheckout(false)
          onClose()
        }}
        mesa={mesa}
      />
    </>
  )
}

// ---- Fila de item en el carrito ----
function CartItemRow({
  item,
  onUpdateQty,
  onRemove,
}: {
  item: { producto: { id: string; nombre: string; precio: number; imagen_url?: string }; cantidad: number }
  onUpdateQty: (qty: number) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      {/* Mini imagen */}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-legado-surface-2 flex-shrink-0 flex items-center justify-center">
        {item.producto.imagen_url ? (
          <Image src={item.producto.imagen_url} alt={item.producto.nombre} width={48} height={48} className="object-cover w-full h-full" />
        ) : (
          <span className="text-xl">🍽️</span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-legado-cream text-sm font-medium truncate">{item.producto.nombre}</p>
        <p className="text-legado-orange text-sm font-bold">{item.producto.precio.toFixed(2)} €</p>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-1.5">
        <button onClick={() => onUpdateQty(item.cantidad - 1)}
                className="w-7 h-7 rounded-lg border flex items-center justify-center text-legado-orange text-lg"
                style={{ borderColor: 'rgba(232, 118, 58, 0.3)' }}>
          −
        </button>
        <span className="text-legado-cream text-sm font-bold w-5 text-center">{item.cantidad}</span>
        <button onClick={() => onUpdateQty(item.cantidad + 1)}
                className="w-7 h-7 rounded-lg border flex items-center justify-center text-legado-orange text-lg"
                style={{ borderColor: 'rgba(232, 118, 58, 0.3)' }}>
          +
        </button>
        <button onClick={onRemove} className="p-1 ml-1 rounded-lg hover:bg-red-500/10 transition-colors">
          <Trash2 size={14} color="#EF4444" />
        </button>
      </div>
    </div>
  )
}
