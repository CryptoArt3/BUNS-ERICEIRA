'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { supabase } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/useI18n'
import { isIosDevice, isStandalone } from '@/lib/pwa'
import { track } from '@/lib/analytics/track'

/* ── Cart restore (same logic as auth/callback, needed here for OTP flow) ── */
function restoreCartIfEmpty() {
  try {
    const current = localStorage.getItem('cart')
    let empty = true
    if (current) {
      try {
        const parsed = JSON.parse(current)
        empty = !Array.isArray(parsed?.items) || parsed.items.length === 0
      } catch { empty = true }
    }
    if (empty) {
      const backup = localStorage.getItem('buns_pending_cart_backup')
      if (backup) {
        try {
          const p = JSON.parse(backup)
          if (Array.isArray(p?.items) && p.items.length > 0) {
            localStorage.setItem('cart', backup)
          }
        } catch {}
      }
    }
  } finally {
    localStorage.removeItem('buns_pending_cart_backup')
  }
}

export default function LoginPage() {
  const router = useRouter()
  const { t } = useI18n()

  const [step, setStep]               = useState<'email' | 'code'>('email')
  const [email, setEmail]             = useState('')
  const [code, setCode]               = useState('')
  const [loading, setLoading]         = useState(false)
  const [err, setErr]                 = useState<string | null>(null)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [showIosPwaHint, setShowIosPwaHint] = useState(false)
  // Resolved after mount to avoid SSR mismatch
  const [nextPath, setNextPath]       = useState<Route>('/checkout')

  // Read ?next= from URL (client-only, no Suspense needed)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get('next')
    setNextPath((raw?.startsWith('/') ? raw : '/checkout') as Route)
  }, [])

  // Check existing session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user?.email ?? null)
    })
  }, [])

  // Show iOS hint when on iPhone/iPad outside standalone PWA
  useEffect(() => {
    setShowIosPwaHint(isIosDevice() && !isStandalone())
  }, [])

  /* ── Step 1: send OTP code ── */
  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    try {
      localStorage.setItem('buns_auth_next', nextPath || '/checkout')
      const cartRaw = localStorage.getItem('cart')
      localStorage.setItem('buns_pending_cart_backup', cartRaw ?? JSON.stringify({ items: [] }))

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      })
      if (error) throw error
      track({ event_name: 'login_started' })
      setStep('code')
    } catch (e: any) {
      setErr(e?.message || t('login.err_send'))
    } finally {
      setLoading(false)
    }
  }

  /* ── Step 2: verify OTP code → redirect ── */
  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'email',
      })
      if (error) throw error

      // Success — restore cart then navigate (loading stays true until component unmounts)
      track({ event_name: 'login_success' })
      restoreCartIfEmpty()
      const saved = localStorage.getItem('buns_auth_next')
      const next = (saved?.startsWith('/') ? saved : '/checkout') as Route
      localStorage.removeItem('buns_auth_next')
      router.replace(next)
    } catch {
      setErr(t('login.err_invalid_code'))
      setLoading(false)
    }
  }

  /* ── Resend: send a fresh OTP to the same email ── */
  async function handleResend() {
    setErr(null)
    setCode('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      })
      if (error) throw error
    } catch (e: any) {
      setErr(e?.message || t('login.err_send'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setSessionEmail(null)
  }

  return (
    <main className="min-h-full w-full max-w-[100vw] overflow-x-hidden bg-buns-cream">

      {/* ── Hero strip ─────────────────────────────────────── */}
      <div className="bg-black px-4 sm:px-6 pt-8 pb-7 border-b-4 border-buns-yellow">
        <div className="max-w-screen-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-buns-yellow text-black text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mb-5">
            {t('login.hero_tag')}
          </div>
          <h1
            className="font-display text-white uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(2.8rem, 10vw, 5.5rem)' }}
          >
            BUNS<br />
            <span className="text-buns-yellow">{t('login.hero_title2')}</span>
          </h1>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="max-w-md mx-auto px-4 pt-10 pb-24">

        {/* ── Already logged in ── */}
        {sessionEmail ? (
          <div className="space-y-4">
            <div className="bg-white border-2 border-black rounded-2xl overflow-hidden">
              <div className="h-[6px] bg-buns-yellow" />
              <div className="p-5">
                <p className="text-[11px] font-black uppercase tracking-widest text-black/35 mb-1">
                  {t('login.active_session')}
                </p>
                <p className="text-black font-black text-lg break-all">{sessionEmail}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href={nextPath}
                className="flex-1 py-4 bg-black text-buns-yellow font-black text-sm uppercase tracking-wide rounded-xl text-center active:scale-[0.98] transition"
              >
                {t('login.continue')}
              </Link>
              <button
                onClick={handleSignOut}
                className="px-5 py-4 bg-white border-2 border-black text-black font-black text-sm uppercase tracking-wide rounded-xl hover:bg-buns-cream transition active:scale-[0.98]"
              >
                {t('login.sign_out')}
              </button>
            </div>
          </div>

        /* ── Step 2: code verification ── */
        ) : step === 'code' ? (
          <div className="space-y-5">
            <div className="bg-white border-2 border-black rounded-2xl overflow-hidden">
              <div className="h-[6px] bg-buns-yellow" />
              <div className="p-6 space-y-5">

                {/* Header */}
                <div className="text-center space-y-1.5">
                  <span className="text-4xl block" aria-hidden="true">📬</span>
                  <p
                    className="font-display uppercase text-black leading-none mt-2"
                    style={{ fontSize: 'clamp(1.4rem, 5vw, 1.8rem)' }}
                  >
                    {t('login.code_sent_title')}
                  </p>
                  <p className="text-black/50 text-sm leading-snug">{t('login.code_sent_sub')}</p>
                  <p className="text-xs text-black/35 mt-1">
                    {t('login.code_sent_for')}:{' '}
                    <span className="font-black text-black/60 break-all">{email}</span>
                  </p>
                </div>

                {/* iOS PWA hint — positive framing for the code UX */}
                {showIosPwaHint && (
                  <div className="bg-buns-cream border border-black/10 rounded-xl px-4 py-3">
                    <p className="text-xs text-black/65 leading-snug">
                      📱 {t('login.ios_pwa_hint')}
                    </p>
                  </div>
                )}

                {/* Code form */}
                <form onSubmit={handleVerifyCode} className="space-y-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-black uppercase tracking-widest text-black/40">
                      {t('login.code_label')}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                      maxLength={6}
                      required
                      autoFocus
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                        setErr(null)
                      }}
                      placeholder={t('login.code_ph')}
                      className="w-full rounded-xl bg-white border-2 border-black/20 focus:border-black px-4 py-3.5 text-black placeholder:text-black/20 outline-none font-black text-3xl tracking-[0.35em] text-center tabular-nums transition"
                    />
                  </label>

                  {err && (
                    <div className="bg-white border-2 border-red-400 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
                      {err}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || code.length < 6}
                    className="w-full py-4 bg-black text-buns-yellow font-black text-base uppercase tracking-wide rounded-xl active:scale-[0.98] transition disabled:opacity-50"
                  >
                    {loading ? t('login.verifying') : t('login.confirm_code')}
                  </button>
                </form>

                {/* Resend + change email */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    className="text-xs text-black/40 underline underline-offset-2 hover:text-black/70 transition disabled:opacity-40"
                  >
                    {t('login.resend')}
                  </button>
                  <button
                    onClick={() => { setStep('email'); setCode(''); setErr(null) }}
                    className="text-xs text-black/40 underline underline-offset-2 hover:text-black/70 transition"
                  >
                    {t('login.use_other')}
                  </button>
                </div>

              </div>
            </div>
          </div>

        /* ── Step 1: email entry ── */
        ) : (
          <div className="space-y-6">

            {/* heading */}
            <div>
              <p
                className="font-display uppercase text-black leading-tight mb-2"
                style={{ fontSize: 'clamp(1.4rem, 4vw, 1.9rem)' }}
              >
                {t('login.heading').split('\n').map((line, i, arr) => (
                  <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                ))}
              </p>
              <p className="text-black/50 text-sm leading-snug">{t('login.sub')}</p>
            </div>

            {/* form */}
            <form onSubmit={handleSendCode} className="space-y-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-widest text-black/40">
                  {t('login.email_label')}
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('login.email_ph')}
                  className="w-full rounded-xl bg-white border-2 border-black/20 focus:border-black px-4 py-3 text-black placeholder:text-black/30 outline-none font-medium transition text-base"
                />
              </label>

              {err && (
                <div className="bg-white border-2 border-red-400 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black text-buns-yellow font-black text-base uppercase tracking-wide rounded-xl border-2 border-black active:scale-[0.98] transition disabled:opacity-50"
              >
                {loading ? t('login.sending') : t('login.send_code')}
              </button>
            </form>

            <p className="text-xs text-black/30 text-center leading-relaxed">
              {t('login.no_password')}
            </p>

            {/* Skip login — only when coming from cart/checkout */}
            {(nextPath === '/checkout' || nextPath === '/cart') && (
              <div className="text-center pt-1">
                <Link
                  href={nextPath}
                  className="text-sm text-black/35 underline underline-offset-2 hover:text-black/60 transition"
                >
                  {t('login.skip')}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
