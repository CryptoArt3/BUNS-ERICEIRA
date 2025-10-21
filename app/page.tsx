'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, Clock } from 'lucide-react'
import { Sizzle } from '@/components/ui/Sizzle'

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 space-y-10">
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
            Nascido na Ericeira 🌊 — vibe surf, graffiti, skate e chapa a arder. Explora o menu e faz o teu pedido.
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

      {/* LOCALIZAÇÕES */}
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

        {/* Segunda Localização — teaser */}
        <div className="location-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-display">Segunda Localização</h3>
              <Clock className="w-5 h-5 text-white/60" />
            </div>
            <p className="text-white/70 mt-2">
              Em <strong>loading…</strong> — a preparar a próxima paragem BUNS.
            </p>
          </div>

          <div className="mt-6">
            <span className="location-chip">brevemente</span>
          </div>
        </div>
      </section>
    </main>
  )
}
