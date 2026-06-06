'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { QuestProgress } from '@/lib/quest/calculate'
import { QUEST_TIERS, QUEST_REWARDS } from '@/lib/quest/config'

/* ── Types ─────────────────────────────────────────────────── */
type RewardRecord = {
  id: string
  reward_type: string
  unlocked_at: string
  claimed_at: string | null
  redeemed_at: string | null
  activeCode: { code: string; expires_at: string } | null
}

type ClaimView = {
  code: string
  expires_at: string
  reward_label: string
  reward_type: string
}

/* ── Helpers ────────────────────────────────────────────────── */
function getRewardsForTier(tierIdx: number) {
  const tier = QUEST_TIERS[tierIdx]
  const nextTier = QUEST_TIERS[tierIdx + 1]
  return QUEST_REWARDS.filter(
    (r) => r.atOrders >= tier.minOrders && (nextTier ? r.atOrders < nextTier.minOrders : true)
  )
}

function toSlug(label: string) {
  return label.toLowerCase().replace(/\s+/g, '_')
}

function getUserIdFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub ?? null
  } catch {
    return null
  }
}

/* ── Component ──────────────────────────────────────────────── */
export default function QuestWidget({ accessToken }: { accessToken: string }) {
  const [progress, setProgress]     = useState<QuestProgress | null>(null)
  const [error, setError]           = useState(false)
  const [isOpen, setIsOpen]         = useState(false)
  const [show, setShow]             = useState(false)
  const [barPct, setBarPct]         = useState(0)
  const [rewards, setRewards]       = useState<RewardRecord[]>([])
  const [claiming, setClaiming]     = useState<string | null>(null)
  const [claimView, setClaimView]   = useState<ClaimView | null>(null)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [countdown, setCountdown]   = useState('10:00')

  /* ── Fetch progress + rewards ── */
  useEffect(() => {
    const headers = { Authorization: `Bearer ${accessToken}` }
    Promise.all([
      fetch('/api/quest/progress', { headers }).then((r) => r.ok ? r.json() : null),
      fetch('/api/quest/rewards',  { headers }).then((r) => r.ok ? r.json() : null),
    ]).then(([progressData, rewardsData]) => {
      if (progressData) setProgress(progressData)
      else setError(true)
      if (rewardsData?.rewards) setRewards(rewardsData.rewards)
    }).catch(() => setError(true))
  }, [accessToken])

  /* ── Realtime: quest_rewards changes ── */
  useEffect(() => {
    const userId = getUserIdFromToken(accessToken)
    if (!userId) return

    const channel = supabase
      .channel('quest_rewards_widget')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'quest_rewards', filter: `user_id=eq.${userId}` },
        () => {
          fetch('/api/quest/rewards', { headers: { Authorization: `Bearer ${accessToken}` } })
            .then((r) => r.ok ? r.json() : null)
            .then((data) => { if (data?.rewards) setRewards(data.rewards) })
        }
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [accessToken])

  /* ── Bar animation on modal open ── */
  useEffect(() => {
    if (show && progress) {
      const t = setTimeout(() => setBarPct(progress.progressPct), 80)
      return () => clearTimeout(t)
    }
    if (!show) setBarPct(0)
  }, [show, progress])

  /* ── Body scroll lock ── */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  /* ── Countdown timer ── */
  useEffect(() => {
    if (!claimView) return
    const interval = setInterval(() => {
      const remaining = new Date(claimView.expires_at).getTime() - Date.now()
      if (remaining <= 0) {
        setCountdown('00:00')
        clearInterval(interval)
        return
      }
      const min = Math.floor(remaining / 60000)
      const sec = Math.floor((remaining % 60000) / 1000)
      setCountdown(`${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [claimView])

  if (error || !progress) return null

  const { current, next, doneOrders, ordersToNext, progressPct } = progress
  const currentIdx    = current ? QUEST_TIERS.findIndex((t) => t.id === current.id) : -1
  const isMythReached = current?.id === 'myth'
  const nextIsHidden  = next?.hidden === true

  function openModal() {
    setIsOpen(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setShow(true)))
  }

  function closeModal() {
    setShow(false)
    setTimeout(() => setIsOpen(false), 300)
  }

  async function handleClaim(rewardLabel: string) {
    const slug = toSlug(rewardLabel)

    // If there's already an active code, show it directly
    const existingRecord = rewards.find((r) => r.reward_type === slug)
    if (existingRecord?.activeCode) {
      setClaimView({
        code: existingRecord.activeCode.code,
        expires_at: existingRecord.activeCode.expires_at,
        reward_label: rewardLabel,
        reward_type: slug,
      })
      return
    }

    setClaiming(slug)
    setClaimError(null)

    try {
      const res = await fetch('/api/quest/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ reward_type: slug }),
      })

      const data = await res.json()

      if (!res.ok) {
        setClaimError(data.error ?? 'Erro ao gerar código')
        setTimeout(() => setClaimError(null), 4000)
      } else {
        setClaimView({
          code: data.code,
          expires_at: data.expires_at,
          reward_label: data.reward_label,
          reward_type: slug,
        })
        // Refresh rewards list
        fetch('/api/quest/rewards', { headers: { Authorization: `Bearer ${accessToken}` } })
          .then((r) => r.ok ? r.json() : null)
          .then((d) => { if (d?.rewards) setRewards(d.rewards) })
      }
    } catch {
      setClaimError('Erro de rede. Tenta novamente.')
      setTimeout(() => setClaimError(null), 4000)
    } finally {
      setClaiming(null)
    }
  }

  return (
    <section>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35 mb-3">
        A tua missão
      </p>

      {/* ── Collapsed card ── */}
      <button
        onClick={openModal}
        className="w-full text-left bg-white border-2 border-black rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
      >
        <div className="h-[5px] bg-buns-yellow" />
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{current?.emoji ?? '🎯'}</span>
              <div>
                <p className="text-[10px] text-black/35 font-black uppercase tracking-widest">Nível</p>
                <p className="font-display text-black text-xl uppercase leading-none">
                  {current?.label ?? 'Sem nível'}
                </p>
              </div>
            </div>
            <span className="text-xl font-black text-black/30">→</span>
          </div>
          <p className="text-xs text-black/45 font-black">
            {doneOrders} pedido{doneOrders !== 1 ? 's' : ''} concluído{doneOrders !== 1 ? 's' : ''}
          </p>
          <div className="h-2 bg-black/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-buns-yellow rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-[11px] text-black/30 font-black uppercase tracking-widest text-center">
            Toca para ver o teu universo
          </p>
        </div>
      </button>

      {/* ── Modal bottom-sheet ── */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeModal}
          />

          {/* Sheet */}
          <div
            className={`fixed bottom-0 left-0 right-0 z-50 bg-[#faf8f4] rounded-t-[24px] max-h-[90vh] overflow-y-auto transition-transform duration-300 ${show ? 'translate-y-0' : 'translate-y-full'}`}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1.5 bg-black/20 rounded-full" />
            </div>

            <div className="px-5 pb-12 space-y-6">

              {/* 1 — Header */}
              <div className="text-center space-y-1 pt-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35">BUNS Quest</p>
                <div className="text-5xl py-2" aria-hidden="true">{current?.emoji ?? '🎯'}</div>
                <p className="font-display text-black text-3xl uppercase leading-none">
                  {current?.label ?? 'Sem nível'}
                </p>
                <p className="text-sm text-black/45 font-black pt-1">
                  {doneOrders} pedido{doneOrders !== 1 ? 's' : ''} concluído{doneOrders !== 1 ? 's' : ''}
                </p>
              </div>

              {/* 2 — Barra de progresso */}
              <div>
                <div className="flex justify-between text-[11px] text-black/40 font-black mb-2">
                  <span>{current?.emoji} {current?.label ?? 'Início'}</span>
                  {next && (
                    <span>{nextIsHidden ? '???' : `${next.emoji} ${next.label}`}</span>
                  )}
                </div>
                <div className="h-3 bg-black/8 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-buns-yellow rounded-full transition-all duration-[800ms]"
                    style={{ width: `${barPct}%` }}
                  />
                </div>
                {next && (
                  <p className="text-xs text-black/35 text-right mt-1.5 font-black">
                    {nextIsHidden
                      ? `??? em ${ordersToNext} pedido${ordersToNext !== 1 ? 's' : ''}`
                      : `${ordersToNext} pedido${ordersToNext !== 1 ? 's' : ''} para ${next.label}`}
                  </p>
                )}
              </div>

              {/* Claim error banner */}
              {claimError && (
                <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-2.5 text-center">
                  <p className="text-red-500 text-xs font-black">{claimError}</p>
                </div>
              )}

              {/* 3 — Timeline */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35 mb-4">
                  Jornada
                </p>

                {QUEST_TIERS.map((tier, idx) => {
                  const isCompleted  = currentIdx > idx
                  const isCurrent    = currentIdx === idx
                  const isFuture     = currentIdx < idx
                  const isMyth       = tier.id === 'myth'
                  const isMythHidden = isMyth && !isMythReached
                  const isLast       = idx === QUEST_TIERS.length - 1
                  const tierRewards  = isMyth ? [] : getRewardsForTier(idx)

                  return (
                    <div key={tier.id} className="flex gap-4">

                      {/* Dot + linha */}
                      <div className="flex flex-col items-center">
                        <div
                          className={[
                            'w-4 h-4 rounded-full shrink-0 mt-1 border-2',
                            isCompleted          ? 'bg-buns-yellow border-buns-yellow'    : '',
                            isCurrent && !isMyth ? 'bg-black border-black animate-pulse' : '',
                            isCurrent && isMyth  ? 'animate-pulse'                       : '',
                            isFuture  && !isMyth ? 'bg-black/10 border-black/15'         : '',
                          ].filter(Boolean).join(' ')}
                          style={isMyth ? { backgroundColor: '#534AB7', borderColor: '#534AB7' } : {}}
                        />
                        {!isLast && (
                          <div className={`w-0.5 flex-1 min-h-[2.5rem] ${isCompleted ? 'bg-buns-yellow' : 'bg-black/10'}`} />
                        )}
                      </div>

                      {/* Conteúdo */}
                      <div className={`flex-1 ${isLast ? 'pb-2' : 'pb-5'}`}>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg leading-none">{isMythHidden ? '⚫' : tier.emoji}</span>
                          <p className={`font-black text-sm ${isFuture ? 'text-black/40' : 'text-black'}`}>
                            {isMythHidden ? '???' : tier.label}
                          </p>
                          {!isMythHidden && (
                            <span className="text-black/25 text-xs">{tier.minOrders}+ pedidos</span>
                          )}
                        </div>

                        <div className="mt-1 mb-2">
                          {isCompleted && (
                            <span className="inline-block text-[10px] font-black uppercase tracking-wide bg-buns-yellow/20 text-black px-2 py-0.5 rounded-md">
                              ✓ Concluído
                            </span>
                          )}
                          {isCurrent && (
                            <span className="inline-block text-[10px] font-black uppercase tracking-wide bg-buns-yellow text-black px-2 py-0.5 rounded-md">
                              ← Estás aqui
                            </span>
                          )}
                        </div>

                        {/* Recompensas do nível */}
                        {tierRewards.length > 0 && (
                          <div className="flex flex-col gap-2">
                            {tierRewards.map((reward) => {
                              const unlocked   = doneOrders >= reward.atOrders
                              const slug       = toSlug(reward.label)
                              const dbRecord   = rewards.find((r) => r.reward_type === slug)
                              const isRedeemed = !!dbRecord?.redeemed_at
                              const isClaiming = claiming === slug

                              return (
                                <div key={reward.atOrders}>
                                  {!unlocked ? (
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-lg border bg-black/5 border-black/10 text-black/30">
                                      🔒 {reward.label}
                                      <span className="text-[10px] text-black/20">aos {reward.atOrders}</span>
                                    </span>
                                  ) : isRedeemed ? (
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-lg border bg-green-500/10 border-green-500/25 text-green-700">
                                      ✓ {reward.label} — Recebida
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleClaim(reward.label)}
                                      disabled={isClaiming}
                                      className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1.5 rounded-lg border bg-buns-yellow/20 border-buns-yellow/50 text-black active:scale-[0.97] transition-transform disabled:opacity-50"
                                    >
                                      🎁 {reward.label}
                                      <span className="text-[10px] opacity-60">
                                        {isClaiming ? '...' : '→'}
                                      </span>
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}

                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 4 — Footer */}
              <div className="space-y-4 pt-2 border-t border-black/8">
                {isMythReached ? (
                  <p className="text-center text-sm text-black/50 font-black pt-2">
                    És um dos poucos que chegou até aqui. 🏆
                  </p>
                ) : (
                  <p className="text-center text-xs text-black/30 italic pt-2">
                    Existe algo acima de Legend...
                  </p>
                )}
                <button
                  onClick={closeModal}
                  className="w-full py-3.5 bg-black text-buns-yellow font-black text-sm uppercase tracking-wide rounded-xl active:scale-[0.98] transition-transform"
                >
                  Fechar
                </button>
              </div>

            </div>
          </div>

          {/* ── Code screen ── */}
          {claimView && (
            <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center px-6">
              <div className="text-center space-y-6 w-full max-w-xs">

                <div className="space-y-1">
                  <p className="text-white/40 text-xs font-black uppercase tracking-[0.2em]">
                    Recompensa
                  </p>
                  <p className="font-display text-white text-3xl uppercase leading-none">
                    {claimView.reward_label}
                  </p>
                </div>

                <div className="bg-buns-yellow rounded-2xl py-8 px-6">
                  <p className="font-black text-black text-6xl tracking-[0.2em]">
                    {claimView.code}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-white/40 text-sm">Mostra este código ao balcão</p>
                  <p className="text-white font-black text-3xl tabular-nums">{countdown}</p>
                  <p className="text-white/30 text-xs uppercase tracking-widest font-black">
                    restantes
                  </p>
                </div>

                <button
                  onClick={() => setClaimView(null)}
                  className="w-full py-3.5 border border-white/20 text-white/50 font-black text-sm uppercase tracking-wide rounded-xl active:scale-[0.98] transition"
                >
                  Fechar
                </button>

              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
