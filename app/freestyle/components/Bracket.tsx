// app/freestyle/components/Bracket.tsx
import { Swords, Trophy, Play } from "lucide-react";

type Match = {
  a: string;
  b: string;
  winner?: string; // opcional (demo)
};

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

export default function Bracket() {
  // DEMO estático — depois ligamos a rounds/sessions reais.
  const quarters: Match[] = [
    { a: "MC NEON", b: "MC RIFT", winner: "MC NEON" },
    { a: "MC STATIC", b: "MC NOISE", winner: "MC STATIC" },
    { a: "MC VANDAL", b: "MC KERNEL", winner: "MC VANDAL" },
    { a: "MC FLUX", b: "MC SHADOW", winner: "MC SHADOW" },
  ];

  const semis: Match[] = [
    { a: "MC NEON", b: "MC STATIC", winner: "MC STATIC" },
    { a: "MC VANDAL", b: "MC SHADOW", winner: "MC SHADOW" },
  ];

  const final: Match = { a: "MC STATIC", b: "MC SHADOW", winner: "MC SHADOW" };

  const champion = final.winner ?? "—";

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 relative overflow-hidden">
      {/* subtle HUD glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(60% 60% at 30% 20%, rgba(255,200,0,0.30) 0%, rgba(0,0,0,0) 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.10] [background-size:100%_10px]"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
        }}
      />

      {/* Header */}
      <div className="relative flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2">
          <Swords className="h-5 w-5 text-buns-yellow" />
          <h3 className="font-display text-xl text-white">Torneio</h3>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-white/70">
            MATCHES: <span className="text-white/90 font-semibold">7/7</span>{" "}
            <span className="text-white/40">·</span> <span className="text-white/60">deduzido</span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-buns-yellow/30 bg-buns-yellow/10 px-3 py-1 text-xs text-amber-100">
            <Trophy className="h-3.5 w-3.5 text-amber-300" />
            Champion: <span className="font-semibold">{champion}</span>
          </div>
        </div>
      </div>

      <p className="relative mt-2 text-sm text-white/60">
        Broadcast bracket em modo demo. Visual “Arena HUD” rápido de ler, forte no olhar, pronto para evoluir com replays por match.
      </p>

      {/* Layout */}
      <div className="relative mt-5 grid gap-4 lg:grid-cols-3">
        {/* QUARTOS */}
        <Stage
          title="QUARTOS"
          subtitle="8 → 4"
          matches={quarters}
          density="dense"
        />

        {/* MEIAS: CENTRADO verticalmente para “ficar como na tua imagem” */}
        <Stage
          title="MEIAS"
          subtitle="4 → 2"
          matches={semis}
          density="centered"
        />

        {/* FINAL: hero card à direita */}
        <FinalHero match={final} />
      </div>

      <div className="relative mt-4 text-xs text-white/40">
        Próximo passo: ligar isto a rounds reais e desbloquear “replay cards” por match (vídeo/clip).
      </div>
    </section>
  );
}

/**
 * density:
 * - dense: lista normal (quartos)
 * - centered: centra verticalmente (meias) para não deixar “buraco feio” no topo
 */
function Stage({
  title,
  subtitle,
  matches,
  density = "dense",
}: {
  title: string;
  subtitle?: string;
  matches: Match[];
  density?: "dense" | "centered";
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-white/10 bg-black/25 p-4",
        // garante altura consistente no desktop para permitir “centrar” as meias
        "lg:min-h-[560px]",
        density === "centered" && "flex flex-col"
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-xs tracking-[0.22em] text-white/60">{title}</div>
        {subtitle ? <div className="text-[11px] text-white/40">{subtitle}</div> : null}
      </div>

      <div
        className={cx(
          "mt-3 space-y-3",
          density === "centered" && "flex-1 flex flex-col justify-center"
        )}
      >
        {matches.map((m, idx) => (
          <MatchCard key={`${title}-${idx}`} match={m} />
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const { a, b, winner } = match;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="space-y-2">
        <PlayerRow name={a} highlight={winner === a} />
        <PlayerRow name={b} highlight={winner === b} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-xs">
          {winner ? (
            <span className="text-amber-200">
              WINNER: <span className="font-semibold">{winner}</span>
            </span>
          ) : (
            <span className="text-white/40">WINNER: —</span>
          )}
        </div>

        {/* botão “REPLAY” (demo, sem ação por agora) */}
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] text-white/70 hover:bg-black/35"
          title="Replay (em breve)"
        >
          <Play className="h-3.5 w-3.5" />
          REPLAY
        </button>
      </div>
    </div>
  );
}

function PlayerRow({ name, highlight }: { name: string; highlight?: boolean }) {
  return (
    <div
      className={cx(
        "flex items-center justify-between rounded-xl border px-3 py-2",
        highlight ? "border-buns-yellow/35 bg-buns-yellow/10" : "border-white/10 bg-black/20"
      )}
    >
      <span className={highlight ? "text-white font-semibold" : "text-white/80"}>{name}</span>
      <span className="text-xs text-white/50">MC</span>
    </div>
  );
}

function FinalHero({ match }: { match: Match }) {
  const champion = match.winner ?? "—";

  return (
    <div className="rounded-2xl border border-buns-yellow/30 bg-buns-yellow/10 p-4 lg:min-h-[560px] flex flex-col">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-xs tracking-[0.22em] text-white/60">FINAL</div>
        <div className="text-[11px] text-white/40">2 → 1</div>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-4">
        <div className="text-[11px] tracking-[0.22em] text-white/50">TITLE FIGHT</div>

        <div className="mt-2 flex items-center justify-between gap-2 text-white">
          <span className="font-semibold truncate">{match.a}</span>
          <span className="text-white/50">vs</span>
          <span className="font-semibold truncate">{match.b}</span>
        </div>

        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-amber-200">
          <Trophy className="h-3.5 w-3.5 text-amber-300" />
          Campeão (demo): <span className="font-semibold text-amber-100">{champion}</span>
        </div>
      </div>

      {/* “buraco” à direita: preenche com um card informativo (ficava vazio na tua imagem) */}
      <div className="mt-4 flex-1 rounded-2xl border border-buns-yellow/20 bg-black/20 p-4">
        <div className="text-[11px] tracking-[0.22em] text-white/50">ARENA NOTE</div>
        <div className="mt-2 text-sm text-white/70 leading-relaxed">
          Vencedor entra no arquivo e sobe aura na próxima sessão.
          <span className="text-white"> Aqui é pressão real.</span>
        </div>

        <div className="mt-4 grid gap-2">
          <BadgeLine label="Status" value="DEMO HUD" />
          <BadgeLine label="Replay" value="LOCKED" />
          <BadgeLine label="Next" value="SESSION 0" />
        </div>
      </div>
    </div>
  );
}

function BadgeLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2">
      <span className="text-xs text-white/50">{label}</span>
      <span className="text-xs text-white/80 font-semibold">{value}</span>
    </div>
  );
}
