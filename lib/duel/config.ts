import type { DuelGameType } from "./types";

const FROZEN_DUEL_GAME_TYPE: DuelGameType = "memory_flash";

export function normalizeDuelGameType(value: unknown): DuelGameType | null {
  if (typeof value !== "string") return null;
  const configured = value.trim().toLowerCase();
  if (configured === "memory-flash" || configured === "memory_flash") {
    return "memory_flash";
  }
  if (configured === "tap-battle" || configured === "tap_battle") {
    return "tap_battle";
  }
  if (configured === "reaction") {
    return "reaction";
  }
  return null;
}

export function getEnvDuelGameType(): DuelGameType {
  return FROZEN_DUEL_GAME_TYPE;
}

export function getActiveDuelGameType(): DuelGameType {
  return FROZEN_DUEL_GAME_TYPE;
}

export const DUEL_GAME_LABELS: Record<DuelGameType, string> = {
  reaction: "Reaction Duel",
  tap_battle: "Tap Battle",
  memory_flash: "Memory Flash",
};
