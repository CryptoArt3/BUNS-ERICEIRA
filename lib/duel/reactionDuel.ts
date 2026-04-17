import {
  clearDuelTimer,
  clearLastSeen,
  getLastSeen,
  getRoom,
  removeLastSeen,
  resetRoom,
  setDuelTimer,
  startCleanupInterval,
  stopCleanupInterval,
  updateLastSeen,
  updateRoom,
} from "./gameState";
import type { Player, RematchVote, Round } from "./types";

// ── Timing constants ──────────────────────────────────────────────────────────
const COUNTDOWN_SECONDS = 3;
const MIN_SIGNAL_DELAY_MS = 2000;
const MAX_SIGNAL_DELAY_MS = 5500;
const TAP_WINDOW_MS = 2500;
const ROUND_RESULT_DISPLAY_MS = 3000;
const MATCH_WINNER_DISPLAY_MS = 2500;
const REMATCH_WINDOW_SECONDS = 10;
const WINS_NEEDED = 2;
const MAX_CONSECUTIVE_MATCHES = 3;

// ── Presence constants ────────────────────────────────────────────────────────
// Client sends a heartbeat every HEARTBEAT_INTERVAL_MS (defined on the client).
// Server removes a player after STALE_TIMEOUT_MS without a heartbeat.
// Server runs the cleanup scan every CLEANUP_INTERVAL_MS.
//
// Worst-case removal latency after disconnect:
//   STALE_TIMEOUT_MS + CLEANUP_INTERVAL_MS ≈ 40 s
// This is acceptable for an in-store game. The pagehide/beforeunload explicit
// leave reduces this to near-instant in the common case.
const STALE_TIMEOUT_MS = 30_000;
const CLEANUP_INTERVAL_MS = 10_000;

// ── Join ──────────────────────────────────────────────────────────────────────

export function addPlayer(id: string, requestedName: string): boolean {
  const room = getRoom();

  if (room.status !== "waiting") return false;
  if (room.players.length >= 2) return false;

  // Idempotent: already joined — refresh their lastSeen and return
  if (room.players.find((p) => p.id === id)) {
    updateLastSeen(id);
    return true;
  }

  const color = room.players.length === 0 ? "red" : "blue";
  const name = requestedName.trim() || `Player ${room.players.length + 1}`;
  const player: Player = { id, name, color, joinedAt: Date.now() };

  const newPlayers = [...room.players, player];
  const newScores = { ...room.scores, [id]: 0 };
  updateRoom({ players: newPlayers, scores: newScores });

  // Seed presence — ensures cleanup doesn't evict them before first heartbeat
  updateLastSeen(id);

  // Ensure the janitor is running now that at least one player is in the room
  startCleanupInterval(cleanupStalePlayers, CLEANUP_INTERVAL_MS);

  if (newPlayers.length === 2) {
    startCountdown();
  }

  return true;
}

// ── Presence: heartbeat ───────────────────────────────────────────────────────

export function heartbeat(playerId: string): boolean {
  const room = getRoom();
  if (!room.players.find((p) => p.id === playerId)) return false;
  // Update lastSeen silently — does NOT call updateRoom so no SSE is emitted.
  updateLastSeen(playerId);
  return true;
}

// ── Presence: explicit leave ──────────────────────────────────────────────────

export function leavePlayer(playerId: string): void {
  handlePlayerDisconnect(playerId);
}

// ── Presence: stale player cleanup ───────────────────────────────────────────

function cleanupStalePlayers(): void {
  const room = getRoom();
  if (room.players.length === 0) return;

  const now = Date.now();
  const stale = room.players.filter((p) => {
    // Fall back to joinedAt if no heartbeat has been recorded yet
    const seen = getLastSeen(p.id) ?? p.joinedAt;
    return now - seen > STALE_TIMEOUT_MS;
  });

  for (const player of stale) {
    // Re-read room inside the loop — state may have changed after each removal
    handlePlayerDisconnect(player.id);
  }
}

// ── Presence: disconnect handler ──────────────────────────────────────────────

