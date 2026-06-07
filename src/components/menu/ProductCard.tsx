'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Info, AlertCircle } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import type { Producto } from '@/types'
import toast from 'react-hot-toast'

// ============================================================
// PRODUCT CARD — Tarjeta de producto mobile-first con alergenos
// ============================================================

interface Props {
  producto: Producto
  onShowRegister?: () => void
}

const ALERGEN_EMOJIS: Record<string, string> = {
  'Gluten': '🌾',
  'Huevo': '🥚',
  'Leche': '🥛',
  'Lácteos': '🧀',
  'Pescado': '🐟',
  'Crustáceos': '🦐',
  'Sulfitos': '⚗️',
  'Frutos secos': '🥜',
  'Soja': '🫘',
  'Mostaza': '🌿',
  'Pistacho': '🫘',
  'Apio': '🌿',
  'Sésamo': '🌱',
  'Altramuces': '🌼',
}

export default function ProductCard({ producto, onShowRegister }: Props) {
  const [showAlergenos, setShowAlergenos] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { addItem, removeItem, items, updateQuantity } = useCartStore()

  const cartItem = items.find(i => i.producto.id === producto.id)
  const quantity = cartItem?.cantidad || 0

  function handleAdd() {
    addItem(producto)
    toast.success(`${producto.nombre} añadido`, {
      icon: '✓',
      duration: 1500,
    })
  }

  function handleRemove() {
    if (quantity > 0) {
      updateQuantity(producto.id, quantity - 1)
    }
  }

  return (
    <motion.div
      layout
      className="card overflow-hidden"
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex gap-4 p-4">
        {/* --- Imagen --- */}
        <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-legado-surface-2">
          {producto.imagen_url && !imageError ? (
            <Image
              src={producto.imagen_url}
              alt={producto.nombre}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              sizes="96px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">
              {getProductEmoji(producto.categoria)}
            </div>
          )}
          
          {/* Destacado badge */}
          {producto.destacado && (
            <div className="absolute top-1 left-1 badge badge-gold text-xs px-1.5 py-0.5">
              ⭐
            </div>
          )}
        </div>

        {/* --- Info --- */}
        <div className="flex-1 min-w-0">
          <h3 className="font-playfair text-legado-cream font-semibold text-base leading-tight mb-1">
            {producto.nombre}
          </h3>
          
          {producto.descripcion && (
            <p className="text-legado-cream-muted text-xs leading-relaxed line-clamp-2 mb-2">
              {producto.descripcion}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-playfair text-legado-orange font-bold text-lg">
                {producto.precio.toFixed(2)} €
              </span>
              
              {/* Alergenos toggle */}
              {producto.alergenos && producto.alergenos.length > 0 && (
                <button
                  onClick={() => setShowAlergenos(!showAlergenos)}
                  className="p-1 rounded-lg transition-colors"
                  style={{ background: showAlergenos ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)' }}
                  aria-label="Ver alergenos"
                >
                  <AlertCircle size={14} color={showAlergenos ? '#FCA5A5' : '#6B5D4A'} />
                </button>
              )}
            </div>

            {/* Quantity controller */}
            <div className="flex items-center gap-2">
              {quantity > 0 ? (
                <div className="flex items-center gap-2 rounded-xl overflow-hidden"
                     style={{ background: 'rgba(232, 118, 58, 0.1)', border: '1px solid rgba(232, 118, 58, 0.3)' }}>
                  <button
                    onClick={handleRemove}
                    className="p-2 hover:bg-orange-500/20 transition-colors"
                    aria-label="Quitar uno"
                  >
                    <Minus size={14} color="#E8763A" />
                  </button>
                  <span className="text-legado-orange font-bold text-sm px-1 min-w-[20px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={handleAdd}
                    className="p-2 hover:bg-orange-500/20 transition-colors"
                    aria-label="Añadir uno"
                  >
                    <Plus size={14} color="#E8763A" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAdd}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{ background: 'linear-gradient(135deg, #E8763A 0%, #C85E24 100%)' }}
                  aria-label={`Añadir ${producto.nombre}`}
                >
                  <Plus size={18} color="white" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Alergenos expandibles --- */}
      <AnimatePresence>
        {showAlergenos && producto.alergenos && producto.alergenos.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-1 border-t"
                 style={{ borderColor: 'rgba(239, 68, 68, 0.15)', background: 'rgba(239, 68, 68, 0.03)' }}>
              <p className="text-xs text-red-400 font-medium mb-2">⚠️ Contiene alergenos:</p>
              <div className="flex flex-wrap gap-1">
                {producto.alergenos.map(alergeno => (
                  <span key={alergeno} className="allergen-pill">
                    {ALERGEN_EMOJIS[alergeno] || '⚠️'} {alergeno}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function getProductEmoji(categoria: string): string {
  const emojis: Record<string, string> = {
    almuerzos: '🥪',
    gildas: '🫒',
    laterio: '🐟',
    aperitivos: '🧀',
    frios_ensaladas: '🥗',
    calientes: '🔥',
    postres: '🍮',
    bebidas: '🍷',
  }
  return emojis[categoria] || '🍽️'
}
