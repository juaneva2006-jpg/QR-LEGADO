'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, User, ChefHat, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

// ============================================================
// LOGIN PAGE — Para staff (cocina y admin)
// ============================================================

export default function LoginPage() {
  const [role, setRole] = useState<'admin' | 'cocina' | null>(null)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!role) return
    setLoading(true)

    try {
      // Simular retraso de red
      await new Promise(r => setTimeout(r, 600))

      if (role === 'admin' && password === 'admin1234') {
        localStorage.setItem('legado_role', 'admin')
        toast.success(`Bienvenido 👋`)
        router.push('/admin')
        return
      }
      
      if (role === 'cocina' && password === 'cocina1234') {
        localStorage.setItem('legado_role', 'cocina')
        toast.success(`Bienvenido 👋`)
        router.push('/cocina')
        return
      }

      throw new Error('Contraseña incorrecta')
    } catch (err: any) {
      toast.error('Contraseña incorrecta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-legado-dark flex items-center justify-center px-4">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-5"
             style={{ background: 'radial-gradient(circle, #E8763A, transparent)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-5"
             style={{ background: 'radial-gradient(circle, #C9A84C, transparent)', filter: 'blur(40px)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="font-playfair text-4xl text-legado-orange font-bold mb-1">LEGADO</div>
          <div className="text-legado-cream-muted tracking-widest text-xs uppercase">Gastrobar · Personal</div>
        </div>

        {/* Card */}
        <div className="card p-6 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {!role ? (
              <motion.div
                key="role-select"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h1 className="text-legado-cream font-semibold text-lg">Acceso Personal</h1>
                  <p className="text-legado-cream-muted text-sm">Selecciona tu área de trabajo</p>
                </div>

                <button
                  onClick={() => setRole('cocina')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all"
                  style={{ background: '#2A1F10', borderColor: '#4A3D2C' }}
                >
                  <div className="p-3 rounded-full" style={{ background: 'rgba(232, 118, 58, 0.1)' }}>
                    <ChefHat size={24} color="#E8763A" />
                  </div>
                  <div className="text-left">
                    <div className="text-legado-cream font-medium text-lg">Cocina</div>
                    <div className="text-legado-cream-muted text-xs">Gestión de pedidos (KDS)</div>
                  </div>
                </button>

                <button
                  onClick={() => setRole('admin')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all"
                  style={{ background: '#2A1F10', borderColor: '#4A3D2C' }}
                >
                  <div className="p-3 rounded-full" style={{ background: 'rgba(201, 168, 76, 0.1)' }}>
                    <Lock size={24} color="#C9A84C" />
                  </div>
                  <div className="text-left">
                    <div className="text-legado-cream font-medium text-lg">Administrador</div>
                    <div className="text-legado-cream-muted text-xs">Panel de control y menú</div>
                  </div>
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="password-input"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => { setRole(null); setPassword('') }} className="btn-ghost p-2 -ml-2">
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h1 className="text-legado-cream font-semibold">
                      Acceso {role === 'admin' ? 'Administrador' : 'Cocina'}
                    </h1>
                    <p className="text-legado-cream-muted text-xs">Introduce tu contraseña</p>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-legado text-lg tracking-widest text-center"
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full justify-center py-3 mt-2"
                  >
                    {loading ? 'Verificando...' : '🔑 Entrar'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-legado-cream-muted mt-6">
          ¿Eres cliente? <a href="/menu?mesa=1" className="text-legado-orange">Escanea el QR de tu mesa</a>
        </p>
      </motion.div>
    </div>
  )
}
