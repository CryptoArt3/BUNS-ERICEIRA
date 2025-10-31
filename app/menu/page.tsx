'use client'

import MenuGrid from '@/components/menu/MenuGrid'

export default function MenuPage() {
  return (
    <main className="container mx-auto px-4 pt-10 pb-20 space-y-6 sm:space-y-8">
      <h1 className="text-4xl sm:text-5xl font-display leading-tight tracking-tight">
        <span className="text-buns-yellow">BUNS</span>
        <span className="mx-2">Smash Menu</span>
      </h1>

      <p className="text-white/80 max-w-2xl text-base sm:text-lg">
        Escolhe os teus favoritos — adiciona ao carrinho e segue para checkout.
      </p>

      <MenuGrid />
    </main>
  )
}
