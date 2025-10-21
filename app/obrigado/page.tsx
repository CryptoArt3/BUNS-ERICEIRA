'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

export default function ObrigadoPage() {
  const sp = useSearchParams()
  const orderId = sp.get('order')

  return (
    <main className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="card p-8 text-center space-y-5">
        <div className="flex justify-center">
          <CheckCircle2 className="w-12 h-12 text-green-400" />
        </div>

        <h1 className="text-3xl font-display">Pedido confirmado! 🎉</h1>

        <p className="text-white/80">
          Recebemos a tua encomenda {orderId ? <><br/>Nº <strong>#{orderId}</strong></> : null}.
          Estamos a preparar tudo — obrigado!
        </p>

        <div className="grid sm:flex gap-3 sm:justify-center pt-2">
          <Link href="/menu" className="btn btn-primary">Continuar a ver menu</Link>
          <Link href="/" className="btn btn-ghost">Voltar à página inicial</Link>
        </div>

        <p className="text-white/60 text-sm pt-2">
          Se precisares de alterar algo, fala connosco pelo telefone da loja.
        </p>
      </div>
    </main>
  )
}
