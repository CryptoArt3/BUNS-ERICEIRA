'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import ProductCard from './ProductCard'
import { PRODUCTS, CATEGORIES } from './data'
import type { Product } from './data'

type CategoryId = 'all' | (typeof CATEGORIES)[number]['id']

export default function MenuGrid() {
  const [filter, setFilter] = useState<CategoryId>('all')
  const chipsRef = useRef<HTMLDivElement>(null)

  const visible: Product[] = useMemo(() => {
    if (filter === 'all') return PRODUCTS
    return PRODUCTS.filter((p: Product) => p.category === filter)
  }, [filter])

  // centra o chip activo no viewport em mobile
  useEffect(() => {
    const el = chipsRef.current
    if (!el) return
    const active = el.querySelector('[data-active="true"]') as HTMLElement | null
    if (!active) return
    const left = active.offsetLeft - el.clientWidth / 2 + active.clientWidth / 2
    el.scrollTo({ left, behavior: 'smooth' })
  }, [filter])

  return (
    <section className="w-full">
      {/* TABS — sticky: compensa header (64px) + barra Uber/Eats (~44px) no mobile */}
      <div className="sticky top-[7.5rem] md:top-16 z-20 bg-black/60 backdrop-blur-sm border-b border-white/10">
        <div
          ref={chipsRef}
          className="flex gap-2 px-2 py-3 overflow-x-auto no-scrollbar w-full"
        >
          <Chip active={filter === 'all'} onClick={() => setFilter('all')} data-active={filter === 'all'}>
            🍔 Tudo
          </Chip>

          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              active={filter === c.id}
              onClick={() => setFilter(c.id as CategoryId)}
              data-active={filter === c.id}
            >
              {c.emoji} {c.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Grelha alinhada com o resto do site */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {visible.map((p: Product) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {visible.length === 0 && (
        <div className="text-white/60 p-6 text-center">Sem produtos nesta categoria.</div>
      )}

      {/* espaço para a sticky cart bar no mobile */}
      <div className="h-20 md:h-0" />
    </section>
  )
}

/* — Chip — */
function Chip(
  { children, active, onClick, ...rest }:
  { children: React.ReactNode, active?: boolean, onClick?: () => void } & React.HTMLAttributes<HTMLButtonElement>
) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-3 py-2 rounded-full text-sm transition shrink-0',
        'border border-white/15 bg-white/5 hover:bg-white/10',
        active ? 'ring-1 ring-white/30 text-buns-yellow' : 'text-white/80',
      ].join(' ')}
      aria-pressed={active ? 'true' : 'false'}
      {...rest}
    >
      {children}
    </button>
  )
}
