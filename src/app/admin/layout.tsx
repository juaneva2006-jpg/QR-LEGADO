'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, UtensilsCrossed, BarChart3, QrCode,
  Lightbulb, ShoppingBag, LogOut, ChefHat, Menu, User, FileText
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// ============================================================
// ADMIN LAYOUT — Sidebar + Autenticación
// ============================================================

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/menu', label: 'Gestión Menú', icon: UtensilsCrossed },
  { href: '/admin/clientes', label: 'Clientes (CRM)', icon: User },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/admin/facturas', label: 'Facturas', icon: FileText },
  { href: '/admin/qr', label: 'Códigos QR', icon: QrCode },
  { href: '/admin/sugerencias', label: 'Sugerencias IA', icon: Lightbulb },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  function isActive(href: string, exact = false) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#0F0A04' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed md:relative top-0 left-0 h-screen z-50 transition-transform duration-300 admin-sidebar
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b" style={{ borderColor: '#4A3D2C' }}>
          <div className="font-playfair text-2xl text-legado-orange font-bold">LEGADO</div>
          <div className="text-xs text-legado-cream-muted tracking-widest">GASTROBAR · ADMIN</div>
        </div>

        {/* Nav */}
        <nav className="px-2 py-4 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`admin-nav-item ${active ? 'active' : ''}`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {active && (
                  <motion.div
                    layoutId="admin-active"
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{ background: 'rgba(232, 118, 58, 0.12)', zIndex: -1 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Cocina link */}
        <div className="px-2 mt-4 border-t pt-4" style={{ borderColor: '#4A3D2C' }}>
          <Link href="/cocina" className="admin-nav-item">
            <ChefHat size={18} />
            <span>Ver KDS Cocina</span>
          </Link>
        </div>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 px-2 py-4 border-t" style={{ borderColor: '#4A3D2C' }}>
          <button
            onClick={async () => {
              localStorage.removeItem('legado_role')
              await supabase.auth.signOut()
              router.push('/login')
            }}
            className="admin-nav-item w-full text-red-400 hover:text-red-300"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b"
             style={{ background: '#1A1208', borderColor: '#4A3D2C' }}>
          <div className="font-playfair text-lg text-legado-orange font-bold">LEGADO Admin</div>
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost p-1">
            <Menu size={22} />
          </button>
        </div>

        {children}
      </main>
    </div>
  )
}
