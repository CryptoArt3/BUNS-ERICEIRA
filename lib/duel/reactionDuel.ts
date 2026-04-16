import {
  clearDuelTimer,
  getRoom,
  resetRoom,
  setDuelTimer,
  updateRoom,
} from "./gameState";
import type { Player, RematchVote, Round } from "./types";

// ── Timing constants ──────────────────────────────────────────────────────────
const COUNTDOWN_SECONDS = 3;
const MIN_SIGNAL_DELAY_MS = 2000;
const MAX_SIGNAL_DELAY_MS = 5500;
const TAP_WINDOW_MS = 2500;
const ROUND_RESULT_DISPLAY_MS = 3000;
const MATCH_WINNER_DISPLAY_MS = 2500; // brief celebration before rematch decision
const REMATCH_WINDOW_SECONDS = 10; // time players have to decide on rematch
const WINS_NEEDED = 2; // best of 3
const MAX_CONSECUTIVE_MATCHES = 3; // anti-monopoly: max same-pair matches in a row

// ── Join ──────────────────────────────────────────────────────────────────────

export function addPlayer(id: string, requestedName: string): boolean {
  const room = getRoom();

  if (room.status !== "waiting") return false;
  if (room.players.length >= 2) return false;
  if (room.players.find((p) => p.id === id)) return true; // idempotent

  const color = room.players.length === 0 ? "red" : "blue";
  const name = requestedName.trim() || `Player ${room.players.length + 1}`;
  const player: Player = { id, name, color, joinedAt: Date.now() };

  const newPlayers = [...room.players, player];
  const newScores = { ...room.scores, [id]: 0 };
  updateRoom({ players: newPlayers, scores: newScores });

  if (newPlayers.length === 2) {
    startCountdown();
  }

  return true;
}

// ── Countdown ─────────────────────────────────────────────────────────────────

function startCountdown() {
  updateRoom({ status: "countdown", countdownValue: COUNTDOWN_SECONDS });
  runCountdownTicker(startRound);
}

// Shared countdown ticker — counts from COUNTDOWN_SECONDS down then calls onComplete.
// Caller is responsible for setting the initial status + countdownValue before calling.
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
  if (currentRound.taps[playerId] !== undefined) return false; // already tapped

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
    // Increment consecutive count now so it's reflected in rematch_wait UI
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
    // Guard: if state changed (e.g. both voted already), stop ticking
    if (room.status !== "rematch_wait") return;

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
  // Don't allow changing an existing vote
  if (room.rematchVotes[playerId] !== undefined) return false;

  const newVotes = { ...room.rematchVotes, [playerId]: vote };
  updateRoom({ rematchVotes: newVotes });

  // Resolve immediately once every player has voted
  if (Object.keys(newVotes).length >= room.players.length) {
    clearDuelTimer();
    resolveRematch();
  }

  return true;
}

// ── Rematch resolution ────────────────────────────────────────────────────────

function resolveRematch() {
  const room = getRoom();
  // Guard against double-invocation (timer + all-voted race)
  if (room.status !== "rematch_wait") return;

  const rematchPlayers = room.players.filter(
    (p) => room.rematchVotes[p.id] === "rematch"
  );
  const bothWantRematch =
    rematchPlayers.length === 2 && room.players.length === 2;

  // ── Anti-monopoly: force full reset if same pair played too many times ──
  if (bothWantRematch && room.consecutiveMatchCount >= MAX_CONSECUTIVE_MATCHES) {
    resetRoom();
    return;
  }

  // ── Both rematch, under limit ─────────────────────────────────────────────
  if (bothWantRematch) {
    startRematch();
    return;
  }

  // ── One player rematches, the other leaves (or didn't respond = treated as leave) ──
  if (rematchPlayers.length === 1) {
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
      consecutiveMatchCount: 0, // new opponent will join — reset streak
    });
    return;
  }

  // ── Both leave, or no votes ───────────────────────────────────────────────
  resetRoom();
}

// ── Rematch start (same players, scores reset) ────────────────────────────────

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
    // consecutiveMatchCount already incremented in resolveRound when this match ended
  });
  runCountdownTicker(startRound);
}
