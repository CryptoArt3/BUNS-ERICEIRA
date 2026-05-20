import Link from 'next/link'

const CHAMPION = {
  title: 'RECORDISTAS ATUAIS',
  names: [
    `Marc "Not Blondie" Weib`,
    `Andrea "Blondie" Teyssedre`,
  ],
  city: 'Germany / Madagascar',
  date: 'Novo recorde oficial',
  record: 8,
  photo: '/champions/marc-andrea-wall-of-fame.jpg',
  quote:
    'Duas máquinas. Dezasseis carnes. Um novo topo no Wall of Fame. Agora o desafio ficou ainda mais sério.',
  subtitle: 'Onde lendas do apetite nascem',
  note: 'novo recorde oficial em dupla',
}

const PAST_CHAMPIONS = [
  {
    name: `Peter "Big Back" Reinheimer & Brayden "Big Back" Gotsky`,
    city: 'Philadelphia / New York',
    date: 'Recorde anterior',
    record: 7,
    photo: '/champions/wall-of-fame-duo.jpeg',
    quote:
      'Sete patties cada um. A dupla que dominou o Wall of Fame antes da chegada dos novos reis da chapa.',
  },
  {
    name: `Adam "BIG BOY" Curry`,
    city: 'USA / Ericeira',
    date: '3 Dez 2025',
    record: 6,
    photo: '/champions/adam-big-boy.png',
    quote:
      'Seis carnes. Uma missão épica. A crosta perfeita nunca foi tão respeitada. Até alguém igualar... o trono é dele.',
  },
  {
    name: 'Daniel Rodrigues',
    city: 'Santarém',
    date: '1 Nov 2025',
    record: 4,
    photo: '/champions/daniel.png',
    quote:
      'Quatro carnes. O primeiro a erguer o standard BUNS e a abrir caminho para as próximas lendas.',
  },
]

export const metadata = {
  title: 'BUNS • Wall of Fame',
  description:
    'Onde os mais corajosos enfrentam a chapa e entram para a história da BUNS.',
}

