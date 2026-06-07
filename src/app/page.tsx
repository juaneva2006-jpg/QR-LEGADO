'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function HomePage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-legado-dark relative overflow-hidden">
      {/* Hero background with overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('/hero-bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.35)',
        }}
      />
      
      {/* Orange gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-legado-dark via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="font-playfair text-5xl md:text-7xl font-bold tracking-widest mb-2"
               style={{ color: '#E8763A', textShadow: '0 0 60px rgba(232, 118, 58, 0.3)' }}>
            LEGADO
          </div>
          <div className="text-legado-cream-muted tracking-[0.4em] text-sm uppercase">
            G A S T R O B A R
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-12"
        >
          <h1 className="font-playfair text-3xl md:text-5xl text-legado-cream mb-4 leading-tight">
            Cocina de herencia
          </h1>
          <p className="text-legado-cream-muted text-base md:text-lg max-w-md mx-auto">
            Un lugar donde el tiempo se detiene y cada momento se vuelve recuerdo
          </p>
        </motion.div>

        {/* CTA Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-1 gap-4 w-full max-w-sm"
        >
          {/* Para clientes — escanear QR */}
          <div className="glass rounded-2xl p-6 text-left">
            <div className="text-3xl mb-3">📱</div>
            <h2 className="font-playfair text-xl text-legado-cream mb-2">¿Cliente?</h2>
            <p className="text-legado-cream-muted text-sm mb-4">
              Escanea el código QR de tu mesa para ver la carta y pedir.
            </p>
            <Link href="/menu?mesa=1" className="btn-primary w-full justify-center text-sm">
              Ver la carta
            </Link>
          </div>

          {/* Para staff */}
          <div className="glass rounded-2xl p-4 flex items-center gap-4">
            <div className="text-2xl">👨‍🍳</div>
            <div className="flex-1">
              <p className="text-legado-cream text-sm font-medium">¿Personal del restaurante?</p>
              <p className="text-legado-cream-muted text-xs">Accede al panel de cocina o admin</p>
            </div>
            <Link href="/login" className="btn-secondary text-sm px-3 py-2 whitespace-nowrap">
              Entrar
            </Link>
          </div>
        </motion.div>

        {/* Version note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 text-legado-cream-muted text-xs"
        >
          Sistema de pedidos QR · Legado Gastrobar © 2024
        </motion.p>
      </div>
    </main>
  )
}