function handlePlayerDisconnect(playerId: string): void {
  const room = getRoom();

  // Already gone (e.g. resolved by a previous cleanup pass this tick)
  if (!room.players.find((p) => p.id === playerId)) return;

  // ── rematch_wait: use the existing vote mechanism ─────────────────────────
  if (room.status === "rematch_wait") {
    // Only inject a vote if they haven't already voted
    if (room.rematchVotes[playerId] === undefined) {
      recordRematchVote(playerId, "leave");
    }
    removeLastSeen(playerId);
    return;
  }

  // ── waiting / match_winner: simple removal, no timer changes ─────────────
  // match_winner: a 2.5s display timer is already queued → let it fire into
  // rematch_wait, which handles reduced player count gracefully.
  if (room.status === "waiting" || room.status === "match_winner") {
    const remaining = room.players.filter((p) => p.id !== playerId);
    removeLastSeen(playerId);

    if (remaining.length === 0) {
      resetRoom(); // also stops cleanup interval + clears all lastSeen
    } else {
      updateRoom({
        players: remaining,
        scores: Object.fromEntries(
          remaining.map((p) => [p.id, room.scores[p.id] ?? 0])
        ),
      });
    }
    return;
  }

  // ── active game (countdown / get_ready / signal / round_result) ──────────
  // The match cannot safely continue with one player — cancel all pending
  // timers and return to waiting with the remaining player.
  clearDuelTimer();
  const remaining = room.players.filter((p) => p.id !== playerId);
  removeLastSeen(playerId);

  if (remaining.length === 0) {
    resetRoom();
  } else {
    updateRoom({
      status: "waiting",
      players: remaining,
      scores: Object.fromEntries(remaining.map((p) => [p.id, 0])),
      currentRound: 0,
      rounds: [],
      countdownValue: null,
      winner: null,
      rematchVotes: {},
      rematchCountdown: null,
      consecutiveMatchCount: 0, // new opponent will join — reset streak
    });
  }
}

// ── Countdown ─────────────────────────────────────────────────────────────────

function startCountdown() {
  updateRoom({ status: "countdown", countdownValue: COUNTDOWN_SECONDS });
  runCountdownTicker(startRound);
}

// Shared ticker — counts from COUNTDOWN_SECONDS down then calls onComplete.
// Caller sets initial status + countdownValue before invoking.
function runCountdownTicker(onComplete: () => void) {
  let count = COUNTDOWN_SECONDS;
  const tick = () => {
    count--;
    if (count > 0) {
      updateRoom({ countdownValue: count });
      setDuelTimer(setTimeout(tick, 1000));
    } else {
      updateRoom({ countdownValue: 0 });
      setDuelTimer(setTimeout(onComplete, 800));
    }
  };
  setDuelTimer(setTimeout(tick, 1000));
}

// ── Round lifecycle ───────────────────────────────────────────────────────────

function startRound() {
  const room = getRoom();
  const roundNumber = room.currentRound + 1;

  const newRound: Round = {
    number: roundNumber,
    signalFiredAt: null,
    taps: {},
    reactionTimes: {},
    winner: null,
    result: "pending",
  };

  updateRoom({
    status: "get_ready",
    currentRound: roundNumber,
    rounds: [...room.rounds, newRound],
    countdownValue: null,
  });

  const delay =
    MIN_SIGNAL_DELAY_MS +
    Math.random() * (MAX_SIGNAL_DELAY_MS - MIN_SIGNAL_DELAY_MS);
  setDuelTimer(setTimeout(fireSignal, delay));
}

function fireSignal() {
  const room = getRoom();
  const signalFiredAt = Date.now();

  const updatedRounds = [...room.rounds];
  const idx = updatedRounds.length - 1;
  if (idx < 0) return;
  updatedRounds[idx] = { ...updatedRounds[idx]!, signalFiredAt };

  updateRoom({ status: "signal", rounds: updatedRounds });
  setDuelTimer(setTimeout(() => resolveRound(), TAP_WINDOW_MS));
}

// ── Tap handling ──────────────────────────────────────────────────────────────

export function recordTap(playerId: string): boolean {
  const room = getRoom();

  if (room.status !== "signal") return false;
  if (!room.players.find((p) => p.id === playerId)) return false;

  const roundIdx = room.rounds.length - 1;
  if (roundIdx < 0) return false;

  const currentRound = room.rounds[roundIdx]!;
  if (currentRound.taps[playerId] !== undefined) return false;

  const tapTime = Date.now();
  const updatedRounds = [...room.rounds];
  updatedRounds[roundIdx] = {
    ...currentRound,
    taps: { ...currentRound.taps, [playerId]: tapTime },
  };

  updateRoom({ rounds: updatedRounds });

  const tapCount = Object.keys(updatedRounds[roundIdx]!.taps).length;
  if (tapCount >= room.players.length) {
    clearDuelTimer();
    setDuelTimer(setTimeout(() => resolveRound(), 200));
  }

  return true;
}

// ── Round resolution ──────────────────────────────────────────────────────────

