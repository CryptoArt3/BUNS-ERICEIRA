export type PlayerColor = "red" | "blue";

export type DuelGameType = "reaction" | "tap_battle" | "memory_flash";

export type Player = {
  id: string;
  name: string;
  color: PlayerColor;
  joinedAt: number;
};

export type Round = {
  number: number;
  signalFiredAt: number | null;
  startedAt?: number | null;
  endsAt?: number | null;
  taps: Record<string, number>; // playerId → tap timestamp (ms)
  tapCounts?: Record<string, number>; // playerId → tap count for tap battle
  memorySequence?: string[];
  memoryInputs?: Record<string, string[]>;
  memoryCompletedAt?: Record<string, number>;
  memoryCorrect?: Record<string, boolean>;
  reactionTimes: Record<string, number>; // playerId → ms from signal
  winner: string | null; // playerId or null (draw / unresolved)
  result: "pending" | "complete";
};

export type RematchVote = "rematch" | "leave";

export type RoomStatus =
  | "waiting" //  < 2 players
  | "countdown" //  3-2-1 before first round
  | "get_ready" //  tension phase — random delay before signal
  | "signal" //  TAP NOW!
  | "round_result" //  showing who won the round
  | "match_winner" //  brief celebration (2.5s) before rematch decision
  | "rematch_wait"; //  players choose rematch or leave (10s window)

export type GameRoom = {
  id: string;
  sessionId: string;
  gameType: DuelGameType;
  status: RoomStatus;
  players: Player[];
  scores: Record<string, number>; // playerId → round wins
  currentRound: number;
  totalRounds: number;
  rounds: Round[];
  countdownValue: number | null;
  winner: string | null; // playerId of match winner
  // ── Rematch ──────────────────────────────────────────────────────────────
  rematchVotes: Record<string, RematchVote>; // playerId → decision
  rematchCountdown: number | null; // seconds left in rematch window
  consecutiveMatchCount: number; // same-pair match counter (anti-monopoly)
  lastUpdatedAt: number;
};
