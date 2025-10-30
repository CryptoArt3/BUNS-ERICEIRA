'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { Sizzle } from '@/components/ui/Sizzle'

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 space-y-12">
      {/* HERO */}
      <section className="grid lg:grid-cols-2 gap-8 items-stretch">
        {/* Texto principal */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-display leading-tight">
            <span className="text-buns-yellow">BUNS</span> Smash Burgers
          </h1>

          <p className="mt-4 text-white/80 max-w-xl">
            Nascido na Ericeira 🌊 — vibe surf, graffiti, skate e chapa a arder.
            Explora o menu e faz o teu pedido.
          </p>

          <div className="mt-6 flex gap-3">
            <Link className="btn btn-primary" href="/menu">
              Ver Menu
            </Link>
            <Link className="btn btn-ghost" href="/cart">
              Ver Carrinho
            </Link>
          </div>
        </motion.div>

        {/* Hero visual com medidor de calor */}
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

      {/* LOCALIZAÇÃO + INFO DE PRODUTO / MENU */}
      <section className="grid md:grid-cols-2 gap-6">
        {/* Ericeira — Loja #1 */}
        <div className="location-card">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-display">Ericeira — Loja #1</h3>
            <MapPin className="w-5 h-5 pin" />
          </div>

          <p className="text-white/80 mt-2">
            Calçada da Baleia 29A<br />2655-238 Ericeira
          </p>

          {/* Mini-mapa embed */}
          <div className="map-thumb mt-4">
            <iframe
              title="Mapa — BUNS Ericeira"
              loading="lazy"
              allowFullScreen={true}
              src="https://www.google.com/maps?q=Calçada%20da%20Baleia%2029A%2C%20Ericeira&output=embed"
            />
          </div>

          <a
            href="https://maps.google.com/?q=Calçada%20da%20Baleia%2029A%202655-238%20Ericeira"
            target="_blank"
            className="btn btn-primary mt-4 inline-block"
          >
            Abrir no Google Maps
          </a>
        </div>

        {/* Em vez da “próxima localização” → Informação de produto e do MENU */}
        <div className="location-card">
          <h3 className="text-2xl font-display">Como servimos</h3>

          <p className="text-white/80 mt-3 leading-relaxed">
            Todos os nossos hamburgers chegam à mesa com{' '}
            <span className="font-semibold text-white">dupla carne</span> e{' '}
            <span className="font-semibold text-white">duplo queijo americano</span>,
            mais os ingredientes de cada receita. Smash na chapa, crosta dourada e
            sabor no ponto. Simples, direto e viciante.
          </p>

          <div className="h-[1px] bg-white/10 my-4" />

          <p className="text-white/80 leading-relaxed">
            O <span className="font-semibold text-buns-yellow">MENU</span> inclui{' '}
            <span className="font-semibold text-white">hamburger</span> +{' '}
            <span className="font-semibold text-white">batata doce ou salgada</span> +{' '}
            <span className="font-semibold text-white">bebida</span> (Super Bock, Ice Tea
            de Limão, Manga ou Pêssego, 7UP, Cola, Cola 0, Água ou Água com gás). Para
            personalizar, indica a tua escolha nas <span className="font-semibold">Notas do
            Carrinho</span>. Por defeito enviamos{' '}
            <span className="font-semibold">batata salgada</span> e{' '}
            <span className="font-semibold">Cola normal</span>.
          </p>

          <div className="mt-5">
            <Link href="/menu" className="btn btn-ghost">
              Explorar o Menu
            </Link>
          </div>
        </div>
      </section>

      {/* ACERCA DA BUNS */}
      <section className="grid lg:grid-cols-2 gap-6 items-center">
        <div className="card p-6">
          <h3 className="text-2xl font-display">Acerca da BUNS Smash Burgers</h3>
          <p className="text-white/80 mt-3 leading-relaxed">
            O BUNS é a nova hamburgueria da Ericeira dedicada aos verdadeiros amantes
            de smash burgers. Ingredientes frescos, carne prensada na chapa como manda
            a tradição e combinações únicas que respeitam o sabor e a simplicidade.
            Além dos clássicos, temos opções vegetarianas, batatas doces, frozen
            Bunanas artesanais e um ambiente urbano inspirado no surf e lifestyle da
            vila. Ideal para um almoço rápido ou um jantar com amigos. Visita-nos e
            descobre o smash perfeito.
          </p>
        </div>

        {/* Imagem de apoio (troca o src depois) */}
        <div className="card overflow-hidden p-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/banner-home.png"
            alt="BUNS — ambiente e smash na chapa"
            className="w-full h-64 sm:h-80 object-cover"
          />
        </div>
      </section>

      {/* EQUIPA */}
      <section className="space-y-4">
        <h3 className="text-2xl font-display">A Equipa</h3>
        <p className="text-white/70">
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
              <blockquote className="text-sm text-white/70 mt-3 italic">“{m.quote}”</blockquote>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-8 border-t border-white/10 pt-6 pb-10 text-sm text-white/70">
        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <div className="font-display text-lg text-white">BUNS</div>
            <p className="mt-2">
              Smash burgers na Ericeira. Surf, graffiti e chapa a arder.
            </p>
          </div>

          <div>
            <div className="font-semibold text-white">Links</div>
            <ul className="mt-2 space-y-1">
              <li><Link href="/menu" className="hover:text-white">Menu</Link></li>
              <li><Link href="/cart" className="hover:text-white">Carrinho</Link></li>
              <li><Link href="/checkout" className="hover:text-white">Checkout</Link></li>
              <li><Link href="/admin/login" className="hover:text-white">Área Admin</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-semibold text-white">Legal</div>
            <ul className="mt-2 space-y-1">
              <li><Link href="/privacidade" className="hover:text-white">Política de Privacidade</Link></li>
              <li><Link href="/termos" className="hover:text-white">Termos & Condições</Link></li>
              <li><Link href="/cookies" className="hover:text-white">Política de Cookies</Link></li>
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

/* —————————————————————— */
/* Dados mock para a equipa (troca quando quiseres) */
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
    name: 'Luis',
    role: 'Criativo',
    photo: '/luis.jpg',
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
