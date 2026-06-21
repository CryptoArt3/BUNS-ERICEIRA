'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

/* ── Types ─────────────────────────────────────────────────── */
type CodeStatus = 'available' | 'pending' | 'redeemed' | 'expired'

type Claim = {
  claim_hash:    string
  claimer_name:  string
  claimer_phone: string
  claimed_at:    string
  expires_at:    string
  redeemed_at:   string | null
}

type VideoCode = {
  id:            string
  code:          string
  episode_title: string
  prize:         string
  status:        CodeStatus
  created_at:    string
  video_code_claims: Claim[]
}

type SearchResult = Claim & {
  video_codes: { episode_title: string; prize: string; status: string }
}

type RedeemInfo = {
  state:         'valid' | 'already_redeemed' | 'expired'
  claim_hash?:   string
  claimer_name?: string
  claimer_phone?: string
  prize?:        string
  episode_title?: string
  claimed_at?:   string
  expires_at?:   string
  redeemed_at?:  string
  error?:        string
}

/* ── Status config ──────────────────────────────────────────── */
const STATUS_LABEL: Record<CodeStatus, string> = {
  available: 'Disponível',
  pending:   'Pendente',
  redeemed:  'Levantado',
  expired:   'Expirado',
}

const STATUS_CLASS: Record<CodeStatus, string> = {
  available: 'bg-green-500/15 text-green-300 border border-green-500/25',
  pending:   'bg-amber-500/15 text-amber-300 border border-amber-500/25',
  redeemed:  'bg-zinc-500/15 text-zinc-400 border border-zinc-500/25',
  expired:   'bg-red-500/15 text-red-400 border border-red-500/25',
}

/* ── Auth helper ────────────────────────────────────────────── */
async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

