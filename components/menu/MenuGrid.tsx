'use client'

import { useMemo, useState } from 'react'
import ProductCard from './ProductCard'
import { PRODUCTS, CATEGORIES } from './data'
import type { Product } from './data'

type CategoryId = 'all' | (typeof CATEGORIES)[number]['id']

export default function MenuGrid() {
  const [filter, setFilter] = useState<CategoryId>('all')

  const visible: Product[] = useMemo(() => {
    if (filter === 'all') return PRODUCTS
    return PRODUCTS.filter((p: Product) => p.category === filter)
  }, [filter])

  return (
    <section className="w-full">
      {/* TABS — sempre visíveis ao fazer scroll */}
      <div className="sticky top-16 z-20 bg-black/60 backdrop-blur-sm border-b border-white/10">
        <div className="flex flex-wrap gap-2 px-2 py-3">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
            🍔 Tudo
          </Chip>

          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              active={filter === c.id}
              onClick={() => setFilter(c.id as CategoryId)}
            >
              {c.emoji} {c.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Grelha */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-8">
        {visible.map((p: Product) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {visible.length === 0 && (
        <div className="text-white/60 p-6 text-center">Sem produtos nesta categoria.</div>
      )}
    </section>
  )
}

/* — Componentes locais — */
function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-3 py-1.5 rounded-full text-sm transition',
        'border border-white/15 bg-white/5 hover:bg-white/10',
        active ? 'ring-1 ring-white/30 text-buns-yellow' : 'text-white/80',
      ].join(' ')}
      aria-pressed={active ? 'true' : 'false'}
    >
      {children}
    </button>
  )
}
