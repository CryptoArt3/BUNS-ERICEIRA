import type { DuelGameType } from "./types";

const DEFAULT_DUEL_GAME_TYPE: DuelGameType = "reaction";

export function getActiveDuelGameType(): DuelGameType {
  const configured = process.env.BUNS_DUEL_ACTIVE_GAME?.trim().toLowerCase();
  if (configured === "tap-battle" || configured === "tap_battle") {
    return "tap_battle";
  }
  return DEFAULT_DUEL_GAME_TYPE;
}

export const DUEL_GAME_LABELS: Record<DuelGameType, string> = {
  reaction: "Reaction Duel",
  tap_battle: "Tap Battle",
};
