'use client'

import { useMemo, useState } from 'react'
import type { Product, ProductVariant } from './data'
import { useCart } from '@/components/cart/CartContext'

/* Category accent colours */
const ACCENT: Record<string, string> = {
  burgers:   '#FFD400',
  kids:      '#34D399',
  batatas:   '#FB923C',
  molhos:    '#F87171',
  extras:    '#A3A3A3',
  bunanas:   '#F472B6',
  'buns-bar': '#818CF8',
}

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart()

  const hasMenu = typeof product.menuPrice === 'number'
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0

  /* burger/menu toggle — for products with a menu combo price */
  const [variant, setVariant] = useState<'burger' | 'menu'>(hasMenu ? 'menu' : 'burger')

  /* option variant — for size/flavour selectors */
  const [selectedOption, setSelectedOption] = useState<ProductVariant | null>(
    product.variants?.[0] ?? null
  )

  const [added, setAdded] = useState(false)

  /* Resolved price: option price → base price, then menu override */
  const price = useMemo(() => {
    const base = selectedOption?.price ?? product.price
    return variant === 'menu' && hasMenu ? product.menuPrice! : base
  }, [variant, hasMenu, product.price, product.menuPrice, selectedOption])

  function handleAdd() {
    const baseName = selectedOption
      ? `${product.name} ${selectedOption.label}`
      : product.name
    const baseId = selectedOption
      ? `${product.id}-${selectedOption.id}`
      : product.id
    const name = variant === 'menu' && hasMenu ? `${baseName} — Menu` : baseName
    const id   = baseId + (variant === 'menu' && hasMenu ? '-menu' : '')
    add({ id, name, price, qty: 1, variant })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 900)
  }

  const accent    = ACCENT[product.category] ?? '#FFD400'
  const isBurger  = product.category === 'burgers'
  const isBar     = product.category === 'buns-bar'

  return (
    <div className="relative bg-white border-2 border-black rounded-2xl overflow-hidden flex flex-col">

      {/* Top accent stripe */}
      <div className="h-[6px] w-full shrink-0" style={{ background: accent }} />

      <div className="p-5 flex flex-col flex-1">

        {/* ── Tag badges ──────────────────────────────── */}
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

        {/* ── Product name ─────────────────────────────── */}
        <h3
          className="font-display uppercase leading-tight text-black"
          style={{
            fontSize: isBurger
              ? 'clamp(1.5rem, 4vw, 2rem)'
              : isBar
              ? 'clamp(1.1rem, 3vw, 1.4rem)'
              : 'clamp(1.2rem, 3vw, 1.5rem)',
          }}
        >
          {product.name}
        </h3>

        {/* ── Description / size label ─────────────────── */}
        {product.description && (
          <p className="mt-1 text-xs text-black/45 leading-snug">
            {product.description}
          </p>
        )}

        {/* ── Ingredient list ─────────────────────────── */}
        {product.ingredients && product.ingredients.length > 0 && (
          <ul className="mt-3 mb-1 space-y-1 flex-1">
            {product.ingredients.map((ing) => (
              <li key={ing} className="text-sm text-black/55 flex gap-2 leading-snug">
                <span className="text-black/25 shrink-0">•</span>
                <span>{ing}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Spacer when no ingredient list */}
        {!product.ingredients && <div className="flex-1" />}

        {/* ── Option variant picker (size, flavour) ────── */}
        {hasVariants && (
          <div className="mt-3 mb-1 flex flex-wrap gap-1.5">
            {product.variants!.map((v) => {
              const active = selectedOption?.id === v.id
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedOption(v)}
                  className={[
                    'px-2.5 py-1 rounded-lg text-xs font-bold border-2 transition-all active:scale-95',
                    active
                      ? 'bg-black text-buns-yellow border-black'
                      : 'bg-white text-black/55 border-black/15 hover:border-black/40',
                  ].join(' ')}
                >
                  {v.label}
                  {v.price !== undefined && (
                    <span className={`ml-1 ${active ? 'text-buns-yellow/70' : 'text-black/35'}`}>
                      {v.price.toFixed(2).replace('.', ',')}€
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* ── Burger / Menu toggle ─────────────────────── */}
        {hasMenu && (
          <div className="flex gap-1 mt-3 mb-1 bg-black/[0.06] rounded-xl p-1">
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
                <span className="absolute -top-2.5 -right-1 text-[9px] bg-black text-buns-yellow px-1.5 py-0.5 rounded-full leading-none font-black whitespace-nowrap">
                  BATATA + BEBIDA
                </span>
              )}
            </button>
          </div>
        )}

        {/* ── Price + Add ──────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-1">
          <span
            className="font-display text-black leading-none"
            style={{ fontSize: 'clamp(1.35rem, 4vw, 1.7rem)' }}
          >
            {price.toFixed(2).replace('.', ',')}€
          </span>

          <button
            onClick={handleAdd}
            aria-live="polite"
            className={[
              'font-black text-sm px-4 py-2.5 rounded-xl border-2 transition-all active:scale-95 shrink-0',
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
