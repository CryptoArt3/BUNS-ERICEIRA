'use client'

import Link from 'next/link'
import { useMemo, useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useCart } from '@/components/cart/CartContext'
import { useI18n } from '@/lib/i18n/useI18n'

function currency(x: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(x)
}

export default function StickyCartBar() {
  const path     = usePathname()
  const { cart } = useCart()
  const { t }    = useI18n()
  const items    = cart?.items ?? []
  const count    = useMemo(() => items.reduce((n, it) => n + it.qty, 0),    [items])
  const subtotal = useMemo(() => items.reduce((s, it) => s + it.price * it.qty, 0), [items])

  const [visible,  setVisible]  = useState(false)
  const [exiting,  setExiting]  = useState(false)
  const [countPop, setCountPop] = useState(false)
  const prevCount = useRef(count)

  /* Show / hide with slide animation */
  useEffect(() => {
    if (count > 0) {
      setExiting(false)
      setVisible(true)
    } else if (visible) {
      setExiting(true)
      const t = window.setTimeout(() => setVisible(false), 320)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  /* Count badge micro-pop on every change */
  useEffect(() => {
    if (count !== prevCount.current && count > 0) {
      setCountPop(true)
      const t = window.setTimeout(() => setCountPop(false), 280)
      prevCount.current = count
      return () => clearTimeout(t)
    }
    prevCount.current = count
  }, [count])

  if (path.startsWith('/screen') || path.startsWith('/admin')) return null
  if (!visible) return null

  return (
    /*
     * Mobile: full-width bottom dock (inset-x-0 bottom-0)
     * Desktop: centered floating pill (left-1/2 bottom-6 -translate-x-1/2)
     */
    <div
      className={[
        'fixed z-40',
        /* mobile */
        'bottom-0 left-0 right-0',
        /* desktop */
        'md:bottom-6 md:left-1/2 md:right-auto md:-translate-x-1/2',
        /* slide animation */
        exiting ? 'buns-cart-out' : 'buns-cart-in',
      ].join(' ')}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Container — full-bleed on mobile, max-width dock on desktop */}
      <div className="mx-3 mb-3 md:mx-0 md:mb-0 md:w-[480px]">
        <div className="rounded-2xl md:rounded-3xl bg-[#111] border-2 border-buns-yellow shadow-[0_0_28px_rgba(255,212,0,0.22),0_8px_40px_rgba(0,0,0,0.75)]">
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-5 md:py-3.5">

            {/* ── Left: label · count · total ─────────── */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/45">
                  {t('dock.label')}
                </span>
                <span
                  className={[
                    'inline-flex items-center justify-center w-5 h-5 rounded-full bg-buns-yellow text-black text-[10px] font-black leading-none',
                    countPop ? 'buns-card-pop' : '',
                  ].join(' ')}
                  aria-label={`${count} item${count === 1 ? '' : 's'}`}
                >
                  {count}
                </span>
              </div>
              <span
                className="font-display text-white leading-none block truncate"
                style={{ fontSize: 'clamp(1.1rem, 4vw, 1.35rem)' }}
              >
                {currency(subtotal)}
              </span>
            </div>

            {/* ── Right: Ver + Checkout ────────────────── */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/cart"
                className="px-4 py-2.5 rounded-xl border-2 border-white/20 bg-white/[0.07] text-white text-sm font-black uppercase tracking-wide active:scale-95 transition-all hover:border-white/40 hover:bg-white/10"
              >
                {t('dock.view')}
              </Link>
              <Link
                href="/checkout"
                className="buns-checkout-glow px-5 py-2.5 rounded-xl bg-buns-yellow text-black text-sm font-black uppercase tracking-wide active:scale-95 transition-transform hover:brightness-105"
              >
                {t('dock.checkout')}
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
