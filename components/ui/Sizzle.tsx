'use client'
import { useEffect, useState } from 'react'

export const Sizzle = () => {
  // anima um medidor só para efeito
  const [pct, setPct] = useState(20)
  useEffect(() => {
    const id = setInterval(() => setPct(p => (p > 85 ? 20 : p + 5)), 120)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="space-y-3">
      <h3 className="text-xl font-semibold drop-shadow-[0_2px_10px_rgba(0,0,0,.35)]">
        <span className="align-middle">🔥</span>{' '}
        <span className="tracking-wide">Chapa no máximo, sabor no limite.</span>
      </h3>
      <p className="text-white/75 text-sm">
        Alterna <strong>Dia/Noite</strong> no topo e muda a vibe — surf de dia, graffiti à noite.
      </p>

      {/* sizzle meter */}
      <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden border border-white/10">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background:
              'linear-gradient(90deg, rgba(255,212,0,1) 0%, rgba(255,122,0,1) 100%)',
            boxShadow: '0 0 14px rgba(255, 180, 0, .55)'
          }}
        />
      </div>
    </div>
  )
}
