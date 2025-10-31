'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ShoppingCart, ExternalLink, LogIn, User, LogOut } from 'lucide-react'

import { useCart } from '@/components/cart/CartContext'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ModeToggle } from '@/components/ui/ModeToggle'
import MobileNav from '@/components/ui/MobileNav'
import { supabase } from '@/lib/supabase/client'

const UBER_LINK = 'https://www.ubereats.com/pt'
const ERICEIRA_EATS = 'https://ericeiraeats.pt'

// rotas internas válidas
type AppRoute = '/' | '/menu' | '/cart' | '/checkout' | '/login' | '/account'

export const Header = () => {
  const path = usePathname()
  const router = useRouter()
  const { cart } = useCart()

  // evitar hydration mismatch
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // sessão
  const [email, setEmail] = useState<string | null>(null)
  useEffect(() => {
    let unsub: (() => void) | undefined
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      setEmail(data.session?.user?.email ?? null)
      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        setEmail(session?.user?.email ?? null)
      })
      unsub = () => sub.subscription.unsubscribe()
    })()
    return () => unsub?.()
  }, [])

  const count = mounted ? cart.items.reduce((n, it) => n + it.qty, 0) : 0

  async function handleSignOut() {
    await supabase.auth.signOut()
    setEmail(null)
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur border-b border-white/10 bg-black/50">
      {/* wrapper idêntico às outras páginas */}
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* logo */}
        <Link href="/" className="font-display text-2xl tracking-wider flex items-center gap-3">
          <img src="/logo-buns.svg" alt="BUNS" className="h-6 w-auto hidden sm:block" />
          <span className="text-buns-yellow">BUNS</span>
        </Link>

        {/* botões externos (desktop) */}
        <div className="hidden md:flex items-center gap-2">
          <a
            href={UBER_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline flex items-center gap-2"
          >
            Uber Eats <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href={ERICEIRA_EATS}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline flex items-center gap-2"
          >
            Ericeira Eats <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* navegação desktop */}
        <nav className="hidden md:flex items-center gap-2">
          <ModeToggle />
          <ThemeToggle />

          <NavLink href="/menu" active={path.startsWith('/menu')}>Menu</NavLink>

          {email ? (
            <>
              <NavLink href="/account" active={path.startsWith('/account')} icon={<User className="w-4 h-4" />}>
                Conta
              </NavLink>
              <button onClick={handleSignOut} className="btn btn-ghost">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </button>
            </>
          ) : (
            <NavLink href="/login" active={path.startsWith('/login')} icon={<LogIn className="w-4 h-4" />}>
              Entrar
            </NavLink>
          )}

          <Link href="/cart" className="btn btn-primary">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Carrinho {mounted && count > 0 && <span className="ml-2">({count})</span>}
          </Link>
        </nav>

        {/* menu hambúrguer (mobile) */}
        <MobileNav />
      </div>

      {/* CTA mobile externos – mesma largura do container */}
      <div className="md:hidden container mx-auto px-4 py-2 flex gap-2">
        <a href={UBER_LINK} target="_blank" rel="noopener noreferrer" className="btn-outline flex-1 text-center">
          Uber Eats <ExternalLink className="inline w-3.5 h-3.5 ml-1" />
        </a>
        <a href={ERICEIRA_EATS} target="_blank" rel="noopener noreferrer" className="btn-outline flex-1 text-center">
          Ericeira Eats <ExternalLink className="inline w-3.5 h-3.5 ml-1" />
        </a>
      </div>
    </header>
  )
}

const NavLink = ({
  href,
  children,
  active,
  icon,
}: {
  href: AppRoute
  children: React.ReactNode
  active?: boolean
  icon?: React.ReactNode
}) => (
  <Link href={href} className={`btn btn-ghost ${active ? 'ring-1 ring-white/20' : ''}`}>
    {icon}
    {children}
  </Link>
)
