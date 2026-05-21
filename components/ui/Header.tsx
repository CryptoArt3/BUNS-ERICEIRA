'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ShoppingCart, ExternalLink, LogIn, User, LogOut } from 'lucide-react'

import { useCart } from '@/components/cart/CartContext'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ModeToggle } from '@/components/ui/ModeToggle'
import MobileNav from '@/components/ui/MobileNav'
import LangToggle from '@/components/ui/LangToggle'
import { supabase } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/useI18n'

const UBER_LINK = 'https://www.ubereats.com/pt/store/buns-smash-burger/O_JvrmwGUeSg0zoFNkw6AQ?diningMode=DELIVERY&pl=JTdCJTIyYWRkcmVzcyUyMiUzQSUyMkVyaWNlaXJhJTIyJTJDJTIycmVmZXJlbmNlJTIyJTNBJTIyQ2hJSmwyXzlyUTRuSHcwUlRLb1FER0VNTEhRJTIyJTJDJTIycmVmZXJlbmNlVHlwZSUyMiUzQSUyMmdvb2dsZV9wbGFjZXMlMjIlMkMlMjJsYXRpdHVkZSUyMiUzQTM4Ljk2ODEyNzclMkMlMjJsb25naXR1ZGUlMjIlM0EtOS40MDczMDA0JTdE'
const ERICEIRA_EATS = 'https://ericeiraeats.pt'

type AppRoute = '/' | '/menu' | '/cart' | '/checkout' | '/login' | '/account'

export const Header = () => {
  const path = usePathname()
  const router = useRouter()
  const { cart } = useCart()
  const { t }    = useI18n()

  if (path.startsWith('/screen') || path.startsWith('/admin')) {
    return null
  }

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

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
    <header
      className="sticky top-0 z-50 backdrop-blur border-b border-white/10 bg-black/50"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        {/* logo — só texto (removido o logo pequeno) */}
        <Link
          href="/"
          className="font-display text-2xl tracking-wider flex items-center"
          aria-label="BUNS — início"
        >
          <span className="text-buns-yellow">BUNS</span>
        </Link>

        {/* desktop – links externos */}
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

        {/* desktop – navegação */}
        <nav className="hidden md:flex items-center gap-2">
          <ModeToggle />
          <ThemeToggle />
          <LangToggle />

          <NavLink href="/menu" active={path.startsWith('/menu')}>
            {t('nav.menu')}
          </NavLink>

          {email ? (
            <>
              <NavLink
                href="/account"
                active={path.startsWith('/account')}
                icon={<User className="w-4 h-4" />}
              >
                {t('nav.account')}
              </NavLink>
              <button onClick={handleSignOut} className="btn btn-ghost">
                <LogOut className="w-4 h-4 mr-2" />
                {t('header.sign_out')}
              </button>
            </>
          ) : (
            <NavLink
              href="/login"
              active={path.startsWith('/login')}
              icon={<LogIn className="w-4 h-4" />}
            >
              {t('header.sign_in')}
            </NavLink>
          )}

          <Link href="/cart" className="btn btn-primary">
            <ShoppingCart className="w-4 h-4 mr-2" />
            {t('nav.cart')} {mounted && count > 0 && <span className="ml-2">({count})</span>}
          </Link>
        </nav>

        {/* mobile – lang toggle + hambúrguer */}
        <div className="md:hidden flex items-center gap-2 pr-1">
          <LangToggle />
          <MobileNav />
        </div>
      </div>

      {/* mobile – links externos */}
      <div className="md:hidden mx-auto max-w-6xl px-4 py-2 flex gap-2">
        <a
          href={UBER_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline flex-1 text-center"
        >
          Uber Eats <ExternalLink className="inline w-3.5 h-3.5 ml-1" />
        </a>
        <a
          href={ERICEIRA_EATS}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline flex-1 text-center"
        >
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
