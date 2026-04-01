// app/wall-of-fame/page.tsx
import Link from "next/link";
import { Trophy, Flame, Crown, MapPin, Calendar, Beef } from "lucide-react";

/**
 * ► CAMPEÃO ATUAL
 * Garante que o ficheiro da foto existe em /public/champions/…
 */
const CHAMPION = {
  title: "RECORDISTAS ATUAIS",
  names: [
    `Marc “Not Blondie” Weib`,
    `Andrea “Blondie” Teyssedre`,
  ],
  city: "Germany / Madagascar",
  date: "Novo recorde oficial",
  record: 8,
  photo: "/champions/marc-andrea-wall-of-fame.jpg",
  quote:
    "Duas máquinas. Dezasseis carnes. Um novo topo no Wall of Fame. Agora o desafio ficou ainda mais sério.",
  subtitle: "Onde lendas do apetite nascem",
  note: "novo recorde oficial em dupla",
};

/**
 * ► HISTÓRICO DE CAMPEÕES
 */
const PAST_CHAMPIONS = [
  {
    name: `Peter "Big Back" Reinheimer & Brayden "Big Back" Gotsky`,
    city: "Philadelphia / New York",
    date: "Recorde anterior",
    record: 7,
    photo: "/champions/wall-of-fame-duo.jpeg",
    quote:
      "Sete patties cada um. A dupla que dominou o Wall of Fame antes da chegada dos novos reis da chapa.",
  },
  {
    name: `Adam "BIG BOY" Curry`,
    city: "USA / Ericeira",
    date: "3 Dez 2025",
    record: 6,
    photo: "/champions/adam-big-boy.png",
    quote:
      "Seis carnes. Uma missão épica. A crosta perfeita nunca foi tão respeitada. Até alguém igualar... o trono é dele.",
  },
  {
    name: "Daniel Rodrigues",
    city: "Santarém",
    date: "1 Nov 2025",
    record: 4,
    photo: "/champions/daniel.png",
    quote:
      "Quatro carnes. O primeiro a erguer o standard BUNS e a abrir caminho para as próximas lendas.",
  },
];

export const metadata = {
  title: "BUNS • Wall of Fame",
  description:
    "Onde os mais corajosos enfrentam a chapa e entram para a história da BUNS.",
};

