'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/lib/i18n/useI18n'

// Capture beforeinstallprompt before React hydrates so we never miss it.
let _deferred: any = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    _deferred = e
  })
}

type Platform = 'ios' | 'android'

export default function InstallBanner() {
  const path = usePathname()
  const { t } = useI18n()
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (path.startsWith('/admin') || path.startsWith('/screen')) return
    if (localStorage.getItem('buns_pwa_dismissed')) return

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    if (standalone) return

    const ua = navigator.userAgent
    const isIos = /iPhone|iPad|iPod/.test(ua)
    // Safari only — exclude Chrome for iOS (CriOS) and Firefox for iOS (FxiOS)
    const isSafariOnIos = isIos && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)

    if (isSafariOnIos) {
      setPlatform('ios')
      const t = setTimeout(() => setVisible(true), 4000)
      return () => clearTimeout(t)
    }

    if (_deferred) {
      setPlatform('android')
      const t = setTimeout(() => setVisible(true), 4000)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function dismiss() {
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

  if (!visible || !platform) return null
  if (path.startsWith('/admin') || path.startsWith('/screen')) return null

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] inset-x-0 z-[200] px-4 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="bg-black border-2 border-buns-yellow/50 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(255,212,0,0.12)]">
          <div className="h-[4px] bg-buns-yellow" />
          <div className="p-4 space-y-3">

            {/* Header row */}
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0 mt-0.5" aria-hidden="true">📲</span>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-sm leading-snug">
                  {t('pwa.install_title')}
                </p>
                <p className="text-white/55 text-xs mt-1 leading-snug">
                  {platform === 'ios' ? t('pwa.install_sub_ios') : t('pwa.install_sub_android')}
                </p>
              </div>
              <button
                onClick={dismiss}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-white/8 text-white/40 hover:text-white transition text-xl leading-none select-none"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            {/* Android CTA */}
            {platform === 'android' && (
              <button
                onClick={installAndroid}
                className="w-full py-2.5 bg-buns-yellow text-black font-black text-sm uppercase tracking-wide rounded-xl active:scale-[0.98] transition"
              >
                {t('pwa.install_cta')}
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
