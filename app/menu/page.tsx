'use client'

import MenuGrid from '@/components/menu/MenuGrid'

export default function MenuPage() {
  return (
    <main className="container mx-auto px-4 py-8 space-y-3">
      <h1 className="text-5xl font-display leading-tight">
        <span className="text-buns-yellow">BUNS</span> — Menu
      </h1>

      <p className="text-white/80 max-w-2xl">
        Escolhe os teus favoritos — adiciona ao carrinho e segue para checkout.
      </p>

      <MenuGrid />
    </main>
  )
}
