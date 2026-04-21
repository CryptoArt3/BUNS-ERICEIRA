import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { DuelGameType } from "./types";

type StoredDuelGameState = {
  gameType: DuelGameType;
  updatedAt: string;
};

const g = globalThis as typeof globalThis & {
  __duelRuntimeGameType?: DuelGameType;
};

const STORE_PATH =
  process.env.BUNS_DUEL_STATE_PATH ||
  path.join(process.cwd(), ".data", "duel-active-game.json");

function normalizeStoredGameType(value: unknown): DuelGameType | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "reaction") return "reaction";
  if (normalized === "tap-battle" || normalized === "tap_battle") return "tap_battle";
  if (normalized === "memory-flash" || normalized === "memory_flash") {
    return "memory_flash";
  }
  return null;
}

export function readRuntimeActiveDuelGameType(): DuelGameType | null {
  if (g.__duelRuntimeGameType) return g.__duelRuntimeGameType;

  try {
    if (!existsSync(STORE_PATH)) return null;
    const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as Partial<StoredDuelGameState>;
    const gameType = normalizeStoredGameType(parsed.gameType);
    if (!gameType) return null;
    g.__duelRuntimeGameType = gameType;
    return gameType;
  } catch {
    return null;
  }
}

export function writeRuntimeActiveDuelGameType(gameType: DuelGameType): StoredDuelGameState {
  const state = {
    gameType,
    updatedAt: new Date().toISOString(),
  };

  g.__duelRuntimeGameType = gameType;

  try {
    mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    writeFileSync(STORE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  } catch {
    // Some deployments expose a read-only filesystem. The in-memory value still
    // applies for the current process; env remains the fallback after restart.
  }

  return state;
}

export function getDuelGameStorePath() {
  return STORE_PATH;
}
