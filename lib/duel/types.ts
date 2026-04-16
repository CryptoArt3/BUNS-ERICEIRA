export type PlayerColor = "red" | "blue";

export type Player = {
  id: string;
  name: string;
  color: PlayerColor;
  joinedAt: number;
};

export type Round = {
  number: number;
  signalFiredAt: number | null;
  taps: Record<string, number>; // playerId → tap timestamp (ms)
  reactionTimes: Record<string, number>; // playerId → ms from signal
  winner: string | null; // playerId or null (draw / unresolved)
  result: "pending" | "complete";
};

export type RoomStatus =
  | "waiting" //  < 2 players
  | "countdown" //  3-2-1 before first round
  | "get_ready" //  tension phase — random delay before signal
  | "signal" //  TAP NOW!
  | "round_result" //  showing who won the round
  | "match_winner"; //  showing match winner before reset

export type GameRoom = {
  id: string;
  status: RoomStatus;
  players: Player[];
  scores: Record<string, number>; // playerId → wins
  currentRound: number;
  totalRounds: number;
  rounds: Round[];
  countdownValue: number | null;
  winner: string | null; // playerId of match winner
  lastUpdatedAt: number;
};
