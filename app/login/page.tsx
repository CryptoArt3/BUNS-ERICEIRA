'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string|null>(null)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const em = data.session?.user?.email ?? null
      setSessionEmail(em)
    })
  }, [])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    const redirect = `${window.location.origin}/account`
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirect }
    })
    if (error) return setErr(error.message)
    setSent(true)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setSessionEmail(null)
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-4xl font-display mb-2">Entrar</h1>
      <p className="text-white/70 mb-6">Recebe um link mágico no teu email.</p>

      {sessionEmail ? (
        <div className="space-y-4">
          <div className="rounded-xl p-4 border border-white/10 bg-white/5">
            Já tens sessão iniciada como <strong>{sessionEmail}</strong>.
          </div>
          <div className="flex gap-3">
            <Link className="btn btn-primary" href="/account">Ir para a minha conta</Link>
            <button className="btn btn-ghost" onClick={handleSignOut}>Sair</button>
          </div>
        </div>
      ) : sent ? (
        <div className="rounded-xl p-4 border border-white/10 bg-white/5">
          Verifica o teu email e clica no link para entrar.
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            placeholder="o.teu@email.com"
            className="w-full rounded-xl bg-white/5 border border-white/10 p-3"
          />
          {err && <div className="text-red-300">{err}</div>}
          <button className="btn btn-primary w-full">Enviar link</button>
        </form>
      )}
    </main>
  )
}
