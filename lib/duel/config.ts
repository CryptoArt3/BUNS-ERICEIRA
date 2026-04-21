import type { DuelGameType } from "./types";
import { readRuntimeActiveDuelGameType } from "./activeGameStore";

const DEFAULT_DUEL_GAME_TYPE: DuelGameType = "reaction";

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
  return normalizeDuelGameType(process.env.BUNS_DUEL_ACTIVE_GAME) ?? DEFAULT_DUEL_GAME_TYPE;
}

export function getActiveDuelGameType(): DuelGameType {
  return readRuntimeActiveDuelGameType() ?? getEnvDuelGameType();
}

export const DUEL_GAME_LABELS: Record<DuelGameType, string> = {
  reaction: "Reaction Duel",
  tap_battle: "Tap Battle",
  memory_flash: "Memory Flash",
};
