'use client'
import Link from 'next/link'
import { useCart } from '@/components/cart/CartContext'

export default function CartPage() {
  const { cart, remove, clear } = useCart()
  const total = cart.items.reduce((a, b) => a + b.price * b.qty, 0)

  return (
    <main className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-display">Carrinho</h2>

      {cart.items.length === 0 ? (
        <p className="mt-4 text-white/70">Ainda sem itens. Vai ao menu e escolhe o teu smash 🍔</p>
      ) : (
        <div className="mt-4 space-y-3">
          {cart.items.map(it => (
            <div key={it.id} className="flex justify-between items-center gap-4 bg-white/5 rounded-xl p-3 border border-white/10">
              <div>{it.name} × {it.qty}</div>
              <div className="flex items-center gap-3">
                <span>{(it.price * it.qty).toFixed(2)} €</span>
                <button className="btn btn-ghost" onClick={() => remove(it.id)}>Remover</button>
              </div>
            </div>
          ))}
          <div className="flex justify-between border-t border-white/10 pt-3">
            <strong>Total</strong>
            <strong>{total.toFixed(2)} €</strong>
          </div>
          <div className="flex gap-3">
            {/* ✅ navegação client-side */}
            <Link href="/checkout" className="btn btn-primary">Avançar</Link>
            <button className="btn btn-ghost" onClick={clear}>Limpar</button>
          </div>
        </div>
      )}
    </main>
  )
}
