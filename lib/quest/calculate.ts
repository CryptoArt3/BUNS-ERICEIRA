import { QUEST_TIERS, QUEST_REWARDS, type QuestTier, type QuestReward } from './config'

export type QuestProgress = {
  current: QuestTier | null
  next: QuestTier | null
  doneOrders: number
  ordersToNext: number | null
  progressPct: number
  nextReward: QuestReward | null
}

export function calculateQuestProgress(doneOrders: number): QuestProgress {
  const reachedTiers = QUEST_TIERS.filter((t) => doneOrders >= t.minOrders)
  const current = reachedTiers.length > 0 ? reachedTiers[reachedTiers.length - 1] : null

  const currentIdx = current ? QUEST_TIERS.indexOf(current) : -1
  const next = QUEST_TIERS[currentIdx + 1] ?? null

  const ordersToNext = next ? next.minOrders - doneOrders : null

  let progressPct: number
  if (!next) {
    progressPct = 100
  } else if (!current) {
    progressPct = Math.min(100, Math.round((doneOrders / next.minOrders) * 100))
  } else {
    const range = next.minOrders - current.minOrders
    const done = doneOrders - current.minOrders
    progressPct = Math.min(100, Math.round((done / range) * 100))
  }

  const nextReward = QUEST_REWARDS.find((r) => r.atOrders > doneOrders) ?? null

  return { current, next, doneOrders, ordersToNext, progressPct, nextReward }
}
