// app/wall-of-fame/page.tsx
import Link from "next/link";
import { Trophy, Flame, Crown, MapPin, Calendar, Beef } from "lucide-react";

/**
 * ► EDITA AQUI OS DADOS DO CAMPEÃO
 * Troca a imagem por um ficheiro teu em /public (ex.: /champions/tiago.jpg)
 */
const CHAMPION = {
  name: "Daniel Rodrigues",
  city: "Santarem",
  date: "1 Nov 2025",
  record: 4, // número de carnes
  photo: "/champions/daniel.png", // coloca o teu caminho (ex.: /champions/tiago.jpg)
};

export const metadata = {
  title: "BUNS • Wall of Fame",
  description:
    "Onde os mais corajosos enfrentam a chapa e entram para a história da BUNS.",
};

export default function WallOfFamePage() {
  return (
    <main className="relative mx-auto max-w-6xl px-4 py-10 sm:py-12">
      {/* BACKDROP — gradiente quente + brilho suave */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-10%] h-[60vh] w-[120vw] -translate-x-1/2 rounded-[999px] blur-3xl opacity-30"
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
        <div className="mx-auto max-w-3xl">
          <div className="relative rounded-[28px] p-[2px] bg-gradient-to-br from-yellow-300 via-amber-500 to-orange-600 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            {/* Moldura interior */}
            <div className="rounded-[26px] bg-[#170f06]/90 backdrop-blur-sm p-5 sm:p-7 border border-white/10">
              <div className="flex items-center justify-center gap-2 text-amber-300">
                <Crown className="h-5 w-5" />
                <span className="font-semibold tracking-wide">
                  CAMPEÃO ATUAL
                </span>
                <Trophy className="h-5 w-5" />
              </div>

              <div className="mt-5 grid gap-6 sm:grid-cols-2 sm:items-center">
                {/* FOTO */}
                <div className="order-2 sm:order-1">
                  <div className="relative mx-auto aspect-[4/5] w-full max-w-[360px] overflow-hidden rounded-[20px] border border-amber-400/30 shadow-[0_10px_40px_rgba(255,170,0,0.25)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={CHAMPION.photo}
                      alt={`Foto de ${CHAMPION.name}`}
                      className="h-full w-full object-cover"
                    />
                    {/* Fita diagonal */}
                    <div className="absolute -left-20 top-4 rotate-[-18deg] rounded px-4 py-1 text-sm font-semibold bg-gradient-to-br from-amber-400 to-orange-500 text-black shadow">
                      RECORD: {CHAMPION.record} carnes
                    </div>
                  </div>
                </div>

                {/* DADOS */}
                <div className="order-1 sm:order-2 text-center sm:text-left">
                  <h2 className="font-display text-2xl sm:text-3xl">
                    {CHAMPION.name}
                  </h2>

                  <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-white/80">
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
                      {CHAMPION.record} carnes — recorde oficial
                    </span>
                  </div>

                  <p className="mt-4 text-white/70 text-sm leading-relaxed">
                    “Duas carnes do hambúrguer original + duas extras. Crosta na
                    chapa, garra e respeito ao pão. Até alguém subir a fasquia,
                    o trono é dele.” 🔥
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
            <li>O recorde é contado pelo número total de carnes ingeridas.</li>
            <li>O hambúrguer base tem 2 carnes; extras contam para o total.</li>
            <li>Válido apenas em loja BUNS Ericeira e sob supervisão da equipa.</li>
            <li>Registo com foto, nome, cidade e data — confirmado pela equipa.</li>
            <li>Em caso de empate, vale o registo mais antigo.</li>
          </ul>
        </div>
      </section>

      {/* (Opcional) Histórico — ativa quando quiseres
      <section className="mx-auto mt-8 max-w-6xl">
        <h3 className="font-display text-xl sm:text-2xl mb-4">Hall de Campeões</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/70 text-sm">Em breve…</div>
            </div>
          ))}
        </div>
      </section>
      */}
    </main>
  );
}
