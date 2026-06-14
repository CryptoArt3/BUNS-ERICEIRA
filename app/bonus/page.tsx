'use client'

import { useEffect, useState } from 'react'
import BonusProgressBar from '@/components/BonusProgressBar'

type Tracker = {
  ath_target: number
  current_billing: number
  is_achieved: boolean
  month_label: string
  updated_at: string
}

export default function BonusPage() {
  const [tracker, setTracker] = useState<Tracker | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/bonus')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(true)
        else setTracker(data as Tracker)
      })
      .catch(() => setError(true))
  }, [])

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-10">

        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-buns-yellow font-black text-xs uppercase tracking-[0.25em]">
            BUNS Ericeira
          </p>
          <h1 className="font-display text-white text-6xl uppercase leading-none">
            Bonus
          </h1>
        </div>

        {/* States */}
        {!tracker && !error && (
          <div className="space-y-3">
            <div className="h-5 bg-white/10 rounded-full animate-pulse" />
            <div className="h-4 bg-white/5 rounded-full w-1/2 mx-auto animate-pulse" />
          </div>
        )}

        {error && (
          <p className="text-white/30 text-center text-sm">
            Erro ao carregar. Tenta mais tarde.
          </p>
        )}

        {tracker && (
          <BonusProgressBar
            athTarget={tracker.ath_target}
            currentBilling={tracker.current_billing}
            isAchieved={tracker.is_achieved}
            monthLabel={tracker.month_label}
          />
        )}

      </div>
    </main>
  )
}
