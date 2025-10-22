'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

type Order = {
  id: string
  created_at: string
  status: string
  total: number
}

export default function AccountPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string|null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    let sub: ReturnType<typeof supabase.channel> | null = null

    async function load() {
      setErr(null)
      setLoading(true)

      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      setUserEmail(user?.email ?? null)

      if (!user) {
        setLoading(false)
        setErr('Precisas de iniciar sessão.')
        return
      }

      // 1) fetch das tuas encomendas
      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, status, total')
        .eq('user_id', user.id)           // <- só as tuas
        .order('created_at', { ascending: false })

      if (error) setErr(error.message)
      setOrders(data || [])
      setLoading(false)

      // 2) realtime das tuas encomendas
      sub = supabase
        .channel('orders_account')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`, // filtra no servidor
        }, async () => {
          const { data } = await supabase
            .from('orders')
            .select('id, created_at, status, total')
            .eq('user_id', user.id)
            .order('created_at', { ascending:false })
          setOrders(data || [])
        })
        .subscribe()
    }

    load()
    return () => { sub?.unsubscribe() }
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    // reload simples para limpar UI
    window.location.href = '/login'
  }

  if (loading) {
    return <main className="container mx-auto px-4 py-8">A carregar…</main>
  }

  if (err) {
    return (
      <main className="container mx-auto px-4 py-8">
        <p className="text-red-300 mb-4">{err}</p>
        <Link className="btn btn-primary" href="/login">Entrar</Link>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-display">A minha conta</h1>
          {userEmail && <p className="text-white/60 text-sm">Sessão: {userEmail}</p>}
        </div>
        <div className="flex gap-2">
          <Link href="/menu" className="btn btn-ghost">Novo pedido</Link>
          <button onClick={handleSignOut} className="btn btn-ghost">Sair</button>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-3">As minhas encomendas</h2>

      {orders.length === 0 ? (
        <div className="text-white/70">Ainda não tens encomendas.</div>
      ) : (
        <ul className="space-y-3">
          {orders.map(o => (
            <li key={o.id} className="p-4 border border-white/10 rounded-xl bg-white/5 flex items-center justify-between">
              <div>
                <div className="font-semibold">
                  #{o.id.slice(0,8)} — {new Date(o.created_at).toLocaleString('pt-PT')}
                </div>
                <div className="text-white/70 text-sm">
                  Estado: <span className="font-medium">{o.status}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-display text-lg">{o.total.toFixed(2)} €</div>
                {/* Se quiseres uma página /order/[id], deixa já o link: */}
                {/* <Link href={`/order/${o.id}`} className="btn btn-primary">Ver</Link> */}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
