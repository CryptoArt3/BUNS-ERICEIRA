'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useCart } from '@/components/cart/CartContext'

function currency(x: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(x)
}

export default function StickyCartBar() {
  const { cart } = useCart()
  const items = cart?.items ?? []
  const count = useMemo(() => items.reduce((n, it) => n + it.qty, 0), [items])
  const subtotal = useMemo(() => items.reduce((acc, it) => acc + it.price * it.qty, 0), [items])

  // só mostra em mobile e quando há itens
  if (count === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 block md:hidden safe-bottom">
      <div className="mx-auto max-w-4xl px-3 pb-[env(safe-area-inset-bottom)]">
        <div className="rounded-2xl bg-black/70 backdrop-blur border border-white/10 shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-sm">
              <div className="font-semibold">Carrinho • {count} {count === 1 ? 'item' : 'itens'}</div>
              <div className="text-white/70 -mt-0.5">{currency(subtotal)}</div>
            </div>
            <div className="flex gap-2">
              <Link href="/cart" className="btn btn-ghost px-3">Ver</Link>
              <Link href="/checkout" className="btn btn-primary px-4">Checkout</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
