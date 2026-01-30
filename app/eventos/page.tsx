"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  Tag,
  Flame,
  Trophy,
  MessageCircle,
  ListChecks,
} from "lucide-react";

type EventStatus = "upcoming" | "past";

type BunsEvent = {
  id: string;
  title: string;
  subtitle?: string;
  date: string;
  weekday: string;
  time: string;
  location: string;
  category: string;
  status: EventStatus;
  description: string;
  highlight?: boolean;

  flyerSrc?: string;
  rules?: string[];
  ctaLabel?: string;
  ctaHref?: string;
};

const WHATSAPP_NUMBER = "351912607829";
const whatsappLink = (text: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

const EVENTS: BunsEvent[] = [
  {
    id: "buns-chess-tournament-feb-21",
    title: "Torneio de Xadrez – BUNS",
    subtitle: "12 jogadores • vagas limitadas • taça para o campeão",
    date: "Feb 21",
    weekday: "Saturday",
    time: "15:00 – 18:00",
    location: "BUNS Smash Burgers, Ericeira",
    category: "Xadrez • Comunidade",
    status: "upcoming",
    highlight: true,
    flyerSrc: "/events/torneio-xadrez-buns-flyer.jpg",
    description:
      "Torneio casual e bem organizado para a comunidade: 12 vagas, 4 mesas, jogos rápidos e final para decidir o campeão. Ideal para competir, conviver e comer smash burgers entre rondas.",
    rules: [
      "12 jogadores (vagas limitadas) • inscrição obrigatória por WhatsApp",
      "4 mesas em simultâneo • 4 jogos garantidos por jogador",
      "Tempo: 20 min por partida (10 min por jogador, sem incremento) + troca rápida",
      "Pontuação: vitória = 1 • empate = 0,5 • derrota = 0",
      "Final: 1º vs 2º no ranking (partida única) • vencedor leva a taça BUNS",
      "Fair play: sem ajuda externa • toque = joga • ambiente descontraído (não federado)",
    ],
    ctaLabel: "Quero participar",
    ctaHref: whatsappLink(
      "Olá BUNS! Quero participar no Torneio de Xadrez (21 de fevereiro, 15h–18h). O meu nome é: _____."
    ),
  },
  {
    id: "smashed-coin-meetup",
    title: "SMASHED COIN – Crypto Meet Up",
    subtitle: "From Bitcoin maxis to degens, let's connect!",
    date: "Dec 09",
    weekday: "Tuesday",
    time: "2:30 pm – 5:00 pm",
    location: "BUNS Smash Burgers, Ericeira",
    category: "Crypto • Community",
    status: "upcoming",
    highlight: false,
    flyerSrc: "/events/smashed-coin-meetup-flyer.jpg",
    description:
      "Crypto humans + smash burgers + tu. Um meet up descontraído para falar de Bitcoin, altcoins, builders e tudo o que mexe no mundo cripto – com a chapa BUNS a trabalhar em background.",
    ctaLabel: "Quero participar",
    ctaHref: whatsappLink(
      "Olá BUNS! Quero participar no SMASHED COIN – Crypto Meet Up. O meu nome é: _____."
    ),
  },
];

export default function EventosPage() {
  const [search, setSearch] = useState("");

  const filteredEvents = useMemo(() => {
    if (!search.trim()) return EVENTS;
    const term = search.toLowerCase();
    return EVENTS.filter((ev) =>
      [
        ev.title,
        ev.subtitle,
        ev.location,
        ev.category,
        ev.description,
        ev.weekday,
        ev.date,
        ev.time,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [search]);

  const highlight = filteredEvents.find((e) => e.highlight);
  const others = filteredEvents.filter((e) => !e.highlight);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-12 space-y-10">
      {/* HERO */}
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs sm:text-sm text-white/80">
          <Flame className="h-4 w-4 text-orange-400" />
          Eventos & meet ups na BUNS
        </div>

        <h1 className="font-display text-4xl sm:text-6xl leading-tight">
          <span className="text-buns-yellow">BUNS</span>{" "}
          <span className="drop-shadow-[0_2px_12px_rgba(255,136,0,0.25)]">
            Events
          </span>
        </h1>

        <p className="mx-auto max-w-2xl text-white/80 text-base sm:text-lg">
          Crypto meet ups, torneios, quizzes e noites temáticas. Aqui encontras
          tudo o que está a acontecer na BUNS Ericeira.
        </p>
      </section>

      {/* SEARCH */}
      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-lg sm:text-xl">
            Explora os eventos
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Pesquisar eventos (ex: xadrez, crypto, fevereiro)…"
              className="w-full rounded-full bg-white/5 border border-white/15 pl-9 pr-3 py-2 text-sm outline-none focus:border-buns-yellow/70 focus:ring-1 focus:ring-buns-yellow/60"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <p className="text-xs text-white/60">
          Dica: podes pesquisar por nome, tipo de evento, mês, local, etc.
        </p>
      </section>

      {/* HIGHLIGHTED EVENT */}
      {highlight && (
        <section>
          <div className="rounded-[28px] border border-yellow-400/40 bg-black/60 shadow-buns p-[2px] bg-gradient-to-br from-yellow-300 via-amber-500 to-orange-600">
            <div className="rounded-[26px] bg-[#120c05]/95 p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 border border-yellow-400/40 text-xs sm:text-sm text-yellow-200">
                  <Flame className="h-4 w-4 text-yellow-300" />
                  Próximo evento em destaque
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-white/70">
                  <Tag className="h-4 w-4 text-yellow-300" />
                  {highlight.category}
                </div>
              </div>

              <div className="mt-5 grid gap-6 sm:grid-cols-[2fr,1.3fr] sm:items-start">
                {/* Info */}
                <div className="space-y-3">
                  <h2 className="font-display text-2xl sm:text-3xl">
                    {highlight.title}
                  </h2>

                  {highlight.subtitle && (
                    <p className="text-white/80 text-sm sm:text-base">
                      {highlight.subtitle}
                    </p>
                  )}

                  <div className="mt-2 space-y-1 text-sm text-white/85">
                    <p className="flex flex-wrap items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber-300" />
                      <span>
                        {highlight.date} ({highlight.weekday})
                      </span>
                    </p>
                    <p className="flex flex-wrap items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-300" />
                      <span>{highlight.time}</span>
                    </p>
                    <p className="flex flex-wrap items-center gap-2">
                      <MapPin className="h-4 w-4 text-amber-300" />
                      <span>{highlight.location}</span>
                    </p>
                  </div>

                  <p className="mt-3 text-sm text-white/75 leading-relaxed">
                    {highlight.description}
                  </p>

                  {/* Rules */}
                  {highlight.rules?.length ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <ListChecks className="h-4 w-4 text-buns-yellow" />
                        Regras rápidas
                      </div>
                      <ul className="mt-3 space-y-2 text-sm text-white/75">
                        {highlight.rules.map((r) => (
                          <li key={r} className="flex gap-2">
                            <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-buns-yellow shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {/* CTA */}
                  {highlight.ctaHref && (
                    <div className="pt-2">
                      <a
                        href={highlight.ctaHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-buns-yellow text-black font-semibold px-5 py-2.5 text-sm hover:brightness-110 transition"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {highlight.ctaLabel ?? "Quero participar"}
                      </a>
                      <p className="mt-2 text-xs text-white/60">
                        Clica para abrir WhatsApp e garantir a tua vaga.
                      </p>
                    </div>
                  )}

                  <p className="mt-2 text-xs text-white/60">
                    Nota: evento casual (não federado). Fair play sempre.
                  </p>
                </div>

                {/* Flyer */}
                <div className="relative min-h-[240px] rounded-2xl border border-yellow-300/40 bg-black/80 overflow-hidden flex items-center justify-center">
                  {highlight.flyerSrc ? (
                    <Image
                      src={highlight.flyerSrc}
                      alt={`Flyer do evento ${highlight.title} na BUNS`}
                      fill
                      className="object-contain p-3"
                      priority
                    />
                  ) : (
                    <div className="p-6 text-center text-white/70">
                      <Trophy className="mx-auto h-8 w-8 text-yellow-300" />
                      <p className="mt-3 text-sm">
                        Flyer em breve (substitui aqui quando tiveres a imagem).
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* OTHER EVENTS */}
      <section className="space-y-3">
        <h2 className="font-display text-lg sm:text-xl">Todos os eventos</h2>

        {filteredEvents.length === 0 ? (
          <p className="text-sm text-white/60">
            Não encontrámos eventos com esse termo. Tenta outra palavra (ex.:
            &quot;xadrez&quot;, &quot;crypto&quot;…).
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((ev) => (
              <article
                key={ev.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm sm:text-base">
                    {ev.title}
                  </h3>

                  {ev.subtitle && (
                    <p className="text-xs text-white/70">{ev.subtitle}</p>
                  )}

                  <div className="text-[11px] text-white/70 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-buns-yellow" />
                      {ev.date} ({ev.weekday})
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-buns-yellow" />
                      {ev.time}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-buns-yellow" />
                      {ev.location}
                    </p>
                  </div>

                  <p className="mt-2 text-xs text-white/75">{ev.description}</p>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/15 px-2 py-0.5 text-white/75">
                    <Tag className="h-3 w-3 text-buns-yellow" />
                    {ev.category}
                  </span>
                  <span className="uppercase tracking-wide text-white/50">
                    {ev.status === "upcoming" ? "upcoming" : "past"}
                  </span>
                </div>

                {ev.ctaHref && (
                  <a
                    href={ev.ctaHref}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-white/10 border border-white/15 text-white px-4 py-2 text-xs hover:border-buns-yellow/60 hover:bg-white/5 transition"
                  >
                    <MessageCircle className="h-4 w-4 text-buns-yellow" />
                    {ev.ctaLabel ?? "Quero participar"}
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <section className="pt-4 border-t border-white/10 text-center">
        <p className="text-xs sm:text-sm text-white/65">
          Queres organizar um evento na BUNS (crypto, gaming, arte, comunidade)?
          Fala connosco em loja ou por WhatsApp e bora tirar ideias do papel.
        </p>
      </section>
    </main>
  );
}
