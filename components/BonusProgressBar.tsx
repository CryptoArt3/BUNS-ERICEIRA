'use client'

import { useMemo } from 'react'

type Props = {
  athTarget: number
  currentBilling: number
  isAchieved: boolean
  monthLabel?: string
}

function Confetti() {
  // Stable particles — no re-render jitter
  const particles = useMemo(
    () =>
      Array.from({ length: 64 }, (_, i) => ({
        id: i,
        x: (i * 1.578125) % 100,         // deterministic spread across 100%
        delay: (i * 0.05) % 3,
        duration: 2.5 + (i % 5) * 0.5,
        size: 6 + (i % 6),
        color: ['#FFD400', '#FF7A00', '#1F8A85', '#ffffff', '#ff4d00', '#00d4b4'][i % 6],
        round: i % 3 === 0,
      })),
    []
  )

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '-16px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.round ? '50%' : '2px',
            animation: `bns-confetti-fall ${p.duration}s ${p.delay}s ease-in infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes bns-confetti-fall {
          0%   { transform: translateY(0)     rotate(0deg);   opacity: 1; }
          80%  {                                               opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

function getMessage(pct: number, isAchieved: boolean): string {
  if (isAchieved) return 'Bonus conquistado!'
  if (pct >= 90) return 'Quase lá. Força máxima.'
  if (pct >= 75) return 'No caminho certo. Continua!'
  if (pct >= 50) return 'Meio caminho andado.'
  if (pct >= 25) return 'Bom início. Vamos a isso!'
  if (pct > 0)   return 'A missão começou. Bora!'
  return 'Sem dados ainda.'
}

export default function BonusProgressBar({
  athTarget,
  currentBilling,
  isAchieved,
  monthLabel,
}: Props) {
  const pct = athTarget > 0
    ? Math.min(Math.round((currentBilling / athTarget) * 100), 100)
    : 0

  const message = getMessage(pct, isAchieved)

  return (
    <div className="w-full space-y-6">
      {isAchieved && <Confetti />}

      {monthLabel && (
        <p className="text-buns-yellow font-black text-xs uppercase tracking-[0.25em] text-center">
          {monthLabel}
        </p>
      )}

      {/* Progress bar */}
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <span className="text-white/40 text-xs uppercase tracking-widest font-black">
            Progresso
          </span>
          <span
            className={`font-display text-5xl leading-none tabular-nums ${
              isAchieved ? 'text-buns-yellow' : 'text-white'
            }`}
          >
            {pct}%
          </span>
        </div>

        <div className="h-5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isAchieved ? 'bg-buns-yellow' : 'bg-white'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {isAchieved && (
          <div className="flex justify-center pt-1">
            <span className="text-[10px] uppercase tracking-[0.2em] text-buns-yellow font-black">
              ✓ Meta superada
            </span>
          </div>
        )}
      </div>

      {/* Motivational message */}
      <p
        className={`text-center font-black text-2xl leading-snug ${
          isAchieved ? 'text-buns-yellow' : 'text-white'
        }`}
      >
        {message}
      </p>
    </div>
  )
}
