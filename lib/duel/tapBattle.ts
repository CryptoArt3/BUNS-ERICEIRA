import {
  clearDuelTimer,
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

const COUNTDOWN_SECONDS = 3;
const READY_DISPLAY_MS = 1200;
const ROUND_DURATION_MS = 5000;
const ROUND_FINALIZATION_GRACE_MS = 180;
const ROUND_RESULT_DISPLAY_MS = 3000;
const MATCH_WINNER_DISPLAY_MS = 2500;
const REMATCH_WINDOW_SECONDS = 10;
const WINS_NEEDED = 2;
const MAX_CONSECUTIVE_MATCHES = 3;

const STALE_TIMEOUT_MS = 30_000;
const CLEANUP_INTERVAL_MS = 10_000;

export function addPlayer(id: string, requestedName: string): boolean {
  const room = getRoom();

  if (room.status !== "waiting") return false;
  if (room.players.length >= 2) return false;

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

  updateLastSeen(id);
  startCleanupInterval(cleanupStalePlayers, CLEANUP_INTERVAL_MS);

  if (newPlayers.length === 2) {
    startCountdown();
  }

  return true;
}

export function heartbeat(playerId: string): boolean {
  const room = getRoom();
  if (!room.players.find((p) => p.id === playerId)) return false;
  updateLastSeen(playerId);
  return true;
}

export function leavePlayer(playerId: string): void {
  handlePlayerDisconnect(playerId);
}

function cleanupStalePlayers(): void {
  const room = getRoom();
  if (room.players.length === 0) return;

  const now = Date.now();
  const stale = room.players.filter((p) => {
    const seen = getLastSeen(p.id) ?? p.joinedAt;
    return now - seen > STALE_TIMEOUT_MS;
  });

  for (const player of stale) {
    handlePlayerDisconnect(player.id);
  }
}

function handlePlayerDisconnect(playerId: string): void {
  const room = getRoom();
  if (!room.players.find((p) => p.id === playerId)) return;

  if (room.status === "rematch_wait") {
    if (room.rematchVotes[playerId] === undefined) {
      recordRematchVote(playerId, "leave");
    }
    removeLastSeen(playerId);
    return;
  }

  if (room.status === "waiting" || room.status === "match_winner") {
    const remaining = room.players.filter((p) => p.id !== playerId);
    removeLastSeen(playerId);

    if (remaining.length === 0) {
      resetRoom();
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
      consecutiveMatchCount: 0,
    });
  }
}

function startCountdown() {
  updateRoom({ status: "countdown", countdownValue: COUNTDOWN_SECONDS });
  runCountdownTicker(startRound);
}

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

function startRound() {
  const room = getRoom();
  const roundNumber = room.currentRound + 1;

  const newRound: Round = {
    id: `tap_${roundNumber}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    number: roundNumber,
    signalFiredAt: null,
    startedAt: null,
    endsAt: null,
    taps: {},
    tapCounts: {},
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

  setDuelTimer(setTimeout(startBattle, READY_DISPLAY_MS));
}

function startBattle() {
  const room = getRoom();
  const idx = room.rounds.length - 1;
  if (idx < 0) return;

  const startedAt = Date.now();
  const endsAt = startedAt + ROUND_DURATION_MS;
  const currentRound = room.rounds[idx]!;

  const updatedRounds = [...room.rounds];
  updatedRounds[idx] = {
    ...currentRound,
    startedAt,
    endsAt,
    tapCounts: Object.fromEntries(room.players.map((p) => [p.id, 0])),
  };

  updateRoom({ status: "signal", rounds: updatedRounds });
  setDuelTimer(setTimeout(beginRoundResolution, ROUND_DURATION_MS));
}

export function recordTap(playerId: string, tapDelta = 1): boolean {
  const room = getRoom();

  if (room.status !== "signal") return false;
  if (!room.players.find((p) => p.id === playerId)) return false;
  if (!Number.isFinite(tapDelta) || tapDelta < 1) return false;

  const roundIdx = room.rounds.length - 1;
  if (roundIdx < 0) return false;

  const currentRound = room.rounds[roundIdx]!;
  if (currentRound.result !== "pending") return false;
  if (
    currentRound.endsAt !== null &&
    currentRound.endsAt !== undefined &&
    Date.now() > currentRound.endsAt + ROUND_FINALIZATION_GRACE_MS
  ) {
    return false;
  }
  const nextCount = (currentRound.tapCounts?.[playerId] ?? 0) + Math.floor(tapDelta);
  const updatedRounds = [...room.rounds];
  updatedRounds[roundIdx] = {
    ...currentRound,
    taps: { ...currentRound.taps, [playerId]: Date.now() },
    tapCounts: { ...currentRound.tapCounts, [playerId]: nextCount },
  };

  updateRoom({ rounds: updatedRounds });
  return true;
}

function beginRoundResolution() {
  const room = getRoom();
  const roundIdx = room.rounds.length - 1;
  if (room.status !== "signal" || roundIdx < 0) return;

  const currentRound = room.rounds[roundIdx]!;
  if (currentRound.result !== "pending") return;

  setDuelTimer(setTimeout(resolveRound, ROUND_FINALIZATION_GRACE_MS));
}

function resolveRound() {
  const room = getRoom();
  const roundIdx = room.rounds.length - 1;
  if (roundIdx < 0) return;

  const currentRound = room.rounds[roundIdx]!;
  if (currentRound.result !== "pending") return;
  const counts = Object.fromEntries(
    room.players.map((player) => [player.id, currentRound.tapCounts?.[player.id] ?? 0])
  );

  let roundWinner: string | null = null;
  if (room.players.length >= 2) {
    const [p1, p2] = room.players as [Player, Player];
    const c1 = counts[p1.id] ?? 0;
    const c2 = counts[p2.id] ?? 0;
    if (c1 > c2) roundWinner = p1.id;
    else if (c2 > c1) roundWinner = p2.id;
  }

  const updatedRounds = [...room.rounds];
  updatedRounds[roundIdx] = {
    ...currentRound,
    result: "complete",
    winner: roundWinner,
    tapCounts: counts,
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

function resolveRematch() {
  const room = getRoom();
  if (room.status !== "rematch_wait") return;
  clearDuelTimer();

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
    const leaverId = room.players.find((p) => room.rematchVotes[p.id] !== "rematch")?.id;
    if (leaverId) removeLastSeen(leaverId);
    updateLastSeen(rematchPlayers[0]!.id);

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

  resetRoom();
}

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
