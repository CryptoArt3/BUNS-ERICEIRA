// app/layout.tsx (corrigido)
import './globals.css'
import type { Metadata } from 'next'
import { CartProvider } from '@/components/cart/CartContext'   // <- caminho certo
import { Header } from '@/components/ui/Header'

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
            <Header />
            {children}
          </div>
        </CartProvider>
      </body>
    </html>
  )
}