export default function WallOfFamePage() {
  return (
    <main className="relative mx-auto max-w-6xl px-4 py-10 sm:py-12">
      {/* BACKDROP */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-[-10%] h-[60vh] w-[120vw] -translate-x-1/2 rounded-[999px] blur-3xl opacity-30"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 50%, rgba(255,136,0,0.8) 0%, rgba(255,51,0,0.6) 35%, rgba(0,0,0,0) 70%)",
          }}
        />
      </div>

      {/* HERO */}
      <header className="text-center space-y-3 sm:space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs sm:text-sm text-white/80">
          <Flame className="h-4 w-4 text-orange-400" />
          Onde lendas do apetite nascem
        </div>

        <h1 className="font-display text-4xl sm:text-6xl leading-tight">
          <span className="text-buns-yellow">BUNS</span>{" "}
          <span className="drop-shadow-[0_2px_12px_rgba(255,136,0,0.25)]">
            WALL OF FAME
          </span>
        </h1>

        <p className="mx-auto max-w-2xl text-white/80 text-base sm:text-lg">
          Entra para a história da BUNS. Bate o recorde de carnes e conquista o
          teu lugar nesta parede lendária. 🍔🔥
        </p>
      </header>

      {/* QUADRO DO CAMPEÃO ATUAL */}
      <section className="mt-8 sm:mt-10">
        <div className="mx-auto max-w-4xl">
          <div className="relative rounded-[28px] p-[2px] bg-gradient-to-br from-yellow-300 via-amber-500 to-orange-600 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            <div className="rounded-[26px] bg-[#170f06]/90 backdrop-blur-sm p-5 sm:p-7 border border-white/10">
              <div className="flex items-center justify-center gap-2 text-amber-300">
                <Crown className="h-5 w-5" />
                <span className="font-semibold tracking-wide">
                  {CHAMPION.title}
                </span>
                <Trophy className="h-5 w-5" />
              </div>

              <div className="mt-5 grid gap-6 md:grid-cols-[1.1fr_1fr] md:items-center">
                {/* FOTO */}
                <div>
                  <div className="relative mx-auto aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-[20px] border border-amber-400/30 shadow-[0_10px_40px_rgba(255,170,0,0.25)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={CHAMPION.photo}
                      alt={`Foto de ${CHAMPION.names.join(" e ")}`}
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute -left-16 top-4 rotate-[-18deg] rounded px-4 py-1 text-sm font-semibold bg-gradient-to-br from-amber-400 to-orange-500 text-black shadow">
                      {CHAMPION.record} patties
                    </div>
                  </div>
                </div>

                {/* DADOS */}
                <div className="text-center md:text-left">
                  <div className="text-xs uppercase tracking-[0.22em] text-white/55">
                    Wall of Fame
                  </div>

                  <h2 className="mt-2 font-display text-2xl sm:text-3xl leading-tight">
                    {CHAMPION.names[0]}
                  </h2>
                  <h3 className="font-display text-xl sm:text-2xl leading-tight text-white/90">
                    {CHAMPION.names[1]}
                  </h3>

                  <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-3 text-white/80">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-amber-300" />
                      {CHAMPION.city}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-amber-300" />
                      {CHAMPION.date}
                    </span>
                  </div>

                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2">
                    <Beef className="h-4 w-4 text-amber-300" />
                    <span className="text-amber-200">
                      {CHAMPION.record} Patties — {CHAMPION.note}
                    </span>
                  </div>

                  <p className="mt-4 text-white/70 text-sm leading-relaxed">
                    {CHAMPION.quote}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6 text-center">
            <p className="text-white/70">
              Achas que consegues bater este recorde?
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              <Link href="/menu" className="btn btn-primary">
                Ir ao Menu
              </Link>
              <Link href="/" className="btn btn-ghost">
                Voltar à página inicial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* REGRAS / NOTAS */}
      <section className="mx-auto mt-10 max-w-3xl">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <h3 className="font-display text-xl sm:text-2xl">Como funciona</h3>
          <ul className="mt-3 list-disc pl-5 text-white/80 space-y-1.5 text-sm sm:text-base">
            <li>O recorde é contado pelo número total de patties/carnes ingeridas.</li>
            <li>O hambúrguer base tem 2 carnes; extras contam para o total.</li>
            <li>Desafios em dupla também entram para o Wall of Fame.</li>
            <li>Válido apenas em loja BUNS Ericeira e sob supervisão da equipa.</li>
            <li>Registo com foto, nome, cidade e data — confirmado pela equipa.</li>
            <li>Em caso de empate, vale o registo mais antigo.</li>
          </ul>
        </div>
      </section>

      {/* HISTÓRICO DE CAMPEÕES */}
      {PAST_CHAMPIONS.length > 0 && (
        <section className="mx-auto mt-8 max-w-6xl">
          <h3 className="font-display text-xl sm:text-2xl mb-4">
            Hall de Campeões
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PAST_CHAMPIONS.map((champ) => (
              <div
                key={champ.name}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex gap-4">
                  <div className="relative w-20 h-24 overflow-hidden rounded-xl border border-white/15 bg-black/40 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={champ.photo}
                      alt={`Foto de ${champ.name}`}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <h4 className="font-semibold text-sm sm:text-base">
                      {champ.name}
                    </h4>

                    <div className="mt-1 text-xs text-white/70 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-amber-300" />
                        <span>{champ.city}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-amber-300" />
                        <span>{champ.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Beef className="h-3 w-3 text-amber-300" />
                        <span>{champ.record} carnes</span>
                      </div>
                    </div>
                  </div>
                </div>

                {champ.quote && (
                  <p className="mt-3 text-xs text-white/60 italic">
                    “{champ.quote}”
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}