'use client'

import { useState } from 'react'

type ClaimResult = {
  hash: string
  prize: string
  episode_title: string
  expires_at: string
}

export default function CodigoPage() {
  const [step, setStep]       = useState<'form' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [result, setResult]   = useState<ClaimResult | null>(null)
  const [copied, setCopied]   = useState(false)

  const [code,  setCode]  = useState('')
  const [name,  setName]  = useState('')
  const [phone, setPhone] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/video-codes/claim', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: code.trim(), name: name.trim(), phone: phone.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro desconhecido.')
      } else {
        setResult(data)
        setStep('success')
      }
    } catch {
      setError('Erro de ligação. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function copyHash() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.hash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch { /* clipboard not available */ }
  }

  const expiryLabel = result
    ? new Date(result.expires_at).toLocaleDateString('pt-PT', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : ''

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-lg mx-auto px-4 py-12 space-y-8">

        {/* Header */}
        <div className="space-y-3">
          <p className="text-buns-yellow font-black text-xs uppercase tracking-[0.25em]">
            Buns & Bunana
          </p>
          <h1 className="font-display text-white uppercase leading-none"
              style={{ fontSize: 'clamp(2.8rem, 10vw, 4.5rem)' }}>
            Encontra<br />o Código
          </h1>
          <p className="text-white/45 text-sm leading-relaxed max-w-sm">
            Escondemos um código numérico em cada episódio. O primeiro a encontrá‑lo
            e a introduzi‑lo aqui ganha o prémio — só há um por episódio.
          </p>
        </div>

        {/* ── Form ── */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">

              {/* Code input */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/35 mb-2 block">
                  Código do episódio
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  inputMode="numeric"
                  placeholder="ex: 4782"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-4 py-4
                             text-white text-3xl font-black text-center tracking-[0.4em]
                             placeholder:text-white/20 placeholder:text-base placeholder:tracking-normal
                             focus:border-buns-yellow focus:outline-none transition-colors"
                />
              </div>

              {/* Divider */}
              <div className="border-t border-white/8" />

              {/* Name + phone */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/35">
                  Os teus dados (para levantamento)
                </p>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Nome</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="O teu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/15 rounded-xl px-4 py-3
                               text-white text-sm placeholder:text-white/25
                               focus:border-buns-yellow focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Telemóvel</label>
                  <input
                    type="tel"
                    required
                    autoComplete="off"
                    placeholder="9XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/15 rounded-xl px-4 py-3
                               text-white text-sm placeholder:text-white/25
                               focus:border-buns-yellow focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl bg-red-950/60 border border-red-500/30 px-4 py-3">
                  <p className="text-red-300 text-sm font-black leading-snug">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !code.trim() || !name.trim() || !phone.trim()}
                className="w-full py-4 bg-buns-yellow text-black font-black text-sm uppercase tracking-widest
                           rounded-xl disabled:opacity-30 transition active:scale-[0.98] hover:brightness-105"
              >
                {loading ? 'A verificar…' : 'Reclamar prémio'}
              </button>
            </div>

            <p className="text-center text-white/20 text-[11px] font-black uppercase tracking-widest">
              Apenas 1 prémio por episódio — o primeiro a acertar ganha
            </p>
          </form>
        )}

        {/* ── Success ── */}
        {step === 'success' && result && (
          <div className="space-y-4">

            {/* Warning banner */}
            <div className="rounded-2xl border-2 border-buns-yellow bg-buns-yellow/8 px-5 py-4 space-y-1.5">
              <p className="text-buns-yellow font-black text-xs uppercase tracking-widest">
                ⚠️ Lê isto antes de saíres desta página
              </p>
              <p className="text-white font-black text-sm leading-snug">
                GUARDA ESTE CÓDIGO AGORA.
              </p>
              <p className="text-white/65 text-sm leading-relaxed">
                Tira print, foto ou copia para um lugar seguro. Não é enviado por SMS
                nem email. Se perderes, tens de contactar a loja directamente.
              </p>
            </div>

            {/* Hash display */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
                O teu código de levantamento
              </p>
              <div className="rounded-xl bg-black border-2 border-buns-yellow/60 px-4 py-5
                              shadow-[0_0_32px_rgba(255,212,0,0.15)]">
                <p className="font-display text-buns-yellow leading-none select-all"
                   style={{ fontSize: 'clamp(2rem, 8vw, 2.8rem)', letterSpacing: '0.15em' }}>
                  {result.hash}
                </p>
              </div>
              <button
                onClick={copyHash}
                className="w-full py-3 rounded-xl border border-white/15 text-white/50 font-black
                           text-xs uppercase tracking-widest hover:border-buns-yellow/40 hover:text-white
                           transition-colors active:scale-[0.98]"
              >
                {copied ? '✓ Copiado!' : 'Copiar código'}
              </button>
            </div>

            {/* Prize + deadline */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Prémio</p>
                <p className="text-white font-black text-lg leading-snug">{result.prize}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Episódio</p>
                <p className="text-white/55 text-sm font-black">{result.episode_title}</p>
              </div>
              <div className="border-t border-white/8 pt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">
                  Data limite para levantamento
                </p>
                <p className="text-buns-yellow font-black text-lg">{expiryLabel}</p>
                <p className="text-white/30 text-xs mt-1 leading-relaxed">
                  Vai à loja, diz o teu código ao balcão, e levanta o teu prémio.
                  Após este prazo o código expira e o prémio volta a estar disponível.
                </p>
              </div>
            </div>

            <p className="text-center text-white/20 text-[11px] font-black uppercase tracking-widest">
              Calçada da Baleia 29A · Ericeira
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
