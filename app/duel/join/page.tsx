"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DuelGameType, GameRoom, RematchVote } from "@/lib/duel/types";

const MAX_CONSECUTIVE_MATCHES = 3; // mirrors reactionDuel.ts

const GAME_LABELS: Record<DuelGameType, string> = {
  reaction: "REACTION DUEL",
  tap_battle: "TAP BATTLE",
  memory_flash: "MEMORY FLASH",
};

const MEMORY_FLASH_OPTIONS = [
  {
    key: "red",
    label: "RED",
    shortLabel: "R",
    buttonClass: "border-[#ff5a5a]/60 bg-[#ff5a5a] text-black",
    tileClass: "border-[#ff5a5a]/50 bg-[#ff5a5a]/20 text-[#ff8d8d]",
  },
  {
    key: "yellow",
    label: "YELLOW",
    shortLabel: "Y",
    buttonClass: "border-buns-yellow/70 bg-buns-yellow text-black",
    tileClass: "border-buns-yellow/40 bg-buns-yellow/15 text-buns-yellow",
  },
  {
    key: "blue",
    label: "BLUE",
    shortLabel: "B",
    buttonClass: "border-[#57a0ff]/60 bg-[#57a0ff] text-black",
    tileClass: "border-[#57a0ff]/40 bg-[#57a0ff]/15 text-[#7fb7ff]",
  },
  {
    key: "green",
    label: "GREEN",
    shortLabel: "G",
    buttonClass: "border-[#52d684]/60 bg-[#52d684] text-black",
    tileClass: "border-[#52d684]/40 bg-[#52d684]/15 text-[#7ff0aa]",
  },
] as const;

function getMemoryOption(symbol: string) {
  return (
    MEMORY_FLASH_OPTIONS.find((option) => option.key === symbol) ??
    MEMORY_FLASH_OPTIONS[0]
  );
}

// ── Player ID management ──────────────────────────────────────────────────────

function getOrCreatePlayerId(): string {
  const stored = sessionStorage.getItem("buns_duel_player_id");
  if (stored) return stored;
  const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  sessionStorage.setItem("buns_duel_player_id", id);
  return id;
}

function createFreshPlayerId(): string {
  const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  sessionStorage.setItem("buns_duel_player_id", id);
  return id;
}

function clearStoredPlayerId(): void {
  sessionStorage.removeItem("buns_duel_player_id");
}

// ── SSE hook ──────────────────────────────────────────────────────────────────

function useDuelRoom() {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;
    let retryDelay = 3_000;
    let isClosed = false;
    let lastUpdatedAt = 0;

    // Poll fallback — catches silent SSE death by comparing lastUpdatedAt.
    // Runs every 15 s regardless of SSE state; no-ops when SSE is healthy.
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/duel/room");
        const data = (await res.json()) as GameRoom;
        if (data.lastUpdatedAt > lastUpdatedAt) {
          lastUpdatedAt = data.lastUpdatedAt;
          setRoom(data);
        }
      } catch {
        // ignore — SSE or next poll will recover
      }
    }, 15_000);

    const connect = () => {
      if (isClosed) return;
      es = new EventSource("/api/duel/events");

      es.onopen = () => {
        setConnected(true);
        retryDelay = 3_000; // reset backoff on successful connection
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as GameRoom;
          lastUpdatedAt = data.lastUpdatedAt;
          setRoom(data);
        } catch {
          // ignore
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        // Exponential backoff: 3 → 6 → 12 → 24 → 30 s cap
        retryTimeout = setTimeout(() => connect(), retryDelay);
        retryDelay = Math.min(retryDelay * 2, 30_000);
      };
    };

    connect();
    return () => {
      isClosed = true;
      clearTimeout(retryTimeout);
      clearInterval(pollInterval);
      es?.close();
    };
  }, []);

  return { room, setRoom, connected };
}

// ── Components ────────────────────────────────────────────────────────────────

function Logo({ gameType = "reaction" }: { gameType?: DuelGameType }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-display text-3xl font-black uppercase tracking-wider text-buns-yellow [text-shadow:0_0_30px_rgba(255,212,0,0.5)]">
        BUNS DUEL
      </span>
      <span className="font-body text-[0.55rem] uppercase tracking-[0.5em] text-white/40">
        {GAME_LABELS[gameType]}
      </span>
    </div>
  );
}

// ── Join screen ───────────────────────────────────────────────────────────────

function JoinView({
  onJoin,
  joining,
  error,
  gameType,
  disabled,
}: {
  onJoin: (name: string) => void;
  joining: boolean;
  error: string | null;
  gameType?: DuelGameType;
  disabled?: boolean;
}) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onJoin(name);
  };

  return (
    <motion.div
      key="join"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex h-full flex-col items-center justify-between py-12 px-6"
    >
      <Logo gameType={gameType} />

      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <p className="font-display text-2xl font-black uppercase text-white tracking-wide">
            JOIN THE DUEL
          </p>
          <p className="mt-1 font-body text-xs uppercase tracking-[0.3em] text-white/40">
            Enter your name to play
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            maxLength={16}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-center font-display text-xl uppercase tracking-wide text-white placeholder-white/20 outline-none focus:border-buns-yellow/50 focus:bg-white/8"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
          />

          {error && (
            <p className="text-center font-body text-xs text-red-400 uppercase tracking-widest">
              {error}
            </p>
          )}

          <motion.button
            type="submit"
            disabled={joining || disabled}
            whileTap={{ scale: 0.96 }}
            className="relative w-full overflow-hidden rounded-xl bg-buns-yellow py-5 font-display text-2xl font-black uppercase tracking-wider text-black disabled:opacity-60"
          >
            {joining ? "JOINING..." : disabled ? "PREPARING..." : "ENTER DUEL"}
          </motion.button>
        </form>
      </div>

      <p className="font-body text-[0.6rem] uppercase tracking-[0.4em] text-white/20">
        BUNS · ERICEIRA
      </p>
    </motion.div>
  );
}

