export type QuestTier = {
  id: string
  label: string
  emoji: string
  minOrders: number
  hidden: boolean
}

export type QuestReward = {
  atOrders: number
  label: string
  hidden: boolean
}

export const QUEST_TIERS: QuestTier[] = [
  { id: 'stranger',   label: 'Stranger in Town', emoji: '🌱', minOrders: 1,  hidden: false },
  { id: 'apprentice', label: 'Smash Apprentice',  emoji: '🍔', minOrders: 5,  hidden: false },
  { id: 'rider',      label: 'Bunana Rider',      emoji: '🍌', minOrders: 10, hidden: false },
  { id: 'master',     label: 'Smash Master',      emoji: '🔥', minOrders: 25, hidden: false },
  { id: 'legend',     label: 'BUNS Legend',       emoji: '👑', minOrders: 35, hidden: false },
  { id: 'myth',       label: 'BUNS Myth',         emoji: '⚡', minOrders: 75, hidden: true  },
]

export const QUEST_REWARDS: QuestReward[] = [
  { atOrders: 10, label: 'Frozen Bunana',     hidden: false },
  { atOrders: 15, label: 'Sauce Pack',        hidden: false },
  { atOrders: 25, label: 'Classic Bun',       hidden: false },
  { atOrders: 30, label: 'Sauce Pack Premium',hidden: false },
  { atOrders: 35, label: 'Bacon Bun',         hidden: false },
  { atOrders: 75, label: 'Myth Reveal',       hidden: true  },
]
