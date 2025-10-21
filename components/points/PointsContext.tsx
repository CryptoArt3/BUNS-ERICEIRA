'use client'
import React from 'react'

/** Estrutura só para satisfazer imports antigos. Não faz nada. */
export type Reward = { id: string; label: string; xp: number }

type PointsCtx = {
  xp: number
  rewards: Reward[]
  addXP: (n: number) => void
  reset: () => void
}

const DummyCtx = React.createContext<PointsCtx>({
  xp: 0,
  rewards: [],
  addXP: () => {},
  reset: () => {},
})

/** Provider “vazio”: não envolve estado nem side-effects */
export const PointsProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>

/** Hook mantém API mas não faz nada */
export const usePoints = () => React.useContext(DummyCtx)
