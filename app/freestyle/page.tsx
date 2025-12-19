// app/freestyle/page.tsx
import Link from "next/link";
import { Flame, Swords, Trophy, Users, Sparkles } from "lucide-react";

import ArenaTV from "./components/ArenaTV";
import BeatsMiniPlayer from "./components/BeatsMiniPlayer";
import Bracket from "./components/Bracket";
import Leaderboard from "./components/Leaderboard";
import MCCard from "./components/MCCard";
import SignupCTA from "./components/SignupCTA";
import CardRaritiesInfo from "./components/CardRaritiesInfo";
import PrizeBlock from "./components/PrizeBlock";

import { MC_POOL } from "./data/mc.mock";
import { SESSIONS } from "./data/sessions.mock";

// Ajusta estes paths conforme os teus ficheiros reais em /public/media/beats/
const BEATS = [
  {
    title: "BUNS BEAT 01",
    artist: "BUNS Beats",
    tag: "RAW / 140",
    src: "/media/beats/buns-beat-1.mp3",
  },
  {
    title: "BUNS BEAT 02",
    artist: "BUNS Beats",
    tag: "DARK / 128",
    src: "/media/beats/buns-beat-2.mp3",
  },
  {
    title: "BUNS BEAT 03",
    artist: "BUNS Beats",
    tag: "DARK / 128",
    src: "/media/beats/buns-beat-3.mp3",
  },
];

export const metadata = {
  title: "BUNS • Freestyle",
  description:
    "BUNS Freestyle — Arena Mode. Cartas de MCs, bracket, arquivo e leaderboard.",
};

export default function FreestylePage() {
  const activeSession =
    SESSIONS.find((s) => s.status === "LIVE") ??
    SESSIONS.find((s) => s.status === "NEXT") ??
    SESSIONS[0];

  return (
    <main
      id="top"
      className="relative mx-auto max-w-6xl px-4 py-10 sm:py-12 space-y-10"
    >
      {/* BACKDROP */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-[-12%] h-[70vh] w-[140vw] -translate-x-1/2 rounded-[999px] blur-3xl opacity-25"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 50%, rgba(255,200,0,0.75) 0%, rgba(255,80,0,0.55) 35%, rgba(0,0,0,0) 70%)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
      </div>

      {/* TOP BAR */}
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs sm:text-sm text-white/80">
          <Flame className="h-4 w-4 text-orange-400" />
          Arena Mode · Roda · Pressão real · Arquivo vivo
        </div>

        <h1 className="font-display text-4xl sm:text-6xl leading-tight">
          <span className="text-white">BUNS</span>{" "}
          <span className="text-buns-yellow drop-shadow-[0_2px_14px_rgba(255,200,0,0.25)]">
            FREESTYLE
          </span>
        </h1>

        <p className="mx-auto max-w-3xl text-white/80 text-base sm:text-lg leading-relaxed">
          Não é uma página. É um campeonato underground.
          <span className="text-white"> Sem palco. Só roda.</span>
        </p>

        {/* BOTÕES (topo) */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <SignupCTA />
          <Link href="/" className="btn btn-ghost">
            Voltar à Home
          </Link>
        </div>
      </header>

      {/* ARENA TV + BEATS */}
      <section className="space-y-6">
        <ArenaTV session={activeSession} />
        <BeatsMiniPlayer tracks={BEATS} />
      </section>

      {/* TORNEIO FULL WIDTH */}
      <section>
        <Bracket />
      </section>

      {/* LEADERBOARD + ENTRAR NA RODA */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Leaderboard mcs={MC_POOL} />

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-buns-yellow" />
            <h3 className="font-display text-xl">Entrar na Roda</h3>
          </div>

          <p className="mt-2 text-white/75 text-sm sm:text-base leading-relaxed">
            Se fores chamado, estás dentro.
            <span className="text-white"> A arena seleciona.</span>
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <SignupCTA />
            <Link href="/menu" className="btn btn-ghost">
              Ver Menu
            </Link>
          </div>

          <div className="mt-4 text-xs text-white/50">
            MVP: inscrições e perfis reais entram na próxima iteração.
          </div>
        </div>
      </section>

      {/* MC CARDS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-buns-yellow" />
          <h2 className="font-display text-2xl sm:text-3xl">MC Cards</h2>
          <span className="ml-auto inline-flex items-center gap-2 text-xs text-white/60 rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            PROGRESSION READY
          </span>
        </div>

        <p className="text-white/70 text-sm sm:text-base max-w-3xl">
          Cada MC é uma carta. Cada batalha muda estatísticas. Cada vitória muda
          aura. O arquivo vira legado.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MC_POOL.map((mc) => (
            <MCCard key={mc.id} mc={mc as any} />
          ))}
        </div>

        {/* INFO: Raridades / Regras */}
        <CardRaritiesInfo />

        <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <div className="flex items-center gap-2 text-white">
            <Trophy className="h-5 w-5 text-amber-300" />
            <div className="font-semibold">Easter lines</div>
          </div>
          <div className="mt-2 text-white/70 text-sm leading-relaxed">
            “45 segundos mudam tudo.” · “Aqui não há palco.” · “O público está a
            um metro.” · “Quem falha, aprende.”
          </div>
        </div>
      </section>

      {/* PRÉMIO */}
      <section>
        <PrizeBlock />
      </section>

      {/* CTA FINAL (SIMPLIFICADO E ESTÁVEL) */}
<section className="pt-2">
  <div className="relative rounded-3xl border border-white/10 bg-white/5 p-6 overflow-hidden">
    {/* glow suave */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-20"
      style={{
        background:
          "radial-gradient(60% 60% at 50% 30%, rgba(255,200,0,0.35) 0%, rgba(0,0,0,0) 70%)",
      }}
    />

    <div className="relative flex flex-col items-center gap-4 text-center">
      <div className="text-xs tracking-[0.22em] text-white/60">
        FECHO DA ARENA
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {/* Ir para o topo */}
        <a
          href="#top"
          className="
            inline-flex items-center justify-center
            rounded-2xl border border-white/10 bg-black/30
            px-4 py-2 text-sm text-white/70
            hover:bg-black/40 hover:text-white
            transition hover:-translate-y-[1px]
          "
          aria-label="Ir para o topo da página"
        >
          <span className="mr-2">↑</span>
          Ir para o topo
        </a>

        {/* HOME */}
        <Link
          href="/"
          className="
            inline-flex items-center justify-center
            rounded-2xl border border-buns-yellow/30
            bg-buns-yellow/10
            px-4 py-2 text-sm text-amber-100
            hover:bg-buns-yellow/15
            transition hover:-translate-y-[1px]
          "
        >
          Home
        </Link>
      </div>

      <div className="text-xs text-white/55 max-w-2xl">
        A arena fecha, o legado fica. Volta para o topo ou regressa à Home.
      </div>
    </div>
  </div>
</section>


      {/* FOOTER */}
      <footer className="pt-2 text-center text-xs text-white/50 relative">
        © {new Date().getFullYear()} BUNS · BUNS Freestyle — Arena Mode
        <Link
          href="/ericeira"
          aria-label="ericeira"
          className="
            absolute right-2 bottom-2
            px-2 py-1 rounded-lg
            text-[11px] tracking-wide
            text-white/60
            opacity-25
            hover:opacity-90 hover:text-white
            hover:bg-white/5 hover:border hover:border-white/10
            transition
            cursor-pointer
          "
        >
          ericeira · 2025
        </Link>
      </footer>
    </main>
  );
}
