'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Trophy, ExternalLink } from 'lucide-react'
import { useCart } from '@/components/cart/CartContext'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ModeToggle } from '@/components/ui/ModeToggle'

const UBER_LINK = 'https://www.ubereats.com/pt'
const ERICEIRA_EATS = 'https://ericeiraeats.pt'

// aceita só rotas internas válidas
type AppRoute = '/' | '/menu' | '/rewards' | '/cart' | '/checkout'

export const Header = () => {
  const path = usePathname()
  const { cart } = useCart()
  const count = cart.items.reduce((n, it) => n + it.qty, 0)

  return (
    <header className="sticky top-0 z-40 backdrop-blur border-b border-white/10 bg-black/40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl tracking-wider flex items-center gap-3">
          <img src="/logo-buns.svg" alt="BUNS" className="h-6 w-auto hidden sm:block" />
          <span className="text-buns-yellow">BUNS</span>
        </Link>

        <div className="hidden md:flex items-center gap-2 mr-2">
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

        <nav className="flex items-center gap-2">
          <ModeToggle />
          <ThemeToggle />
          <NavLink href="/menu" active={path.startsWith('/menu')}>Menu</NavLink>
          <NavLink
            href="/rewards"
            active={path.startsWith('/rewards')}
            icon={<Trophy className="w-4 h-4" />}
          >
            Rewards
          </NavLink>
          <Link href="/cart" className="btn btn-primary">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Carrinho {count > 0 && <span className="ml-2">({count})</span>}
          </Link>
        </nav>
      </div>

      <div className="md:hidden container mx-auto px-4 py-2 flex gap-2">
        <a
          href={UBER_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline flex-1 text-center"
        >
          Uber Eats
        </a>
        <a
          href={ERICEIRA_EATS}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline flex-1 text-center"
        >
          Ericeira Eats
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
  <Link
    href={href}
    className={`btn btn-ghost ${active ? 'ring-1 ring-white/20' : ''}`}
  >
    {icon}
    {children}
  </Link>
)
