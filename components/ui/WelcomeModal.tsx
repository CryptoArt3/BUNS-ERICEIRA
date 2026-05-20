'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n/useI18n'

const STORAGE_KEY   = 'buns_welcome_seen_at'
const DAYS_INTERVAL = 1 // <- mostra novamente passado 1 dia (altera se quiseres)

function shouldOpen(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return true
    const last     = new Date(raw).getTime()
    const now      = Date.now()
    const diffDays = (now - last) / (1000 * 60 * 60 * 24)
    return diffDays >= DAYS_INTERVAL
  } catch {
    return true
  }
}

export default function WelcomeModal() {
  const [open,    setOpen]    = useState(false)
  const [mounted, setMounted] = useState(false)
  const path   = usePathname()
  const router = useRouter()
  const { t }  = useI18n()

  useEffect(() => {
    setMounted(true)
    if (shouldOpen()) setOpen(true)
  }, [])

  const close = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, new Date().toISOString()) } catch {}
    setOpen(false)
  }, [])

  const goToMenu = useCallback(() => {
    close()
    router.push('/menu')
  }, [close, router])

  /* ESC to close */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  if (!mounted || path.startsWith('/screen') || path.startsWith('/admin')) return null

  return (
    <AnimatePresence>
      {open && (
        /* ── Backdrop ───────────────────────────────────────── */
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-[60] bg-black/88 backdrop-blur-sm flex items-center justify-center"
          style={{
            paddingTop:    'max(env(safe-area-inset-top),    16px)',
            paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
            paddingLeft:   '12px',
            paddingRight:  '12px',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={close}
          aria-hidden="true"
        >
          {/* ── Dialog card ─────────────────────────────────── */}
          <motion.div
            key="dialog"
            role="dialog"
            aria-modal="true"
            aria-label={t('modal.badge')}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.24, ease: [0.34, 1.15, 0.64, 1] }}
            className="w-full max-w-[420px] bg-black border-2 border-buns-yellow rounded-3xl overflow-hidden shadow-[0_0_48px_rgba(255,212,0,0.18),0_24px_64px_rgba(0,0,0,1)]"
            onClick={(e) => e.stopPropagation()}
          >

            {/* ── Video ────────────────────────────────────── */}
            <div className="relative">
              <video
                src="/mascote-poster.mp4"
                poster="/mascote-poster.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="w-full h-52 sm:h-64 object-cover bg-black block"
              />
              {/* Gradient into card body */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent pointer-events-none" />
              {/* Close X */}
              <button
                onClick={close}
                aria-label="Fechar"
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/70 border border-white/15 text-white/60 hover:text-white hover:bg-black transition font-black text-sm"
              >
                ✕
              </button>
            </div>

            {/* ── Body ─────────────────────────────────────── */}
            <div className="px-5 pt-4 pb-5 sm:px-6 sm:pb-6">

              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 bg-buns-yellow text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mb-4">
                {t('modal.badge')}
              </div>

              {/* Title */}
              <h2
                className="font-display text-white uppercase leading-none tracking-tight"
                style={{ fontSize: 'clamp(1.7rem, 6vw, 2.2rem)' }}
              >
                {t('modal.title_line1')}<br />
                <span className="text-buns-yellow">{t('modal.title_line2')}</span>
              </h2>

              {/* Subtitle */}
              <p className="mt-3 text-white/50 text-sm leading-relaxed">
                {t('modal.subtitle')}
              </p>

              {/* CTAs */}
              <div className="mt-5 flex flex-col gap-2">
                <button
                  onClick={goToMenu}
                  className="w-full py-4 bg-buns-yellow text-black font-black text-sm uppercase tracking-wide rounded-2xl active:scale-[0.98] transition shadow-[0_0_20px_rgba(255,212,0,0.35)] hover:brightness-105"
                >
                  {t('modal.cta_menu')}
                </button>
                <button
                  onClick={close}
                  className="w-full py-3.5 border-2 border-white/15 bg-white/[0.06] text-white font-black text-sm uppercase tracking-wide rounded-2xl active:scale-[0.98] transition hover:border-white/30 hover:bg-white/10"
                >
                  {t('modal.cta_close')}
                </button>
              </div>

              {/* Footer note */}
              <p className="mt-4 text-center text-[10px] font-black uppercase tracking-widest text-white/20">
                {t('modal.footer')}
              </p>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
