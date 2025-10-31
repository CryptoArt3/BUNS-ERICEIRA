'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

// Rotas internas válidas
type AppRoute = '/' | '/menu' | '/cart' | '/checkout' | '/login' | '/account'

export default function MobileNav() {
  const [open, setOpen] = useState(false)

  // bloquear scroll do body quando o menu está aberto
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className="md:hidden relative">
      <button
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay para clicar fora e fechar */}
      {open && (
        <div
          aria-hidden
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
        />
      )}

      {/* Painel centralizado, com margens laterais e safe-area no topo */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="
            fixed z-50
            left-4 right-4 mx-auto max-w-sm
            top-[calc(env(safe-area-inset-top,0px)+64px)]
          "
        >
          <div className="rounded-2xl bg-black/90 border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="font-display text-lg">Menu</div>
              <button
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="px-2 py-2 text-center space-y-1">
              <NavItem href="/" onSelect={() => setOpen(false)}>🏠 Início</NavItem>
              <NavItem href="/menu" onSelect={() => setOpen(false)}>🍔 Menu</NavItem>
              <NavItem href="/cart" onSelect={() => setOpen(false)}>🛒 Carrinho</NavItem>
              <NavItem href="/account" onSelect={() => setOpen(false)}>👤 Conta</NavItem>
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}

function NavItem({
  href,
  children,
  onSelect,
}: {
  href: AppRoute
  children: React.ReactNode
  onSelect?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className="
        block w-full px-4 py-3
        text-lg font-medium text-white/95
        hover:text-buns-yellow hover:bg-white/10 active:bg-white/15
        rounded-xl transition
      "
    >
      {children}
    </Link>
  )
}
