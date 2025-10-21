'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useCart } from '@/components/cart/CartContext'

/* ——— helpers ——— */
function currency(x: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(x)
}

function calcFeeAndMeta(zoneOrTakeaway: string) {
  if (zoneOrTakeaway === 'TAKEAWAY') {
    return { delivery_type: 'TAKEAWAY' as const, zone: 'Ericeira', delivery_fee: 0 }
  }
  const zone = zoneOrTakeaway
  const baseNearby = ['Ericeira']
  const around = ['Ribamar', 'Achada', 'Sobreiro']
  if (baseNearby.includes(zone)) return { delivery_type: 'DELIVERY' as const, zone, delivery_fee: 2.5 }
  if (around.includes(zone))    return { delivery_type: 'DELIVERY' as const, zone, delivery_fee: 3.5 }
  return { delivery_type: 'DELIVERY' as const, zone, delivery_fee: 3.5 }
}

/* ——— page ——— */
export default function CheckoutPage() {
  const router = useRouter()
  const { cart, clear } = useCart()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [zoneChoice, setZoneChoice] =
    useState<'TAKEAWAY' | 'Ericeira' | 'Ribamar' | 'Achada' | 'Sobreiro' | 'Outro'>('TAKEAWAY')
  const [paymentMethod, setPaymentMethod] =
    useState<'cash' | 'mbway' | 'card'>('cash')

  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const items = cart?.items ?? []
  const subtotal = useMemo(
    () => items.reduce((acc, it) => acc + it.price * it.qty, 0),
    [items]
  )

  const { delivery_type, zone, delivery_fee } = useMemo(
    () => calcFeeAndMeta(zoneChoice),
    [zoneChoice]
  )

  const total = useMemo(() => subtotal + delivery_fee, [subtotal, delivery_fee])
  const needsAddress = delivery_type === 'DELIVERY'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)

    if (!name.trim()) return setErr('Indica o teu nome.')

    // só dígitos (até 15)
    const phoneClean = (phone.match(/\d/g) ?? []).join('').slice(0, 15)
    if (!phoneClean) return setErr('Indica o teu telemóvel.')

    if (needsAddress && !address.trim()) return setErr('Indica a morada para entrega.')
    if (items.length === 0) return setErr('O carrinho está vazio.')

    const items_count = items.reduce((n, it) => n + it.qty, 0)

    setLoading(true)
    try {
      const payload = {
        // dados do cliente
        name: name.trim(),
        phone: phoneClean,
        address: needsAddress ? address.trim() : '',
        // entrega
        zone,
        delivery_type,
        // pagamento
        payment_method: paymentMethod, // NOT NULL
        // valores
        subtotal,
        delivery_fee,
        fee: delivery_fee, // compat
        total,
        // itens
        items,            // JSONB
        items_count,      // NOT NULL
        // meta
        order_type: delivery_type,
        acknowledged: false as boolean | undefined,
        status: 'pending' as const,
      }

      // 👉 Guardar e obter o ID da encomenda
      const { data, error } = await supabase
        .from('orders')
        .insert(payload)
        .select('id')
        .single()

      if (error) {
        console.error('INSERT error', error)
        setErr(error.message)
        setLoading(false)
        return
      }

      // limpa carrinho
      clear()
      localStorage.removeItem('cart')

      // 👉 página de confirmação com o nº da encomenda
      router.push(`/obrigado?order=${data.id}`)
    } catch (e: any) {
      console.error(e)
      setErr(e?.message ?? 'Falha ao enviar o pedido.')
    } finally {
      setLoading(false)
    }
  }

  // lembrar telefone localmente
  useEffect(() => {
    const saved = localStorage.getItem('checkout_phone')
    if (saved && !phone) setPhone(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (phone) localStorage.setItem('checkout_phone', phone)
  }, [phone])

  return (
    <div className="max-w-5xl mx-auto p-6 sm:p-10">
      <h1 className="text-4xl sm:text-5xl font-display mb-6">Checkout</h1>
      <p className="text-white/80 mb-8">
        Preenche os teus dados e confirma o pedido. Tarifa por zona é aplicada automaticamente.
      </p>

      <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-6">
        {/* Nome + Telefone */}
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-white/70">Nome</span>
            <input
              className="rounded-xl bg-white/5 border border-white/10 p-3 outline-none focus:border-white/20"
              placeholder="O teu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-white/70">Telefone</span>
            <input
              className="rounded-xl bg-white/5 border border-white/10 p-3 outline-none focus:border-white/20"
              placeholder="962 000 000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
        </div>

        {/* Zona */}
        <label className="flex flex-col gap-2">
          <span className="text-sm text-white/70">Zona</span>
          <select
            className="rounded-xl bg-white/5 border border-white/10 p-3 outline-none focus:border-white/20"
            value={zoneChoice}
            onChange={(e) => setZoneChoice(e.target.value as typeof zoneChoice)}
          >
            <option value="TAKEAWAY">Levantamento em loja (Takeaway)</option>
            <option value="Ericeira">Entrega — Ericeira (+2,50€)</option>
            <option value="Ribamar">Entrega — Ribamar (+3,50€)</option>
            <option value="Achada">Entrega — Achada (+3,50€)</option>
            <option value="Sobreiro">Entrega — Sobreiro (+3,50€)</option>
            <option value="Outro">Entrega — Outra zona perto (+3,50€)</option>
          </select>
        </label>

        {/* Morada (se delivery) */}
        {needsAddress && (
          <label className="flex flex-col gap-2">
            <span className="text-sm text-white/70">Morada de entrega</span>
            <input
              className="rounded-xl bg-white/5 border border-white/10 p-3 outline-none focus:border-white/20"
              placeholder="Rua e nº, localidade"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
        )}

        {/* Método de pagamento */}
        <label className="flex flex-col gap-2">
          <span className="text-sm text-white/70">Método de pagamento</span>
          <select
            className="rounded-xl bg-white/5 border border-white/10 p-3 outline-none focus:border-white/20"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as 'cash'|'mbway'|'card')}
          >
            <option value="cash">Dinheiro</option>
            <option value="mbway">MB WAY</option>
            <option value="card">Cartão</option>
          </select>
        </label>

        {/* Resumo */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between py-1">
            <span className="text-white/70">Subtotal</span>
            <span className="font-semibold">{currency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-white/70">
              {delivery_type === 'TAKEAWAY' ? 'Takeaway' : `Entrega (${zone})`}
            </span>
            <span className="font-semibold">{currency(delivery_fee)}</span>
          </div>
          <div className="border-t border-white/10 my-2" />
          <div className="flex items-center justify-between py-1 text-lg">
            <span>Total</span>
            <span className="font-bold text-buns-yellow">{currency(total)}</span>
          </div>
        </div>

        {err && (
          <div className="rounded-xl bg-red-900/40 border border-red-500/30 text-red-200 p-3">
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full sm:w-auto disabled:opacity-60"
        >
          {loading ? 'A enviar…' : 'Confirmar pedido'}
        </button>

        {/* Itens (leitura) */}
        <div className="pt-4">
          <h3 className="text-white/80 font-semibold mb-2">
            Itens ({items.reduce((n, it) => n + it.qty, 0)})
          </h3>
          {items.length === 0 ? (
            <div className="text-white/60">Carrinho vazio.</div>
          ) : (
            <ul className="space-y-1">
              {items.map((it) => (
                <li key={it.id} className="flex justify-between text-white/90">
                  <span>{it.name} × {it.qty}</span>
                  <span>{currency(it.price * it.qty)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>
    </div>
  )
}
