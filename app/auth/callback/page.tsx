'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    let done = false

    const redirect = () => {
      if (done) return
      done = true
      const saved = localStorage.getItem('buns_auth_next')
      const next = (saved?.startsWith('/') ? saved : '/account') as Route
      localStorage.removeItem('buns_auth_next')
      router.replace(next)
    }

    // Case 1: hash already processed by Supabase client (session exists)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) redirect()
    })

    // Case 2: hash processed asynchronously → SIGNED_IN fires
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') redirect()
    })

    // Fallback: if nothing fires within 5 s, go to account
    const timeout = window.setTimeout(() => redirect(), 5000)

    return () => {
      subscription.unsubscribe()
      window.clearTimeout(timeout)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <p
        className="font-display text-buns-yellow uppercase leading-none animate-pulse"
        style={{ fontSize: 'clamp(2rem, 8vw, 4rem)' }}
      >
        BUNS
      </p>
      <p className="text-white/40 text-sm tracking-wide">A verificar sessão…</p>
    </div>
  )
}
