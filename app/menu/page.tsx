'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import MenuGrid from '@/components/menu/MenuGrid'

const BANNER_DISMISSED_KEY = 'buns_menu_login_banner_dismissed'

export default function MenuPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [bannerDismissed, setBannerDismissed] = useState(true) // true until loaded

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session)
    })
    setBannerDismissed(sessionStorage.getItem(BANNER_DISMISSED_KEY) === '1')
  }, [])

  function dismissBanner() {
    sessionStorage.setItem(BANNER_DISMISSED_KEY, '1')
    setBannerDismissed(true)
  }

  const showBanner = isLoggedIn === false && !bannerDismissed

  return (
    <main className="min-h-full w-full max-w-[100vw] overflow-x-hidden bg-buns-cream">

      {/* ── Hero strip ───────────────────────────────────── */}
      <div className="bg-black px-4 sm:px-6 pt-8 pb-7 border-b-4 border-buns-yellow">
        <div className="max-w-screen-xl mx-auto">

          <div className="inline-flex items-center gap-1.5 bg-buns-yellow text-black text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mb-5">
            🔥 Smash Burgers · Ericeira
          </div>

          <h1 className="font-display text-white uppercase leading-none tracking-tight"
              style={{ fontSize: 'clamp(2.8rem, 10vw, 5.5rem)' }}>
            BUNS<br />
            <span className="text-buns-yellow">MENU</span>
          </h1>

          <p className="mt-4 text-white/50 text-sm font-medium max-w-sm">
            Escolhe os teus favoritos — adiciona ao carrinho e segue para checkout.
          </p>
        </div>
      </div>

      {/* ── Login banner ─────────────────────────────────── */}
      {showBanner && (
        <div className="bg-buns-yellow border-b-2 border-black/10 px-4 sm:px-6 py-4">
          <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-black text-sm font-medium flex-1">
              Para guardar o teu pedido e acompanhar o estado, entra antes de adicionar ao carrinho.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/login?next=/menu"
                className="px-4 py-2 bg-black text-buns-yellow font-black text-sm rounded-xl uppercase tracking-wide"
              >
                Entrar
              </Link>
              <button
                onClick={dismissBanner}
                className="px-4 py-2 bg-black/10 text-black/70 font-bold text-sm rounded-xl"
              >
                Continuar sem entrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Menu grid ────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-3 sm:px-4 pb-24">
        <MenuGrid />
      </div>

    </main>
  )
}
