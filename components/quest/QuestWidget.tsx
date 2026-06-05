'use client'

import { useEffect, useState } from 'react'
import type { QuestProgress } from '@/lib/quest/calculate'
import { QUEST_TIERS, QUEST_REWARDS } from '@/lib/quest/config'

function getRewardsForTier(tierIdx: number) {
  const tier = QUEST_TIERS[tierIdx]
  const nextTier = QUEST_TIERS[tierIdx + 1]
  return QUEST_REWARDS.filter(
    (r) => r.atOrders >= tier.minOrders && (nextTier ? r.atOrders < nextTier.minOrders : true)
  )
}

export default function QuestWidget({ accessToken }: { accessToken: string }) {
  const [progress, setProgress]   = useState<QuestProgress | null>(null)
  const [error, setError]         = useState(false)
  const [isOpen, setIsOpen]       = useState(false)
  const [show, setShow]           = useState(false)
  const [barPct, setBarPct]       = useState(0)

  useEffect(() => {
    fetch('/api/quest/progress', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setProgress)
      .catch(() => setError(true))
  }, [accessToken])

  useEffect(() => {
    if (show && progress) {
      const t = setTimeout(() => setBarPct(progress.progressPct), 80)
      return () => clearTimeout(t)
    }
    if (!show) setBarPct(0)
  }, [show, progress])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

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

  return (
    <section>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35 mb-3">
        A tua missão
      </p>

      {/* ── Collapsed card ────────────────────────────────── */}
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

      {/* ── Modal bottom-sheet ────────────────────────────── */}
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

                      {/* Dot + linha vertical */}
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

                      {/* Conteúdo do nível */}
                      <div className={`flex-1 ${isLast ? 'pb-2' : 'pb-5'}`}>

                        {/* Nome + pedidos */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg leading-none">{isMythHidden ? '⚫' : tier.emoji}</span>
                          <p className={`font-black text-sm ${isFuture ? 'text-black/40' : 'text-black'}`}>
                            {isMythHidden ? '???' : tier.label}
                          </p>
                          {!isMythHidden && (
                            <span className="text-black/25 text-xs">{tier.minOrders}+ pedidos</span>
                          )}
                        </div>

                        {/* Badge de estado */}
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

                        {/* Recompensas */}
                        {tierRewards.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {tierRewards.map((reward) => {
                              const unlocked = doneOrders >= reward.atOrders
                              return (
                                <span
                                  key={reward.atOrders}
                                  className={`text-[11px] font-black px-2.5 py-1 rounded-lg border ${
                                    unlocked
                                      ? 'bg-buns-yellow/20 border-buns-yellow/50 text-black'
                                      : 'bg-black/5 border-black/10 text-black/30'
                                  }`}
                                >
                                  {unlocked ? '🎁' : '🔒'} {reward.label}
                                  {!unlocked && (
                                    <span className="ml-1 text-[10px] text-black/20">aos {reward.atOrders}</span>
                                  )}
                                </span>
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
        </>
      )}
    </section>
  )
}
