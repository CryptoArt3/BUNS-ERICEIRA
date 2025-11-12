'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

type Step = {
  title: string
  desc: string
  img?: string
  tip?: string
}

const STEPS: Step[] = [
  {
    title: 'Aceder ao site',
    desc: 'Vai a www.buns-ericeira.pt e entra no Menu.',
    img: '/pagina-1.png',
  },
  {
    title: 'Adicionar ao carrinho',
    desc: 'Escolhe os teus produtos no Menu e adiciona ao carrinho.',
    img: '/pagina-2.png',
  },
  {
    title: 'Carrinho & Notas',
    desc:
      'No carrinho consegues rever os produtos e escrever notas (ex.: “sem ketchup”, “batata doce”, “extra bacon”).',
    img: '/pagina-3.png',
    tip: 'As notas ajudam a equipa a personalizar o pedido como queres.',
  },
  {
    title: 'Seguir para Checkout',
    desc:
      'Clica em Checkout para finalizar. Se ainda não tens sessão iniciada, vais ver o ecrã de login.',
    img: '/pagina-4.png',
  },
  {
    title: 'Magic Link (login sem password)',
    desc:
      'Escreve o teu email e pede o “Magic Link”. Nas primeiras vezes, confirma a caixa de Spam.',
    img: '/pagina-5.png',
    tip: 'Abre o email e toca no botão “Entrar na conta” para voltares automaticamente ao site.',
  },
  {
    title: 'Finalizar pedido',
    desc:
      'Já com sessão iniciada, confirma os dados e finaliza. Vais receber a confirmação do pedido.',
    img: '/pagina-6.png',
  },
  {
    title: 'Acompanhar o estado',
    desc:
      'Na tua conta podes acompanhar o estado: • Pending (recebido) • Em preparação • Feito (levantar na loja).',
    img: '/pagina-7.png',
  },
]

export default function ComoUsarPage() {
  const [idx, setIdx] = useState(0)
  const step = STEPS[idx]

  const progress = useMemo(() => ((idx + 1) / STEPS.length) * 100, [idx])

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-10">
      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-3xl sm:text-5xl font-display">
          Como usar a <span className="text-buns-yellow">BUNS App</span>
        </h1>
        <p className="mt-3 text-white/80">
          Guia rápido com imagens — do Menu ao acompanhamento do pedido.
        </p>
      </motion.header>

      {/* PROGRESS BAR */}
      <div className="rounded-full bg-white/10 h-2 overflow-hidden">
        <div
          className="h-full bg-buns-yellow"
          style={{ width: `${progress}%`, transition: 'width .3s ease' }}
        />
      </div>

      {/* STEP */}
      <section className="grid md:grid-cols-2 gap-6 items-start">
        {/* Texto */}
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="card p-6"
        >
          <div className="inline-flex items-center gap-2 text-buns-yellow font-semibold">
            <CheckCircle className="w-4 h-4" />
            Passo {idx + 1} de {STEPS.length}
          </div>

          <h2 className="mt-2 text-2xl font-display">{step.title}</h2>
          <p className="mt-3 text-white/80 leading-relaxed">{step.desc}</p>

          {step.tip && (
            <div className="mt-4 rounded-xl bg-buns-yellow/10 border border-buns-yellow/30 p-3 text-sm text-buns-yellow">
              💡 <span className="font-semibold">Dica:</span> {step.tip}
            </div>
          )}

          {/* Navegação */}
          <div className="mt-6 flex items-center justify-between gap-2">
            <button
              onClick={() => setIdx((v) => Math.max(0, v - 1))}
              className="btn btn-ghost inline-flex items-center gap-2"
              disabled={idx === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
            <div className="text-white/60 text-sm">Passo {idx + 1}</div>
            <button
              onClick={() => setIdx((v) => Math.min(STEPS.length - 1, v + 1))}
              className="btn btn-primary inline-flex items-center gap-2"
              disabled={idx === STEPS.length - 1}
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Imagem */}
        <motion.div
          key={step.img || `noimg-${idx}`}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="card overflow-hidden p-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={step.img || '/guia/placeholder.png'}
            alt={step.title}
            className="w-full h-[360px] object-cover"
          />
        </motion.div>
      </section>

      {/* CTA FINAL */}
      <section className="text-center">
        <Link href="/menu" className="btn btn-primary">Ir para o Menu</Link>
        <span className="mx-2 inline-block" />
        <Link href="/cart" className="btn btn-ghost">Ver Carrinho</Link>
      </section>
    </main>
  )
}
