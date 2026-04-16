import {
  clearDuelTimer,
  getRoom,
  resetRoom,
  setDuelTimer,
  updateRoom,
} from "./gameState";
import type { Player, Round } from "./types";

// ── Timing constants ──────────────────────────────────────────────────────────
const COUNTDOWN_SECONDS = 3;
const MIN_SIGNAL_DELAY_MS = 2000; // shortest wait before TAP NOW
const MAX_SIGNAL_DELAY_MS = 5500; // longest wait before TAP NOW
const TAP_WINDOW_MS = 2500; // window to tap after signal
const ROUND_RESULT_DISPLAY_MS = 3000; // show round result before next
const WINNER_DISPLAY_MS = 6000; // show match winner before lobby reset
const WINS_NEEDED = 2; // best of 3

// ── Join ──────────────────────────────────────────────────────────────────────

export function addPlayer(id: string, requestedName: string): boolean {
  const room = getRoom();

  // Reject if game is already running or room is full
  if (room.status !== "waiting") return false;
  if (room.players.length >= 2) return false;

  // Idempotent: already joined
  if (room.players.find((p) => p.id === id)) return true;

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

  let count = COUNTDOWN_SECONDS;

  const tick = () => {
    count--;
    if (count > 0) {
      updateRoom({ countdownValue: count });
      setDuelTimer(setTimeout(tick, 1000));
    } else {
      updateRoom({ countdownValue: 0 });
      setDuelTimer(setTimeout(startRound, 800));
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

  // Random delay — creates tension
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

  // Auto-resolve after tap window expires (handles disconnects / missed taps)
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
  // Already tapped
  if (currentRound.taps[playerId] !== undefined) return false;

  const tapTime = Date.now();
  const updatedRounds = [...room.rounds];
  updatedRounds[roundIdx] = {
    ...currentRound,
    taps: { ...currentRound.taps, [playerId]: tapTime },
  };

  updateRoom({ rounds: updatedRounds });

  // Resolve as soon as both players have tapped
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
      tapTime !== undefined ? tapTime - signal : TAP_WINDOW_MS + 1000; // missed
  }

  // Determine round winner — lowest reaction time wins
  let roundWinner: string | null = null;
  if (room.players.length >= 2) {
    const [p1, p2] = room.players as [Player, Player];
    const t1 = reactionTimes[p1.id] ?? Infinity;
    const t2 = reactionTimes[p2.id] ?? Infinity;
    if (t1 < t2) roundWinner = p1.id;
    else if (t2 < t1) roundWinner = p2.id;
    // equal → draw, no point awarded
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

  updateRoom({ status: "round_result", rounds: updatedRounds, scores: newScores });

  // Check for match winner (first to WINS_NEEDED)
  const matchWinner = room.players.find(
    (p) => (newScores[p.id] ?? 0) >= WINS_NEEDED
  );

  if (matchWinner) {
    setDuelTimer(
      setTimeout(() => {
        updateRoom({ status: "match_winner", winner: matchWinner.id });
        setDuelTimer(setTimeout(() => resetRoom(), WINNER_DISPLAY_MS));
      }, ROUND_RESULT_DISPLAY_MS)
    );
  } else {
    setDuelTimer(setTimeout(startRound, ROUND_RESULT_DISPLAY_MS));
  }
}
