// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { CartProvider } from '@/components/cart/CartContext'
import { Header } from '@/components/ui/Header'
import WelcomeModal from '@/components/ui/WelcomeModal' // 👈 novo componente do popup

export const metadata: Metadata = {
  title: 'BUNS — Smash Burgers',
  description: 'Born in Ericeira. Surf · Graffiti · Smash Burgers.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body suppressHydrationWarning>
        <CartProvider>
          <div className="min-h-dvh grid grid-rows-[auto,1fr]">
            {/* Cabeçalho global */}
            <Header />

            {/* Popup de boas-vindas com mascote */}
            <WelcomeModal />

            {/* Conteúdo das páginas */}
            {children}
          </div>
        </CartProvider>
      </body>
    </html>
  )
}
