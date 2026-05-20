'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'

type EventStatus = 'upcoming' | 'past'

type BunsEvent = {
  id: string
  title: string
  subtitle?: string
  date: string
  weekday: string
  time: string
  location: string
  category: string
  status: EventStatus
  description: string
  highlight?: boolean
  flyerSrc?: string
  rules?: string[]
  ctaLabel?: string
  ctaHref?: string
}

const WHATSAPP_NUMBER = '351912607829'
const whatsappLink = (text: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`

const EVENTS: BunsEvent[] = [
  {
    id: 'buns-chess-tournament-feb-21',
    title: 'Torneio de Xadrez – BUNS',
    subtitle: '12 jogadores • vagas limitadas • taça para o campeão',
    date: 'Feb 21',
    weekday: 'Saturday',
    time: '15:00 – 18:00',
    location: 'BUNS Smash Burgers, Ericeira',
    category: 'Xadrez • Comunidade',
    status: 'upcoming',
    highlight: true,
    flyerSrc: '/events/torneio-xadrez-buns-flyer.jpg',
    description:
      'Torneio casual e bem organizado para a comunidade: 12 vagas, 4 mesas, jogos rápidos e final para decidir o campeão. Ideal para competir, conviver e comer smash burgers entre rondas.',
    rules: [
      '12 jogadores (vagas limitadas) • inscrição obrigatória por WhatsApp',
      '4 mesas em simultâneo • 4 jogos garantidos por jogador',
      'Tempo: 20 min por partida (10 min por jogador, sem incremento) + troca rápida',
      'Pontuação: vitória = 1 • empate = 0,5 • derrota = 0',
      'Final: 1º vs 2º no ranking (partida única) • vencedor leva a taça BUNS',
      'Fair play: sem ajuda externa • toque = joga • ambiente descontraído (não federado)',
    ],
    ctaLabel: 'Quero participar',
    ctaHref: whatsappLink(
      'Olá BUNS! Quero participar no Torneio de Xadrez (21 de fevereiro, 15h–18h). O meu nome é: _____.',
    ),
  },
  {
    id: 'smashed-coin-meetup',
    title: 'SMASHED COIN – Crypto Meet Up',
    subtitle: 'From Bitcoin maxis to degens, let\'s connect!',
    date: 'Dec 09',
    weekday: 'Tuesday',
    time: '2:30 pm – 5:00 pm',
    location: 'BUNS Smash Burgers, Ericeira',
    category: 'Crypto • Community',
    status: 'upcoming',
    highlight: false,
    flyerSrc: '/events/smashed-coin-meetup-flyer.jpg',
    description:
      'Crypto humans + smash burgers + tu. Um meet up descontraído para falar de Bitcoin, altcoins, builders e tudo o que mexe no mundo cripto – com a chapa BUNS a trabalhar em background.',
    ctaLabel: 'Quero participar',
    ctaHref: whatsappLink(
      'Olá BUNS! Quero participar no SMASHED COIN – Crypto Meet Up. O meu nome é: _____.',
    ),
  },
]

/* ── Event type showcase ─────────────────────────────────── */
const EVENT_TYPES = [
  { emoji: '♟️', label: 'Torneios',      sub: 'Xadrez, gaming, challenges' },
  { emoji: '₿',  label: 'Crypto Meetups', sub: 'Bitcoin, Web3, builders' },
  { emoji: '🎵', label: 'Noites Temáticas', sub: 'DJs, playlists, vibes' },
  { emoji: '🏆', label: 'Record Nights', sub: 'Wall of Fame ao vivo' },
]

export default function EventosPage() {
  const [search, setSearch] = useState('')

  const filteredEvents = useMemo(() => {
    if (!search.trim()) return EVENTS
    const term = search.toLowerCase()
    return EVENTS.filter((ev) =>
      [ev.title, ev.subtitle, ev.location, ev.category, ev.description, ev.weekday, ev.date, ev.time]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [search])

  const highlight = filteredEvents.find((e) => e.highlight)
  const others = filteredEvents.filter((e) => !e.highlight)

  return (
    <main className="w-full max-w-full overflow-x-hidden bg-buns-cream">

      {/* ── Hero strip ─────────────────────────────────────── */}
      <div className="bg-black border-b-4 border-buns-yellow px-4 sm:px-6 pt-8 pb-10">
        <div className="max-w-screen-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-buns-yellow text-black text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mb-5">
            🎉 Eventos na BUNS
          </div>
          <h1
            className="font-display text-white uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(3rem, 13vw, 7.5rem)' }}
          >
            BUNS<br />
            <span className="text-buns-yellow">Events</span>
          </h1>
          <p className="mt-4 text-white/45 text-sm sm:text-base font-medium max-w-md">
            Crypto meetups, torneios, quizzes e noites temáticas. A comunidade da Ericeira em volta da chapa.
          </p>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-8 pb-32 space-y-8">

        {/* ── Event types strip ── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {EVENT_TYPES.map((t) => (
            <div key={t.label} className="bg-white border-2 border-black/8 rounded-2xl p-4 text-center">
              <p className="text-3xl mb-2">{t.emoji}</p>
              <p className="font-black text-black text-sm uppercase tracking-wide leading-tight">{t.label}</p>
              <p className="text-black/45 text-xs mt-1 leading-snug">{t.sub}</p>
            </div>
          ))}
        </section>

        {/* ── Search ── */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35">
              Todos os eventos
            </p>
            <div className="relative w-full sm:w-72">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/30 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Pesquisar eventos…"
                className="w-full rounded-xl bg-white border-2 border-black/15 focus:border-black pl-9 pr-3 py-2.5 text-sm outline-none text-black placeholder:text-black/30 font-medium transition"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* ── Featured event ── */}
        {highlight && (
          <section>
            <div className="bg-white border-2 border-black rounded-3xl overflow-hidden">
              {/* Yellow gradient stripe */}
              <div className="h-2 bg-gradient-to-r from-buns-yellow via-amber-400 to-orange-500" />

              <div className="p-5 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div className="inline-flex items-center gap-2 bg-buns-yellow text-black text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg">
                    🔥 Próximo evento em destaque
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wide text-black/40 bg-black/5 border border-black/10 px-2.5 py-1 rounded-lg">
                    {highlight.category}
                  </span>
                </div>

                <div className="grid sm:grid-cols-[2fr_1.4fr] gap-6 sm:gap-8 items-start">
                  {/* Info */}
                  <div className="space-y-4">
                    <div>
                      <p className="font-display text-black uppercase leading-none"
                         style={{ fontSize: 'clamp(1.6rem, 5vw, 2.5rem)' }}>
                        {highlight.title}
                      </p>
                      {highlight.subtitle && (
                        <p className="text-black/60 text-sm mt-2 font-medium">{highlight.subtitle}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { icon: '📅', text: `${highlight.date} (${highlight.weekday})` },
                        { icon: '🕒', text: highlight.time },
                        { icon: '📍', text: highlight.location },
                      ].map(({ icon, text }) => (
                        <div key={text} className="flex items-center gap-2 text-sm text-black/65 font-medium">
                          <span>{icon}</span>
                          <span>{text}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-black/60 text-sm leading-relaxed">{highlight.description}</p>

                    {/* Rules */}
                    {highlight.rules?.length ? (
                      <div className="bg-buns-cream rounded-2xl p-4 space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-widest text-black/35 mb-3">
                          Regras rápidas
                        </p>
                        <ul className="space-y-2">
                          {highlight.rules.map((r) => (
                            <li key={r} className="flex gap-2 text-sm text-black/60 leading-snug">
                              <span className="w-2 h-2 rounded-full bg-buns-yellow shrink-0 mt-1.5" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {/* CTA */}
                    {highlight.ctaHref && (
                      <div className="space-y-2">
                        <a
                          href={highlight.ctaHref}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-4 bg-black text-buns-yellow font-black text-base uppercase tracking-wide rounded-2xl active:scale-[0.98] transition"
                        >
                          💬 {highlight.ctaLabel ?? 'Quero participar'}
                        </a>
                        <p className="text-xs text-black/35 text-center">
                          Clica para abrir WhatsApp e garantir a tua vaga.
                        </p>
                        <p className="text-xs text-black/35 text-center">
                          Evento casual (não federado). Fair play sempre.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Flyer */}
                  <div className="relative min-h-[240px] rounded-2xl border-2 border-black/10 bg-black/5 overflow-hidden flex items-center justify-center">
                    {highlight.flyerSrc ? (
                      <Image
                        src={highlight.flyerSrc}
                        alt={`Flyer do evento ${highlight.title} na BUNS`}
                        fill
                        className="object-contain p-3"
                        priority
                      />
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-4xl mb-2">🏆</p>
                        <p className="text-sm text-black/40">Flyer em breve.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Other events grid ── */}
        {others.length > 0 && (
          <section>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35 mb-4">
              Mais eventos
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((ev) => (
                <article
                  key={ev.id}
                  className="bg-white border-2 border-black/8 rounded-2xl overflow-hidden flex flex-col"
                >
                  <div className="h-[5px] bg-buns-yellow" />
                  <div className="p-5 flex-1 space-y-3">
                    <div>
                      <p className="font-black text-black text-base leading-tight">{ev.title}</p>
                      {ev.subtitle && (
                        <p className="text-black/50 text-xs mt-1">{ev.subtitle}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {[
                        { icon: '📅', text: `${ev.date} (${ev.weekday})` },
                        { icon: '🕒', text: ev.time },
                        { icon: '📍', text: ev.location },
                      ].map(({ icon, text }) => (
                        <p key={text} className="flex items-center gap-2 text-xs text-black/50 font-medium">
                          <span>{icon}</span><span>{text}</span>
                        </p>
                      ))}
                    </div>

                    <p className="text-xs text-black/55 leading-snug">{ev.description}</p>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wide text-black/40 bg-black/5 border border-black/10 px-2 py-1 rounded-md">
                        {ev.category}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-md ${
                        ev.status === 'upcoming'
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-black/5 text-black/40 border border-black/10'
                      }`}>
                        {ev.status === 'upcoming' ? '● Próximo' : 'Passado'}
                      </span>
                    </div>
                  </div>

                  {ev.ctaHref && (
                    <div className="px-5 pb-5">
                      <a
                        href={ev.ctaHref}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-black text-buns-yellow font-black text-sm uppercase tracking-wide rounded-xl active:scale-[0.98] transition"
                      >
                        💬 {ev.ctaLabel ?? 'Quero participar'}
                      </a>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ── Empty state ── */}
        {filteredEvents.length === 0 && (
          <div className="bg-white border-2 border-black/8 rounded-2xl p-8 text-center">
            <p className="text-3xl mb-2">🔍</p>
            <p className="font-black text-black text-base">Não encontrámos eventos.</p>
            <p className="text-black/45 text-sm mt-1">Tenta outra palavra (ex.: "xadrez", "crypto"…)</p>
          </div>
        )}

        {/* ── Organise your event CTA ── */}
        <section className="bg-black rounded-3xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-buns-yellow via-amber-400 to-orange-500" />
          <div className="px-6 py-7 sm:px-8 sm:py-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 bg-buns-yellow text-black text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mb-3">
                💡 Organiza um evento
              </div>
              <p className="font-display text-white uppercase leading-none text-xl sm:text-2xl">
                Traz a tua ideia<br />para a BUNS.
              </p>
              <p className="text-white/45 text-sm mt-2 leading-snug max-w-sm">
                Crypto, gaming, arte, comunidade — fala connosco em loja ou por WhatsApp e bora tirar ideias do papel.
              </p>
            </div>
            <a
              href={whatsappLink('Olá BUNS! Tenho uma ideia para um evento na BUNS. Posso falar convosco?')}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 px-6 py-4 bg-buns-yellow text-black font-black text-sm uppercase tracking-wide rounded-2xl active:scale-[0.98] transition"
            >
              💬 Falar no WhatsApp →
            </a>
          </div>
        </section>

      </div>
    </main>
  )
}
