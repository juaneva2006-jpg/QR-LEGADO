'use client'

import { Suspense } from 'react'
import MenuPageContent from '@/components/menu/MenuPageContent'

export default function MenuPage() {
  return (
    <Suspense fallback={<MenuSkeleton />}>
      <MenuPageContent />
    </Suspense>
  )
}

function MenuSkeleton() {
  return (
    <div className="min-h-screen bg-legado-dark">
      <div className="h-16 skeleton mb-4" />
      <div className="px-4 space-y-4">
        <div className="h-8 skeleton w-48" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 skeleton rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
