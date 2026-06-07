'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Phone, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cartStore'
import toast from 'react-hot-toast'

// ============================================================
// CLIENT REGISTER MODAL — Registro rápido con nombre + teléfono
// ============================================================

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ClientRegisterModal({ open, onClose, onSuccess }: Props) {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedOtp, setGeneratedOtp] = useState<string>('')
  const { setCliente } = useCartStore()
  const supabase = createClient()

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !telefono.trim()) {
      toast.error('Por favor completa todos los campos')
      return
    }
    if (telefono.replace(/\D/g, '').length < 9) {
      toast.error('Introduce un número de teléfono válido')
      return
    }

    setLoading(true)
    try {
      // Llamada real a la API de Twilio Verify
      const res = await fetch('/api/verify/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: telefono.trim() })
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar SMS')
      }

      toast.success(`Código enviado a ${telefono}`, {
        duration: 5000,
        icon: '📱',
      })
      
      setStep('otp')
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar código')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) {
      toast.error('Introduce un código válido de 6 dígitos.')
      return
    }

    setLoading(true)
    try {
      // Verificar con la API de Twilio
      const res = await fetch('/api/verify/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: telefono.trim(), code: otp })
      })
      const verifyData = await res.json()

      if (!res.ok) {
        throw new Error(verifyData.error || 'Código incorrecto')
      }

      // Crear o recuperar cliente en la BD
      const { data, error } = await supabase
        .from('clientes')
        .insert({ nombre: nombre.trim(), telefono: telefono.trim() })
        .select()
        .single()

      if (error) {
        // Si ya existe (conflicto), buscar por teléfono
        const { data: existing } = await supabase
          .from('clientes')
          .select('*')
          .eq('telefono', telefono.trim())
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (existing) {
          setCliente(existing)
          toast.success(`¡Bienvenido de nuevo, ${existing.nombre}!`)
          onSuccess()
          return
        }
      }

      if (data) {
        setCliente(data)
        toast.success(`¡Bienvenido, ${data.nombre}! 🎉`)
        onSuccess()
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al verificar. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setStep('form')
    setOtp('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 bottom-0 top-auto md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-50 rounded-t-3xl md:rounded-3xl overflow-hidden"
            style={{ background: '#1A1208', border: '1px solid #4A3D2C' }}
          >
            {/* Handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 rounded-full" style={{ background: '#4A3D2C' }} />
            </div>

            <div className="px-6 pb-8 pt-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-playfair text-2xl text-legado-cream font-bold">
                    {step === 'form' ? 'Identificarse' : 'Verificar código'}
                  </h2>
                  <p className="text-legado-cream-muted text-sm mt-1">
                    {step === 'form'
                      ? 'Para hacer tu pedido, necesitamos tus datos'
                      : 'Introduce el código que te enviamos por SMS'}
                  </p>
                </div>
                <button onClick={handleClose} className="btn-ghost p-1">
                  <X size={20} />
                </button>
              </div>

              {step === 'form' ? (
                <form onSubmit={handleSubmitForm} className="space-y-4">
                  <div>
                    <label className="text-legado-cream-muted text-sm block mb-2">
                      <User size={13} className="inline mr-1.5" />
                      Tu nombre
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={e => setNombre(e.target.value)}
                      placeholder="Ej: María García"
                      className="input-legado"
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-legado-cream-muted text-sm block mb-2">
                      <Phone size={13} className="inline mr-1.5" />
                      Número de teléfono
                    </label>
                    <input
                      type="tel"
                      value={telefono}
                      onChange={e => setTelefono(e.target.value)}
                      placeholder="Ej: +34 612 345 678"
                      className="input-legado"
                      autoComplete="tel"
                      required
                    />
                    <p className="text-xs text-legado-cream-muted mt-1">
                      Te enviaremos un código de verificación y tu factura por SMS
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full justify-center py-4 mt-2"
                  >
                    {loading ? 'Enviando código...' : '📱 Enviar código SMS'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {/* OTP Input */}
                  <div>
                    <label className="text-legado-cream-muted text-sm block mb-2">
                      <Shield size={13} className="inline mr-1.5" />
                      Código de 6 dígitos
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="input-legado text-center text-2xl tracking-widest font-bold"
                      maxLength={6}
                      autoComplete="one-time-code"
                      autoFocus
                    />
                  </div>

                  <div className="rounded-xl p-4 text-sm"
                       style={{ background: 'rgba(232, 118, 58, 0.08)', border: '1px solid rgba(232, 118, 58, 0.2)' }}>
                    <p className="text-legado-orange font-medium mb-1">ℹ️ SMS Oficial</p>
                    <p className="text-legado-cream-muted">
                      El código te ha sido enviado por SMS oficial desde el sistema de Twilio Verify. Revisa la bandeja de entrada de tu móvil.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="btn-primary w-full justify-center py-4"
                  >
                    {loading ? 'Verificando...' : '✓ Verificar y Continuar'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('form')}
                    className="btn-ghost w-full justify-center text-sm"
                  >
                    ← Cambiar teléfono
                  </button>
                </form>
              )}

              <p className="text-center text-xs text-legado-cream-muted mt-4">
                🔒 Tus datos solo se usan para gestionar tu pedido y enviar la factura
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
