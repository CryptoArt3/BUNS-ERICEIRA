'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

function ObrigadoInner() {
  const sp = useSearchParams()
  const orderId = sp.get('order')

  return (
    <main className="mx-auto w-full max-w-[100vw] overflow-x-hidden px-3 sm:px-4 pt-10 pb-24 space-y-6 sm:space-y-8">
      <h1 className="text-4xl sm:text-5xl font-display leading-tight tracking-tight px-1">
        <span className="text-buns-yellow">BUNS</span>
        <span className="ml-2">Obrigado</span>
      </h1>

      <div className="card p-8 text-center space-y-5 max-w-2xl mx-auto">
        <div className="flex justify-center">
          <CheckCircle2 className="w-12 h-12 text-green-400" />
        </div>

        <h2 className="text-3xl font-display">Pedido confirmado! 🎉</h2>

        <p className="text-white/80">
          Recebemos a tua encomenda{' '}
          {orderId ? (
            <>
              <br />Nº <strong>#{orderId}</strong>
            </>
          ) : null}
          . Estamos a preparar tudo — obrigado!
        </p>

        <div className="grid sm:flex gap-3 sm:justify-center pt-2">
          <Link href="/menu" className="btn btn-primary">
            Continuar a ver menu
          </Link>
          <Link href="/" className="btn btn-ghost">
            Voltar à página inicial
          </Link>
        </div>

        <p className="text-white/60 text-sm pt-2">
          Se precisares de alterar algo, fala connosco pelo telefone da loja.
        </p>
      </div>
    </main>
  )
}

export default function ObrigadoPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-[100vw] overflow-x-hidden px-3 sm:px-4 pt-10 pb-24">
          <div className="card p-8 text-center max-w-2xl mx-auto">A carregar…</div>
        </main>
      }
    >
      <ObrigadoInner />
    </Suspense>
  )
}
