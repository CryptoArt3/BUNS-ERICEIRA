'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { supabase } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/useI18n'
import { isIosDevice, isStandalone } from '@/lib/pwa'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { t } = useI18n()

  const [success, setSuccess]   = useState(false)
  const [nextPath, setNextPath] = useState<Route>('/checkout')
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    // Detect iOS outside PWA (magic link opened in Safari instead of the app)
    setShowIosHint(isIosDevice() && !isStandalone())

    const timers: number[] = []
    let done = false

    /* ── Cart restore (unchanged logic) ── */
    const restoreCartIfEmpty = () => {
      try {
        const current = localStorage.getItem('cart')
        let cartIsEmpty = true
        if (current) {
          try {
            const parsed = JSON.parse(current)
            cartIsEmpty = !Array.isArray(parsed?.items) || parsed.items.length === 0
          } catch { cartIsEmpty = true }
        }
        if (cartIsEmpty) {
          const backup = localStorage.getItem('buns_pending_cart_backup')
          if (backup) {
            try {
              const parsed = JSON.parse(backup)
              if (Array.isArray(parsed?.items) && parsed.items.length > 0) {
                localStorage.setItem('cart', backup)
              }
            } catch {}
          }
        }
      } finally {
        localStorage.removeItem('buns_pending_cart_backup')
      }
    }

    /* ── Handle confirmed session ── */
    const handleSuccess = () => {
      if (done) return
      done = true
      restoreCartIfEmpty()

      const saved = localStorage.getItem('buns_auth_next')
      const next = (saved?.startsWith('/') ? saved : '/checkout') as Route
      localStorage.removeItem('buns_auth_next')

      setNextPath(next)
      setSuccess(true)

      // Auto-redirect after a short pause — gives user time to read the success screen.
      // The CTA button acts as an immediate escape hatch.
      timers.push(window.setTimeout(() => router.replace(next), 2500))
    }

    /* ── Session detection (unchanged logic) ── */
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) handleSuccess()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') handleSuccess()
    })

    // Fallback: if nothing fires within 5 s, redirect anyway
    timers.push(window.setTimeout(() => {
      if (!done) {
        done = true
        const saved = localStorage.getItem('buns_auth_next')
        const next = (saved?.startsWith('/') ? saved : '/checkout') as Route
        localStorage.removeItem('buns_auth_next')
        router.replace(next)
      }
    }, 5000))

    return () => {
      subscription.unsubscribe()
      timers.forEach(clearTimeout)
    }
  }, [router])

  /* ── Loading state ── */
  if (!success) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <p
          className="font-display text-buns-yellow uppercase leading-none animate-pulse"
          style={{ fontSize: 'clamp(2rem, 8vw, 4rem)' }}
        >
          BUNS
        </p>
        <p className="text-white/40 text-sm tracking-wide">{t('callback.checking')}</p>
      </div>
    )
  }

  /* ── Success state ── */
  return (
    <main className="min-h-screen bg-buns-cream flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-white border-2 border-black rounded-2xl overflow-hidden">
          <div className="h-[6px] bg-buns-yellow" />
          <div className="p-8 space-y-5 text-center">

            {/* Check circle */}
            <div className="w-14 h-14 rounded-full bg-buns-yellow flex items-center justify-center mx-auto">
              <span className="text-black text-3xl font-black leading-none select-none">✓</span>
            </div>

            {/* Message */}
            <div>
              <p
                className="font-display text-black uppercase leading-none"
                style={{ fontSize: 'clamp(1.6rem, 6vw, 2rem)' }}
              >
                {t('callback.title')}
              </p>
              <p className="text-black/50 text-sm mt-1.5 leading-snug">
                {t('callback.sub')}
              </p>
            </div>

            {/* iOS hint — only when on iPhone/iPad outside PWA standalone */}
            {showIosHint && (
              <div className="bg-buns-cream border border-black/10 rounded-xl px-4 py-3 text-left">
                <p className="text-xs text-black/65 leading-snug">
                  📱 {t('callback.ios_hint')}
                </p>
              </div>
            )}

            {/* CTA button */}
            <Link
              href={nextPath}
              className="block w-full py-3.5 bg-black text-buns-yellow font-black text-sm uppercase tracking-wide rounded-xl text-center active:scale-[0.98] transition"
            >
              {nextPath.startsWith('/checkout')
                ? t('callback.cta_checkout')
                : t('callback.cta_account')}
            </Link>

            <p className="text-[11px] text-black/30">{t('callback.redirecting')}</p>
          </div>
        </div>
      </div>
    </main>
  )
}
