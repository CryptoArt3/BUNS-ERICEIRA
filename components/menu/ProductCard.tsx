'use client'

import { useMemo, useRef, useState } from 'react'
import type { Product } from './data'
import { useCart } from '@/components/cart/CartContext'
import { Check } from 'lucide-react'

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart()

  const hasMenu = typeof product.menuPrice === 'number'
  const [variant, setVariant] = useState<'burger' | 'menu'>(hasMenu ? 'menu' : 'burger')

  const [added, setAdded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const price = useMemo(
    () => (variant === 'menu' && hasMenu ? product.menuPrice! : product.price),
    [variant, hasMenu, product.price, product.menuPrice]
  )

  const canTilt =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: fine)').matches

  function handleAdd() {
    const name = variant === 'menu' && hasMenu ? `${product.name} — Menu` : product.name
    add({
      id: product.id + (variant === 'menu' && hasMenu ? '-menu' : ''),
      name,
      price,
      qty: 1,
      variant,
    })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 900)
  }

  function handleMove(e: React.MouseEvent) {
    if (!canTilt) return
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
    if (!canTilt) return
    const el = cardRef.current
    if (!el) return
    el.style.transform = `rotateX(0deg) rotateY(0deg)`
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="group relative rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5 shadow-buns transition-transform will-change-transform overflow-hidden max-w-[100vw]"
    >
      {/* efeito glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 blur-md transition group-hover:opacity-100"
        style={{ background: 'radial-gradient(600px 120px at 10% -10%, rgba(255,212,0,.25), transparent 60%)' }}
      />

      {/* imagem com proporção estável */}
      <div className="mb-3 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="block w-full max-w-full aspect-[16/9] object-cover md:aspect-[3/1]"
          />
        ) : (
          <div className="w-full aspect-[16/9] bg-gradient-to-br from-white/10 to-white/0" />
        )}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg sm:text-xl">{product.name}</h3>
          {product.description && (
            <p className="mt-1 text-sm sm:text-[15px] text-white/75 leading-snug">
              {product.description}
            </p>
          )}
          <div className="mt-2 flex gap-2">
            {product.tags?.includes('veg') && (
              <span className="inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-200">
                Veggie
              </span>
            )}
            {product.tags?.includes('spicy') && (
              <span className="inline-block rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-200">
                Picante
              </span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="font-display text-lg sm:text-xl text-buns-yellow transition-all">
            {price.toFixed(2)} €
          </div>

          {hasMenu && (
            <div
              className={[
                'mt-2 grid grid-cols-2 gap-1 rounded-xl p-1 text-sm',
                'bg-black/50 border border-white/10',
                variant === 'menu' ? 'ring-2 ring-[rgba(255,212,0,.45)]' : '',
              ].join(' ')}
            >
              <button
                onClick={() => setVariant('burger')}
                aria-pressed={variant === 'burger'}
                className={[
                  'rounded-lg px-3 py-2 transition',
                  variant === 'burger' ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5',
                ].join(' ')}
              >
                Burger
              </button>

              <button
                onClick={() => setVariant('menu')}
                aria-pressed={variant === 'menu'}
                className={[
                  'rounded-lg px-3 py-2 transition relative',
                  variant === 'menu'
                    ? 'bg-buns-yellow text-black font-semibold shadow-[0_0_12px_rgba(255,212,0,.35)]'
                    : 'hover:bg-white/5',
                ].join(' ')}
              >
                Menu
                {variant === 'menu' && (
                  <span className="absolute -top-2 -right-2 text-[10px] px-2 py-0.5 rounded-full bg-black/70 text-buns-yellow">
                    🔥 Popular
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={handleAdd}
          className={[
            'btn btn-primary w-full py-3 text-base active:scale-[0.99] transition',
            added ? 'ring-4 ring-[rgba(255,212,0,.35)] animate-pulse' : '',
          ].join(' ')}
          aria-live="polite"
        >
          {added ? (
            <span className="inline-flex items-center gap-2">
              <Check className="w-5 h-5" /> Adicionado!
            </span>
          ) : (
            'Adicionar'
          )}
        </button>
      </div>
    </div>
  )
}
