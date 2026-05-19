'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/* ─── Menu highlight data ────────────────────────────────── */
const HIGHLIGHTS = [
  {
    name: 'Classic Bun',
    price: 9.90,
    emoji: '🍔',
    desc: 'Queijo americano, ketchup, mostarda, cebola, pickles',
    tag: null,
  },
  {
    name: 'Bacon Bun',
    price: 9.90,
    emoji: '🥓',
    desc: 'Molho especial, cebola frita, bacon crocante, alface',
    tag: 'bestseller',
  },
  {
    name: 'Epic Bun',
    price: 9.90,
    emoji: '🌶️',
    desc: 'Molho especial, cebola caramelizada, jalapeños',
    tag: 'spicy',
  },
  {
    name: 'Bunanas',
    price: 3.00,
    emoji: '🍌',
    desc: 'Gelado artesanal — chocolate, caramelo, pistachio e mais',
    tag: 'novo',
  },
]

/* ─── Adventures (latest 3 episodes) ────────────────────── */
const ADVENTURES = [
  { ep: 12, src: '/videos/buns-episode-12.mp4' },
  { ep: 11, src: '/videos/buns-episode-11.mp4' },
  { ep: 10, src: '/videos/buns-episode-10.mp4' },
]

/* ─── Currency ───────────────────────────────────────────── */
function currency(x: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(x)
}

