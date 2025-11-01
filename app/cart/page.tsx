'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useCart } from '@/components/cart/CartContext'

function currency(x: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(x)
}

export default function CartPage() {
  const { cart, inc, dec, remove, setNote } = useCart()

  const subtotal = useMemo(
    () => cart.items.reduce((acc, it) => acc + it.price * it.qty, 0),
    [cart.items]
  )

  return (
    // viewport estável + safe-areas + sem overflow lateral
    <main
      className="
        w-screen overflow-x-clip
        pl-[max(env(safe-area-inset-left),0.75rem)]
        pr-[max(env(safe-area-inset-right),1rem)]
        sm:px-4 pt-10 pb-24 space-y-6 sm:space-y-8
      "
    >
      {/* wrapper centralizado como no checkout */}
      <div className="max-w-6xl mx-auto w-full">
        <h1 className="text-4xl sm:text-5xl font-display leading-tight tracking-tight px-1">
          <span className="text-buns-yellow">BUNS</span>
          <span className="ml-2">Carrinho</span>
        </h1>

        {cart.items.length === 0 ? (
          <div className="card p-6 mt-4">Carrinho vazio.</div>
        ) : (
          <div className="grid lg:grid-cols-[1fr,420px] gap-6 mt-6">
            {/* itens */}
            <div className="space-y-4 min-w-0">
              {cart.items.map((it) => {
                const note = it.options && typeof it.options.note === 'string' ? it.options.note : ''
                return (
                  <div key={it.id} className="card p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xl font-semibold">{it.name}</div>
                        <div className="text-white/70">{currency(it.price)} × {it.qty}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button onClick={() => dec(it.id)} className="btn btn-ghost text-xl">−</button>
                        <div className="w-8 text-center">{it.qty}</div>
                        <button onClick={() => inc(it.id)} className="btn btn-ghost text-xl">+</button>
                        <button onClick={() => remove(it.id)} className="btn btn-ghost">Remover</button>
                      </div>
                    </div>

                    {/* Nota do item */}
                    <div className="mt-4">
                      <label className="text-white/70 text-sm block mb-2">Nota (opcional)</label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(it.id, e.target.value)}
                        placeholder="ex.: sem cebola, mais picante…"
                        className="w-full rounded-2xl bg-black/40 border border-white/10 p-3"
                        rows={3}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* resumo */}
            <aside className="card p-5 h-fit min-w-0">
              <div className="flex items-center justify-between py-1">
                <span className="text-white/70">Subtotal</span>
                <span className="font-semibold">{currency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-white/70">Takeaway</span>
                <span className="font-semibold">{currency(0)}</span>
              </div>
              <div className="border-t border-white/10 my-2" />
              <div className="flex items-center justify-between py-1 text-lg">
                <span>Total</span>
                <span className="font-bold text-buns-yellow">{currency(subtotal)}</span>
              </div>

              <Link href="/checkout" className="btn btn-primary w-full mt-4">
                Avançar para o checkout
              </Link>
              <Link href="/menu" className="btn btn-ghost w-full mt-2">
                Continuar a ver menu
              </Link>
            </aside>
          </div>
        )}
      </div>

      {/* CTA fixo no fundo (apenas mobile) */}
      {cart.items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
          <div className="mx-4 mb-4 rounded-2xl shadow-buns">
            <Link href="/checkout" className="btn btn-primary w-full py-3 text-lg">
              Checkout — {currency(subtotal)}
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
