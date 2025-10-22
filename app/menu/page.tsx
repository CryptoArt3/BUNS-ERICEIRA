'use client'

import MenuGrid from '@/components/menu/MenuGrid'

export default function MenuPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h2 className="text-4xl sm:text-5xl font-display mb-2 text-buns-yellow tracking-wide">
        🍟 Menu BUNS
      </h2>
      <p className="text-white/70 mb-6">
        Escolhe os teus favoritos — adiciona ao carrinho e segue para checkout.
      </p>

      <MenuGrid />
    </main>
  )
}
