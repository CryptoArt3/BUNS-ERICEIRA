'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useCart } from '@/components/cart/CartContext'

function currency(x: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(x)
}

export default function CartPage() {
  const { cart, inc, dec, remove, setNote } = useCart()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session)
    })
  }, [])

  const subtotal = useMemo(
    () => cart.items.reduce((acc, it) => acc + it.price * it.qty, 0),
    [cart.items]
  )

  return (
    <main className="min-h-full w-full max-w-[100vw] overflow-x-hidden bg-buns-cream">

      {/* ── Hero strip ─────────────────────────────────────── */}
      <div className="bg-black px-4 sm:px-6 pt-8 pb-7 border-b-4 border-buns-yellow">
        <div className="max-w-screen-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-buns-yellow text-black text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mb-5">
            🛒 O teu pedido
          </div>
          <h1
            className="font-display text-white uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(2.8rem, 10vw, 5.5rem)' }}
          >
            BUNS<br />
            <span className="text-buns-yellow">Carrinho</span>
          </h1>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-3 sm:px-4 pt-6 pb-32">

        {/* Login banner */}
        {isLoggedIn === false && cart.items.length > 0 && (
          <div className="mt-4 bg-white border-2 border-orange-400 rounded-2xl overflow-hidden">
            <div className="h-[5px] bg-orange-400" />
            <div className="p-5 space-y-3">
              <p className="text-black font-black text-sm">Recomendamos entrar antes de continuar.</p>
              <p className="text-black/60 text-sm leading-snug">
                Ao abrir o link do email, alguns browsers podem perder o carrinho. Entra agora para garantir que o pedido fica ligado à tua conta.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Link
                  href="/login?next=/menu"
                  className="flex-1 py-3 bg-black text-buns-yellow font-black text-sm uppercase tracking-wide rounded-xl text-center"
                >
                  Entrar agora
                </Link>
                <Link
                  href="/checkout"
                  className="flex-1 py-3 bg-white border-2 border-black/20 text-black/60 font-bold text-sm rounded-xl text-center"
                >
                  Continuar para checkout
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {cart.items.length === 0 && (
          <div className="mt-10 flex flex-col items-center gap-4 py-20 text-center">
            <span className="text-7xl">🛒</span>
            <p
              className="font-display uppercase text-black leading-none"
              style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}
            >
              Carrinho vazio
            </p>
            <p className="text-black/50 text-base max-w-xs">
              Ainda não adicionaste nada. Volta ao menu e escolhe os teus favoritos.
            </p>
            <Link
              href="/menu"
              className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-black text-buns-yellow font-black text-sm uppercase tracking-wide rounded-xl active:scale-95 transition"
            >
              Ver Menu →
            </Link>
          </div>
        )}

        {/* Cart with items */}
        {cart.items.length > 0 && (
          <div className="grid lg:grid-cols-[1fr_380px] gap-6 mt-2">

            {/* ── Item cards ──────────────────────────────── */}
            <div className="space-y-4">
              {cart.items.map((it) => {
                const note = it.options && typeof it.options.note === 'string' ? it.options.note : ''
                return (
                  <div
                    key={it.id}
                    className="bg-white border-2 border-black rounded-2xl overflow-hidden"
                  >
                    {/* accent stripe */}
                    <div className="h-[6px] w-full bg-buns-yellow" />

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3
                            className="font-display uppercase text-black leading-tight"
                            style={{ fontSize: 'clamp(1.25rem, 3vw, 1.6rem)' }}
                          >
                            {it.name}
                          </h3>
                          <p className="mt-1 text-sm text-black/45 font-medium">
                            {currency(it.price)} × {it.qty}
                            {' '}
                            <span className="text-black font-black">
                              = {currency(it.price * it.qty)}
                            </span>
                          </p>
                        </div>

                        {/* remove */}
                        <button
                          onClick={() => remove(it.id)}
                          className="shrink-0 w-8 h-8 rounded-full bg-black/5 hover:bg-red-100 text-black/25 hover:text-red-500 font-black text-xl flex items-center justify-center transition"
                          aria-label={`Remover ${it.name}`}
                        >
                          ×
                        </button>
                      </div>

                      {/* Qty controls */}
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          onClick={() => dec(it.id)}
                          className="w-11 h-11 rounded-xl bg-black text-white font-black text-2xl flex items-center justify-center active:scale-95 transition select-none"
                          aria-label="Diminuir quantidade"
                        >
                          −
                        </button>
                        <span className="w-10 text-center font-black text-2xl text-black tabular-nums select-none">
                          {it.qty}
                        </span>
                        <button
                          onClick={() => inc(it.id)}
                          className="w-11 h-11 rounded-xl bg-black text-buns-yellow font-black text-2xl flex items-center justify-center active:scale-95 transition select-none"
                          aria-label="Aumentar quantidade"
                        >
                          +
                        </button>
                      </div>

                      {/* Note */}
                      <div className="mt-4">
                        <label className="text-[11px] font-black uppercase tracking-widest text-black/35 block mb-1.5">
                          Nota ao cozinheiro
                        </label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(it.id, e.target.value)}
                          placeholder="ex.: sem cebola, mais picante…"
                          className="w-full rounded-xl bg-buns-cream border-2 border-black/15 focus:border-black/50 px-3 py-2.5 text-sm text-black placeholder:text-black/25 outline-none resize-none transition"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Summary sidebar ──────────────────────────── */}
            <aside className="h-fit">
              <div className="bg-black rounded-2xl overflow-hidden">

                {/* header */}
                <div className="px-6 pt-5 pb-4 border-b border-white/10">
                  <p
                    className="font-display text-buns-yellow uppercase leading-none"
                    style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
                  >
                    Resumo
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    {cart.items.reduce((n, it) => n + it.qty, 0)} item(s)
                  </p>
                </div>

                {/* line items */}
                <div className="px-6 py-4 space-y-1 border-b border-white/10">
                  {cart.items.map((it) => (
                    <div key={it.id} className="flex justify-between items-baseline gap-2 text-sm">
                      <span className="text-white/60 truncate">{it.name} ×{it.qty}</span>
                      <span className="text-white font-bold shrink-0">{currency(it.price * it.qty)}</span>
                    </div>
                  ))}
                </div>

                {/* totals */}
                <div className="px-6 py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-sm">Subtotal</span>
                    <span className="text-white font-bold">{currency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-sm">Takeaway</span>
                    <span className="text-white font-bold">{currency(0)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-3 mt-1 flex items-center justify-between">
                    <span className="text-white font-black text-lg">Total</span>
                    <span className="text-buns-yellow font-black text-2xl tabular-nums">
                      {currency(subtotal)}
                    </span>
                  </div>
                </div>

                {/* CTAs */}
                <div className="px-6 pb-6 space-y-2">
                  <Link
                    href="/checkout"
                    className="block w-full py-4 bg-buns-yellow text-black font-black text-base uppercase tracking-wide rounded-xl text-center active:scale-[0.98] transition"
                  >
                    Finalizar pedido →
                  </Link>
                  <Link
                    href="/menu"
                    className="block w-full py-3 bg-white/8 text-white/50 font-bold text-sm uppercase tracking-wide rounded-xl text-center hover:bg-white/12 transition"
                  >
                    Continuar a ver menu
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* ── Mobile sticky CTA ──────────────────────────────── */}
      {cart.items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
          <div className="bg-black border-t-2 border-buns-yellow px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <Link
              href="/checkout"
              className="block w-full py-4 bg-buns-yellow text-black font-black text-lg uppercase tracking-wide rounded-xl text-center active:scale-[0.98] transition"
            >
              Finalizar pedido — {currency(subtotal)}
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
