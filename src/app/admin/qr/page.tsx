'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { QrCode, Download, Eye } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { createClient } from '@/lib/supabase/client'
import type { Mesa } from '@/types'
import toast from 'react-hot-toast'

// ============================================================
// QR CODES PAGE — Generador de QR por mesa
// ============================================================

export default function QRPage() {
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [loading, setLoading] = useState(true)
  const baseUrl = 'https://marketingdebolsillo.cloud/legado'
  const supabase = createClient()

  useEffect(() => {
    loadMesas()
  }, [])

  async function loadMesas() {
    const { data } = await supabase.from('mesas').select('*').order('numero')
    setMesas(data || [])
    setLoading(false)
  }

  function getMenuUrl(mesa: Mesa) {
    return `${baseUrl}/menu?mesa=${mesa.numero}`
  }

  function downloadQR(mesa: Mesa) {
    const canvas = document.getElementById(`qr-mesa-${mesa.numero}`) as HTMLCanvasElement
    if (!canvas) {
      toast.error('No se pudo generar el QR para descargar')
      return
    }
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `QR-Mesa-${mesa.numero}-Legado.png`
    a.click()
    toast.success(`QR Mesa ${mesa.numero} descargado`)
  }

  const mesas_sala = mesas.filter(m => m.zona === 'sala')
  const mesas_terraza = mesas.filter(m => m.zona === 'terraza')

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-playfair text-3xl text-legado-cream font-bold flex items-center gap-3">
            <QrCode size={28} color="#E8763A" /> Códigos QR
          </h1>
          <p className="text-legado-cream-muted text-sm mt-1">
            {mesas.length} mesas · Escanear abre el menú con la mesa pre-seleccionada
          </p>
        </div>
      </div>

      {/* URL Base */}
      <div className="card p-4 mb-6 flex items-center gap-3">
        <span className="text-legado-cream-muted text-sm">URL base:</span>
        <code className="text-legado-orange text-sm flex-1">{baseUrl}/menu?mesa=N</code>
      </div>

      {/* Zonas */}
      {[
        { label: '🏠 Sala Interior', mesas: mesas_sala },
        { label: '☀️ Terraza', mesas: mesas_terraza },
      ].map(({ label, mesas: zonasMesas }) => (
        <div key={label} className="mb-8">
          <h2 className="font-playfair text-xl text-legado-cream font-bold mb-4">{label}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-48 skeleton rounded-2xl" />
              ))
            ) : (
              zonasMesas.map(mesa => (
                <motion.div
                  key={mesa.id}
                  className="card p-4 text-center"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-legado-orange font-playfair font-bold text-lg mb-3">
                    Mesa {mesa.numero}
                  </div>

                  {/* QR Code */}
                  <div className="qr-container mx-auto mb-3 w-full max-w-[140px] bg-white p-2 rounded-xl">
                    <QRCodeCanvas
                      id={`qr-mesa-${mesa.numero}`}
                      value={getMenuUrl(mesa)}
                      size={130}
                      bgColor="#ffffff"
                      fgColor="#1A1208"
                      level="H"
                      marginSize={1}
                      imageSettings={{
                        src: '/legado/logo-qr.jpg',
                        x: undefined,
                        y: undefined,
                        height: 35,
                        width: 100,
                        excavate: true,
                      }}
                      style={{ width: '100%', height: 'auto' }}
                    />
                  </div>

                  <p className="text-legado-cream-muted text-xs mb-3 capitalize">{mesa.zona} · {mesa.capacidad} pax</p>

                  {/* Actions */}
                  <div className="flex gap-1.5">
                    <a
                      href={getMenuUrl(mesa)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost p-1.5 rounded-lg flex-1 justify-center text-xs flex items-center gap-1"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      <Eye size={12} /> Ver
                    </a>
                    <button
                      onClick={() => downloadQR(mesa)}
                      className="btn-primary p-1.5 rounded-lg flex-1 justify-center text-xs flex items-center gap-1"
                    >
                      <Download size={12} /> Descargar
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
