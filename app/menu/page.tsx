'use client'

import MenuGrid from '@/components/menu/MenuGrid'

export default function MenuPage() {
  return (
    <main className="min-h-full w-full max-w-[100vw] overflow-x-hidden bg-buns-cream">

      {/* ── Hero strip ───────────────────────────────────── */}
      <div className="bg-black px-4 sm:px-6 pt-8 pb-7 border-b-4 border-buns-yellow">
        <div className="max-w-screen-xl mx-auto">

          {/* Sticker tag */}
          <div className="inline-flex items-center gap-1.5 bg-buns-yellow text-black text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mb-5">
            🔥 Smash Burgers · Ericeira
          </div>

          {/* Title */}
          <h1 className="font-display text-white uppercase leading-none tracking-tight"
              style={{ fontSize: 'clamp(2.8rem, 10vw, 5.5rem)' }}>
            BUNS<br />
            <span className="text-buns-yellow">MENU</span>
          </h1>

          {/* Sub-copy */}
          <p className="mt-4 text-white/50 text-sm font-medium max-w-sm">
            Escolhe os teus favoritos — adiciona ao carrinho e segue para checkout.
          </p>
        </div>
      </div>

      {/* ── Menu grid ────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-3 sm:px-4 pb-24">
        <MenuGrid />
      </div>

    </main>
  )
}