function resolveRound() {
  const room = getRoom();
  const roundIdx = room.rounds.length - 1;
  if (roundIdx < 0) return;

  const currentRound = room.rounds[roundIdx]!;
  if (!currentRound.signalFiredAt) return;

  const signal = currentRound.signalFiredAt;
  const reactionTimes: Record<string, number> = {};

  for (const player of room.players) {
    const tapTime = currentRound.taps[player.id];
    reactionTimes[player.id] =
      tapTime !== undefined ? tapTime - signal : TAP_WINDOW_MS + 1000;
  }

  let roundWinner: string | null = null;
  if (room.players.length >= 2) {
    const [p1, p2] = room.players as [Player, Player];
    const t1 = reactionTimes[p1.id] ?? Infinity;
    const t2 = reactionTimes[p2.id] ?? Infinity;
    if (t1 < t2) roundWinner = p1.id;
    else if (t2 < t1) roundWinner = p2.id;
  }

  const updatedRounds = [...room.rounds];
  updatedRounds[roundIdx] = {
    ...currentRound,
    result: "complete",
    winner: roundWinner,
    reactionTimes,
  };

  const newScores = { ...room.scores };
  if (roundWinner) {
    newScores[roundWinner] = (newScores[roundWinner] ?? 0) + 1;
  }

  const matchWinner = room.players.find(
    (p) => (newScores[p.id] ?? 0) >= WINS_NEEDED
  );

  updateRoom({
    status: "round_result",
    rounds: updatedRounds,
    scores: newScores,
    ...(matchWinner
      ? { consecutiveMatchCount: room.consecutiveMatchCount + 1 }
      : {}),
  });

  if (matchWinner) {
    setDuelTimer(
      setTimeout(() => enterMatchWinner(matchWinner.id), ROUND_RESULT_DISPLAY_MS)
    );
  } else {
    setDuelTimer(setTimeout(startRound, ROUND_RESULT_DISPLAY_MS));
  }
}

// ── Match winner → rematch wait ───────────────────────────────────────────────

function enterMatchWinner(winnerId: string) {
  updateRoom({ status: "match_winner", winner: winnerId });
  setDuelTimer(setTimeout(enterRematchWait, MATCH_WINNER_DISPLAY_MS));
}

function enterRematchWait() {
  updateRoom({
    status: "rematch_wait",
    rematchVotes: {},
    rematchCountdown: REMATCH_WINDOW_SECONDS,
  });
  startRematchCountdown();
}

function startRematchCountdown() {
  let seconds = REMATCH_WINDOW_SECONDS;

  const tick = () => {
    const room = getRoom();
    if (room.status !== "rematch_wait") return; // guard: state changed externally

    seconds--;
    if (seconds <= 0) {
      resolveRematch();
    } else {
      updateRoom({ rematchCountdown: seconds });
      setDuelTimer(setTimeout(tick, 1000));
    }
  };

  setDuelTimer(setTimeout(tick, 1000));
}

// ── Rematch vote ──────────────────────────────────────────────────────────────

export function recordRematchVote(
  playerId: string,
  vote: RematchVote
): boolean {
  const room = getRoom();

  if (room.status !== "rematch_wait") return false;
  if (!room.players.find((p) => p.id === playerId)) return false;
  if (room.rematchVotes[playerId] !== undefined) return false;

  const newVotes = { ...room.rematchVotes, [playerId]: vote };
  updateRoom({ rematchVotes: newVotes });

  if (Object.keys(newVotes).length >= room.players.length) {
    clearDuelTimer();
    resolveRematch();
  }

  return true;
}

// ── Rematch resolution ────────────────────────────────────────────────────────

function resolveRematch() {
  const room = getRoom();
  if (room.status !== "rematch_wait") return; // guard against double-invocation

  const rematchPlayers = room.players.filter(
    (p) => room.rematchVotes[p.id] === "rematch"
  );
  const bothWantRematch =
    rematchPlayers.length === 2 && room.players.length === 2;

  if (bothWantRematch && room.consecutiveMatchCount >= MAX_CONSECUTIVE_MATCHES) {
    resetRoom();
    return;
  }

  if (bothWantRematch) {
    startRematch();
    return;
  }

  if (rematchPlayers.length === 1) {
    // Keep the rematching player; clear the leaver's presence
    const leaverId = room.players.find((p) => room.rematchVotes[p.id] !== "rematch")?.id;
    if (leaverId) removeLastSeen(leaverId);

    updateRoom({
      status: "waiting",
      players: rematchPlayers,
      scores: Object.fromEntries(rematchPlayers.map((p) => [p.id, 0])),
      currentRound: 0,
      rounds: [],
      countdownValue: null,
      winner: null,
      rematchVotes: {},
      rematchCountdown: null,
      consecutiveMatchCount: 0,
    });
    return;
  }

  // Both leave or no votes — full reset
  resetRoom();
}

// ── Rematch start ─────────────────────────────────────────────────────────────

function startRematch() {
  const room = getRoom();
  updateRoom({
    status: "countdown",
    scores: Object.fromEntries(room.players.map((p) => [p.id, 0])),
    currentRound: 0,
    rounds: [],
    countdownValue: COUNTDOWN_SECONDS,
    winner: null,
    rematchVotes: {},
    rematchCountdown: null,
  });
  runCountdownTicker(startRound);
}