// ── Lobby / waiting screen ────────────────────────────────────────────────────

function LobbyView({
  room,
  playerId,
}: {
  room: GameRoom;
  playerId: string;
}) {
  const me = room.players.find((p) => p.id === playerId);
  const opponent = room.players.find((p) => p.id !== playerId);
  const playerNum = me?.color === "red" ? 1 : 2;

  return (
    <motion.div
      key="lobby"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full flex-col items-center justify-between py-12 px-6"
    >
      <Logo gameType={room.gameType} />

      <div className="flex flex-col items-center gap-8 w-full max-w-sm">
        {/* Player badge */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-8 py-6 ${
            me?.color === "red"
              ? "border-[#FF4444]/60 bg-[#FF4444]/10"
              : "border-[#4488FF]/60 bg-[#4488FF]/10"
          }`}
        >
          <span className="font-body text-[0.6rem] uppercase tracking-[0.4em] text-white/50">
            YOU ARE
          </span>
          <span
            className={`font-display text-4xl font-black uppercase tracking-wide ${
              me?.color === "red" ? "text-[#FF4444]" : "text-[#4488FF]"
            }`}
          >
            {me?.name ?? `PLAYER ${playerNum}`}
          </span>
          <span className="font-body text-[0.55rem] uppercase tracking-[0.3em] text-white/30">
            PLAYER {playerNum}
          </span>
        </motion.div>

        {/* Opponent status */}
        <div className="flex w-full flex-col items-center gap-3">
          {opponent ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <span className="font-body text-sm uppercase tracking-[0.3em] text-white/70">
                {opponent.name} joined!
              </span>
            </motion.div>
          ) : (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center gap-3"
            >
              <div className="h-2 w-2 rounded-full bg-white/30" />
              <span className="font-body text-sm uppercase tracking-[0.4em] text-white/40">
                Waiting for opponent...
              </span>
            </motion.div>
          )}
        </div>
      </div>

      <p className="font-body text-[0.6rem] uppercase tracking-[0.4em] text-white/20">
        BEST OF {room.totalRounds} ROUNDS
      </p>
    </motion.div>
  );
}

// ── Countdown view ────────────────────────────────────────────────────────────

function CountdownView({ room }: { room: GameRoom }) {
  return (
    <motion.div
      key="countdown"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full flex-col items-center justify-center gap-6"
    >
      <span className="font-body text-xs uppercase tracking-[0.5em] text-white/50">
        GET READY
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={room.countdownValue}
          initial={{ scale: 2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="font-display text-[9rem] font-black leading-none text-buns-yellow [text-shadow:0_0_60px_rgba(255,212,0,0.8)]"
        >
          {room.countdownValue}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}

// ── Get ready view ────────────────────────────────────────────────────────────

function GetReadyView({ room }: { room: GameRoom }) {
  return (
    <motion.div
      key={`get_ready_${room.currentRound}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full flex-col items-center justify-center gap-6 px-8"
    >
      <span className="font-body text-xs uppercase tracking-[0.4em] text-white/40">
        ROUND {room.currentRound} OF {room.totalRounds}
      </span>
      <motion.span
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="font-display text-6xl font-black uppercase text-white leading-none tracking-wide text-center"
      >
        GET
        <br />
        READY
      </motion.span>
      <span className="font-body text-xs uppercase tracking-[0.4em] text-white/30">
        Wait for the signal...
      </span>
    </motion.div>
  );
}

// ── Signal / tap view ─────────────────────────────────────────────────────────

function SignalView({
  room,
  playerId,
  onTap,
  tapped,
}: {
  room: GameRoom;
  playerId: string;
  onTap: () => void;
  tapped: boolean;
}) {
  const lastRound = room.rounds[room.rounds.length - 1];
  const myTapTime = lastRound?.taps[playerId];
  const hasTapped = myTapTime !== undefined || tapped;

  return (
    <motion.div
      key={`signal_${room.currentRound}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative flex h-full w-full flex-col overflow-hidden"
    >
      {/* Fullscreen tap zone */}
      <motion.button
        onPointerDown={hasTapped ? undefined : onTap}
        disabled={hasTapped}
        className={`flex h-full w-full flex-col items-center justify-center gap-6 transition-colors duration-200 select-none ${
          hasTapped
            ? "bg-white/10"
            : "bg-buns-yellow active:bg-buns-yellow/80"
        }`}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.15 }}
      >
        {!hasTapped ? (
          <>
            <motion.span
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 0.4, repeat: Infinity }}
              className="font-display text-[7rem] font-black uppercase leading-none text-black tracking-wide"
            >
              TAP!
            </motion.span>
            <span className="font-body text-xs uppercase tracking-[0.5em] text-black/60">
              Tap anywhere
            </span>
          </>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <span className="font-display text-6xl font-black text-white">✓</span>
            <span className="font-body text-sm uppercase tracking-[0.4em] text-white/70">
              Tapped!
            </span>
          </motion.div>
        )}
      </motion.button>
    </motion.div>
  );
}

function TapBattleSignalView({
  room,
  playerId,
  onTap,
}: {
  room: GameRoom;
  playerId: string;
  onTap: () => void;
}) {
  const lastRound = room.rounds[room.rounds.length - 1];
  const myCount = lastRound?.tapCounts?.[playerId] ?? 0;
  const opponent = room.players.find((p) => p.id !== playerId);
  const opponentCount = opponent ? (lastRound?.tapCounts?.[opponent.id] ?? 0) : 0;

  return (
    <motion.div
      key={`tap_battle_${room.currentRound}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative flex h-full w-full flex-col overflow-hidden"
    >
      <div className="absolute left-4 right-4 top-6 z-10 flex items-center justify-between rounded-full border border-white/10 bg-black/35 px-4 py-2 backdrop-blur-sm">
        <div className="flex flex-col">
          <span className="font-body text-[0.55rem] uppercase tracking-[0.35em] text-white/40">
            Tap Battle
          </span>
          <span className="font-display text-lg font-black uppercase text-white">
            Round {room.currentRound}
          </span>
        </div>
        <div className="text-right">
          <span className="font-body text-[0.55rem] uppercase tracking-[0.35em] text-white/40">
            Live count
          </span>
          <div className="font-display text-2xl font-black text-buns-yellow">
            {myCount} · {opponentCount}
          </div>
        </div>
      </div>

      <motion.button
        onPointerDown={onTap}
        className="flex h-full w-full flex-col items-center justify-center gap-6 bg-buns-yellow active:bg-buns-yellow/85 select-none"
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.12 }}
      >
        <motion.span
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 0.3, repeat: Infinity }}
          className="font-display text-[5.5rem] font-black uppercase leading-none text-black tracking-wide"
        >
          TAP FAST
        </motion.span>
        <span className="font-body text-xs uppercase tracking-[0.5em] text-black/60">
          Keep tapping until the round ends
        </span>
        <div className="mt-2 flex items-center gap-6">
          <div className="flex flex-col items-center">
            <span className="font-body text-[0.55rem] uppercase tracking-[0.35em] text-black/50">
              You
            </span>
            <span className="font-display text-5xl font-black text-black">
              {myCount}
            </span>
          </div>
          <div className="h-12 w-px bg-black/10" />
          <div className="flex flex-col items-center">
            <span className="font-body text-[0.55rem] uppercase tracking-[0.35em] text-black/50">
              Opponent
            </span>
            <span className="font-display text-5xl font-black text-black/75">
              {opponentCount}
            </span>
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}

