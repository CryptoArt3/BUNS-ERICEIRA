export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'delivering'
  | 'done'
  | 'cancelled'

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'preparing',
  'ready',
  'delivering',
]

export const CLOSED_ORDER_STATUSES: OrderStatus[] = ['done', 'cancelled']

export function isActiveOrder(status: OrderStatus): boolean {
  return (ACTIVE_ORDER_STATUSES as string[]).includes(status)
}

export function isClosedOrder(status: OrderStatus): boolean {
  return (CLOSED_ORDER_STATUSES as string[]).includes(status)
}

/** Portuguese label, context-aware for order type. */
export function getOrderStatusLabel(status: OrderStatus, orderType?: string): string {
  const isTakeaway = (orderType ?? '').toUpperCase() === 'TAKEAWAY'
  switch (status) {
    case 'pending':    return 'Pedido recebido'
    case 'preparing':  return 'Em preparação'
    case 'ready':      return 'Pronto para levantar'
    case 'delivering': return isTakeaway ? 'Pronto para levantar' : 'A caminho'
    case 'done':       return isTakeaway ? 'Levantado' : 'Entregue'
    case 'cancelled':  return 'Cancelado'
    default:           return status
  }
}

export type OrderStatusTone = {
  emoji: string
  /** Pill badge classes (bg + text + border). */
  badge: string
  /** Card border class. */
  border: string
  /** Card background tint class. */
  bg: string
  /** Prominent text color class. */
  color: string
  /** Ring/glow class for focused status cards. */
  ring: string
}

export function getOrderStatusTone(status: OrderStatus): OrderStatusTone {
  switch (status) {
    case 'pending':
      return {
        emoji:  '🎯',
        badge:  'bg-buns-yellow/15 text-buns-yellow border-buns-yellow/30',
        border: 'border-buns-yellow/30',
        bg:     'bg-buns-yellow/5',
        color:  'text-buns-yellow',
        ring:   'ring-buns-yellow/40',
      }
    case 'preparing':
      return {
        emoji:  '👨‍🍳',
        badge:  'bg-orange-400/15 text-orange-300 border-orange-400/30',
        border: 'border-orange-400/30',
        bg:     'bg-orange-400/5',
        color:  'text-orange-400',
        ring:   'ring-orange-400/40',
      }
    case 'ready':
      return {
        emoji:  '🛎️',
        badge:  'bg-teal-400/15 text-teal-300 border-teal-400/30',
        border: 'border-teal-400/30',
        bg:     'bg-teal-400/5',
        color:  'text-teal-400',
        ring:   'ring-teal-400/40',
      }
    case 'delivering':
      return {
        emoji:  '🚚',
        badge:  'bg-blue-400/15 text-blue-300 border-blue-400/30',
        border: 'border-blue-400/30',
        bg:     'bg-blue-400/5',
        color:  'text-blue-400',
        ring:   'ring-blue-400/40',
      }
    case 'done':
      return {
        emoji:  '✅',
        badge:  'bg-white/8 text-white/45 border-white/10',
        border: 'border-white/10',
        bg:     '',
        color:  'text-green-400',
        ring:   'ring-green-400/40',
      }
    case 'cancelled':
      return {
        emoji:  '❌',
        badge:  'bg-red-400/10 text-red-300/70 border-red-400/15',
        border: 'border-red-400/15',
        bg:     '',
        color:  'text-red-400',
        ring:   'ring-red-400/40',
      }
    default:
      return {
        emoji:  '⏳',
        badge:  'bg-white/10 text-white/50 border-white/15',
        border: 'border-white/10',
        bg:     '',
        color:  'text-white/60',
        ring:   'ring-white/20',
      }
  }
}