/* ─── OperatingHours (hydration-safe) ───────────────────── */
function OperatingHours() {
  const [label, setLabel]   = useState<string>('')
  const [isOpen, setIsOpen] = useState<boolean | null>(null)

  useEffect(() => {
    const tz = 'Europe/Lisbon'
    function update() {
      const now = new Date()
      const day = new Intl.DateTimeFormat('pt-PT', { weekday: 'short', timeZone: tz }).format(now)
      const time = new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(now)
      setLabel(`${day.replace('.', '')} · ${time}`)
      try {
        const h = parseInt(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: tz }).format(now), 10)
        setIsOpen(!isNaN(h) && h >= 11 && h < 23)
      } catch { setIsOpen(false) }
    }
    update()
    const t = setInterval(update, 30_000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-black/55 text-sm font-medium tabular-nums">{label || '—'}</span>
      {isOpen !== null && (
        <span className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide px-2.5 py-1 rounded-lg border ${
          isOpen
            ? 'bg-green-100 border-green-400 text-green-700'
            : 'bg-red-100  border-red-400  text-red-700'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
          {isOpen ? 'Aberto' : 'Fechado'}
        </span>
      )}
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────── */
export default function Home() {
  return (
    <main className="w-full max-w-full overflow-x-hidden bg-buns-cream">

      {/* ══════════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════════ */}
      <section className="bg-black border-b-4 border-buns-yellow">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-10 pb-12 sm:pt-14 sm:pb-16">

          {/* Tag */}
          <div className="inline-flex items-center gap-1.5 bg-buns-yellow text-black text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mb-6">
            🔥 Smash Burgers · Ericeira
          </div>

          {/* Main title */}
          <h1
            className="font-display text-white uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(3.5rem, 16vw, 9rem)' }}
          >
            BUNS<br />
            <span className="text-buns-yellow">Smash</span><br />
            Burgers
          </h1>

          {/* Sub-line */}
          <p className="mt-5 text-white/50 text-base sm:text-lg font-medium max-w-md">
            Ericeira · Smash burgers · Takeaway
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-sm">
            <Link
              href="/menu"
              className="flex-1 py-5 bg-buns-yellow text-black font-black text-lg uppercase tracking-wide rounded-2xl border-2 border-buns-yellow text-center active:scale-[0.98] transition"
            >
              Pedir agora →
            </Link>
            <a
              href="#aventuras"
              className="flex-1 py-5 bg-white/8 text-white font-black text-base uppercase tracking-wide rounded-2xl border-2 border-white/15 text-center active:scale-[0.98] transition hover:bg-white/12"
            >
              Ver aventuras
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          2. QUICK ORDER STRIP
      ══════════════════════════════════════════════════ */}
      <section className="bg-buns-yellow border-b-2 border-black/10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-5">
            {[
              { n: '1', label: 'Escolhe', sub: 'os teus favoritos' },
              { n: '2', label: 'Finaliza', sub: 'o checkout em segundos' },
              { n: '3', label: 'Acompanha', sub: 'o estado em tempo real' },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-10 h-10 rounded-full bg-black text-buns-yellow font-black text-lg flex items-center justify-center mx-auto mb-2">
                  {s.n}
                </div>
                <p className="font-black text-black text-sm uppercase tracking-wide leading-tight">{s.label}</p>
                <p className="text-black/55 text-xs mt-0.5 leading-snug hidden sm:block">{s.sub}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/menu"
              className="inline-block px-8 py-3 bg-black text-buns-yellow font-black text-sm uppercase tracking-wide rounded-xl active:scale-[0.98] transition"
            >
              Abrir o menu →
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          3. ADVENTURES
      ══════════════════════════════════════════════════ */}
      <section id="aventuras" className="bg-black border-b-4 border-buns-yellow">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-10 pb-12">

          {/* Section heading */}
          <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-buns-yellow text-black text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mb-3">
                📲 BUNS & Bunana Adventures
              </div>
              <p
                className="font-display text-white uppercase leading-none"
                style={{ fontSize: 'clamp(1.8rem, 6vw, 3.5rem)' }}
              >
                As aventuras mais<br className="sm:hidden" /> caóticas<br className="hidden sm:block" /> da Ericeira.
              </p>
            </div>
            <a
              href="https://www.instagram.com/buns.ericeira"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-5 py-2.5 bg-white/10 text-white font-black text-sm uppercase tracking-wide rounded-xl border border-white/15 hover:bg-white/15 transition"
            >
              Instagram →
            </a>
          </div>

          {/* Video cards — horizontal scroll on mobile */}
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
            {ADVENTURES.map(({ ep, src }) => (
              <div
                key={ep}
                className="shrink-0 w-[62vw] sm:w-auto snap-start rounded-2xl overflow-hidden border-2 border-white/10 bg-black relative"
                style={{ aspectRatio: '9/16' }}
              >
                <video
                  src={src}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <span className="inline-flex items-center gap-1 bg-buns-yellow text-black text-[10px] font-black uppercase px-2 py-1 rounded-md">
                    Ep. {ep}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          4. MENU HIGHLIGHTS
      ══════════════════════════════════════════════════ */}
      <section className="bg-buns-cream">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-10 pb-10">

          {/* Heading */}
          <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-black text-buns-yellow text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mb-3">
                🍔 O Menu
              </div>
              <p
                className="font-display text-black uppercase leading-none"
                style={{ fontSize: 'clamp(1.8rem, 6vw, 3.5rem)' }}
              >
                Os favoritos<br className="sm:hidden" /> da BUNS.
              </p>
            </div>
            <Link
              href="/menu"
              className="shrink-0 px-5 py-2.5 bg-black text-buns-yellow font-black text-sm uppercase tracking-wide rounded-xl"
            >
              Ver menu completo →
            </Link>
          </div>

          {/* Cards — 2 col on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {HIGHLIGHTS.map((item) => (
              <Link
                key={item.name}
                href="/menu"
                className="bg-white border-2 border-black rounded-2xl overflow-hidden active:scale-[0.97] transition block"
              >
                {/* Accent stripe */}
                <div className="h-[6px] bg-buns-yellow" />
                <div className="p-4 space-y-2">
                  {/* Tag */}
                  {item.tag && (
                    <span className={`inline-block text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md border ${
                      item.tag === 'bestseller' ? 'bg-yellow-100 text-yellow-800 border-yellow-400' :
                      item.tag === 'spicy'      ? 'bg-red-100    text-red-700    border-red-300'    :
                      item.tag === 'novo'       ? 'bg-green-100  text-green-700  border-green-400'  :
                      'bg-black/5 text-black/50 border-black/15'
                    }`}>
                      {item.tag === 'bestseller' ? '⭐ bestseller' :
                       item.tag === 'spicy'      ? '🌶️ spicy'      :
                       item.tag === 'novo'       ? '✨ novo'        : item.tag}
                    </span>
                  )}
                  <p className="text-3xl">{item.emoji}</p>
                  <p className="font-black text-black text-base leading-tight uppercase">
                    {item.name}
                  </p>
                  <p className="text-black/45 text-xs leading-snug">{item.desc}</p>
                  <p className="font-black text-black text-lg tabular-nums pt-1">
                    {currency(item.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          5. LOCATION
      ══════════════════════════════════════════════════ */}
      <section className="bg-black border-t-4 border-buns-yellow">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-10 pb-12">
          <div className="bg-white rounded-3xl overflow-hidden border-2 border-white/0">

            {/* Yellow stripe */}
            <div className="h-2 bg-buns-yellow" />

            <div className="p-6 sm:p-8 space-y-5">
              {/* Heading */}
              <div>
                <div className="inline-flex items-center gap-1.5 bg-black text-buns-yellow text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mb-3">
                  📍 Onde estamos
                </div>
                <p
                  className="font-display text-black uppercase leading-none"
                  style={{ fontSize: 'clamp(1.8rem, 6vw, 3rem)' }}
                >
                  Ericeira.<br />
                  <span className="text-buns-yellow" style={{ fontSize: '70%' }}>Calçada da Baleia 29A</span>
                </p>
              </div>

              {/* Hours + open badge */}
              <div className="bg-buns-cream rounded-2xl px-4 py-4 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-black/35 mb-1">Takeaway</p>
                    <p className="font-black text-black text-sm">Segunda–Domingo · 11:00–23:00</p>
                  </div>
                  <OperatingHours />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-black/35 mb-1">Delivery</p>
                  <p className="text-black/55 text-sm font-medium">🚚 Disponível brevemente</p>
                </div>
              </div>

              {/* Map CTA */}
              <a
                href="https://maps.google.com/?q=BUNS%20Smash%20Burgers%2C%20Cal%C3%A7ada%20da%20Baleia%2029A%2C%20Ericeira"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-4 bg-black text-buns-yellow font-black text-base uppercase tracking-wide rounded-2xl text-center active:scale-[0.98] transition"
              >
                Abrir no Google Maps →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          6. AR
      ══════════════════════════════════════════════════ */}
      <section className="bg-buns-cream border-t-2 border-black/8">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-black rounded-2xl overflow-hidden">
            <div className="px-5 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 bg-buns-yellow text-black text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-2">
                  🕶️ Novo
                </div>
                <p className="font-display text-white uppercase leading-none text-xl sm:text-2xl">
                  Menu em Realidade Aumentada
                </p>
                <p className="text-white/45 text-sm mt-1">
                  Coloca os burgers da BUNS na tua mesa em tamanho real.
                </p>
              </div>
              <Link
                href="/ar"
                className="shrink-0 px-6 py-3 bg-buns-yellow text-black font-black text-sm uppercase tracking-wide rounded-xl active:scale-[0.98] transition"
              >
                Experimentar AR →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          7. EXTRA LINKS (Wall of Fame, Eventos)
      ══════════════════════════════════════════════════ */}
      <section className="bg-buns-cream border-t-2 border-black/8">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pb-8">
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              href="/wall-of-fame"
              className="bg-white border-2 border-black/10 rounded-2xl overflow-hidden active:scale-[0.98] transition block"
            >
              <div className="h-[5px] bg-buns-yellow" />
              <div className="p-5">
                <p className="font-display text-black uppercase text-xl leading-none mb-1">🔥 Wall of Fame</p>
                <p className="text-black/50 text-sm leading-snug">Consegues comer mais do que o campeão? O teu nome pode ficar na história.</p>
              </div>
            </Link>
            <Link
              href="/eventos"
              className="bg-white border-2 border-black/10 rounded-2xl overflow-hidden active:scale-[0.98] transition block"
            >
              <div className="h-[5px] bg-buns-yellow" />
              <div className="p-5">
                <p className="font-display text-black uppercase text-xl leading-none mb-1">🎉 Eventos BUNS</p>
                <p className="text-black/50 text-sm leading-snug">Meetups, quizzes, record nights e eventos especiais. Vê o que está a acontecer.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          8. FOOTER
      ══════════════════════════════════════════════════ */}
      <footer className="bg-black border-t-4 border-buns-yellow px-4 sm:px-6 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-6 mb-8">

            <div>
              <p className="font-display text-buns-yellow uppercase text-3xl leading-none mb-2">BUNS</p>
              <p className="text-white/40 text-sm leading-relaxed">
                Smash burgers na Ericeira.<br />Surf, graffiti e chapa a arder.
              </p>
            </div>

            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-white/35 mb-3">Links</p>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link href="/menu"       className="hover:text-white transition">Menu</Link></li>
                <li><Link href="/cart"       className="hover:text-white transition">Carrinho</Link></li>
                <li><Link href="/account"    className="hover:text-white transition">Conta</Link></li>
                <li><Link href="/como-usar"  className="hover:text-white transition">Como usar</Link></li>
                <li><Link href="/admin/login" className="hover:text-white transition">Área Admin</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-white/35 mb-3">Legal</p>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link href="/privacidade" className="hover:text-white transition">Privacidade</Link></li>
                <li><Link href="/termos"      className="hover:text-white transition">Termos & Condições</Link></li>
                <li><Link href="/cookies"     className="hover:text-white transition">Cookies</Link></li>
              </ul>
            </div>

          </div>

          <div className="border-t border-white/10 pt-5 text-center text-xs text-white/25">
            © {new Date().getFullYear()} BUNS Smash Burgers. Todos os direitos reservados.
          </div>
        </div>
      </footer>

    </main>
  )
}
