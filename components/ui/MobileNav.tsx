'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

// rotas internas válidas
type AppRoute = '/' | '/menu' | '/cart' | '/checkout' | '/login' | '/account'

export default function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden relative">
      <button
        aria-label="Abrir menu"
        onClick={() => setOpen(!open)}
        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-12 z-40 bg-black/90 backdrop-blur-lg border-t border-white/10 p-6 space-y-4 text-center rounded-b-2xl">
          <NavItem href="/">🏠 Início</NavItem>
          <NavItem href="/menu">🍔 Menu</NavItem>
          <NavItem href="/cart">🛒 Carrinho</NavItem>
          <NavItem href="/account">👤 Conta</NavItem>
        </div>
      )}
    </div>
  )
}

function NavItem({
  href,
  children,
}: {
  href: AppRoute
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="block text-lg font-medium text-white/95 hover:text-buns-yellow transition"
    >
      {children}
    </Link>
  )
}