export default function WallOfFamePage() {
  return (
    <main className="w-full max-w-full overflow-x-hidden bg-buns-cream">

      {/* ── Hero strip ─────────────────────────────────────── */}
      <div className="bg-black border-b-4 border-buns-yellow px-4 sm:px-6 pt-8 pb-10">
        <div className="max-w-screen-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-buns-yellow text-black text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mb-5">
            🔥 Lendas do apetite
          </div>
          <h1
            className="font-display text-white uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(2.8rem, 14vw, 8rem)' }}
          >
            WALL<br />
            <span className="text-buns-yellow">OF FAME</span>
          </h1>
          <p className="mt-4 text-white/45 text-sm sm:text-base font-medium max-w-md">
            Bate o recorde de carnes e conquista o teu lugar nesta parede lendária. 🍔🔥
          </p>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-8 pb-32 space-y-10">

        {/* ── Current champion card ── */}
        <section>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35 mb-4">
            👑 {CHAMPION.title}
          </p>

          <div className="bg-white border-2 border-black rounded-3xl overflow-hidden">
            {/* Trophy stripe — gradient yellow/amber */}
            <div className="h-2 bg-gradient-to-r from-buns-yellow via-amber-400 to-orange-500" />

            <div className="p-5 sm:p-8">
              <div className="grid md:grid-cols-[1fr_1.1fr] gap-6 md:gap-8 items-start">

                {/* Photo — polaroid style */}
                <div className="relative">
                  <div className="bg-black rounded-2xl overflow-hidden aspect-[4/5] w-full max-w-sm mx-auto border-4 border-buns-yellow shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={CHAMPION.photo}
                      alt={`Foto de ${CHAMPION.names.join(' e ')}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {/* Record badge */}
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center gap-1.5 bg-buns-yellow text-black font-black text-sm px-3 py-1.5 rounded-xl">
                        🥩 {CHAMPION.record} patties
                      </span>
                    </div>
                  </div>
                  {/* Rotated note */}
                  <div className="absolute -top-2 -right-2 rotate-3 bg-black text-buns-yellow font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg">
                    {CHAMPION.note}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35 mb-2">Recordistas</p>
                    <p className="font-display text-black uppercase leading-none"
                       style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)' }}>
                      {CHAMPION.names[0]}
                    </p>
                    <p className="font-display text-black/70 uppercase leading-none mt-1"
                       style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)' }}>
                      {CHAMPION.names[1]}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 bg-black/5 border border-black/15 text-black/60 text-xs font-black uppercase px-3 py-1.5 rounded-lg">
                      📍 {CHAMPION.city}
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-black/5 border border-black/15 text-black/60 text-xs font-black uppercase px-3 py-1.5 rounded-lg">
                      📅 {CHAMPION.date}
                    </span>
                  </div>

                  <div className="bg-buns-yellow/15 border border-buns-yellow/40 rounded-2xl px-4 py-3">
                    <p className="font-black text-black text-sm uppercase tracking-wide mb-1">🏆 Recorde</p>
                    <p className="font-display text-black uppercase leading-none text-3xl">{CHAMPION.record} Patties</p>
                    <p className="text-black/50 text-xs mt-1 uppercase tracking-wide font-bold">{CHAMPION.note}</p>
                  </div>

                  <blockquote className="border-l-4 border-buns-yellow pl-4">
                    <p className="text-black/65 text-sm leading-relaxed italic">"{CHAMPION.quote}"</p>
                  </blockquote>
                </div>
              </div>
            </div>
          </div>

          {/* Challenge CTA */}
          <div className="mt-5 bg-black rounded-2xl px-5 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/70 text-sm text-center sm:text-left">
              Achas que consegues bater este recorde?<br />
              <span className="text-white font-black">{CHAMPION.record} patties. Conta até abrir a boca.</span>
            </p>
            <div className="flex gap-2 shrink-0">
              <Link
                href="/menu"
                className="px-6 py-3 bg-buns-yellow text-black font-black text-sm uppercase tracking-wide rounded-xl active:scale-[0.98] transition"
              >
                Ir ao Menu →
              </Link>
              <Link
                href="/"
                className="px-4 py-3 bg-white/10 border border-white/15 text-white/60 font-black text-sm uppercase tracking-wide rounded-xl active:scale-[0.98] transition"
              >
                Início
              </Link>
            </div>
          </div>
        </section>

        {/* ── Rules ── */}
        <section>
          <div className="bg-white border-2 border-black/10 rounded-3xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 bg-black">
              <h2 className="font-black text-white uppercase tracking-wide text-sm">Como funciona</h2>
            </div>
            <div className="p-5">
              <ul className="space-y-3">
                {[
                  'O recorde é contado pelo número total de patties/carnes ingeridas.',
                  'O hambúrguer base tem 2 carnes; extras contam para o total.',
                  'Desafios em dupla também entram para o Wall of Fame.',
                  'Válido apenas em loja BUNS Ericeira e sob supervisão da equipa.',
                  'Registo com foto, nome, cidade e data — confirmado pela equipa.',
                  'Em caso de empate, vale o registo mais antigo.',
                ].map((rule, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-black/65 leading-snug">
                    <span className="w-6 h-6 rounded-full bg-buns-yellow text-black font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Past champions ── */}
        {PAST_CHAMPIONS.length > 0 && (
          <section>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35 mb-4">
              🏅 Hall de Campeões
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PAST_CHAMPIONS.map((champ, idx) => (
                <div
                  key={champ.name}
                  className="bg-white border-2 border-black/10 rounded-2xl overflow-hidden"
                  style={{ transform: idx % 2 === 1 ? 'rotate(0.5deg)' : 'rotate(-0.5deg)' }}
                >
                  {/* Polaroid photo */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={champ.photo}
                      alt={`Foto de ${champ.name}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-2 left-2">
                      <span className="bg-buns-yellow text-black font-black text-xs px-2 py-1 rounded-lg">
                        🥩 {champ.record} patties
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <p className="font-black text-black text-sm leading-tight">{champ.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-black uppercase text-black/45">📍 {champ.city}</span>
                      <span className="text-[10px] font-black uppercase text-black/45">· {champ.date}</span>
                    </div>
                    {champ.quote && (
                      <p className="text-xs text-black/50 leading-snug italic border-l-2 border-buns-yellow pl-2 mt-2">
                        "{champ.quote}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
