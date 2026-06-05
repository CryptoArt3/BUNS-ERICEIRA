'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { QuestProgress } from '@/lib/quest/calculate'

export default function QuestWidget({ userId }: { userId: string }) {
  const [progress, setProgress] = useState<QuestProgress | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const token = session?.access_token
      if (!token) { setError(true); return }
      fetch('/api/quest/progress', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then(setProgress)
        .catch(() => setError(true))
    })
  }, [userId])

  if (error || !progress) return null

  const { current, next, doneOrders, ordersToNext, progressPct, nextReward } = progress

  const nextIsHidden = next?.hidden === true
  const nextLabel = nextIsHidden ? '???' : next ? `${next.emoji} ${next.label}` : null

  return (
    <section>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35 mb-3">
        A tua missão
      </p>
      <div className="bg-white border-2 border-black rounded-2xl overflow-hidden">
        <div className="h-[6px] bg-buns-yellow" />
        <div className="p-5 space-y-4">

          {/* Tier badge */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-black/40 font-black uppercase tracking-wide">Nível actual</p>
              {current ? (
                <p className="font-display text-black text-2xl uppercase leading-none mt-1">
                  {current.emoji} {current.label}
                </p>
              ) : (
                <p className="font-display text-black text-lg uppercase leading-none mt-1">
                  Sem nível ainda
                </p>
              )}
            </div>
            {current && (
              <span className="text-3xl" aria-hidden="true">{current.emoji}</span>
            )}
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-[11px] text-black/40 font-black mb-1.5">
              <span>{doneOrders} pedidos concluídos</span>
              {nextLabel && <span>{nextLabel}</span>}
            </div>
            <div className="h-2.5 bg-black/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-buns-yellow rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Next level / max level */}
          {next ? (
            <p className="text-xs text-black/45 text-center">
              {nextIsHidden ? (
                <>Algo secreto aguarda em <span className="font-black text-black">{ordersToNext}</span> pedido{ordersToNext !== 1 ? 's' : ''}</>
              ) : (
                <>Mais <span className="font-black text-black">{ordersToNext}</span> pedido{ordersToNext !== 1 ? 's' : ''} para {next.emoji} {next.label}</>
              )}
            </p>
          ) : (
            <p className="text-xs text-black/45 text-center font-black">
              Atingiste o nível máximo! 🏆
            </p>
          )}

          {/* Next reward milestone */}
          {nextReward && !nextReward.hidden && (
            <div className="bg-buns-yellow/10 border border-buns-yellow/30 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
              <span className="text-base" aria-hidden="true">🎁</span>
              <div>
                <p className="text-[11px] text-black/40 font-black uppercase tracking-wide">Próxima recompensa</p>
                <p className="text-xs font-black text-black">
                  {nextReward.label} — {nextReward.atOrders} pedidos
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  )
}
