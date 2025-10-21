'use client'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type CartItem = { id: string; name: string; price: number; qty: number }
export type Cart = { items: CartItem[] }

type CartCtx = {
  cart: Cart
  add: (item: CartItem) => void
  remove: (id: string) => void
  clear: () => void
}

const Ctx = createContext<CartCtx | undefined>(undefined)

// 👉 lê do localStorage já no 1º render
function loadInitialCart(): Cart {
  if (typeof window === 'undefined') return { items: [] }
  try {
    const raw = localStorage.getItem('cart')
    return raw ? JSON.parse(raw) : { items: [] }
  } catch {
    return { items: [] }
  }
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<Cart>(loadInitialCart)

  // persiste no localStorage sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart))
    } catch {}
  }, [cart])

  const add = (item: CartItem) =>
    setCart(c => {
      const idx = c.items.findIndex(x => x.id === item.id)
      const items = [...c.items]
      if (idx >= 0) items[idx] = { ...items[idx], qty: items[idx].qty + item.qty }
      else items.push(item)
      return { items }
    })

  const remove = (id: string) =>
    setCart(c => ({ items: c.items.filter(x => x.id !== id) }))

  const clear = () => setCart({ items: [] })

  const value = useMemo(() => ({ cart, add, remove, clear }), [cart])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useCart = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
