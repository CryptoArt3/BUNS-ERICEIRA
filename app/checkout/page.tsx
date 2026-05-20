'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useCart } from '@/components/cart/CartContext'
import { useI18n } from '@/lib/i18n/useI18n'

/* ── helpers (unchanged) ─────────────────────────────────── */
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

/* ── Section shell ───────────────────────────────────────── */
function Section({
  number,
  title,
  children,
}: {
  number: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border-2 border-black rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 bg-black">
        <span className="w-7 h-7 rounded-full bg-buns-yellow text-black font-black text-sm flex items-center justify-center shrink-0 leading-none">
          {number}
        </span>
        <h2 className="font-black text-white uppercase tracking-wide text-sm">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

/* ── Shared input styles ─────────────────────────────────── */
const inputCls =
  'w-full rounded-xl bg-buns-cream border-2 border-black/20 focus:border-black px-4 py-3 text-black placeholder:text-black/30 outline-none font-medium transition text-base'
const selectCls =
  'w-full rounded-xl bg-buns-cream border-2 border-black/20 focus:border-black px-4 py-3 text-black outline-none font-medium transition appearance-none cursor-pointer text-base'

/* ── Page ────────────────────────────────────────────────── */
export default function CheckoutPage() {
  const router = useRouter()
  const { cart, clear } = useCart()
  const { t } = useI18n()

  /* ── auth state ── */
  const [mustLogin, setMustLogin] = useState<boolean | null>(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setMustLogin(!data?.session)
    })
  }, [])

  /* ── form state (unchanged) ── */
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [zoneChoice, setZoneChoice] =
    useState<'TAKEAWAY' | 'Ericeira' | 'Ribamar' | 'Achada' | 'Sobreiro' | 'Outro'>('TAKEAWAY')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mbway' | 'card'>('cash')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  /* ── derived (unchanged) ── */
  const items = cart?.items ?? []
  const subtotal = useMemo(() => items.reduce((acc, it) => acc + it.price * it.qty, 0), [items])
  const { delivery_type, zone, delivery_fee } = useMemo(() => calcFeeAndMeta(zoneChoice), [zoneChoice])
  const total = useMemo(() => subtotal + delivery_fee, [subtotal, delivery_fee])
  const needsAddress = delivery_type === 'DELIVERY'

  /* ── submit (unchanged) ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)

    if (mustLogin) {
      setErr(t('checkout.err_login'))
      return
    }
    if (!name.trim()) return setErr(t('checkout.err_name'))

    const phoneClean = (phone.match(/\d/g) ?? []).join('').slice(0, 15)
    if (!phoneClean) return setErr(t('checkout.err_phone'))
    if (needsAddress && !address.trim()) return setErr(t('checkout.err_address'))
    if (items.length === 0) return setErr(t('checkout.err_empty'))

    const items_count = items.reduce((n, it) => n + it.qty, 0)
    setLoading(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData?.session?.user?.id ?? null
      if (!userId) {
        setErr(t('checkout.err_session'))
        setLoading(false)
        return
      }

      const payload = {
        name: name.trim(),
        phone: phoneClean,
        address: needsAddress ? address.trim() : '',
        zone,
        delivery_type,
        payment_method: paymentMethod,
        subtotal,
        delivery_fee,
        fee: delivery_fee,
        total,
        items: items.map((it) => ({
          id: it.id,
          name: it.name,
          qty: it.qty,
          price: it.price,
          variant: (it as any).variant ?? null,
          options: (it as any).options ?? null,
          note: (it as any).options?.note ?? null,
        })),
        items_count,
        order_type: delivery_type,
        acknowledged: false as boolean | undefined,
        status: 'pending' as const,
        user_id: userId,
      }

      const { data, error } = await supabase
        .from('orders')
        .insert(payload)
        .select('id')
        .single()

      if (error) {
        setErr(
          String(error.message).toLowerCase().includes('row-level security')
            ? t('checkout.err_rls')
            : error.message
        )
        setLoading(false)
        return
      }

      clear()
      localStorage.removeItem('cart')
      router.push(`/order/${data.id}`)
    } catch (e: any) {
      setErr(e?.message ?? t('checkout.err_send'))
    } finally {
      setLoading(false)
    }
  }

  /* ── phone persistence (unchanged) ── */
  useEffect(() => {
    const saved = localStorage.getItem('checkout_phone')
    if (saved && !phone) setPhone(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (phone) localStorage.setItem('checkout_phone', phone)
  }, [phone])

  /* ── render ───────────────────────────────────────────── */
  return (
    <main className="min-h-full w-full max-w-[100vw] overflow-x-hidden bg-buns-cream">

      {/* ── Hero strip ─────────────────────────────────── */}
      <div className="bg-black px-4 sm:px-6 pt-8 pb-7 border-b-4 border-buns-yellow">
        <div className="max-w-screen-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-buns-yellow text-black text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mb-5">
            {t('checkout.hero_tag')}
          </div>
          <h1
            className="font-display text-white uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(2.8rem, 10vw, 5.5rem)' }}
          >
            BUNS<br />
            <span className="text-buns-yellow">{t('checkout.hero_title2')}</span>
          </h1>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-3 sm:px-4 pt-6 pb-32 space-y-4">

        {/* Login required — full gate */}
        {mustLogin === true && (
          <div className="bg-white border-2 border-black rounded-2xl overflow-hidden">
            <div className="h-[6px] bg-buns-yellow" />
            <div className="p-8 flex flex-col items-center text-center gap-5">
              <span className="text-5xl">🔑</span>
              <div className="space-y-2">
                <p className="font-black text-black text-xl leading-tight">
                  {t('checkout.must_login_title')}
                </p>
                <p className="text-black/55 text-sm leading-relaxed max-w-xs mx-auto">
                  {t('checkout.must_login_sub')}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                <Link
                  href="/login?next=/menu"
                  className="flex-1 py-4 bg-black text-buns-yellow font-black text-base uppercase tracking-wide rounded-xl text-center"
                >
                  {t('checkout.sign_in')}
                </Link>
                <Link
                  href="/menu"
                  className="flex-1 py-4 bg-white border-2 border-black/20 text-black/60 font-bold text-sm rounded-xl text-center"
                >
                  {t('checkout.back_menu')}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Empty cart notice */}
        {items.length === 0 && (
          <div className="bg-white border-2 border-black rounded-2xl overflow-hidden">
            <div className="h-[6px] bg-buns-yellow" />
            <div className="p-6 space-y-3">
              <p className="text-black font-black text-lg leading-tight">
                {t('checkout.empty_title')}
              </p>
              <p className="text-black/55 text-sm leading-snug">
                {t('checkout.empty_sub')}
              </p>
              <div className="flex gap-3 pt-1">
                <Link
                  href="/menu"
                  className="px-4 py-2.5 bg-black text-buns-yellow font-black text-sm rounded-xl uppercase tracking-wide active:scale-95 transition"
                >
                  {t('nav.menu')}
                </Link>
                <Link
                  href="/cart"
                  className="px-4 py-2.5 bg-white border-2 border-black text-black font-black text-sm rounded-xl uppercase tracking-wide active:scale-95 transition"
                >
                  {t('nav.cart')}
                </Link>
              </div>
            </div>
          </div>
        )}

        {mustLogin === false && <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── 1. Os teus dados ── */}
          <Section number="1" title={t('checkout.section1')}>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-widest text-black/40">{t('checkout.name')}</span>
                <input
                  className={inputCls}
                  placeholder={t('checkout.name_ph')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-widest text-black/40">{t('checkout.phone')}</span>
                <input
                  className={inputCls}
                  placeholder="962 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
            </div>
          </Section>

          {/* ── 2. Entrega ── */}
          <Section number="2" title={t('checkout.section2')}>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-black/40">{t('checkout.delivery_type')}</span>
              <div className="relative">
                <select
                  className={selectCls}
                  value={zoneChoice}
                  onChange={(e) => setZoneChoice(e.target.value as typeof zoneChoice)}
                >
                  <option value="TAKEAWAY">{t('checkout.opt_takeaway')}</option>
                  <option value="Ericeira" disabled>{t('checkout.opt_ericeira')}</option>
                  <option value="Ribamar" disabled>{t('checkout.opt_ribamar')}</option>
                  <option value="Achada" disabled>{t('checkout.opt_achada')}</option>
                  <option value="Sobreiro" disabled>{t('checkout.opt_sobreiro')}</option>
                  <option value="Outro" disabled>{t('checkout.opt_outro')}</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/40 text-sm">▾</span>
              </div>
              <span className="text-xs text-black/40 mt-0.5">
                {t('checkout.delivery_soon')}
              </span>
            </label>

            {needsAddress && (
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-widest text-black/40">{t('checkout.address')}</span>
                <input
                  className={inputCls}
                  placeholder={t('checkout.address_ph')}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </label>
            )}
          </Section>

          {/* ── 3. Pagamento ── */}
          <Section number="3" title={t('checkout.section3')}>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-black/40">{t('checkout.payment')}</span>
              <div className="relative">
                <select
                  className={selectCls}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'mbway' | 'card')}
                >
                  <option value="cash">{t('checkout.cash')}</option>
                  <option value="mbway">{t('checkout.mbway')}</option>
                  <option value="card">{t('checkout.card')}</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/40 text-sm">▾</span>
              </div>
            </label>
          </Section>

          {/* ── 4. Resumo ── */}
          <Section number="4" title={t('checkout.section4')}>
            {items.length === 0 ? (
              <p className="text-black/40 text-sm">{t('checkout.empty_title')}</p>
            ) : (
              <div className="space-y-1.5">
                {items.map((it) => (
                  <div key={it.id} className="flex items-baseline justify-between gap-3">
                    <span className="text-black/70 text-sm leading-snug">
                      {it.name}
                      <span className="text-black/40"> ×{it.qty}</span>
                    </span>
                    <span className="text-black font-bold text-sm shrink-0 tabular-nums">
                      {currency(it.price * it.qty)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t-2 border-black/10 pt-4 mt-2 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-black/50">{t('checkout.subtotal')}</span>
                <span className="text-black font-bold tabular-nums">{currency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-black/50">
                  {delivery_type === 'TAKEAWAY' ? t('cart.takeaway') : `${t('order.type_delivery').replace('🚚 ', '')} (${zone})`}
                </span>
                <span className="text-black font-bold tabular-nums">{currency(delivery_fee)}</span>
              </div>
              <div className="border-t-2 border-black/10 pt-2 flex items-center justify-between">
                <span className="text-black font-black text-lg">{t('checkout.total')}</span>
                <span className="text-black font-black text-2xl tabular-nums">{currency(total)}</span>
              </div>
            </div>
          </Section>

          {/* ── Error ── */}
          {err && (
            <div className="bg-white border-2 border-red-500 rounded-2xl px-5 py-4 text-red-600 text-sm font-medium">
              {err}
            </div>
          )}

          {/* ── Submit CTA ── */}
          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="w-full py-5 bg-black text-buns-yellow font-black text-xl uppercase tracking-wide rounded-2xl border-4 border-buns-yellow active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? t('checkout.submitting') : t('checkout.submit')}
          </button>

          <p className="text-center text-xs text-black/30 pb-2">
            {t('checkout.terms')}{' '}
            <Link href="/termos" className="underline underline-offset-2">{t('checkout.terms_link')}</Link>.
          </p>

        </form>}
      </div>
    </main>
  )
}
