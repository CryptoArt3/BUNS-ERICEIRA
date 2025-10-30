// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { CartProvider } from '@/components/cart/CartContext'
import { Header } from '@/components/ui/Header'
import WelcomeModal from '@/components/ui/WelcomeModal'
import StickyCartBar from '@/components/cart/StickyCartBar' // 👈 novo CTA fixo no mobile

export const metadata: Metadata = {
  title: 'BUNS — Smash Burgers',
  description: 'Born in Ericeira. Surf · Graffiti · Smash Burgers.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body suppressHydrationWarning>
        <CartProvider>
          {/* padding-bottom no mobile para não ficar conteúdo escondido atrás da StickyCartBar */}
          <div className="min-h-dvh grid grid-rows-[auto,1fr] pb-16 md:pb-0">
            <Header />
            <WelcomeModal />
            {children}
          </div>

          {/* CTA do carrinho sempre visível no mobile */}
          <StickyCartBar />
        </CartProvider>
      </body>
    </html>
  )
}
