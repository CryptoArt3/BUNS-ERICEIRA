// components/AdminGuard.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

/**
 * Lista branca de emails de admin.
 * Define na Vercel e localmente: NEXT_PUBLIC_ADMIN_EMAILS=teu@email.com,outro@dominio.com
 */
const ADMIN_EMAILS =
  (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession()
      const email = data.session?.user?.email?.toLowerCase() ?? null

      const isAdmin = !!email && ADMIN_EMAILS.includes(email)
      if (!isAdmin) {
        // envia para login com ?next= para voltar ao admin depois de entrar
        const next = encodeURIComponent(pathname || '/admin/orders')
        router.replace(`/login?next=${next}`)
        setAllowed(false)
        setLoading(false)
        return
      }
      setAllowed(true)
      setLoading(false)
    }

    check().catch(() => {
      setAllowed(false)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const email = session?.user?.email?.toLowerCase() ?? null
      const isAdmin = !!email && ADMIN_EMAILS.includes(email)
      if (!isAdmin) {
        const next = encodeURIComponent(pathname || '/admin/orders')
        router.replace(`/login?next=${next}`)
        setAllowed(false)
      } else {
        setAllowed(true)
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [pathname, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        A verificar permissões…
      </div>
    )
  }

  if (!allowed) return null
  return <>{children}</>
}