function MemorySequencePreview({
  sequence,
  entered,
  concealed = false,
}: {
  sequence: string[];
  entered?: string[];
  concealed?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {sequence.map((symbol, index) => {
        const option = getMemoryOption(symbol);
        const matched = entered?.[index] === symbol;
        const missed = entered !== undefined && entered[index] !== undefined && !matched;
        return (
          <div
            key={`${symbol}-${index}`}
            className={`flex h-16 w-16 items-center justify-center rounded-2xl border font-display text-lg font-black uppercase tracking-[0.25em] ${
              missed
                ? "border-red-400/50 bg-red-500/15 text-red-300"
                : matched
                ? "border-white/40 bg-white/10 text-white"
                : concealed
                ? "border-white/10 bg-white/[0.03] text-white/20"
                : option.tileClass
            }`}
          >
            {concealed && !matched && !missed ? "•" : option.shortLabel}
          </div>
        );
      })}
    </div>
  );
}

function MemoryFlashGetReadyView({ room }: { room: GameRoom }) {
  const lastRound = room.rounds[room.rounds.length - 1];
  const sequence = lastRound?.memorySequence ?? [];

  return (
    <motion.div
      key={`memory_get_ready_${room.currentRound}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full flex-col items-center justify-between px-6 py-10"
    >
      <Logo gameType={room.gameType} />

      <div className="flex w-full max-w-sm flex-col items-center gap-5 text-center">
        <span className="font-body text-[0.6rem] uppercase tracking-[0.4em] text-white/35">
          ROUND {room.currentRound} · WATCH THE PATTERN
        </span>
        <span className="font-display text-5xl font-black uppercase leading-none tracking-wide text-buns-yellow">
          MEMORY
          <br />
          FLASH
        </span>
        <p className="font-body text-xs uppercase tracking-[0.28em] text-white/45">
          Memorize the sequence, then repeat it fast.
        </p>
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-6">
          <MemorySequencePreview sequence={sequence} />
        </div>
      </div>

      <p className="font-body text-[0.58rem] uppercase tracking-[0.36em] text-white/25">
        Sequence reveal in progress...
      </p>
    </motion.div>
  );
}

function MemoryFlashSignalView({
  room,
  playerId,
  onInput,
}: {
  room: GameRoom;
  playerId: string;
  onInput: (symbol: string) => void;
}) {
  const lastRound = room.rounds[room.rounds.length - 1];
  const sequence = lastRound?.memorySequence ?? [];
  const myInputs = lastRound?.memoryInputs?.[playerId] ?? [];
  const completed = lastRound?.memoryCompletedAt?.[playerId] !== undefined;
  const correct = lastRound?.memoryCorrect?.[playerId];
  const progress = Math.min(myInputs.length, sequence.length);

  return (
    <motion.div
      key={`memory_signal_${room.currentRound}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full flex-col items-center justify-between px-5 py-8"
    >
      <div className="flex w-full items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-body text-[0.55rem] uppercase tracking-[0.35em] text-white/35">
            Memory Flash
          </span>
          <span className="font-display text-2xl font-black uppercase text-white">
            Repeat the sequence
          </span>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-right">
          <span className="font-body text-[0.5rem] uppercase tracking-[0.3em] text-white/35">
            Progress
          </span>
          <div className="font-display text-2xl font-black text-buns-yellow">
            {progress}/{sequence.length}
          </div>
        </div>
      </div>

      <div className="flex w-full max-w-sm flex-col items-center gap-5">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-6">
          <MemorySequencePreview
            sequence={sequence}
            entered={myInputs}
            concealed
          />
        </div>

        <div className="grid w-full grid-cols-2 gap-4">
          {MEMORY_FLASH_OPTIONS.map((option) => (
            <motion.button
              key={option.key}
              type="button"
              whileTap={{ scale: completed ? 1 : 0.96 }}
              onPointerDown={() => onInput(option.key)}
              disabled={completed}
              className={`rounded-3xl border px-4 py-8 font-display text-2xl font-black uppercase tracking-[0.25em] shadow-[0_0_35px_rgba(0,0,0,0.2)] disabled:opacity-45 ${option.buttonClass}`}
            >
              {option.shortLabel}
            </motion.button>
          ))}
        </div>
      </div>

      <p className="font-body text-[0.62rem] uppercase tracking-[0.32em] text-white/35 text-center">
        {completed
          ? correct
            ? "Sequence locked in."
            : "Wrong move. Waiting for round result."
          : "Repeat from memory. Filled slots track your progress."}
      </p>
    </motion.div>
  );
}

// ── Round result view ─────────────────────────────────────────────────────────

function RoundResultView({
  room,
  playerId,
}: {
  room: GameRoom;
  playerId: string;
}) {
  const lastRound = room.rounds[room.rounds.length - 1];
  const iWon = lastRound?.winner === playerId;
  const isDraw = lastRound?.winner === null;
  const myTime = lastRound?.reactionTimes[playerId];
  const myTimeLabel =
    myTime === undefined ? "—" : myTime > 2500 ? "MISS" : `${myTime}ms`;

  return (
    <motion.div
      key={`result_${room.currentRound}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full flex-col items-center justify-between py-12 px-6"
    >
      <Logo gameType={room.gameType} />

      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        <span className="font-body text-[0.6rem] uppercase tracking-[0.4em] text-white/40">
          Round {lastRound?.number ?? room.currentRound}
        </span>

        {isDraw ? (
          <span className="font-display text-5xl font-black uppercase text-white/60 tracking-widest">
            DRAW
          </span>
        ) : iWon ? (
          <motion.span
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="font-display text-5xl font-black uppercase text-buns-yellow [text-shadow:0_0_40px_rgba(255,212,0,0.8)] tracking-wide"
          >
            YOU WIN!
          </motion.span>
        ) : (
          <span className="font-display text-5xl font-black uppercase text-white/50 tracking-wide">
            OPPONENT WINS
          </span>
        )}

        <span className="font-body text-2xl text-white/60">
          Your reaction: <strong className="text-white">{myTimeLabel}</strong>
        </span>

        {/* Score */}
        <div className="mt-4 flex items-center gap-6">
          {room.players.map((p, i) => (
            <div key={p.id} className="flex flex-col items-center gap-1">
              <span
                className={`font-body text-xs uppercase tracking-widest ${
                  p.id === playerId ? "text-buns-yellow" : "text-white/40"
                }`}
              >
                {p.id === playerId ? "YOU" : p.name}
              </span>
              <span className="font-display text-4xl font-black text-white">
                {room.scores[p.id] ?? 0}
              </span>
              {i === 0 && (
                <span className="font-display text-xl text-white/20">—</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <motion.p
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="font-body text-xs uppercase tracking-[0.4em] text-white/30"
      >
        Next round starting...
      </motion.p>
    </motion.div>
  );
}

function TapBattleRoundResultView({
  room,
  playerId,
}: {
  room: GameRoom;
  playerId: string;
}) {
  const lastRound = room.rounds[room.rounds.length - 1];
  const iWon = lastRound?.winner === playerId;
  const isDraw = lastRound?.winner === null;
  const me = room.players.find((p) => p.id === playerId);
  const opponent = room.players.find((p) => p.id !== playerId);
  const myCount = lastRound?.tapCounts?.[playerId] ?? 0;
  const opponentCount = opponent ? (lastRound?.tapCounts?.[opponent.id] ?? 0) : 0;

  return (
    <motion.div
      key={`tap_battle_result_${room.currentRound}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full flex-col items-center justify-between py-12 px-6"
    >
      <Logo gameType={room.gameType} />

      <div className="flex w-full max-w-sm flex-col items-center gap-5">
        <span className="font-body text-[0.6rem] uppercase tracking-[0.4em] text-white/40">
          Round {lastRound?.number ?? room.currentRound}
        </span>

        {isDraw ? (
          <span className="font-display text-5xl font-black uppercase text-white/60 tracking-widest">
            DRAW
          </span>
        ) : iWon ? (
          <span className="font-display text-5xl font-black uppercase text-buns-yellow [text-shadow:0_0_40px_rgba(255,212,0,0.8)] tracking-wide">
            YOU WIN!
          </span>
        ) : (
          <span className="font-display text-5xl font-black uppercase text-white/50 tracking-wide">
            OPPONENT WINS
          </span>
        )}

        <div className="grid w-full grid-cols-2 gap-4">
          <div className="rounded-2xl border border-buns-yellow/20 bg-white/5 px-5 py-4 text-center">
            <span className="font-body text-[0.55rem] uppercase tracking-[0.3em] text-white/35">
              {me?.name ?? "YOU"}
            </span>
            <div className="mt-2 font-display text-5xl font-black text-buns-yellow">
              {myCount}
            </div>
            <div className="font-body text-[0.55rem] uppercase tracking-[0.3em] text-white/35">
              taps
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center">
            <span className="font-body text-[0.55rem] uppercase tracking-[0.3em] text-white/35">
              {opponent?.name ?? "OPP"}
            </span>
            <div className="mt-2 font-display text-5xl font-black text-white">
              {opponentCount}
            </div>
            <div className="font-body text-[0.55rem] uppercase tracking-[0.3em] text-white/35">
              taps
            </div>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-6">
          {room.players.map((p, i) => (
            <div key={p.id} className="flex flex-col items-center gap-1">
              <span
                className={`font-body text-xs uppercase tracking-widest ${
                  p.id === playerId ? "text-buns-yellow" : "text-white/40"
                }`}
              >
                {p.id === playerId ? "YOU" : p.name}
              </span>
              <span className="font-display text-4xl font-black text-white">
                {room.scores[p.id] ?? 0}
              </span>
              {i === 0 && <span className="font-display text-xl text-white/20">—</span>}
            </div>
          ))}
        </div>
      </div>

      <motion.p
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="font-body text-xs uppercase tracking-[0.4em] text-white/30"
      >
        Next round starting...
      </motion.p>
    </motion.div>
  );
}

function MemoryFlashRoundResultView({
  room,
  playerId,
}: {
  room: GameRoom;
  playerId: string;
}) {
  const lastRound = room.rounds[room.rounds.length - 1];
  const iWon = lastRound?.winner === playerId;
  const isDraw = lastRound?.winner === null;
  const me = room.players.find((p) => p.id === playerId);
  const opponent = room.players.find((p) => p.id !== playerId);
  const myCorrect = lastRound?.memoryCorrect?.[playerId] === true;
  const opponentCorrect = opponent
    ? lastRound?.memoryCorrect?.[opponent.id] === true
    : false;
  const startedAt = lastRound?.startedAt ?? 0;
  const myCompletedAt = lastRound?.memoryCompletedAt?.[playerId];
  const opponentCompletedAt = opponent
    ? lastRound?.memoryCompletedAt?.[opponent.id]
    : undefined;

  const formatTime = (value: number | undefined) =>
    value === undefined || !Number.isFinite(value)
      ? "MISS"
      : `${Math.max(0, value - startedAt)}ms`;

  return (
    <motion.div
      key={`memory_result_${room.currentRound}`}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full flex-col items-center justify-between px-6 py-10"
    >
      <Logo gameType={room.gameType} />

      <div className="flex w-full max-w-sm flex-col items-center gap-5">
        <span className="font-body text-[0.58rem] uppercase tracking-[0.4em] text-white/35">
          Round {lastRound?.number ?? room.currentRound}
        </span>

        {isDraw ? (
          <span className="font-display text-5xl font-black uppercase tracking-wide text-white/65">
            DRAW
          </span>
        ) : iWon ? (
          <span className="font-display text-5xl font-black uppercase tracking-wide text-buns-yellow [text-shadow:0_0_40px_rgba(255,212,0,0.8)]">
            YOU WIN!
          </span>
        ) : (
          <span className="font-display text-5xl font-black uppercase tracking-wide text-white/50">
            OPPONENT WINS
          </span>
        )}

        <div className="grid w-full grid-cols-2 gap-4">
          <div className="rounded-2xl border border-buns-yellow/20 bg-white/5 px-5 py-4 text-center">
            <span className="font-body text-[0.55rem] uppercase tracking-[0.3em] text-white/35">
              {me?.name ?? "YOU"}
            </span>
            <div className="mt-2 font-display text-3xl font-black text-buns-yellow">
              {myCorrect ? "CORRECT" : "MISS"}
            </div>
            <div className="font-body text-[0.55rem] uppercase tracking-[0.3em] text-white/35">
              {formatTime(myCompletedAt)}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center">
            <span className="font-body text-[0.55rem] uppercase tracking-[0.3em] text-white/35">
              {opponent?.name ?? "OPP"}
            </span>
            <div className="mt-2 font-display text-3xl font-black text-white">
              {opponentCorrect ? "CORRECT" : "MISS"}
            </div>
            <div className="font-body text-[0.55rem] uppercase tracking-[0.3em] text-white/35">
              {formatTime(opponentCompletedAt)}
            </div>
          </div>
        </div>

        <div className="mt-1 flex items-center gap-6">
          {room.players.map((p, i) => (
            <div key={p.id} className="flex flex-col items-center gap-1">
              <span
                className={`font-body text-xs uppercase tracking-widest ${
                  p.id === playerId ? "text-buns-yellow" : "text-white/40"
                }`}
              >
                {p.id === playerId ? "YOU" : p.name}
              </span>
              <span className="font-display text-4xl font-black text-white">
                {room.scores[p.id] ?? 0}
              </span>
              {i === 0 && <span className="font-display text-xl text-white/20">—</span>}
            </div>
          ))}
        </div>
      </div>

      <motion.p
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="font-body text-xs uppercase tracking-[0.4em] text-white/30"
      >
        {isDraw ? "Replaying the round..." : "Next round starting..."}
      </motion.p>
    </motion.div>
  );
}

// ── Match winner view ─────────────────────────────────────────────────────────

function MatchWinnerView({
  room,
  playerId,
}: {
  room: GameRoom;
  playerId: string;
}) {
  const iWon = room.winner === playerId;
  const winner = room.players.find((p) => p.id === room.winner);

  return (
    <motion.div
      key="match_winner"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full flex-col items-center justify-center gap-8 px-8"
    >
      {iWon ? (
        <>
          <motion.div
            animate={{ rotate: [-3, 3, -3] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="font-display text-[5rem] font-black uppercase leading-none text-buns-yellow [text-shadow:0_0_60px_rgba(255,212,0,0.9)] text-center"
          >
            YOU
            <br />
            WIN!
          </motion.div>
          <span className="font-display text-xl font-black uppercase text-white/60 tracking-widest">
            CHAMPION 🏆
          </span>
        </>
      ) : (
        <>
          <span className="font-display text-[4rem] font-black uppercase leading-none text-white/50 text-center">
            GG
          </span>
          <span className="font-display text-xl font-black uppercase text-white/40 tracking-widest">
            {winner?.name ?? "Opponent"} wins this time
          </span>
        </>
      )}

      <motion.p
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="font-body text-xs uppercase tracking-[0.4em] text-white/30"
      >
        Deciding rematch...
      </motion.p>
    </motion.div>
  );
}

// ── Rematch wait view (mobile) ────────────────────────────────────────────────

function RematchWaitView({
  room,
  playerId,
  onVote,
  myVote,
}: {
  room: GameRoom;
  playerId: string;
  onVote: (vote: RematchVote) => void;
  myVote: RematchVote | undefined;
}) {
  const opponent = room.players.find((p) => p.id !== playerId);
  const opponentVote = opponent
    ? (room.rematchVotes[opponent.id] as RematchVote | undefined)
    : undefined;
  const isLastGame = room.consecutiveMatchCount >= MAX_CONSECUTIVE_MATCHES;

  return (
    <motion.div
      key="rematch_wait"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex h-full flex-col items-center justify-between py-10 px-6"
    >
      {/* Logo + fair-play notice */}
      <div className="flex flex-col items-center gap-2">
        <Logo gameType={room.gameType} />
        {isLastGame && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1 font-body text-[0.6rem] uppercase tracking-[0.3em] text-buns-orange text-center"
          >
            Fair play limit — new challengers after this
          </motion.span>
        )}
      </div>

      {/* Countdown */}
      <div className="flex flex-col items-center gap-1">
        <span className="font-body text-[0.55rem] uppercase tracking-[0.5em] text-white/35">
          DECIDE IN
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={room.rematchCountdown}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="font-display text-[8rem] font-black leading-none text-white/75"
          >
            {room.rematchCountdown ?? "—"}
          </motion.span>
        </AnimatePresence>
        <span className="font-body text-[0.55rem] uppercase tracking-[0.4em] text-white/25">
          seconds
        </span>
      </div>

      {/* Decision area */}
      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        {!myVote ? (
          <>
            <motion.button
              onClick={() => onVote("rematch")}
              whileTap={{ scale: 0.96 }}
              className="w-full rounded-xl bg-buns-yellow py-5 font-display text-2xl font-black uppercase tracking-wide text-black"
            >
              REMATCH
            </motion.button>
            <motion.button
              onClick={() => onVote("leave")}
              whileTap={{ scale: 0.96 }}
              className="w-full rounded-xl border border-white/15 py-4 font-display text-xl font-black uppercase tracking-wide text-white/45"
            >
              LEAVE
            </motion.button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`font-display text-3xl font-black uppercase tracking-wide ${
                myVote === "rematch" ? "text-buns-yellow" : "text-white/40"
              }`}
            >
              {myVote === "rematch" ? "REMATCH ✓" : "LEAVING..."}
            </motion.span>
            {myVote === "rematch" && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="font-body text-sm uppercase tracking-[0.3em] text-white/35 text-center"
              >
                {opponentVote === undefined
                  ? "Waiting for opponent..."
                  : opponentVote === "rematch"
                  ? "Opponent wants rematch!"
                  : "Opponent is leaving..."}
              </motion.span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Room full view ────────────────────────────────────────────────────────────

function RoomFullView({ room }: { room: GameRoom }) {
  return (
    <motion.div
      key="full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center"
    >
      <Logo gameType={room.gameType} />
      <span className="font-display text-4xl font-black uppercase text-white/60 tracking-wide">
        ROOM FULL
      </span>
      <p className="font-body text-sm text-white/40 uppercase tracking-widest">
        A duel is already in progress.
        <br />
        Wait for the next round.
      </p>
      <p className="mt-4 font-body text-xs uppercase tracking-[0.3em] text-white/20">
        Status: {room.status.replace(/_/g, " ").toUpperCase()}
      </p>
    </motion.div>
  );
}

// ── Root page ─────────────────────────────────────────────────────────────────

export default function DuelJoinPage() {
  const { room, setRoom, connected } = useDuelRoom();
  const [playerId, setPlayerId] = useState<string>("");
  const [joining, setJoining] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [hasTapped, setHasTapped] = useState(false);
  const [myRematchVote, setMyRematchVote] = useState<RematchVote | undefined>(undefined);
  const prevRoundRef = useRef<number>(0);
  const wasInRoomRef = useRef(false);
  const tapBattlePendingRef = useRef(0);
  const tapBattlePendingRoundRef = useRef<number | null>(null);
  const tapBattleFlushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapBattleFlushInFlightRef = useRef(false);
  const latestRoomStatusRef = useRef<GameRoom["status"] | null>(null);
  const latestGameTypeRef = useRef<DuelGameType | null>(null);
  const prevRoomSessionIdRef = useRef<string | null>(null);

  const resetLocalSession = useCallback(() => {
    clearStoredPlayerId();
    const nextPlayerId = createFreshPlayerId();
    wasInRoomRef.current = false;
    setPlayerId(nextPlayerId);
    setJoining(false);
    setJoinError(null);
    setHasTapped(false);
    setMyRematchVote(undefined);
    tapBattlePendingRef.current = 0;
    tapBattlePendingRoundRef.current = null;
    tapBattleFlushInFlightRef.current = false;
    if (tapBattleFlushTimeoutRef.current) {
      clearTimeout(tapBattleFlushTimeoutRef.current);
      tapBattleFlushTimeoutRef.current = null;
    }
  }, []);

  // Init player ID on mount
  useEffect(() => {
    setPlayerId(getOrCreatePlayerId());
  }, []);

  useEffect(() => {
    latestRoomStatusRef.current = room?.status ?? null;
    latestGameTypeRef.current = room?.gameType ?? null;
  }, [room]);

  const isInRoom = room?.players.some((p) => p.id === playerId) ?? false;
  const roomSessionId = room?.sessionId ?? null;

  useEffect(() => {
    if (!roomSessionId) return;
    const previousRoomSessionId = prevRoomSessionIdRef.current;
    prevRoomSessionIdRef.current = roomSessionId;

    if (previousRoomSessionId && previousRoomSessionId !== roomSessionId) {
      setJoining(false);
      setJoinError(null);
      setHasTapped(false);
      setMyRematchVote(undefined);
      tapBattlePendingRef.current = 0;
      tapBattlePendingRoundRef.current = null;
      tapBattleFlushInFlightRef.current = false;
      if (tapBattleFlushTimeoutRef.current) {
        clearTimeout(tapBattleFlushTimeoutRef.current);
        tapBattleFlushTimeoutRef.current = null;
      }

      if (!isInRoom) {
        resetLocalSession();
      }
    }
  }, [roomSessionId, isInRoom, resetLocalSession]);

  // Handle player removal: if we were joined but are no longer in the room
  // (opponent left and we were removed, or full room reset), go back to join screen.
  useEffect(() => {
    if (!room || !playerId) return;
    const wasInRoom = wasInRoomRef.current;
    wasInRoomRef.current = isInRoom;
    if (!joining && wasInRoom && !isInRoom) {
      resetLocalSession();
    }
  }, [room, playerId, joining, isInRoom, resetLocalSession]);

  // Reset tap state when round changes
  useEffect(() => {
    if (!room) return;
    if (room.currentRound !== prevRoundRef.current) {
      prevRoundRef.current = room.currentRound;
      setHasTapped(false);
      tapBattlePendingRef.current = 0;
      tapBattlePendingRoundRef.current = null;
      tapBattleFlushInFlightRef.current = false;
      if (tapBattleFlushTimeoutRef.current) {
        clearTimeout(tapBattleFlushTimeoutRef.current);
        tapBattleFlushTimeoutRef.current = null;
      }
    }
  }, [room]);

  useEffect(() => {
    if (room?.gameType !== "tap_battle" || room.status === "signal") return;
    tapBattlePendingRef.current = 0;
    tapBattlePendingRoundRef.current = null;
    tapBattleFlushInFlightRef.current = false;
    if (tapBattleFlushTimeoutRef.current) {
      clearTimeout(tapBattleFlushTimeoutRef.current);
      tapBattleFlushTimeoutRef.current = null;
    }
  }, [room?.gameType, room?.status]);

  // Clear rematch vote once the rematch_wait window closes (any direction)
  useEffect(() => {
    if (!room) return;
    if (room.status !== "rematch_wait") {
      setMyRematchVote(undefined);
    }
  }, [room?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Presence: heartbeat ───────────────────────────────────────────────────
  // Send a lightweight ping every 12 s while in the room.
  // The server removes players that go silent for > 30 s (STALE_TIMEOUT_MS).
  // This covers the case where the browser closes without firing pagehide
  // (e.g. iOS Safari background kill, crash, network drop).
  useEffect(() => {
    if (!playerId || !isInRoom) return;

    const HEARTBEAT_MS = 12_000;

    const send = () => {
      fetch("/api/duel/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "heartbeat", playerId, roomSessionId }),
      }).catch(() => {}); // fire and forget
    };

    send(); // immediate first ping so the server refreshes lastSeen right away
    const interval = setInterval(send, HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [playerId, isInRoom, roomSessionId]);

  useEffect(() => {
    return () => {
      if (tapBattleFlushTimeoutRef.current) {
        clearTimeout(tapBattleFlushTimeoutRef.current);
      }
    };
  }, []);

  // ── Presence: explicit leave on page unload ───────────────────────────────
  // Fires a best-effort leave when the user navigates away, closes the tab,
  // or the browser puts the page in the background (mobile).
  //
  // sendBeacon is the most reliable mechanism on mobile — the browser
  // guarantees delivery even during page teardown. fetch with keepalive is
  // used as a fallback for environments where sendBeacon is unavailable.
  useEffect(() => {
    if (!playerId || !isInRoom) return;

    const leave = () => {
      const body = JSON.stringify({ type: "leave", playerId, roomSessionId });
      try {
        if (typeof navigator.sendBeacon === "function") {
          navigator.sendBeacon(
            "/api/duel/action",
            new Blob([body], { type: "application/json" })
          );
        } else {
          // keepalive keeps the request alive through page unload
          fetch("/api/duel/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        // Best-effort — the heartbeat timeout will clean up if this fails
      }
    };

    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
    };
  }, [playerId, isInRoom, roomSessionId]);

  const handleJoin = useCallback(
    async (name: string) => {
      if (!playerId) return;
      setJoining(true);
      setJoinError(null);

      try {
        const res = await fetch("/api/duel/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "join",
            playerId,
            playerName: name,
            roomSessionId,
          }),
        });
        const data = (await res.json()) as { success: boolean; room?: GameRoom };
        if (data.room) {
          setRoom(data.room);
        }
        if (data.success) {
          setJoinError(null);
        } else {
          setJoinError("Could not join. Room may be full or game in progress.");
        }
      } catch {
        setJoinError("Connection error. Try again.");
      } finally {
        setJoining(false);
      }
    },
    [playerId, roomSessionId, setRoom]
  );

  const flushTapBattleTaps = useCallback(async () => {
    if (!playerId || tapBattleFlushInFlightRef.current) return;

    const delta = tapBattlePendingRef.current;
    const pendingRoundNumber = tapBattlePendingRoundRef.current;
    if (delta <= 0) return;

    tapBattlePendingRef.current = 0;
    tapBattlePendingRoundRef.current = null;
    tapBattleFlushInFlightRef.current = true;

    try {
      const res = await fetch("/api/duel/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "tap",
          playerId,
          tapCount: delta,
          roomSessionId,
          roundNumber: pendingRoundNumber,
        }),
      });

      const data = (await res.json()) as { success?: boolean };
      const shouldRetry =
        latestGameTypeRef.current === "tap_battle" &&
        latestRoomStatusRef.current === "signal";
      if (!data.success && shouldRetry) {
        tapBattlePendingRef.current += delta;
        tapBattlePendingRoundRef.current = pendingRoundNumber;
      }
    } catch {
      const shouldRetry =
        latestGameTypeRef.current === "tap_battle" &&
        latestRoomStatusRef.current === "signal";
      if (shouldRetry) {
        tapBattlePendingRef.current += delta;
        tapBattlePendingRoundRef.current = pendingRoundNumber;
      }
    } finally {
      tapBattleFlushInFlightRef.current = false;
      const shouldRetry =
        latestGameTypeRef.current === "tap_battle" &&
        latestRoomStatusRef.current === "signal";
      if (tapBattlePendingRef.current > 0 && shouldRetry) {
        tapBattleFlushTimeoutRef.current = setTimeout(() => {
          tapBattleFlushTimeoutRef.current = null;
          void flushTapBattleTaps();
        }, 50);
      }
    }
  }, [playerId, roomSessionId]);

  const handleTap = useCallback(async () => {
    if (!playerId) return;

    if (room?.gameType === "tap_battle") {
      if (room.status !== "signal") return;
      if (tapBattlePendingRoundRef.current === null) {
        tapBattlePendingRoundRef.current = room.currentRound;
      }
      tapBattlePendingRef.current += 1;
      if (!tapBattleFlushTimeoutRef.current) {
        tapBattleFlushTimeoutRef.current = setTimeout(() => {
          tapBattleFlushTimeoutRef.current = null;
          void flushTapBattleTaps();
        }, 50);
      }
      return;
    }

    if (hasTapped) return;
    setHasTapped(true); // optimistic update

    try {
      await fetch("/api/duel/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "tap",
          playerId,
          roomSessionId,
          roundNumber: room?.currentRound,
        }),
      });
    } catch {
      // tap is best-effort
    }
  }, [playerId, hasTapped, room?.gameType, room?.status, roomSessionId, flushTapBattleTaps]);

  const handleMemoryInput = useCallback(
    async (symbol: string) => {
      if (!playerId || room?.gameType !== "memory_flash" || room.status !== "signal") {
        return;
      }

      try {
        await fetch("/api/duel/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "memory_input",
            playerId,
            symbol,
            roomSessionId,
            roundNumber: room.currentRound,
          }),
        });
      } catch {
        // best effort
      }
    },
    [playerId, room?.gameType, room?.status, roomSessionId]
  );

  const handleRematchVote = useCallback(
    async (vote: RematchVote) => {
      if (!playerId || myRematchVote !== undefined) return;
      setMyRematchVote(vote); // optimistic

      try {
        const res = await fetch("/api/duel/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "rematch_vote", playerId, vote, roomSessionId }),
        });
        const data = (await res.json()) as {
          success?: boolean;
          room?: GameRoom;
        };
        if (data.room) {
          setRoom(data.room);
        }
        if (!data.success) {
          setMyRematchVote(undefined);
        }
      } catch {
        setMyRematchVote(undefined);
      }
    },
    [playerId, myRematchVote, roomSessionId, setRoom]
  );

  const handleReconnect = useCallback(async () => {
    if (!playerId || reconnecting) return;
    setReconnecting(true);

    try {
      const res = await fetch("/api/duel/room");
      const data = (await res.json()) as GameRoom;
      setRoom(data);

      const playerStillInRoom = data.players.some((p) => p.id === playerId);
      if (!playerStillInRoom) {
        resetLocalSession();
      } else {
        setJoinError(null);
      }
    } catch {
      setJoinError("Reconnect failed. Try again.");
    } finally {
      setReconnecting(false);
    }
  }, [playerId, reconnecting, resetLocalSession, setRoom]);

  // Room is "full" to new joiners when a game is underway and they're not a participant.
  // waiting and rematch_wait are the only states where new players can enter.
  const roomFull =
    (room?.players.length ?? 0) >= 2 &&
    !isInRoom &&
    room?.status !== "waiting" &&
    room?.status !== "rematch_wait";

  const renderContent = () => {
    if (!room) {
      return (
        <div className="flex h-full items-center justify-center">
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="font-display text-2xl font-black uppercase tracking-widest text-white/40"
          >
            CONNECTING...
          </motion.span>
        </div>
      );
    }

    // Not joined yet
    if (!isInRoom) {
      if (roomFull) return <RoomFullView room={room} />;
      return (
        <JoinView
          onJoin={handleJoin}
          joining={joining}
          error={joinError}
          gameType={room?.gameType}
          disabled={!playerId}
        />
      );
    }

    // In room — show game state
    switch (room.status) {
      case "waiting":
        return <LobbyView room={room} playerId={playerId} />;
      case "countdown":
        return <CountdownView room={room} />;
      case "get_ready":
        return room.gameType === "memory_flash" ? (
          <MemoryFlashGetReadyView room={room} />
        ) : (
          <GetReadyView room={room} />
        );
      case "signal":
        return room.gameType === "tap_battle" ? (
          <TapBattleSignalView
            room={room}
            playerId={playerId}
            onTap={handleTap}
          />
        ) : room.gameType === "memory_flash" ? (
          <MemoryFlashSignalView
            room={room}
            playerId={playerId}
            onInput={handleMemoryInput}
          />
        ) : (
          <SignalView
            room={room}
            playerId={playerId}
            onTap={handleTap}
            tapped={hasTapped}
          />
        );
      case "round_result":
        return room.gameType === "tap_battle" ? (
          <TapBattleRoundResultView room={room} playerId={playerId} />
        ) : room.gameType === "memory_flash" ? (
          <MemoryFlashRoundResultView room={room} playerId={playerId} />
        ) : (
          <RoundResultView room={room} playerId={playerId} />
        );
      case "match_winner":
        return <MatchWinnerView room={room} playerId={playerId} />;
      case "rematch_wait":
        return (
          <RematchWaitView
            room={room}
            playerId={playerId}
            onVote={handleRematchVote}
            myVote={myRematchVote}
          />
        );
      default:
        return <LobbyView room={room} playerId={playerId} />;
    }
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#0a0a0a] text-white">
      {/* Subtle texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,212,0,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,212,0,0.4)_1px,transparent_1px)] [background-size:32px_32px]" />

      <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>

      <motion.button
        type="button"
        onClick={handleReconnect}
        disabled={reconnecting || !playerId}
        whileTap={{ scale: 0.97 }}
        className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/40 px-4 py-2 font-body text-[0.65rem] uppercase tracking-[0.25em] text-white/75 backdrop-blur-sm disabled:opacity-50"
      >
        {reconnecting ? "RECONNECTING..." : "🔄 Reconnect"}
      </motion.button>

      {/* Connection dot */}
      <div
        className={`absolute right-4 top-4 h-2 w-2 rounded-full transition-colors ${
          connected ? "bg-green-400" : "bg-red-400 animate-pulse"
        }`}
      />
    </div>
  );
}
