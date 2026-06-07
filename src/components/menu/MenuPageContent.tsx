'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, ChefHat, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cartStore'
import type { Producto, Mesa, ProductCategory } from '@/types'
import { CATEGORIAS } from '@/types'
import ProductCard from './ProductCard'
import CartDrawer from './CartDrawer'
import ClientRegisterModal from './ClientRegisterModal'
import toast from 'react-hot-toast'

// ============================================================
// MENÚ PAGE — Componente principal del cliente (Mobile-First)
// ============================================================

const CATEGORY_ORDER: ProductCategory[] = [
  'almuerzos', 'gildas', 'laterio', 'aperitivos',
  'frios_ensaladas', 'calientes', 'postres', 'bebidas'
]

export default function MenuPageContent() {
  const searchParams = useSearchParams()
  const mesaParam = searchParams.get('mesa')
  
  const [productos, setProductos] = useState<Producto[]>([])
  const [mesa, setMesa] = useState<Mesa | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('almuerzos')
  const [showCart, setShowCart] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  
  const { items, getTotalItems, setMesa: setCartMesa, cliente, checkAndClearExpired } = useCartStore()
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({})
  const supabase = createClient()

  // --- Cargar mesa y productos ---
  useEffect(() => {
    checkAndClearExpired()
    
    if (!mesaParam) {
      toast.error('Código QR inválido. Escanea el QR de tu mesa.')
      return
    }
    loadData()
  }, [mesaParam])

  async function loadData() {
    try {
      setLoading(true)
      
      // Cargar mesa
      const { data: mesaData, error: mesaError } = await supabase
        .from('mesas')
        .select('*')
        .eq('numero', parseInt(mesaParam!))
        .eq('activa', true)
        .single()

      if (mesaError || !mesaData) {
        toast.error('Mesa no encontrada. Solicita ayuda al personal.')
        return
      }

      // Si viene de otra mesa, vaciamos el carrito
      const currentMesaNumero = useCartStore.getState().mesa_numero
      if (currentMesaNumero !== null && currentMesaNumero !== mesaData.numero) {
        useCartStore.getState().clearCart()
      }

      setMesa(mesaData)
      setCartMesa(mesaData.id, mesaData.numero)

      // Cargar productos disponibles
      const { data: productosData } = await supabase
        .from('productos')
        .select('*')
        .eq('disponible', true)
        .order('categoria')
        .order('orden')

      setProductos(productosData || [])
    } catch (err) {
      toast.error('Error cargando el menú. Por favor recarga la página.')
    } finally {
      setLoading(false)
    }
  }

  // Agrupar productos por categoría
  const productosPorCategoria = CATEGORY_ORDER.reduce((acc, cat) => {
    const prods = productos.filter(p => p.categoria === cat)
    if (prods.length > 0) acc[cat] = prods
    return acc
  }, {} as Record<string, Producto[]>)

  // Categorías disponibles en el menú
  const categoriasDisponibles = CATEGORY_ORDER.filter(
    cat => productosPorCategoria[cat]?.length > 0
  )

  // Scroll a categoría al hacer click en nav
  function scrollToCategory(cat: ProductCategory) {
    setActiveCategory(cat)
    const el = categoryRefs.current[cat]
    if (el) {
      const offset = 120 // altura header + category nav
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  // Detectar categoría activa en scroll
  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY + 130
      for (const cat of CATEGORY_ORDER) {
        const el = categoryRefs.current[cat]
        if (el && el.offsetTop <= scrollY) {
          setActiveCategory(cat as ProductCategory)
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const totalItems = getTotalItems()

  if (loading) {
    return <MenuLoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-legado-dark pb-28">
      
      {/* ---- HEADER ---- */}
      <header className="glass sticky top-0 z-40 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div>
            <div className="font-playfair text-xl text-legado-orange font-bold">LEGADO</div>
            <div className="text-xs text-legado-cream-muted tracking-widest">GASTROBAR</div>
          </div>
          
          {mesa && (
            <div className="flex items-center gap-2 badge badge-orange">
              <span>Mesa {mesa.numero}</span>
              <span className="text-xs opacity-60">·</span>
              <span className="capitalize text-xs">{mesa.zona}</span>
            </div>
          )}
          
          <button
            onClick={() => setShowCart(true)}
            className="relative p-2 rounded-xl"
            style={{ background: 'rgba(232, 118, 58, 0.12)' }}
          >
            <ShoppingCart size={22} color="#E8763A" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
                    style={{ background: '#E8763A' }}>
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ---- CATEGORY NAV ---- */}
      <nav className="category-nav px-4 py-3 overflow-x-auto hide-scrollbar">
        <div className="flex gap-2 max-w-2xl mx-auto min-w-max">
          {categoriasDisponibles.map((cat) => {
            const info = CATEGORIAS[cat]
            const isActive = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => scrollToCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-legado-cream-muted'
                }`}
                style={isActive ? {
                  background: 'linear-gradient(135deg, #E8763A 0%, #C85E24 100%)',
                  boxShadow: '0 4px 12px rgba(232, 118, 58, 0.3)'
                } : {
                  background: 'rgba(255,255,255,0.05)'
                }}
              >
                <span>{info.emoji}</span>
                <span>{info.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* ---- MENU CONTENT ---- */}
      <main className="px-4 max-w-2xl mx-auto mt-4 space-y-8">
        {categoriasDisponibles.map((cat) => (
          <section
            key={cat}
            ref={el => { categoryRefs.current[cat] = el }}
            id={`cat-${cat}`}
          >
            {/* Category Header */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{CATEGORIAS[cat].emoji}</span>
              <div>
                <h2 className="font-playfair text-2xl text-legado-cream font-bold">
                  {CATEGORIAS[cat].label}
                </h2>
                <p className="text-legado-cream-muted text-xs">
                  {CATEGORIAS[cat].descripcion}
                </p>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 gap-3">
              {productosPorCategoria[cat]?.map((producto, idx) => (
                <motion.div
                  key={producto.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <ProductCard
                    producto={producto}
                    onShowRegister={() => setShowRegister(true)}
                  />
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* ---- CART FAB ---- */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setShowCart(true)}
            className="cart-fab btn-primary"
            aria-label="Ver carrito"
          >
            <ShoppingCart size={20} />
            <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
            <span className="font-playfair text-lg ml-2">
              {useCartStore.getState().getTotal().toFixed(2)} €
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ---- MODALS ---- */}
      <CartDrawer
        open={showCart}
        onClose={() => setShowCart(false)}
        mesa={mesa}
        onNeedRegister={() => {
          setShowCart(false)
          setShowRegister(true)
        }}
      />
      
      <ClientRegisterModal
        open={showRegister}
        onClose={() => setShowRegister(false)}
        onSuccess={() => {
          setShowRegister(false)
          setShowCart(true)
        }}
      />
    </div>
  )
}

function MenuLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-legado-dark">
      <div className="h-14 skeleton mb-2" />
      <div className="h-14 skeleton mb-4" />
      <div className="px-4 space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i}>
            <div className="h-7 skeleton w-40 mb-3" />
            <div className="space-y-3">
              {[1, 2].map(j => (
                <div key={j} className="h-28 skeleton rounded-2xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
