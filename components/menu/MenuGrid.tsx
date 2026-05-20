'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import ProductCard from './ProductCard'
import { PRODUCTS, CATEGORIES } from './data'
import type { Product, CategoryId } from './data'

type FilterId = 'all' | CategoryId

/*
 * Active pill colours match ProductCard ACCENT map.
 * Keys use the same CategoryId strings.
 */
const PILL_ACTIVE: Record<string, { bg: string; text: string }> = {
  all:        { bg: '#111111', text: '#FFD400' },
  burgers:    { bg: '#111111', text: '#FFD400' },
  kids:       { bg: '#34D399', text: '#000000' },
  batatas:    { bg: '#FB923C', text: '#000000' },
  molhos:     { bg: '#F87171', text: '#000000' },
  extras:     { bg: '#525252', text: '#FFFFFF' },
  bunanas:    { bg: '#F472B6', text: '#000000' },
  'buns-bar': { bg: '#818CF8', text: '#000000' },
}

export default function MenuGrid() {
  const [filter, setFilter] = useState<FilterId>('all')
  const chipsRef = useRef<HTMLDivElement>(null)

  const visible: Product[] = useMemo(() => {
    if (filter === 'all') return PRODUCTS
    return PRODUCTS.filter((p) => p.category === filter)
  }, [filter])

  /* Auto-scroll selected pill into view within the pill bar */
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

      {/* Category pill bar — sticky on desktop, scrolls with page on mobile */}
      <div className="bg-buns-cream border-b-2 border-black/10 md:sticky md:top-16 md:z-30">
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

      {/* Product grid — mt-5 mobile (20 px) / mt-8 desktop (32 px) below pill bar */}
      <div className="mt-5 md:mt-8 pb-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visible.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {visible.length === 0 && (
        <div className="py-16 text-center">
          <p className="font-display text-black/30 uppercase text-2xl">Nada nesta categoria ainda 👀</p>
          <p className="text-black/25 text-sm mt-2">Em breve chegam novidades.</p>
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
      style={
        active
          ? {
              background: activeStyle.bg,
              color: activeStyle.text,
              borderColor: activeStyle.bg,
              boxShadow: `0 0 14px ${activeStyle.bg}55`,
            }
          : undefined
      }
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
