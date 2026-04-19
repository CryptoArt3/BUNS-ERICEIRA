import {
  clearDuelTimer,
  getLastSeen,
  getRoom,
  removeLastSeen,
  resetRoom,
  setDuelTimer,
  startCleanupInterval,
  updateLastSeen,
  updateRoom,
} from "./gameState";
import type { Player, RematchVote, Round } from "./types";

const COUNTDOWN_SECONDS = 3;
const SEQUENCE_STEP_MS = 550;
const SEQUENCE_BUFFER_MS = 900;
const INPUT_WINDOW_MS = 7000;
const ROUND_RESULT_DISPLAY_MS = 3000;
const MATCH_WINNER_DISPLAY_MS = 2500;
const REMATCH_WINDOW_SECONDS = 10;
const WINS_NEEDED = 2;
const MAX_CONSECUTIVE_MATCHES = 3;

const STALE_TIMEOUT_MS = 30_000;
const CLEANUP_INTERVAL_MS = 10_000;

const MEMORY_SYMBOLS = ["red", "yellow", "blue", "green"] as const;

function generateSequence(roundNumber: number): string[] {
  const length = Math.min(3 + roundNumber - 1, 5);
  return Array.from({ length }, () => {
    const index = Math.floor(Math.random() * MEMORY_SYMBOLS.length);
    return MEMORY_SYMBOLS[index]!;
  });
}

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

function startRound(replayCurrentRound = false) {
  const room = getRoom();
  const roundNumber = replayCurrentRound
    ? Math.max(room.currentRound, 1)
    : room.currentRound + 1;
  const sequence = generateSequence(roundNumber);

  const newRound: Round = {
    number: roundNumber,
    signalFiredAt: null,
    startedAt: Date.now(),
    endsAt: null,
    taps: {},
    reactionTimes: {},
    memorySequence: sequence,
    memoryInputs: {},
    memoryCompletedAt: {},
    memoryCorrect: {},
    winner: null,
    result: "pending",
  };

  updateRoom({
    status: "get_ready",
    currentRound: roundNumber,
    rounds: [...room.rounds, newRound],
    countdownValue: null,
  });

  const sequenceDuration = sequence.length * SEQUENCE_STEP_MS + SEQUENCE_BUFFER_MS;
  setDuelTimer(setTimeout(startInputPhase, sequenceDuration));
}

function startInputPhase() {
  const room = getRoom();
  const roundIdx = room.rounds.length - 1;
  if (roundIdx < 0) return;

  const currentRound = room.rounds[roundIdx]!;
  const startedAt = Date.now();
  const endsAt = startedAt + INPUT_WINDOW_MS;
  const updatedRounds = [...room.rounds];
  updatedRounds[roundIdx] = {
    ...currentRound,
    startedAt,
    endsAt,
  };

  updateRoom({ status: "signal", rounds: updatedRounds });
  setDuelTimer(setTimeout(resolveRound, INPUT_WINDOW_MS));
}

export function recordMemoryInput(playerId: string, symbol: string): boolean {
  const room = getRoom();
  if (room.status !== "signal") return false;
  if (!room.players.find((p) => p.id === playerId)) return false;
  if (!MEMORY_SYMBOLS.includes(symbol as (typeof MEMORY_SYMBOLS)[number])) {
    return false;
  }

  const roundIdx = room.rounds.length - 1;
  if (roundIdx < 0) return false;

  const currentRound = room.rounds[roundIdx]!;
  if (currentRound.result !== "pending") return false;
  if (currentRound.memoryCompletedAt?.[playerId] !== undefined) return false;

  const sequence = currentRound.memorySequence ?? [];
  const currentInputs = currentRound.memoryInputs?.[playerId] ?? [];
  const nextInputs = [...currentInputs, symbol];
  const expectedSymbol = sequence[currentInputs.length];
  const isStillCorrect = expectedSymbol === symbol;
  const completed = !isStillCorrect || nextInputs.length >= sequence.length;

  const updatedRounds = [...room.rounds];
  updatedRounds[roundIdx] = {
    ...currentRound,
    taps: { ...currentRound.taps, [playerId]: Date.now() },
    memoryInputs: { ...currentRound.memoryInputs, [playerId]: nextInputs },
    memoryCorrect: completed
      ? { ...currentRound.memoryCorrect, [playerId]: isStillCorrect && nextInputs.length === sequence.length }
      : currentRound.memoryCorrect,
    memoryCompletedAt: completed
      ? { ...currentRound.memoryCompletedAt, [playerId]: Date.now() }
      : currentRound.memoryCompletedAt,
  };

  updateRoom({ rounds: updatedRounds });

  const allResolved = room.players.every(
    (player) => updatedRounds[roundIdx]!.memoryCompletedAt?.[player.id] !== undefined
  );
  if (allResolved) {
    clearDuelTimer();
    setDuelTimer(setTimeout(resolveRound, 180));
  }

  return true;
}

function resolveRound() {
  const room = getRoom();
  const roundIdx = room.rounds.length - 1;
  if (roundIdx < 0) return;

  const currentRound = room.rounds[roundIdx]!;
  if (currentRound.result !== "pending") return;

  const sequence = currentRound.memorySequence ?? [];
  const memoryInputs = { ...currentRound.memoryInputs };
  const memoryCorrect = { ...currentRound.memoryCorrect };
  const memoryCompletedAt = { ...currentRound.memoryCompletedAt };

  for (const player of room.players) {
    const inputs = memoryInputs[player.id] ?? [];
    const isCorrect =
      inputs.length === sequence.length &&
      inputs.every((value, index) => value === sequence[index]);
    memoryInputs[player.id] = inputs;
    memoryCorrect[player.id] = isCorrect;
    if (memoryCompletedAt[player.id] === undefined) {
      memoryCompletedAt[player.id] = Number.POSITIVE_INFINITY;
    }
  }

  let roundWinner: string | null = null;
  if (room.players.length >= 2) {
    const [p1, p2] = room.players as [Player, Player];
    const p1Correct = memoryCorrect[p1.id] === true;
    const p2Correct = memoryCorrect[p2.id] === true;

    if (p1Correct && !p2Correct) roundWinner = p1.id;
    else if (p2Correct && !p1Correct) roundWinner = p2.id;
    else if (p1Correct && p2Correct) {
      const t1 = memoryCompletedAt[p1.id] ?? Number.POSITIVE_INFINITY;
      const t2 = memoryCompletedAt[p2.id] ?? Number.POSITIVE_INFINITY;
      if (t1 < t2) roundWinner = p1.id;
      else if (t2 < t1) roundWinner = p2.id;
    }
  }

  const updatedRounds = [...room.rounds];
  updatedRounds[roundIdx] = {
    ...currentRound,
    result: "complete",
    winner: roundWinner,
    memoryInputs,
    memoryCorrect,
    memoryCompletedAt,
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
    setDuelTimer(
      setTimeout(() => startRound(roundWinner === null), ROUND_RESULT_DISPLAY_MS)
    );
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