/* ── Component ──────────────────────────────────────────────── */
export default function AdminCodigosPage() {
  const [codes, setCodes]   = useState<VideoCode[]>([])
  const [loading, setLoading] = useState(true)

  /* Create form */
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ code: '', episode_title: '', prize: '' })
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState('')
  const [createOk, setCreateOk]   = useState(false)

  /* Redeem flow */
  const [redeemHash,    setRedeemHash]    = useState('')
  const [redeemInfo,    setRedeemInfo]    = useState<RedeemInfo | null>(null)
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemStep,    setRedeemStep]    = useState<'idle' | 'preview' | 'confirmed' | 'error'>('idle')

  /* Search */
  const [searchQ,       setSearchQ]       = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching,     setSearching]     = useState(false)
  const [searchMsg,     setSearchMsg]     = useState('')

  /* Expanded code detail */
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadCodes = useCallback(async () => {
    setLoading(true)
    const token = await getToken()
    if (!token) { setLoading(false); return }
    const res = await fetch('/api/video-codes', { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    if (Array.isArray(data)) setCodes(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadCodes() }, [loadCodes])

  /* ── Create ── */
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (creating) return
    setCreating(true)
    setCreateMsg('')
    const token = await getToken()
    if (!token) { setCreating(false); return }
    const res = await fetch('/api/video-codes', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(createForm),
    })
    const data = await res.json()
    if (res.ok) {
      setCreateMsg('Código criado com sucesso.')
      setCreateOk(true)
      setCreateForm({ code: '', episode_title: '', prize: '' })
      await loadCodes()
      setTimeout(() => { setShowCreate(false); setCreateMsg(''); setCreateOk(false) }, 1800)
    } else {
      setCreateMsg(data.error ?? 'Erro.')
      setCreateOk(false)
    }
    setCreating(false)
  }

  /* ── Redeem: verify (GET) ── */
  async function handleVerify() {
    if (redeemLoading || !redeemHash.trim()) return
    setRedeemLoading(true)
    setRedeemInfo(null)
    const token = await getToken()
    if (!token) { setRedeemLoading(false); return }
    const res = await fetch(
      `/api/video-codes/redeem?hash=${encodeURIComponent(redeemHash.trim())}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    const data = await res.json()
    if (res.ok) {
      setRedeemInfo({ state: 'valid', ...data })
      setRedeemStep('preview')
    } else if (res.status === 409) {
      setRedeemInfo({ state: 'already_redeemed', ...data })
      setRedeemStep('error')
    } else if (res.status === 410) {
      setRedeemInfo({ state: 'expired', ...data })
      setRedeemStep('error')
    } else {
      setRedeemInfo({ state: 'expired', error: data.error ?? 'Erro.' })
      setRedeemStep('error')
    }
    setRedeemLoading(false)
  }

  /* ── Redeem: confirm (POST) ── */
  async function handleConfirmRedeem() {
    if (redeemLoading) return
    setRedeemLoading(true)
    const token = await getToken()
    if (!token) { setRedeemLoading(false); return }
    const res = await fetch('/api/video-codes/redeem', {
      method:  'POST',
      headers: authHeaders(token),
      body:    JSON.stringify({ hash: redeemHash.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      setRedeemInfo((prev) => ({ ...prev!, ...data, state: 'valid' }))
      setRedeemStep('confirmed')
      await loadCodes()
    } else {
      setRedeemInfo({ state: 'expired', error: data.error ?? 'Erro.' })
      setRedeemStep('error')
    }
    setRedeemLoading(false)
  }

  function resetRedeem() {
    setRedeemHash('')
    setRedeemInfo(null)
    setRedeemStep('idle')
  }

  /* ── Search ── */
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searching || searchQ.trim().length < 2) return
    setSearching(true)
    setSearchMsg('')
    setSearchResults([])
    const token = await getToken()
    if (!token) { setSearching(false); return }
    const res = await fetch(
      `/api/video-codes/search?q=${encodeURIComponent(searchQ.trim())}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    const data = await res.json()
    if (res.ok && Array.isArray(data)) {
      setSearchResults(data)
      if (data.length === 0) setSearchMsg('Nenhum resultado encontrado.')
    } else {
      setSearchMsg(data.error ?? 'Erro na pesquisa.')
    }
    setSearching(false)
  }

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-buns-yellow font-black text-xs uppercase tracking-[0.25em]">Admin</p>
            <h1 className="font-display text-white text-4xl uppercase leading-none">Códigos</h1>
          </div>
          <button
            onClick={() => { setShowCreate((v) => !v); setCreateMsg('') }}
            className="px-4 py-2.5 bg-buns-yellow text-black font-black text-xs uppercase tracking-wide rounded-xl hover:brightness-110 transition active:scale-[0.98]"
          >
            {showCreate ? '✕ Cancelar' : '+ Novo código'}
          </button>
        </div>

        {/* ── Create form ── */}
        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4"
          >
            <p className="text-[11px] font-black uppercase tracking-widest text-white/35">
              Novo código de episódio
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-white/45 mb-1.5 block">Código numérico *</label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="ex: 4782"
                  value={createForm.code}
                  onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value }))}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2.5
                             text-white text-sm placeholder:text-white/25 font-black tracking-widest text-center
                             focus:border-buns-yellow focus:outline-none transition-colors"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-white/45 mb-1.5 block">Título do episódio *</label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="ex: Ep. 02 — Buns & Bunana no Mercado"
                  value={createForm.episode_title}
                  onChange={(e) => setCreateForm((f) => ({ ...f, episode_title: e.target.value }))}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2.5
                             text-white text-sm placeholder:text-white/25
                             focus:border-buns-yellow focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-white/45 mb-1.5 block">Prémio *</label>
              <input
                type="text"
                required
                autoComplete="off"
                placeholder="ex: Gold Bun grátis"
                value={createForm.prize}
                onChange={(e) => setCreateForm((f) => ({ ...f, prize: e.target.value }))}
                className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2.5
                           text-white text-sm placeholder:text-white/25
                           focus:border-buns-yellow focus:outline-none transition-colors"
              />
            </div>
            {createMsg && (
              <p className={`text-sm font-black ${createOk ? 'text-green-400' : 'text-red-400'}`}>
                {createMsg}
              </p>
            )}
            <button
              type="submit"
              disabled={creating || !createForm.code.trim() || !createForm.episode_title.trim() || !createForm.prize.trim()}
              className="w-full py-3 bg-buns-yellow text-black font-black text-sm uppercase tracking-wide
                         rounded-xl disabled:opacity-30 transition active:scale-[0.98]"
            >
              {creating ? 'A criar…' : 'Criar código'}
            </button>
          </form>
        )}

        {/* ── Redeem section ── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-white/35">
            Levantar prémio na loja
          </p>

          {redeemStep === 'idle' && (
            <div className="flex gap-3">
              <input
                type="text"
                autoComplete="off"
                placeholder="BUNS-XXXXX"
                value={redeemHash}
                onChange={(e) => setRedeemHash(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                className="flex-1 bg-zinc-900 border border-white/15 rounded-xl px-4 py-3
                           text-white font-black text-sm tracking-widest placeholder:text-white/25 placeholder:tracking-normal
                           focus:border-buns-yellow focus:outline-none transition-colors"
              />
              <button
                onClick={handleVerify}
                disabled={redeemLoading || !redeemHash.trim()}
                className="px-5 py-3 bg-white/10 border border-white/15 text-white font-black text-xs
                           uppercase tracking-wide rounded-xl hover:bg-white/15 disabled:opacity-30
                           transition active:scale-[0.98]"
              >
                {redeemLoading ? '…' : 'Verificar'}
              </button>
            </div>
          )}

          {redeemStep === 'preview' && redeemInfo && (
            <div className="space-y-4">
              <div className="rounded-xl bg-green-950/50 border border-green-500/30 p-4 space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                  <p className="text-green-300 font-black text-xs uppercase tracking-widest">Hash válido</p>
                </div>
                <Row label="Hash"     value={redeemInfo.claim_hash ?? ''} mono />
                <Row label="Cliente"  value={redeemInfo.claimer_name ?? ''} />
                <Row label="Tel."     value={redeemInfo.claimer_phone ?? ''} />
                <Row label="Prémio"   value={redeemInfo.prize ?? ''} />
                <Row label="Episódio" value={redeemInfo.episode_title ?? ''} />
                <Row label="Reclamado em" value={redeemInfo.claimed_at ? fmtDateTime(redeemInfo.claimed_at) : ''} />
                <Row label="Válido até"   value={redeemInfo.expires_at ? fmtDate(redeemInfo.expires_at) : ''} />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmRedeem}
                  disabled={redeemLoading}
                  className="flex-1 py-3 bg-buns-yellow text-black font-black text-sm uppercase tracking-wide
                             rounded-xl disabled:opacity-30 transition active:scale-[0.98]"
                >
                  {redeemLoading ? 'A confirmar…' : '✓ Confirmar levantamento'}
                </button>
                <button
                  onClick={resetRedeem}
                  className="px-4 py-3 border border-white/15 text-white/40 font-black text-xs
                             uppercase tracking-wide rounded-xl hover:text-white transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {redeemStep === 'confirmed' && redeemInfo && (
            <div className="space-y-4">
              <div className="rounded-xl bg-buns-yellow/10 border border-buns-yellow/30 p-4 space-y-2">
                <p className="text-buns-yellow font-black text-xs uppercase tracking-widest mb-3">
                  ✓ Prémio levantado com sucesso
                </p>
                <Row label="Cliente"  value={redeemInfo.claimer_name ?? ''} />
                <Row label="Prémio"   value={redeemInfo.prize ?? ''} />
                <Row label="Episódio" value={redeemInfo.episode_title ?? ''} />
              </div>
              <button
                onClick={resetRedeem}
                className="w-full py-3 border border-white/15 text-white/50 font-black text-xs
                           uppercase tracking-wide rounded-xl hover:text-white transition"
              >
                Novo levantamento
              </button>
            </div>
          )}

          {redeemStep === 'error' && redeemInfo && (
            <div className="space-y-3">
              <div className={`rounded-xl p-4 space-y-2 ${
                redeemInfo.state === 'already_redeemed'
                  ? 'bg-zinc-800/60 border border-zinc-600/40'
                  : 'bg-red-950/50 border border-red-500/30'
              }`}>
                <p className={`font-black text-xs uppercase tracking-widest mb-2 ${
                  redeemInfo.state === 'already_redeemed' ? 'text-zinc-400' : 'text-red-400'
                }`}>
                  {redeemInfo.state === 'already_redeemed' ? 'Já levantado' : 'Hash expirado'}
                </p>
                <p className="text-white/60 text-sm">{redeemInfo.error}</p>
                {redeemInfo.claimer_name && <Row label="Cliente" value={redeemInfo.claimer_name} />}
                {redeemInfo.prize && <Row label="Prémio" value={redeemInfo.prize} />}
                {redeemInfo.redeemed_at && <Row label="Levantado em" value={fmtDateTime(redeemInfo.redeemed_at)} />}
                {redeemInfo.expires_at && redeemInfo.state === 'expired' && (
                  <Row label="Expirou em" value={fmtDateTime(redeemInfo.expires_at)} />
                )}
              </div>
              <button
                onClick={resetRedeem}
                className="w-full py-3 border border-white/15 text-white/50 font-black text-xs
                           uppercase tracking-wide rounded-xl hover:text-white transition"
              >
                Tentar outro hash
              </button>
            </div>
          )}
        </div>

        {/* ── Search section ── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-white/35">
            Recuperação manual — pesquisa por nome ou telemóvel
          </p>
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              autoComplete="off"
              placeholder="Nome ou número..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="flex-1 bg-zinc-900 border border-white/15 rounded-xl px-4 py-3
                         text-white text-sm placeholder:text-white/25
                         focus:border-buns-yellow focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={searching || searchQ.trim().length < 2}
              className="px-5 py-3 bg-white/10 border border-white/15 text-white font-black text-xs
                         uppercase tracking-wide rounded-xl hover:bg-white/15 disabled:opacity-30
                         transition active:scale-[0.98]"
            >
              {searching ? '…' : 'Pesquisar'}
            </button>
          </form>

          {searchMsg && <p className="text-white/40 text-sm font-black">{searchMsg}</p>}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((r, i) => (
                <div key={i} className="rounded-xl border border-white/8 bg-zinc-950/50 px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-black text-white text-sm">{r.claimer_name}</p>
                    <code className="text-buns-yellow font-black text-sm tracking-widest">{r.claim_hash}</code>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                    <span className="text-white/35 text-xs">{r.claimer_phone}</span>
                    <span className="text-white/35 text-xs">{(r.video_codes as { episode_title: string }).episode_title}</span>
                    <span className="text-white/35 text-xs">{(r.video_codes as { prize: string }).prize}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                    <span className="text-white/25 text-[11px]">Válido até {fmtDate(r.expires_at)}</span>
                    {r.redeemed_at && (
                      <span className="text-green-400/60 text-[11px]">✓ Levantado {fmtDateTime(r.redeemed_at)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Codes list ── */}
        <div className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-white/35">
            Todos os episódios ({codes.length})
          </p>

          {loading && <div className="h-32 rounded-2xl bg-white/5 animate-pulse" />}

          {!loading && codes.length === 0 && (
            <p className="text-white/20 text-sm text-center py-6">
              Nenhum código criado ainda. Cria o primeiro com o botão acima.
            </p>
          )}

          {!loading && codes.map((c) => {
            const activeClaim = c.video_code_claims.find((cl) => !cl.redeemed_at)
            const isExpanded  = expandedId === c.id

            return (
              <div key={c.id} className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-white/5 transition"
                >
                  <div className="shrink-0 w-14 text-center">
                    <p className="font-black text-buns-yellow text-lg tracking-widest">{c.code}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white text-sm leading-tight truncate">{c.episode_title}</p>
                    <p className="text-white/35 text-xs mt-0.5 truncate">{c.prize}</p>
                  </div>
                  <span className={`shrink-0 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_CLASS[c.status]}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                  <span className="text-white/20 text-xs shrink-0">{isExpanded ? '▲' : '▼'}</span>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/8 px-5 py-4 space-y-3 bg-black/20">
                    <Row label="Código"   value={c.code} mono />
                    <Row label="Criado"   value={fmtDate(c.created_at)} />
                    {c.video_code_claims.length === 0 && (
                      <p className="text-white/25 text-xs font-black uppercase tracking-widest">
                        Sem tentativas ainda
                      </p>
                    )}
                    {c.video_code_claims.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/25">
                          Histórico de claims ({c.video_code_claims.length})
                        </p>
                        {c.video_code_claims.map((cl, i) => (
                          <div key={i} className="rounded-lg border border-white/6 bg-white/3 px-3 py-2 space-y-0.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p className="text-white text-xs font-black">{cl.claimer_name}</p>
                              <code className="text-buns-yellow text-xs font-black tracking-widest">{cl.claim_hash}</code>
                            </div>
                            <p className="text-white/35 text-[11px]">{cl.claimer_phone}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                              <span className="text-white/25 text-[11px]">Reclamado {fmtDateTime(cl.claimed_at)}</span>
                              {cl.redeemed_at
                                ? <span className="text-green-400/60 text-[11px]">✓ Levantado {fmtDateTime(cl.redeemed_at)}</span>
                                : <span className="text-amber-400/60 text-[11px]">Prazo até {fmtDate(cl.expires_at)}</span>
                              }
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeClaim && !activeClaim.redeemed_at && (
                      <button
                        onClick={() => {
                          setRedeemHash(activeClaim.claim_hash)
                          setRedeemStep('idle')
                          setRedeemInfo(null)
                          document.querySelector('#redeem-section')?.scrollIntoView({ behavior: 'smooth' })
                        }}
                        className="text-[10px] font-black uppercase tracking-wide text-buns-yellow
                                   border border-buns-yellow/30 px-3 py-1.5 rounded-lg
                                   hover:bg-buns-yellow/10 transition"
                      >
                        Usar hash para levantar →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </main>
  )
}

/* ── Row helper ─────────────────────────────────────────────── */
function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <span className="text-[10px] font-black uppercase tracking-widest text-white/30 shrink-0 w-24">{label}</span>
      <span className={`text-sm ${mono ? 'font-black text-buns-yellow tracking-widest' : 'text-white/70 font-medium'}`}>
        {value}
      </span>
    </div>
  )
}
