'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import ProductCard from './ProductCard'
import { PRODUCTS, CATEGORIES } from './data'
import type { Product, CategoryId } from './data'

type FilterId = 'all' | CategoryId

/* Category badge pill colours matching ProductCard ACCENT map */
const PILL_ACTIVE: Record<string, { bg: string; text: string }> = {
  all:      { bg: '#111111', text: '#FFD400' },
  burgers:  { bg: '#111111', text: '#FFD400' },
  extras:   { bg: '#FB923C', text: '#000000' },
  bebidas:  { bg: '#38BDF8', text: '#000000' },
  molhos:   { bg: '#F87171', text: '#000000' },
  bunanas:  { bg: '#F472B6', text: '#000000' },
  kids:     { bg: '#34D399', text: '#000000' },
}

export default function MenuGrid() {
  const [filter, setFilter] = useState<FilterId>('all')
  const chipsRef = useRef<HTMLDivElement>(null)

  const visible: Product[] = useMemo(() => {
    if (filter === 'all') return PRODUCTS
    return PRODUCTS.filter((p) => p.category === filter)
  }, [filter])

  /* Auto-scroll selected pill into view */
  useEffect(() => {
    const el = chipsRef.current
    if (!el) return
    const active = el.querySelector('[data-active="true"]') as HTMLElement | null
    if (!active) return
    const left = active.offsetLeft - el.clientWidth / 2 + active.clientWidth / 2
    el.scrollTo({ left, behavior: 'smooth' })
  }, [filter])

  return (
    <section className="w-full max-w-[100vw] overflow-x-hidden">

      {/* Sticky category pills bar */}
      <div className="sticky top-[64px] z-20 bg-buns-cream border-b-2 border-black/10">
        <div
          ref={chipsRef}
          className="ios-hscroll no-scrollbar flex gap-2 px-4 py-3 overflow-x-auto"
        >
          <CategoryPill
            active={filter === 'all'}
            activeStyle={PILL_ACTIVE.all}
            onClick={() => setFilter('all')}
            data-active={filter === 'all'}
          >
            🍔 Tudo
          </CategoryPill>

          {CATEGORIES.map((c) => (
            <CategoryPill
              key={c.id}
              active={filter === c.id}
              activeStyle={PILL_ACTIVE[c.id] ?? PILL_ACTIVE.all}
              onClick={() => setFilter(c.id as FilterId)}
              data-active={filter === c.id}
            >
              {c.emoji} {c.label}
            </CategoryPill>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visible.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {visible.length === 0 && (
        <div className="text-black/40 p-8 text-center font-black uppercase tracking-wide">
          Sem produtos nesta categoria.
        </div>
      )}

      {/* Bottom spacer for mobile sticky cart bar */}
      <div className="h-20 md:h-0" />
    </section>
  )
}

/* ─── CategoryPill ────────────────────────────────────────── */
function CategoryPill({
  children,
  active,
  activeStyle,
  onClick,
  ...rest
}: {
  children: React.ReactNode
  active?: boolean
  activeStyle: { bg: string; text: string }
  onClick?: () => void
} & React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={active ? { background: activeStyle.bg, color: activeStyle.text, borderColor: activeStyle.bg } : undefined}
      className={[
        'px-4 py-2 rounded-xl text-sm font-black transition-all shrink-0 uppercase tracking-wide border-2',
        active
          ? 'shadow-sm scale-[1.03]'
          : 'bg-white text-black border-black/20 hover:border-black/50',
      ].join(' ')}
      aria-pressed={active ? 'true' : 'false'}
      {...rest}
    >
      {children}
    </button>
  )
}
