'use client'

import { useMemo, useState } from 'react'
import type { Product } from './data'
import { useCart } from '@/components/cart/CartContext'

/* Category accent colours — kept as JS map to avoid Tailwind purge issues */
const ACCENT: Record<string, string> = {
  burgers:  '#FFD400',
  extras:   '#FB923C',
  bebidas:  '#38BDF8',
  molhos:   '#F87171',
  bunanas:  '#F472B6',
  kids:     '#34D399',
}

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart()

  const hasMenu = typeof product.menuPrice === 'number'
  const [variant, setVariant] = useState<'burger' | 'menu'>(hasMenu ? 'menu' : 'burger')
  const [added, setAdded] = useState(false)

  const price = useMemo(
    () => (variant === 'menu' && hasMenu ? product.menuPrice! : product.price),
    [variant, hasMenu, product.price, product.menuPrice]
  )

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

  const accent = ACCENT[product.category] ?? '#FFD400'
  const isBurger = product.category === 'burgers'

  return (
    <div className="relative bg-white border-2 border-black rounded-2xl overflow-hidden flex flex-col group">

      {/* Top accent stripe */}
      <div className="h-[6px] w-full shrink-0" style={{ background: accent }} />

      <div className="p-5 flex flex-col flex-1 gap-0">

        {/* Tag badges */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {product.tags.includes('bestseller') && (
              <span className="bg-buns-yellow text-black text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                👑 Mais pedido
              </span>
            )}
            {product.tags.includes('spicy') && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                🔥 Picante
              </span>
            )}
            {product.tags.includes('veg') && (
              <span className="bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                🌱 Veggie
              </span>
            )}
            {product.tags.includes('new') && (
              <span className="bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                ✨ Novo
              </span>
            )}
          </div>
        )}

        {/* Product name — BIG poster typography */}
        <h3
          className="font-display uppercase leading-none text-black mb-0"
          style={{ fontSize: isBurger ? 'clamp(1.5rem, 4vw, 2rem)' : 'clamp(1.2rem, 3vw, 1.5rem)' }}
        >
          {product.name}
        </h3>

        {/* Ingredients list */}
        {product.ingredients && product.ingredients.length > 0 && (
          <ul className="mt-3 mb-4 space-y-1 flex-1">
            {product.ingredients.map((ing) => (
              <li key={ing} className="text-sm text-black/55 flex gap-2 leading-snug">
                <span className="text-black/30 shrink-0">•</span>
                <span>{ing}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Description (non-burger items without ingredients) */}
        {product.description && !product.ingredients && (
          <p className="mt-2 mb-4 text-sm text-black/55 leading-snug flex-1">
            {product.description}
          </p>
        )}

        {/* Spacer when no body content */}
        {!product.ingredients && !product.description && <div className="flex-1 mt-2" />}

        {/* Burger/Menu variant toggle */}
        {hasMenu && (
          <div className="flex gap-1 mb-4 bg-black/[0.06] rounded-xl p-1">
            <button
              onClick={() => setVariant('burger')}
              aria-pressed={variant === 'burger'}
              className={[
                'flex-1 py-2 rounded-lg text-sm font-black transition-all',
                variant === 'burger'
                  ? 'bg-black text-buns-yellow shadow-sm'
                  : 'text-black/50 hover:text-black',
              ].join(' ')}
            >
              Burger
            </button>
            <button
              onClick={() => setVariant('menu')}
              aria-pressed={variant === 'menu'}
              className={[
                'flex-1 py-2 rounded-lg text-sm font-black transition-all relative',
                variant === 'menu'
                  ? 'bg-buns-yellow text-black shadow-sm'
                  : 'text-black/50 hover:text-black',
              ].join(' ')}
            >
              + Menu
              {variant === 'menu' && (
                <span className="absolute -top-2 -right-1 text-[9px] bg-black text-buns-yellow px-1.5 py-0.5 rounded-full leading-none font-black">
                  BATATA + BEBIDA
                </span>
              )}
            </button>
          </div>
        )}

        {/* Price + Add button */}
        <div className="flex items-center justify-between gap-3 mt-auto pt-1">
          <div className="leading-none">
            <span className="font-display text-black" style={{ fontSize: 'clamp(1.4rem, 4vw, 1.75rem)' }}>
              {price.toFixed(2).replace('.', ',')}€
            </span>
          </div>

          <button
            onClick={handleAdd}
            aria-live="polite"
            className={[
              'font-black text-sm px-4 py-2.5 rounded-xl border-2 transition-all active:scale-95',
              added
                ? 'bg-green-500 border-green-500 text-white'
                : 'bg-black border-black text-buns-yellow hover:bg-neutral-800',
            ].join(' ')}
          >
            {added ? '✓ OK!' : '+ Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}
