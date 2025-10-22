// components/menu/ProductCard.tsx
'use client'

import { useMemo, useRef, useState } from 'react'
import type { Product } from './data'
import { useCart } from '@/components/cart/CartContext'

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart()

  // ⬇️ se quiser “Menu” pré-selecionado, mude 'burger' para 'menu'
  const [variant, setVariant] = useState<'burger' | 'menu'>('burger')

  const cardRef = useRef<HTMLDivElement>(null)

  const hasMenu = typeof product.menuPrice === 'number'
  const price = useMemo(
    () => (variant === 'menu' && hasMenu ? product.menuPrice! : product.price),
    [variant, hasMenu, product.price, product.menuPrice]
  )

  function handleAdd() {
    const name =
      variant === 'menu' && hasMenu ? `${product.name} — Menu` : product.name
    add({
      id: product.id + (variant === 'menu' && hasMenu ? '-menu' : ''),
      name,
      price,
      qty: 1,
    })
  }

  // tilt leve “crypto”
  function handleMove(e: React.MouseEvent) {
    const el = cardRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    const rx = (py - 0.5) * 6
    const ry = (px - 0.5) * -6
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`
  }
  function handleLeave() {
    const el = cardRef.current
    if (!el) return
    el.style.transform = `rotateX(0deg) rotateY(0deg)`
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="group relative rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5 shadow-buns transition-transform will-change-transform"
    >
      {/* glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 blur-md transition group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(600px 120px at 10% -10%, rgba(255,212,0,.25), transparent 60%)',
        }}
      />

      {/* imagem / fallback */}
      <div className="mb-3 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="h-40 w-full object-cover"
          />
        ) : (
          <div className="h-40 w-full bg-gradient-to-br from-white/10 to-white/0" />
        )}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl">{product.name}</h3>
          {product.description && (
            <p className="mt-1 text-sm text-white/70">{product.description}</p>
          )}
          {product.tags?.includes('veg') && (
            <span className="mt-2 inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-200">
              Veggie
            </span>
          )}
          {product.tags?.includes('spicy') && (
            <span className="ml-2 mt-2 inline-block rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-200">
              Picante
            </span>
          )}
        </div>

        <div className="text-right">
          <div className="font-display text-lg text-buns-yellow">
            {price.toFixed(2)} €
          </div>

          {hasMenu && (
            <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-black/40 p-1 text-sm">
              <button
                onClick={() => setVariant('burger')}
                className={`rounded-lg px-3 py-2 font-medium transition ${
                  variant === 'burger'
                    ? 'bg-white/20 text-white shadow-inner'
                    : 'hover:bg-white/10 text-white/70'
                }`}
              >
                🍔 Burger
              </button>
              <button
                onClick={() => setVariant('menu')}
                className={`rounded-lg px-3 py-2 font-medium transition ${
                  variant === 'menu'
                    ? 'bg-buns-yellow text-black shadow-inner'
                    : 'hover:bg-white/10 text-white/80'
                }`}
              >
                🍟 Menu
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <button onClick={handleAdd} className="btn btn-primary w-full">
          Adicionar
        </button>
      </div>
    </div>
  )
}
