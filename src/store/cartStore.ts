import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, CartState, Cliente, Producto } from '@/types'

// ============================================================
// ZUSTAND STORE — Carrito Global con persistencia localStorage
// ============================================================

interface CartStore extends CartState {
  // Actions
  addItem: (producto: Producto, notas?: string) => void
  removeItem: (productoId: string) => void
  updateQuantity: (productoId: string, cantidad: number) => void
  clearCart: () => void
  checkAndClearExpired: () => void
  setMesa: (mesaId: string, mesaNumero: number) => void
  setCliente: (cliente: Cliente) => void
  
  // Computed
  getTotalItems: () => number
  getSubtotal: () => number
  getIVA: () => number
  getTotal: () => number
}

const IVA_RATE = 0.10 // 10% IVA restauración España

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      mesa_id: null,
      mesa_numero: null,
      cliente: null,
      last_updated: null,

      addItem: (producto, notas) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.producto.id === producto.id
          )
          
          if (existingIndex >= 0) {
            // Incrementar cantidad si ya existe
            const newItems = [...state.items]
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              cantidad: newItems[existingIndex].cantidad + 1,
            }
            return { items: newItems, last_updated: Date.now() }
          }
          
          // Añadir nuevo item
          return {
            items: [
              ...state.items,
              { producto, cantidad: 1, notas },
            ],
            last_updated: Date.now()
          }
        })
      },

      removeItem: (productoId) => {
        set((state) => ({
          items: state.items.filter((item) => item.producto.id !== productoId),
          last_updated: Date.now()
        }))
      },

      updateQuantity: (productoId, cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(productoId)
          return
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.producto.id === productoId ? { ...item, cantidad } : item
          ),
          last_updated: Date.now()
        }))
      },

      clearCart: () => set({ items: [], cliente: null, last_updated: null }),

      setMesa: (mesaId, mesaNumero) =>
        set({ mesa_id: mesaId, mesa_numero: mesaNumero }),

      setCliente: (cliente) => set({ cliente }),

      checkAndClearExpired: () => {
        const state = get()
        if (state.last_updated && state.items.length > 0) {
          const fifteenMins = 15 * 60 * 1000
          if (Date.now() - state.last_updated > fifteenMins) {
            get().clearCart()
          }
        }
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.cantidad, 0)
      },

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.producto.precio * item.cantidad,
          0
        )
      },

      getIVA: () => {
        return get().getSubtotal() * IVA_RATE
      },

      getTotal: () => {
        const subtotal = get().getSubtotal()
        return subtotal + subtotal * IVA_RATE
      },
    }),
    {
      name: 'legado-cart',
      // Solo persistir items y mesa, NO el cliente por seguridad
      partialize: (state) => ({
        items: state.items,
        mesa_id: state.mesa_id,
        mesa_numero: state.mesa_numero,
        last_updated: state.last_updated,
      }),
    }
  )
)
