'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/lib/i18n/useI18n'
import LangToggle from '@/components/ui/LangToggle'

type AppRoute =
  | '/'
  | '/menu'
  | '/cart'
  | '/account'
  | '/ar'
  | '/wall-of-fame'
  | '/eventos'
  | '/collabs'

const NAV_ITEMS: { href: AppRoute; emoji: string; tKey: string }[] = [
  { href: '/',             emoji: '🏠', tKey: 'nav.home' },
  { href: '/menu',         emoji: '🍔', tKey: 'nav.menu' },
  { href: '/cart',         emoji: '🛒', tKey: 'nav.cart' },
  { href: '/account',      emoji: '👤', tKey: 'nav.account' },
  { href: '/ar',           emoji: '🧠', tKey: 'nav.ar' },
  { href: '/wall-of-fame', emoji: '🏆', tKey: 'nav.wof' },
  { href: '/eventos',      emoji: '🎉', tKey: 'nav.events' },
  { href: '/collabs',      emoji: '🎬', tKey: 'nav.collabs' },
]

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { t } = useI18n()

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => { setOpen(false) }, [pathname])

  const close = () => setOpen(false)

  return (
    <div className="md:hidden">

      {/* ── Trigger button ── */}
      <button
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 active:bg-white/20 transition"
      >
        <span className="font-black text-white text-lg leading-none">{open ? '✕' : '☰'}</span>
      </button>

      {/* ── Fullscreen drawer ── */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-black flex flex-col overflow-hidden"
          style={{
            minHeight: '100dvh',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >

          {/* ── Top bar ── */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
            <Link href="/" onClick={close}>
              <span className="font-display text-buns-yellow uppercase text-2xl leading-none tracking-tight">
                BUNS
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <LangToggle />
              <button
                aria-label="Fechar menu"
                onClick={close}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 active:bg-white/20 transition"
              >
                <span className="font-black text-white text-lg leading-none">✕</span>
              </button>
            </div>
          </div>

          {/* ── Nav items ── */}
          <nav className="flex-1 overflow-y-auto" aria-label="Navegação principal">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className={`flex items-center gap-4 w-full px-5 border-b border-white/10 transition-colors ${
                    isActive
                      ? 'bg-buns-yellow/10 text-buns-yellow'
                      : 'text-white hover:bg-white/5 hover:text-buns-yellow'
                  }`}
                  style={{ minHeight: '64px' }}
                >
                  <span className="text-2xl shrink-0">{item.emoji}</span>
                  <span className="font-display uppercase leading-none tracking-tight flex-1"
                        style={{ fontSize: 'clamp(1.3rem, 5vw, 1.6rem)' }}>
                    {t(item.tKey)}
                  </span>
                  {isActive && (
                    <span className="text-buns-yellow text-sm shrink-0">●</span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* ── Bottom strip ── */}
          <div className="shrink-0 px-5 pt-5 pb-5 border-t border-white/10 space-y-3">
            <Link
              href="/menu"
              onClick={close}
              className="block w-full py-4 bg-buns-yellow text-black font-black text-lg uppercase tracking-wide rounded-2xl text-center active:scale-[0.98] transition"
            >
              {t('nav.order_now')}
            </Link>
            <p className="text-[11px] font-black uppercase tracking-widest text-white/25 text-center">
              Ericeira · Takeaway · 11:00–00:00
            </p>
          </div>

        </div>
      )}
    </div>
  )
}
