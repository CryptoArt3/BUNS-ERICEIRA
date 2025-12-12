'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, Clock, Store, Truck } from 'lucide-react'
import { Sizzle } from '@/components/ui/Sizzle'
import { useEffect, useMemo, useState } from 'react'

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-12">
      {/* HERO */}
      <section className="grid lg:grid-cols-2 gap-8 items-stretch">
        {/* Texto principal */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl sm:text-5xl font-display leading-tight">
            <span className="text-buns-yellow">BUNS</span> Smash Burgers
          </h1>

          <p className="mt-2 sm:mt-4 text-base sm:text-lg text-white/80 max-w-xl leading-relaxed">
            Nascido na Ericeira 🌊 — vibe surf, graffiti, skate e chapa a arder.
            Explora o menu e faz o teu pedido.
          </p>

          <div className="mt-5 sm:mt-6 flex flex-wrap gap-3">
            <Link className="btn btn-primary" href="/menu">
              Ver Menu
            </Link>
            <Link className="btn btn-ghost" href="/cart">
              Ver Carrinho
            </Link>
            <Link className="btn btn-outline" href="/ar">
              Ver Menu em AR
            </Link>
          </div>
        </motion.div>

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="hero"
        >
          <div className="hero-content">
            <Sizzle />
          </div>
        </motion.div>
      </section>

      {/* FEATURE — MENU EM AR */}
      <section className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xs sm:text-sm font-semibold text-buns-yellow uppercase tracking-[0.18em]">
            🕶️ Novo na BUNS
          </p>
          <h2 className="mt-1 text-base sm:text-lg font-display">
            Vê o nosso menu em Realidade Aumentada
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-white/75">
            Usa o telemóvel para colocar os burgers da BUNS diretamente na tua mesa, em tamanho real.
          </p>
        </div>

        {/* Rota da página de AR */}
        <Link
          href="/ar"
          className="btn btn-primary text-sm whitespace-nowrap"
        >
          Experimentar Menu em AR
        </Link>
      </section>

      {/* LOCALIZAÇÃO + INFO */}
      <section className="grid md:grid-cols-2 gap-6">
        {/* Ericeira — Loja #1 */}
        <div className="location-card">
          <div className="flex items-center justify-between">
            <h3 className="text-xl sm:text-2xl font-display">Ericeira — Loja #1</h3>
            <MapPin className="w-5 h-5 pin" />
          </div>

          <p className="text-white/80 mt-2">
            Calçada da Baleia 29A
            <br />
            2655-238 Ericeira
          </p>

          <div className="map-thumb mt-4">
            <iframe
              title="Mapa — BUNS Ericeira"
              loading="lazy"
              allowFullScreen={true}
              src="https://www.google.com/maps?q=BUNS%20Smash%20Burgers%2C%20Cal%C3%A7ada%20da%20Baleia%2029A%2C%20Ericeira&output=embed"
            />
          </div>

          <a
            href="https://maps.google.com/?q=BUNS%20Smash%20Burgers%2C%20Cal%C3%A7ada%20da%20Baleia%2029A%2C%20Ericeira"
            target="_blank"
            className="btn btn-primary mt-4 inline-block"
          >
            Abrir no Google Maps
          </a>

          {/* ---- Horários: por baixo da geolocation ---- */}
          <div className="mt-5">
            <OperatingHours />
          </div>
        </div>

        {/* Informação de produto / menu */}
        <div className="location-card">
          <h3 className="text-xl sm:text-2xl font-display">Como servimos</h3>

          <p className="text-white/80 mt-3 leading-relaxed text-[15px] sm:text-base">
            Todos os nossos hamburgers chegam à mesa com{' '}
            <span className="font-semibold text-white">dupla carne</span> e{' '}
            <span className="font-semibold text-white">duplo queijo americano</span>, mais os
            ingredientes de cada receita. Smash na chapa, crosta dourada e sabor no ponto. Simples,
            direto e viciante.
          </p>

          <div className="h-[1px] bg-white/10 my-4" />

          <p className="text-white/80 leading-relaxed text-[15px] sm:text-base">
            O <span className="font-semibold text-buns-yellow">MENU</span> inclui{' '}
            <span className="font-semibold text-white">hamburger</span> +{' '}
            <span className="font-semibold text-white">batata doce ou salgada</span> +{' '}
            <span className="font-semibold text-white">bebida</span> (Super Bock, Ice Tea de Limão,
            Manga ou Pêssego, 7UP, Cola, Cola 0, Água ou Água com gás). Para personalizar, indica a
            tua escolha nas <span className="font-semibold">Notas do Carrinho</span>. Por defeito
            enviamos <span className="font-semibold">batata salgada</span> e{' '}
            <span className="font-semibold">Cola normal</span>.
          </p>

          <div className="mt-5">
            <Link href="/menu" className="btn btn-ghost">
              Explorar o Menu
            </Link>
          </div>
        </div>
      </section>

      {/* ACERCA */}
      <section className="grid lg:grid-cols-2 gap-6 items-center">
        <div className="card p-6">
          <h3 className="text-xl sm:text-2xl font-display">Acerca da BUNS Smash Burgers</h3>
          <p className="text-white/80 mt-3 leading-relaxed text-[15px] sm:text-base">
            O BUNS é a nova hamburgueria da Ericeira dedicada aos verdadeiros amantes de smash
            burgers. Ingredientes frescos, carne prensada na chapa como manda a tradição e
            combinações únicas que respeitam o sabor e a simplicidade. Além dos clássicos, temos
            opções vegetarianas, batatas doces, frozen Bunanas artesanais e um ambiente urbano
            inspirado no surf e lifestyle da vila. Ideal para um almoço rápido ou um jantar com
            amigos. Visita-nos e descobre o smash perfeito.
          </p>

          {/* 🔥 Link para a Wall of Fame — box inteira clicável */}
          <Link
            href="/wall-of-fame"
            className="mt-5 block rounded-xl bg-white/5 border border-white/10 p-4 text-center sm:text-left cursor-pointer transition hover:border-buns-yellow/70 hover:bg-white/10 hover:shadow-lg"
          >
            <h4 className="font-display text-lg text-buns-yellow">🔥 Wall of Fame</h4>
            <p className="text-white/80 text-sm sm:text-base mt-1">
              Acreditas que consegues comer mais do que o campeão atual? Junta-te à nossa{' '}
              <span className="text-buns-yellow font-semibold">Wall of Fame</span> e coloca o teu
              nome na história da BUNS.
            </p>
          </Link>

          {/* 🎉 BUNS Eventos — box inteira clicável */}
          <Link
            href="/eventos"
            className="mt-6 block rounded-xl bg-white/5 border border-white/10 p-4 text-center sm:text-left cursor-pointer transition hover:border-buns-yellow/70 hover:bg-white/10 hover:shadow-lg"
          >
            <h4 className="font-display text-lg text-buns-yellow">🎉 BUNS Eventos</h4>
            <p className="text-white/80 text-sm sm:text-base mt-1">
              Acontece sempre algo na BUNS — meetups, quizzes, record nights e eventos especiais. Vê
              o que está a acontecer agora na nossa página de{' '}
              <span className="text-buns-yellow font-semibold">Eventos BUNS</span>.
            </p>
          </Link>
        </div>

        <div className="card overflow-hidden p-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/banner-home.png"
            alt="BUNS — ambiente e smash na chapa"
            className="w-full h-64 sm:h-80 object-cover"
          />
        </div>
      </section>

      {/* NOVA SECÇÃO — MANUAL / COMO USAR */}
      <section className="grid md:grid-cols-2 gap-6 items-center">
        <div className="card overflow-hidden p-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/como-usar.jpg"
            alt="Guia: Como usar a app"
            className="w-full h-64 sm:h-80 object-cover"
          />
        </div>
        <div className="card p-6">
          <h3 className="text-xl sm:text-2xl font-display">Manual / Como usar a app</h3>
          <p className="text-white/80 mt-3 leading-relaxed text-[15px] sm:text-base">
            Passo a passo com imagens: escolher produtos, escrever notas no carrinho, login com
            Magic Link e acompanhar o estado do pedido na tua conta.
          </p>
          <div className="mt-5 flex gap-3">
            <Link href="/como-usar" className="btn btn-primary">
              Abrir o Guia
            </Link>
            <Link href="/menu" className="btn btn-ghost">
              Menu
            </Link>
          </div>
        </div>
      </section>

      {/* EQUIPA */}
      <section className="space-y-4">
        <h3 className="text-xl sm:text-2xl font-display">A Equipa</h3>
        <p className="text-white/70 text-[15px] sm:text-base">
          O sabor nasce de uma boa equipa. Aqui estão algumas das caras por trás da chapa.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {TEAM.map((m) => (
            <div key={m.name} className="card p-5 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.photo}
                alt={m.name}
                className="mx-auto h-20 w-20 rounded-full object-cover border border-white/10"
              />
              <div className="mt-3 font-semibold">{m.name}</div>
              <div className="text-sm text-white/60">{m.role}</div>
              <blockquote className="text-sm text-white/70 mt-3 italic">
                “{m.quote}”
              </blockquote>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-8 border-t border-white/10 pt-6 pb-10 text-sm text-white/70">
        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <div className="font-display text-lg text-white">BUNS</div>
            <p className="mt-2">Smash burgers na Ericeira. Surf, graffiti e chapa a arder.</p>
          </div>

          <div>
            <div className="font-semibold text-white">Links</div>
            <ul className="mt-2 space-y-1">
              <li>
                <Link href="/menu" className="hover:text-white">
                  Menu
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white">
                  Carrinho
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-white">
                  Checkout
                </Link>
              </li>
              <li>
                <Link href="/como-usar" className="hover:text-white">
                  Manual / Como usar
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-white">
                  Área Admin
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-semibold text-white">Legal</div>
            <ul className="mt-2 space-y-1">
              <li>
                <Link href="/privacidade" className="hover:text-white">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/termos" className="hover:text-white">
                  Termos & Condições
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-white">
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} BUNS. Todos os direitos reservados.
        </div>
      </footer>
    </main>
  )
}

/* ——— Componente: Horário + relógio (estilo BUNS) ——— */
function OperatingHours() {
  const [now, setNow] = useState<Date>(new Date())

  // atualiza a cada 30s
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  const tz = 'Europe/Lisbon'
  const label = useMemo(() => {
    const day = new Intl.DateTimeFormat('pt-PT', {
      weekday: 'short',
      timeZone: tz,
    }).format(now)
    const time = new Intl.DateTimeFormat('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: tz,
    }).format(now)
    return `${day.replace('.', '')} · ${time}`
  }, [now])

  // aberto 11:00–22:59
  const isOpen = useMemo(() => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      timeZone: tz,
    }).formatToParts(now)
    const h = Number(parts.find((p) => p.type === 'hour')?.value ?? '0')
    return h >= 11 && h < 23
  }, [now])

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-buns-yellow/10 via-orange-500/10 to-pink-500/10 p-[1px]">
      <div className="rounded-2xl bg-black/40 backdrop-blur p-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-white/80" />
          <span className="text-sm sm:text-base text-white/90">{label}</span>
          <span
            className={`ml-auto inline-flex items-center gap-2 text-xs sm:text-sm px-2 py-1 rounded-full border ${
              isOpen
                ? 'bg-green-500/15 border-green-400/30 text-green-300'
                : 'bg-red-500/15 border-red-400/30 text-red-300'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isOpen ? 'bg-green-400' : 'bg-red-400'
              }`}
            />
            {isOpen ? 'Aberto' : 'Fechado'}
          </span>
        </div>

        {/* chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 text-xs sm:text-sm px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <Store className="w-3.5 h-3.5" />
            Takeaway: 11:00–23:00
          </span>
          <span className="inline-flex items-center gap-2 text-xs sm:text-sm px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <Truck className="w-3.5 h-3.5" />
            Delivery: brevemente
          </span>
        </div>

        {/* glow subtil */}
        <div className="pointer-events-none absolute -inset-20 bg-[radial-gradient(ellipse_at_center,rgba(255,200,0,0.08),transparent_50%)]" />
      </div>
    </div>
  )
}

/* Mock de equipa (troca quando quiseres) */
const TEAM = [
  {
    name: 'Francisco',
    role: 'Chapa & Sabor',
    photo: '/francisco.png',
    quote: 'Smash é crosta, suco e respeito ao pão.',
  },
  {
    name: 'Pedro',
    role: 'Operações',
    photo: '/pedro.jpg',
    quote: 'Serviço rápido, sempre quente.',
  },
  {
    name: 'António',
    role: 'Criativo',
    photo: '/antonio.jpg',
    quote: 'Surf de dia, smash à noite.',
  },
  {
    name: 'Bárbara',
    role: 'Front & Smile',
    photo: '/barbara.jpg',
    quote: 'O segredo? Bons ingredientes e boas vibrações.',
  },
  {
    name: 'Bruno',
    role: 'Prep & Qualidade',
    photo: '/bruno.jpg',
    quote: 'Detalhe a detalhe, burger a burger.',
  },
]
