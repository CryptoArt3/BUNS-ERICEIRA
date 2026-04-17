import { EventEmitter } from "events";
import type { GameRoom } from "./types";
import { getActiveDuelGameType } from "./config";

// ── PHASE 1 MVP — Production limitations ─────────────────────────────────────
//
// IN-MEMORY STATE
// The game room lives in process memory (globalThis). This means:
//   • State is lost if the Node.js process restarts (server crash, deploy, etc.)
//   • This only works correctly on a single-process server. If the app were
//     deployed behind multiple workers or serverless functions, each worker
//     would have its own isolated room — players could land on different
//     instances and never see each other.
//
// For a single in-store machine (Next.js running locally on one box) this is
// perfectly fine and the simplest correct solution.
//
// When to upgrade: if the game moves to a multi-process or cloud deployment,
// replace this module with a Redis-backed store (e.g. ioredis pub/sub + a
// shared hash for room state) or migrate to Supabase Realtime channels with a
// Postgres row as source of truth.
//
// SINGLETON PATTERN
// Next.js hot-reload re-executes modules, which would reset in-memory state.
// Attaching to globalThis survives those re-executions in dev mode.
// In production there is only one process, so this is always correct.

const g = globalThis as typeof globalThis & {
  __duelEmitter?: EventEmitter;
  __duelRoom?: GameRoom;
  __duelTimer?: ReturnType<typeof setTimeout>;
  // ── Presence tracking (intentionally outside GameRoom — not sent over SSE) ──
  __duelLastSeen?: Map<string, number>; // playerId → ms timestamp
  __duelCleanupInterval?: ReturnType<typeof setInterval>;
};

export const duelEmitter: EventEmitter =
  g.__duelEmitter ?? (g.__duelEmitter = new EventEmitter());

duelEmitter.setMaxListeners(100); // TV + 2 players + some headroom

// ── Room factory ─────────────────────────────────────────────────────────────

function createRoom(): GameRoom {
  return {
    id: "BUNS",
    gameType: getActiveDuelGameType(),
    status: "waiting",
    players: [],
    scores: {},
    currentRound: 0,
    totalRounds: 3,
    rounds: [],
    countdownValue: null,
    winner: null,
    rematchVotes: {},
    rematchCountdown: null,
    consecutiveMatchCount: 0,
    lastUpdatedAt: Date.now(),
  };
}

// ── Room API ──────────────────────────────────────────────────────────────────

export function getRoom(): GameRoom {
  if (!g.__duelRoom) {
    g.__duelRoom = createRoom();
  }
  return g.__duelRoom;
}

export function updateRoom(updates: Partial<GameRoom>): GameRoom {
  const current = getRoom();
  g.__duelRoom = { ...current, ...updates, lastUpdatedAt: Date.now() };
  duelEmitter.emit("update", g.__duelRoom);
  return g.__duelRoom;
}

export function resetRoom(): GameRoom {
  clearDuelTimer();
  stopCleanupInterval(); // no players left — stop the janitor
  clearLastSeen();
  g.__duelRoom = createRoom();
  duelEmitter.emit("update", g.__duelRoom);
  return g.__duelRoom;
}

// ── Game timer ────────────────────────────────────────────────────────────────

export function setDuelTimer(timer: ReturnType<typeof setTimeout>): void {
  if (g.__duelTimer) clearTimeout(g.__duelTimer);
  g.__duelTimer = timer;
}

export function clearDuelTimer(): void {
  if (g.__duelTimer) {
    clearTimeout(g.__duelTimer);
    g.__duelTimer = undefined;
  }
}

// ── Presence: lastSeen map ────────────────────────────────────────────────────
// Kept outside GameRoom so heartbeat updates don't trigger SSE broadcasts.

export function updateLastSeen(playerId: string): void {
  if (!g.__duelLastSeen) g.__duelLastSeen = new Map();
  g.__duelLastSeen.set(playerId, Date.now());
}

export function getLastSeen(playerId: string): number | undefined {
  return g.__duelLastSeen?.get(playerId);
}

export function removeLastSeen(playerId: string): void {
  g.__duelLastSeen?.delete(playerId);
}

export function clearLastSeen(): void {
  g.__duelLastSeen?.clear();
}

// ── Presence: cleanup interval ────────────────────────────────────────────────

export function startCleanupInterval(fn: () => void, intervalMs: number): void {
  if (g.__duelCleanupInterval) return; // already running — don't double-start
  g.__duelCleanupInterval = setInterval(fn, intervalMs);
}

export function stopCleanupInterval(): void {
  if (g.__duelCleanupInterval) {
    clearInterval(g.__duelCleanupInterval);
    g.__duelCleanupInterval = undefined;
  }
}
