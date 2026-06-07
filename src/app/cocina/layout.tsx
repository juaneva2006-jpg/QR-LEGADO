import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cocina · KDS — Legado Gastrobar',
  description: 'Panel de cocina - Kitchen Display System',
}

export default function CocinaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#0F0A04' }}>
      {children}
    </div>
  )
}
