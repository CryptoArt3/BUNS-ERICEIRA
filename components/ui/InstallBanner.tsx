'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/lib/i18n/useI18n'
import { track } from '@/lib/analytics/track'

// Capture beforeinstallprompt before React hydrates so we never miss it.
let _deferred: any = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    _deferred = e
  })
}

type Platform = 'ios' | 'android'

// Never show on these paths — checkout has its own sticky controls
const SUPPRESS_PATHS = ['/checkout', '/admin', '/screen']

export default function InstallBanner() {
  const path = usePathname()
  const { t } = useI18n()

  const [platform, setPlatform] = useState<Platform | null>(null)
  const [visible, setVisible]   = useState(false)
  const [entered, setEntered]   = useState(false)   // drives entrance transition
  const [iosOpen, setIosOpen]   = useState(false)   // iOS step expansion

  const autoHideRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ── Detection (logic unchanged) ─────────────────────────── */
  useEffect(() => {
    if (SUPPRESS_PATHS.some((p) => path.startsWith(p))) return
    if (localStorage.getItem('buns_pwa_dismissed')) return

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    if (standalone) return

    const ua = navigator.userAgent
    const isIos = /iPhone|iPad|iPod/.test(ua)
    const isSafariOnIos = isIos && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)

    if (isSafariOnIos) {
      setPlatform('ios')
      const id = setTimeout(() => {
        setVisible(true)
        track({ event_name: 'pwa_install_prompt_seen', metadata: { platform: 'ios' } })
      }, 4000)
      return () => clearTimeout(id)
    }

    if (_deferred) {
      setPlatform('android')
      const id = setTimeout(() => {
        setVisible(true)
        track({ event_name: 'pwa_install_prompt_seen', metadata: { platform: 'android' } })
      }, 4000)
      return () => clearTimeout(id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Entrance animation: one frame after mount ─────────────── */
  useEffect(() => {
    if (!visible) { setEntered(false); return }
    const id = setTimeout(() => setEntered(true), 16)
    return () => clearTimeout(id)
  }, [visible])

  /* ── Auto-hide after 12 s if untouched ─────────────────────── */
  function startAutoHide() {
    if (autoHideRef.current) clearTimeout(autoHideRef.current)
    autoHideRef.current = setTimeout(() => setVisible(false), 12_000)
  }
  function resetAutoHide() {
    startAutoHide()
  }
  useEffect(() => {
    if (!visible) return
    startAutoHide()
    return () => { if (autoHideRef.current) clearTimeout(autoHideRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  /* ── Handlers (logic unchanged) ──────────────────────────── */
  function dismiss() {
    track({ event_name: 'pwa_install_hint_dismissed', metadata: { platform } })
    localStorage.setItem('buns_pwa_dismissed', '1')
    setVisible(false)
  }

  async function installAndroid() {
    if (!_deferred) return
    _deferred.prompt()
    const { outcome } = await _deferred.userChoice
    _deferred = null
    if (outcome === 'accepted') localStorage.setItem('buns_pwa_dismissed', '1')
    setVisible(false)
  }

  function handleIosCta() {
    resetAutoHide()
    setIosOpen((o) => !o)
  }

  /* ── Guards ─────────────────────────────────────────────── */
  if (!visible || !platform) return null
  if (SUPPRESS_PATHS.some((p) => path.startsWith(p))) return null

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] inset-x-0 z-[200]
                 flex justify-center px-4 pointer-events-none"
    >
      {/* Slide-up + fade envelope */}
      <div
        className={[
          'w-full pointer-events-auto',
          'transition-all duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
          entered ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
        ].join(' ')}
        style={{ maxWidth: 'min(92vw, 400px)' }}
      >
        {/* Glass card */}
        <div
          className="rounded-[22px] overflow-hidden"
          style={{
            background: 'rgba(10,10,10,0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,212,0,0.14)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(255,212,0,0.09)',
          }}
        >
          <div className="px-4 pt-3.5 pb-3.5">

            {/* ── Header row ── */}
            <div className="flex items-center gap-3">
              <span className="text-[22px] shrink-0 leading-none select-none" aria-hidden="true">
                📲
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-[13.5px] leading-tight tracking-[-0.01em]">
                  {t('pwa.install_title')}
                </p>
                <p className="text-white/45 text-[11.5px] mt-[3px] leading-snug">
                  {t('pwa.install_sub_compact')}
                </p>
              </div>

              {/* Dismiss — small, unobtrusive */}
              <button
                onClick={dismiss}
                aria-label="Fechar"
                className="shrink-0 w-[26px] h-[26px] flex items-center justify-center
                           rounded-full bg-white/[0.07] text-white/35
                           hover:text-white/65 active:scale-90 transition"
              >
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
                  <path d="M1 1l7 7M8 1L1 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* ── CTA ── */}
            <div className="mt-3">
              {platform === 'ios' ? (
                <>
                  <button
                    onClick={handleIosCta}
                    className="w-full py-[10px] bg-buns-yellow text-black font-black
                               text-[13px] uppercase tracking-[0.06em] rounded-[13px]
                               flex items-center justify-center gap-1.5
                               active:scale-[0.97] transition-transform duration-150"
                  >
                    {t('pwa.install_cta')}
                    <svg
                      width="10" height="10" viewBox="0 0 10 10" fill="none"
                      className={`transition-transform duration-200 ${iosOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    >
                      <path d="M1.5 3.5L5 7l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {/* iOS steps — collapse/expand */}
                  <div
                    className={[
                      'overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
                      iosOpen ? 'max-h-16 opacity-100 mt-2' : 'max-h-0 opacity-0',
                    ].join(' ')}
                  >
                    <div className="px-3 py-2.5 rounded-[13px] bg-white/[0.06]">
                      <p className="text-white/55 text-[11.5px] text-center leading-snug tracking-[0.01em]">
                        {t('pwa.install_sub_ios')}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <button
                  onClick={installAndroid}
                  className="w-full py-[10px] bg-buns-yellow text-black font-black
                             text-[13px] uppercase tracking-[0.06em] rounded-[13px]
                             active:scale-[0.97] transition-transform duration-150"
                >
                  {t('pwa.install_cta')}
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
