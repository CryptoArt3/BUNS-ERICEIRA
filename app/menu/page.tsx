'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import MenuGrid from '@/components/menu/MenuGrid'
import { useI18n } from '@/lib/i18n/useI18n'
import { track } from '@/lib/analytics/track'

const BANNER_DISMISSED_KEY = 'buns_menu_login_banner_dismissed'

function scrollToMenu(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault()
  document.getElementById('menu-products')?.scrollIntoView({ behavior: 'smooth' })
}

export default function MenuPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [bannerDismissed, setBannerDismissed] = useState(true)
  const { t } = useI18n()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session)
    })
    setBannerDismissed(sessionStorage.getItem(BANNER_DISMISSED_KEY) === '1')
    track({ event_name: 'menu_view' })
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
            {t('menu.hero_tag')}
          </div>

          <h1 className="font-display text-white uppercase leading-none tracking-tight"
              style={{ fontSize: 'clamp(2.8rem, 10vw, 5.5rem)' }}>
            BUNS<br />
            <span className="text-buns-yellow">MENU</span>
          </h1>

          <p className="mt-4 text-white/50 text-sm font-medium max-w-sm">
            {t('menu.hero_sub')}
          </p>
        </div>
      </div>

      {/* ── Login banner ─────────────────────────────────── */}
      {showBanner && (
        <div className="bg-buns-yellow border-b-2 border-black/10 px-4 sm:px-6 py-4">
          <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-black text-sm font-medium flex-1">
              {t('menu.banner_msg')}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/login?next=/menu"
                className="px-4 py-2 bg-black text-buns-yellow font-black text-sm rounded-xl uppercase tracking-wide"
              >
                {t('menu.banner_login')}
              </Link>
              <button
                onClick={dismissBanner}
                className="px-4 py-2 bg-black/10 text-black/70 font-bold text-sm rounded-xl"
              >
                {t('menu.banner_skip')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Inside the Smash video ───────────────────────── */}
      <section
        aria-label="Por dentro do smash"
        className="bg-buns-cream border-b-2 border-black/10 px-4 sm:px-6 py-8 sm:py-10"
      >
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-7 sm:gap-12">

            {/* ── 9:16 Video card ──────────────────────── */}
            <div className="shrink-0 w-[52vw] max-w-[200px] sm:w-[200px] md:w-[240px]">
              <div className="relative aspect-[9/16] rounded-3xl border-4 border-black overflow-hidden shadow-[6px_6px_0_0_rgba(0,0,0,0.75)]">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  src="/videos/menu-inside-smash.mp4"
                  poster="/videos/menu-inside-smash-poster.jpg"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover"
                  aria-label="Vídeo de produção BUNS Ericeira"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/15 pointer-events-none" />
                {/* Badge */}
                <div className="absolute top-3 left-3">
                  <span className="bg-buns-yellow text-black text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md leading-none">
                    BUNS Kitchen
                  </span>

                </div>
                {/* Bottom text overlay */}
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white font-black text-xs uppercase tracking-wide leading-snug drop-shadow-md">
                    {t('menu.video_overlay1')}<br />{t('menu.video_overlay2')}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Text + CTA ───────────────────────────── */}
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 bg-black text-buns-yellow text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mb-4">
                {t('menu.video_badge')}
              </div>
              <h2
                className="font-display text-black uppercase leading-none tracking-tight"
                style={{ fontSize: 'clamp(1.9rem, 7vw, 3.8rem)' }}
              >
                {t('menu.video_title1')}<br />
                <span className="text-buns-yellow">{t('menu.video_title2')}</span>
              </h2>
              <p className="mt-3 text-black/55 text-sm leading-relaxed max-w-[260px] mx-auto sm:mx-0">
                {t('menu.video_sub')}
              </p>
              <a
                href="#menu-products"
                onClick={scrollToMenu}
                className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-black text-buns-yellow font-black text-sm uppercase tracking-wide rounded-xl border-2 border-black active:scale-[0.98] transition hover:bg-neutral-900"
              >
                {t('menu.video_cta')}
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ── Menu grid ────────────────────────────────────── */}
      <div id="menu-products" className="max-w-screen-xl mx-auto px-3 sm:px-4 pb-24">
        <MenuGrid />
      </div>

    </main>
  )
}
