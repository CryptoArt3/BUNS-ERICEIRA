import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { DuelGameType } from "./types";

type StoredDuelGameState = {
  gameType: DuelGameType;
  updatedAt: string;
};

type HydratedDuelGameState = {
  gameType: DuelGameType | null;
  source: "supabase" | "local" | "memory" | "missing" | "error" | "none";
};

const g = globalThis as typeof globalThis & {
  __duelRuntimeGameType?: DuelGameType;
};

const STORE_PATH =
  process.env.BUNS_DUEL_STATE_PATH ||
  path.join(process.cwd(), ".data", "duel-active-game.json");
const SUPABASE_STATE_TABLE =
  process.env.BUNS_DUEL_SUPABASE_STATE_TABLE || "app_runtime_state";
const SUPABASE_STATE_KEY = "buns_duel_active_game";

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

export function hasDurableDuelGameStore() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function writeFileFallback(state: StoredDuelGameState) {
  try {
    mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    writeFileSync(STORE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  } catch {
    // Some deployments expose a read-only filesystem. The in-memory value still
    // applies for the current process; env remains the fallback after restart.
  }
}

export async function hydrateRuntimeActiveDuelGameType(): Promise<DuelGameType | null> {
  return (await hydrateRuntimeActiveDuelGameState()).gameType;
}

export async function hydrateRuntimeActiveDuelGameState(): Promise<HydratedDuelGameState> {
  const supabaseAdmin = getSupabaseAdminClient();
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from(SUPABASE_STATE_TABLE)
        .select("value")
        .eq("key", SUPABASE_STATE_KEY)
        .maybeSingle();

      if (error) {
        return {
          gameType: g.__duelRuntimeGameType ?? null,
          source: g.__duelRuntimeGameType ? "memory" : "error",
        };
      }

      const value = data?.value as Partial<StoredDuelGameState> | null | undefined;
      const gameType = normalizeStoredGameType(value?.gameType);
      if (gameType) {
        g.__duelRuntimeGameType = gameType;
        return { gameType, source: "supabase" };
      }

      return {
        gameType: g.__duelRuntimeGameType ?? null,
        source: g.__duelRuntimeGameType ? "memory" : "missing",
      };
    } catch {
      // Supabase is the production source of truth. Do not fall back to a stale
      // local file when durable storage is configured but temporarily fails.
      return {
        gameType: g.__duelRuntimeGameType ?? null,
        source: g.__duelRuntimeGameType ? "memory" : "error",
      };
    }
  }

  const gameType = readRuntimeActiveDuelGameType();
  return { gameType, source: gameType ? "local" : "none" };
}

export async function writeRuntimeActiveDuelGameType(
  gameType: DuelGameType
): Promise<StoredDuelGameState> {
  const state = {
    gameType,
    updatedAt: new Date().toISOString(),
  };

  g.__duelRuntimeGameType = gameType;

  const supabaseAdmin = getSupabaseAdminClient();
  if (supabaseAdmin) {
    const { error } = await supabaseAdmin.from(SUPABASE_STATE_TABLE).upsert(
      {
        key: SUPABASE_STATE_KEY,
        value: state,
        updated_at: state.updatedAt,
      },
      { onConflict: "key" }
    );

    if (error) {
      throw new Error(`Failed to persist duel game in Supabase: ${error.message}`);
    }

    writeFileFallback(state);
    return state;
  }

  writeFileFallback(state);
  return state;
}

export function getDuelGameStorePath() {
  return STORE_PATH;
}
