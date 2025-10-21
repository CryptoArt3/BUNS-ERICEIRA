'use client'

import { useEffect } from 'react'
import MenuGrid from '@/components/menu/MenuGrid'

export default function MenuPage() {
  useEffect(() => {}, [])

  return (
    <main className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-display">Menu</h2>
      <MenuGrid />
    </main>
  )
}
