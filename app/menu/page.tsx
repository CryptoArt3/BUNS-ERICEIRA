'use client'

import MenuGrid from '@/components/menu/MenuGrid'

export default function MenuPage() {
  return (
    <main className="container mx-auto px-4 pt-6 pb-8 space-y-4 sm:space-y-6">
      <h1 className="font-display leading-tight text-4xl sm:text-5xl">
        <span className="text-buns-yellow">BUNS</span>
        <span className="mx-2">—</span>
        <span>Menu</span>
      </h1>

      <p className="text-white/80 max-w-2xl">
        Escolhe os teus favoritos — adiciona ao carrinho e segue para checkout.
      </p>

      <MenuGrid />
    </main>
  )
}
