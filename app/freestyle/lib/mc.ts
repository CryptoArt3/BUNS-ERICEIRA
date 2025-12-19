// app/freestyle/lib/mc.ts
import type { MCCardModel, MCTier, MCStyle } from "../data/mc.mock";

export function initialsFromAKA(aka?: string | null) {
  const safe = (aka ?? "").toString();
  const raw = safe.replace(/[^A-Z0-9 ]/gi, "").trim();
  if (!raw) return "MC";
  const parts = raw.split(/\s+/).slice(0, 2);
  const init = parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return init || "MC";
}

export function tierFromStats(stats?: { battles?: number; wins?: number; finals?: number }): MCTier {
  const battles = stats?.battles ?? 0;
  const wins = stats?.wins ?? 0;
  const finals = stats?.finals ?? 0;

  if (finals >= 3 || wins >= 8) return "Champion";
  if (finals >= 2 || wins >= 5) return "Veteran";
  if (wins >= 3) return "Challenger";
  return "Rookie";
}

export function styleLabel(style?: MCStyle) {
  switch (style) {
    case "Punch": return "PUNCH";
    case "Flow": return "FLOW";
    case "Tech": return "TECH";
    case "Crowd": return "CROWD";
    default: return "STYLE";
  }
}

export function scoreForRanking(mc: MCCardModel) {
  // Protege caso o teu modelo não tenha stats (ou venha vazio)
  const wins = (mc as any)?.stats?.wins ?? (mc as any)?.wins ?? 0;
  const finals = (mc as any)?.stats?.finals ?? (mc as any)?.finals ?? 0;
  const battles = (mc as any)?.stats?.battles ?? (mc as any)?.battles ?? 0;
  return wins * 100 + finals * 25 + battles;
}

export function glowClass(tier: MCTier) {
  switch (tier) {
    case "Champion":
      return "ring-2 ring-amber-300/60 shadow-[0_0_35px_rgba(255,200,0,0.25)]";
    case "Veteran":
      return "ring-1 ring-buns-yellow/50 shadow-[0_0_28px_rgba(255,200,0,0.18)]";
    case "Challenger":
      return "ring-1 ring-buns-yellow/35 shadow-[0_0_22px_rgba(255,200,0,0.12)]";
    case "Rookie":
    default:
      return "ring-1 ring-white/10";
  }
}
