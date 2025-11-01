'use client'

import MenuGrid from '@/components/menu/MenuGrid'

export default function MenuPage() {
  return (
    <main className="mx-auto w-full max-w-[100vw] overflow-x-hidden px-3 sm:px-4 pt-10 pb-20 space-y-6 sm:space-y-8">
      {/* título com alinhamento perfeito */}
      <h1 className="text-4xl sm:text-5xl font-display leading-tight tracking-tight px-1">
        <span className="text-buns-yellow">BUNS</span>
        <span className="ml-2">Smash Menu</span>
      </h1>

      <p className="text-white/80 max-w-2xl text-base sm:text-lg px-1">
        Escolhe os teus favoritos — adiciona ao carrinho e segue para checkout.
      </p>

      {/* grid de produtos */}
      <div className="px-1">
        <MenuGrid />
      </div>
    </main>
  )
}
