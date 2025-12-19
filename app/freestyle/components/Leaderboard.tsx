// app/freestyle/components/Leaderboard.tsx
import { Crown, Trophy, Flame, Swords, Medal } from "lucide-react";
import type { MCCardModel } from "../data/mc.mock";
import { scoreForRanking } from "../lib/mc";

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function pct(n: number) {
  return `${Math.round(clamp01(n) * 100)}%`;
}

function tierColor(tier?: string) {
  // Mantém compatível mesmo se tier vier undefined/novo
  switch (tier) {
    case "Champion":
      return "text-amber-200";
    case "Veteran":
      return "text-emerald-200";
    case "Challenger":
      return "text-sky-200";
    case "Rookie":
      return "text-white/70";
    default:
      return "text-white/70";
  }
}

function tierBadge(tier?: string) {
  switch (tier) {
    case "Champion":
      return { label: "CHAMPION", cls: "border-amber-400/30 bg-amber-400/10 text-amber-100" };
    case "Veteran":
      return { label: "VETERAN", cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" };
    case "Challenger":
      return { label: "CHALLENGER", cls: "border-sky-400/30 bg-sky-400/10 text-sky-100" };
    case "Rookie":
      return { label: "ROOKIE", cls: "border-white/10 bg-white/5 text-white/70" };
    default:
      return { label: "MC", cls: "border-white/10 bg-white/5 text-white/70" };
  }
}

function heatFor(mc: MCCardModel) {
  // “Heat” derivado (não é pontos): winrate + finais como pressão.
  const battles = mc.stats?.battles ?? 0;
  const wins = mc.stats?.wins ?? 0;
  const finals = mc.stats?.finals ?? 0;

  const winRate = battles > 0 ? wins / battles : 0;
  const finalsPressure = Math.min(1, finals / 4); // 0..1
  const heat = clamp01(winRate * 0.75 + finalsPressure * 0.25);

  if (heat >= 0.66) return { label: "HOT", icon: <Flame className="h-4 w-4 text-orange-300" />, cls: "border-orange-400/30 bg-orange-400/10 text-orange-100" };
  if (heat >= 0.33) return { label: "WARM", icon: <Flame className="h-4 w-4 text-amber-300" />, cls: "border-amber-400/25 bg-amber-400/10 text-amber-100" };
  return { label: "COLD", icon: <Flame className="h-4 w-4 text-white/50" />, cls: "border-white/10 bg-white/5 text-white/60" };
}

function StatBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const ratio = max > 0 ? value / max : 0;
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between text-[11px] text-white/55">
        <span className="tracking-[0.18em]">{label}</span>
        <span className="text-white/60">{value}</span>
      </div>
      <div className="mt-1 h-2 rounded-full border border-white/10 bg-black/25 overflow-hidden">
        <div
          className="h-full bg-buns-yellow/40"
          style={{ width: pct(ratio) }}
        />
      </div>
    </div>
  );
}

export default function Leaderboard({ mcs }: { mcs: MCCardModel[] }) {
  const ranked = [...mcs]
    .sort((a, b) => scoreForRanking(b) - scoreForRanking(a))
    .slice(0, 5);

  const top = ranked[0];
  const rest = ranked.slice(1);

  // Para normalizar barras no TOP 5 (fica “HUD-like”)
  const maxWins = Math.max(...ranked.map((m) => m.stats?.wins ?? 0), 1);
  const maxFinals = Math.max(...ranked.map((m) => m.stats?.finals ?? 0), 1);
  const maxBattles = Math.max(...ranked.map((m) => m.stats?.battles ?? 0), 1);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 overflow-hidden">
      <div className="flex items-center gap-2">
        <Crown className="h-5 w-5 text-buns-yellow" />
        <h3 className="font-display text-xl">Leaderboard</h3>
        <span className="ml-auto text-xs text-white/50 tracking-[0.18em]">
          ARENA RANK
        </span>
      </div>

      {/* TOP 1 — CHAMPION CARD */}
      {top ? (
        <div className="mt-4 rounded-3xl border border-buns-yellow/30 bg-buns-yellow/10 p-[2px]">
          <div className="rounded-[22px] border border-white/10 bg-[#0c0906]/80 p-5 relative overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                background:
                  "radial-gradient(60% 60% at 40% 40%, rgba(255,200,0,0.55) 0%, rgba(0,0,0,0) 70%)",
              }}
            />

            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/35">
                <Medal className="h-6 w-6 text-buns-yellow" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-display text-2xl text-white truncate">
                    {top.aka}
                  </div>

                  <span
                    className={cx(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
                      heatFor(top).cls
                    )}
                    title="Momentum (derivado de winrate + finais)"
                  >
                    {heatFor(top).icon}
                    {heatFor(top).label}
                  </span>

                  <span
                    className={cx(
                      "inline-flex items-center rounded-full border px-3 py-1 text-xs",
                      tierBadge((top as any).tier).cls
                    )}
                  >
                    {(tierBadge((top as any).tier).label)}
                  </span>
                </div>

                <div className="mt-1 text-sm text-white/65">
                  {top.city} ·{" "}
                  <span className={cx("font-semibold", tierColor((top as any).tier))}>
                    {(top as any).tier ?? "MC"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <StatBar label="WINS" value={top.stats?.wins ?? 0} max={maxWins} />
                  <StatBar label="FINALS" value={top.stats?.finals ?? 0} max={maxFinals} />
                  <StatBar label="BATTLES" value={top.stats?.battles ?? 0} max={maxBattles} />
                </div>

                <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 py-2 text-sm text-amber-100">
                  <Trophy className="h-4 w-4 text-amber-300" />
                  #1 Arena Leader · {top.stats?.wins ?? 0}W / {top.stats?.finals ?? 0}F
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* REST — RANK LIST */}
      <div className="mt-4 space-y-2">
        {rest.map((mc, i) => {
          const idx = i + 2; // porque top é #1
          const heat = heatFor(mc);
          const wins = mc.stats?.wins ?? 0;
          const finals = mc.stats?.finals ?? 0;
          const battles = mc.stats?.battles ?? 0;

          return (
            <div
              key={mc.id}
              className="rounded-2xl border border-white/10 bg-black/25 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="font-display text-lg w-10 text-white">
                  #{idx}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="font-semibold text-white truncate">{mc.aka}</div>

                    <span
                      className={cx(
                        "ml-auto inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px]",
                        heat.cls
                      )}
                      title="Momentum (derivado de winrate + finais)"
                    >
                      {heat.icon}
                      {heat.label}
                    </span>
                  </div>

                  <div className="mt-1 text-xs text-white/60">
                    {mc.city} ·{" "}
                    <span className={tierColor((mc as any).tier)}>
                      {(mc as any).tier ?? "MC"}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <StatBar label="WINS" value={wins} max={maxWins} />
                    <StatBar label="FINALS" value={finals} max={maxFinals} />
                    <StatBar label="BATTLES" value={battles} max={maxBattles} />
                  </div>
                </div>

                <div className="hidden sm:flex flex-col items-end gap-2 pl-2">
                  <div className="inline-flex items-center gap-2 text-sm text-amber-200">
                    <Trophy className="h-4 w-4 text-amber-300" />
                    {wins}W
                  </div>
                  <div className="inline-flex items-center gap-2 text-xs text-white/55">
                    <Swords className="h-3.5 w-3.5" />
                    {finals} finals
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-white/50">
        Ranking é calculado por vitórias + finais + participação (modo demo). O “Heat” é apenas um indicador visual (winrate + finais).
      </p>
    </div>
  );
}
