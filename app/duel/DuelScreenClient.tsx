"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { GameRoom, Player, RematchVote, RoomStatus } from "@/lib/duel/types";

const MAX_CONSECUTIVE_MATCHES = 3; // mirrors reactionDuel.ts — anti-monopoly limit

// ── Constants ────────────────────────────────────────────────────────────────

const JOIN_URL_PATH = "/duel/join";

const PLAYER_COLORS = {
  red: {
    text: "text-[#FF4444]",
    bg: "bg-[#FF4444]",
    border: "border-[#FF4444]",
    glow: "[text-shadow:0_0_40px_rgba(255,68,68,0.9)]",
    shadow: "shadow-[0_0_60px_rgba(255,68,68,0.5)]",
    gradient: "from-[#FF4444]/20 to-transparent",
  },
  blue: {
    text: "text-[#4488FF]",
    bg: "bg-[#4488FF]",
    border: "border-[#4488FF]",
    glow: "[text-shadow:0_0_40px_rgba(68,136,255,0.9)]",
    shadow: "shadow-[0_0_60px_rgba(68,136,255,0.5)]",
    gradient: "from-[#4488FF]/20 to-transparent",
  },
} as const;

// ── Hook: SSE connection ─────────────────────────────────────────────────────

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
    // Runs every 15 s regardless of SSE state; no-ops when SSE is healthy
    // (data won't have advanced). Stops only on component unmount.
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
          // ignore parse errors
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

  return { room, connected };
}

// ── Hook: fullscreen + wake lock ─────────────────────────────────────────────

function useScreenLock() {
  useEffect(() => {
    // Fullscreen
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => null);
    }

    // Wake lock
    let wl: WakeLockSentinel | null = null;
    if ("wakeLock" in navigator) {
      (navigator.wakeLock as { request(type: string): Promise<WakeLockSentinel> })
        .request("screen")
        .then((lock) => { wl = lock; })
        .catch(() => null);
    }

    // Block all interaction
    const noop = (e: Event) => e.preventDefault();
    window.addEventListener("keydown", noop);
    window.addEventListener("contextmenu", noop);
    window.addEventListener("wheel", noop, { passive: false });

    return () => {
      wl?.release().catch(() => null);
      window.removeEventListener("keydown", noop);
      window.removeEventListener("contextmenu", noop);
      window.removeEventListener("wheel", noop);
    };
  }, []);
}

// ── QR helper ────────────────────────────────────────────────────────────────

function buildQrUrl(path: string): string {
  const configuredBase =
    process.env.NEXT_PUBLIC_DUEL_JOIN_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : "http://localhost:3000");
  const base = configuredBase.replace(/\/+$/, "");
  return `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(
    base + path
  )}`;
}

// ── Player slot ───────────────────────────────────────────────────────────────

function PlayerSlot({
  player,
  score,
  side,
  isWinner,
}: {
  player: Player | undefined;
  score: number;
  side: "left" | "right";
  isWinner?: boolean;
}) {
  const colors = player ? PLAYER_COLORS[player.color] : null;
  const align = side === "left" ? "items-start" : "items-end";
  const textAlign = side === "left" ? "text-left" : "text-right";

  return (
    <div className={`flex flex-col gap-3 ${align} min-w-0`}>
      {player ? (
        <>
          <motion.div
            initial={{ opacity: 0, x: side === "left" ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            className={`font-display text-[clamp(1.8rem,4vw,3.2rem)] font-black uppercase leading-none tracking-wide ${colors!.text} ${colors!.glow} ${textAlign}`}
          >
            {player.name}
          </motion.div>
          <div className="flex items-center gap-3">
            {side === "right" && (
              <span className="font-display text-[clamp(3rem,8vw,7rem)] font-black text-white leading-none">
                {score}
              </span>
            )}
            <div className={`h-2 w-2 rounded-full ${colors!.bg} ${colors!.shadow}`} />
            {side === "left" && (
              <span className="font-display text-[clamp(3rem,8vw,7rem)] font-black text-white leading-none">
                {score}
              </span>
            )}
          </div>
          {isWinner && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="font-display text-[clamp(1rem,2.5vw,1.8rem)] font-black uppercase tracking-widest text-buns-yellow [text-shadow:0_0_30px_rgba(255,212,0,0.9)]"
            >
              WINNER
            </motion.div>
          )}
        </>
      ) : (
        <div className={`flex flex-col gap-2 ${align}`}>
          <div className="font-display text-[clamp(1.2rem,3vw,2.2rem)] font-black uppercase text-white/20 tracking-widest">
            —
          </div>
          <div className="font-body text-[clamp(0.7rem,1.5vw,1rem)] uppercase tracking-[0.3em] text-white/25">
            waiting
          </div>
        </div>
      )}
    </div>
  );
}

// ── Screen views ──────────────────────────────────────────────────────────────

function WaitingView({ room, qrUrl }: { room: GameRoom; qrUrl: string }) {
  const hasPlayer = room.players.length > 0;
  const player1 = room.players[0];

  return (
    <motion.div
      key="waiting"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full w-full flex-col items-center justify-between px-16 py-14"
    >
      {/* Header */}
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-display text-[clamp(2.5rem,6vw,5rem)] font-black uppercase leading-none tracking-wider text-buns-yellow [text-shadow:0_0_40px_rgba(255,212,0,0.6)]">
            BUNS DUEL
          </span>
          <span className="font-body text-[clamp(0.6rem,1.4vw,1rem)] uppercase tracking-[0.5em] text-white/50">
            REACTION DUEL · BEST OF 3
          </span>
        </div>
        <div className="rounded border border-white/10 bg-white/5 px-4 py-2 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-white/40">
          ROOM · BUNS
        </div>
      </div>

      {/* Main — QR + status */}
      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          <div className="overflow-hidden rounded-2xl border-2 border-buns-yellow/60 bg-white p-3 shadow-[0_0_80px_rgba(255,212,0,0.4)]">
            <img
              src={qrUrl}
              alt="Scan to join"
              className="block h-[min(32vw,280px)] w-[min(32vw,280px)]"
            />
          </div>
          {/* Animated corner accents */}
          <div className="absolute -left-2 -top-2 h-6 w-6 border-l-2 border-t-2 border-buns-yellow" />
          <div className="absolute -right-2 -top-2 h-6 w-6 border-r-2 border-t-2 border-buns-yellow" />
          <div className="absolute -bottom-2 -left-2 h-6 w-6 border-b-2 border-l-2 border-buns-yellow" />
          <div className="absolute -bottom-2 -right-2 h-6 w-6 border-b-2 border-r-2 border-buns-yellow" />
        </div>

        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2"
        >
          <span className="font-display text-[clamp(1.8rem,4.5vw,3.5rem)] font-black uppercase tracking-wider text-white">
            SCAN TO JOIN
          </span>
          <span className="font-body text-[clamp(0.65rem,1.4vw,1rem)] uppercase tracking-[0.4em] text-white/50">
            or visit buns.pt/duel/join
          </span>
        </motion.div>
      </div>

      {/* Player count */}
      <div className="flex items-center gap-6">
        <div
          className={`flex items-center gap-3 rounded-full border px-6 py-3 ${
            hasPlayer
              ? "border-[#FF4444]/60 bg-[#FF4444]/10"
              : "border-white/10 bg-white/5"
          }`}
        >
          <div
            className={`h-3 w-3 rounded-full ${hasPlayer ? "bg-[#FF4444]" : "bg-white/20"}`}
          />
          <span className="font-body text-[clamp(0.7rem,1.5vw,1.1rem)] font-black uppercase tracking-[0.25em] text-white">
            {hasPlayer ? player1!.name : "PLAYER 1"}
          </span>
        </div>

        <span className="font-display text-[clamp(1.2rem,2.5vw,2rem)] font-black text-white/30">
          VS
        </span>

        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-3">
          <div className="h-3 w-3 rounded-full bg-white/20" />
          <span className="font-body text-[clamp(0.7rem,1.5vw,1.1rem)] font-black uppercase tracking-[0.25em] text-white/40">
            PLAYER 2
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function CountdownView({ room }: { room: GameRoom }) {
  const [p1, p2] = room.players;

  return (
    <motion.div
      key="countdown"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full w-full flex-col items-center justify-between px-16 py-14"
    >
      {/* Players */}
      <div className="flex w-full items-start justify-between">
        <PlayerSlot player={p1} score={room.scores[p1?.id ?? ""] ?? 0} side="left" />
        <div className="font-display text-[clamp(3rem,8vw,6rem)] font-black text-white/20">VS</div>
        <PlayerSlot player={p2} score={room.scores[p2?.id ?? ""] ?? 0} side="right" />
      </div>

      {/* Countdown */}
      <div className="flex flex-col items-center gap-4">
        <span className="font-body text-[clamp(0.8rem,1.8vw,1.3rem)] uppercase tracking-[0.5em] text-white/50">
          DUEL STARTS IN
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={room.countdownValue}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="font-display text-[clamp(8rem,25vw,20rem)] font-black leading-none text-buns-yellow [text-shadow:0_0_80px_rgba(255,212,0,0.8)]"
          >
            {room.countdownValue}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="font-body text-[clamp(0.6rem,1.2vw,0.9rem)] uppercase tracking-[0.5em] text-white/30">
        BEST OF {room.totalRounds} ROUNDS
      </div>
    </motion.div>
  );
}

function GetReadyView({ room }: { room: GameRoom }) {
  const [p1, p2] = room.players;

  return (
    <motion.div
      key="get_ready"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full w-full flex-col items-center justify-between px-16 py-14"
    >
      {/* Players */}
      <div className="flex w-full items-start justify-between">
        <PlayerSlot player={p1} score={room.scores[p1?.id ?? ""] ?? 0} side="left" />
        <div className="flex flex-col items-center gap-2">
          <span className="font-body text-[clamp(0.6rem,1.2vw,0.9rem)] uppercase tracking-[0.4em] text-white/40">
            ROUND
          </span>
          <span className="font-display text-[clamp(2rem,5vw,4rem)] font-black text-white">
            {room.currentRound}
          </span>
          <span className="font-body text-[clamp(0.55rem,1vw,0.8rem)] uppercase tracking-[0.3em] text-white/30">
            OF {room.totalRounds}
          </span>
        </div>
        <PlayerSlot player={p2} score={room.scores[p2?.id ?? ""] ?? 0} side="right" />
      </div>

      {/* Get Ready pulse */}
      <div className="flex flex-col items-center gap-6">
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.98, 1.02, 0.98],
          }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="font-display text-[clamp(4rem,12vw,10rem)] font-black uppercase leading-none tracking-wider text-white [text-shadow:0_0_60px_rgba(255,255,255,0.3)]"
        >
          GET READY
        </motion.div>
        <motion.div
          animate={{ scaleX: [0, 1] }}
          transition={{ duration: 0.6 }}
          className="h-1 w-48 rounded-full bg-buns-yellow/60"
        />
      </div>

      {/* Tension indicator — growing bar */}
      <div className="flex w-full flex-col items-center gap-3">
        <span className="font-body text-[clamp(0.55rem,1.1vw,0.85rem)] uppercase tracking-[0.4em] text-white/30">
          WAIT FOR THE SIGNAL...
        </span>
        <div className="h-1 w-full max-w-md overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 5.5, ease: "linear" }}
            className="h-full rounded-full bg-buns-yellow/40"
          />
        </div>
      </div>
    </motion.div>
  );
}

function SignalView({ room }: { room: GameRoom }) {
  const [p1, p2] = room.players;
  const round = room.rounds[room.rounds.length - 1];
  const p1Tapped = round && p1 && round.taps[p1.id] !== undefined;
  const p2Tapped = round && p2 && round.taps[p2.id] !== undefined;

  return (
    <motion.div
      key="signal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden"
    >
      {/* Burst background */}
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute h-64 w-64 rounded-full bg-buns-yellow"
      />

      {/* TAP NOW! */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center gap-4"
      >
        <span className="font-display text-[clamp(6rem,20vw,16rem)] font-black uppercase leading-none tracking-wide text-buns-yellow [text-shadow:0_0_120px_rgba(255,212,0,1),0_0_40px_rgba(255,212,0,0.8)]">
          TAP!
        </span>
        <span className="font-body text-[clamp(0.8rem,2vw,1.5rem)] uppercase tracking-[0.6em] text-white/70">
          NOW — TAP YOUR SCREEN
        </span>
      </motion.div>

      {/* Player tap status */}
      <div className="absolute bottom-16 left-0 right-0 flex items-center justify-between px-16">
        <motion.div
          animate={{ scale: p1Tapped ? [1, 1.3, 1] : 1 }}
          className={`flex items-center gap-3 rounded-full px-6 py-3 border-2 transition-colors duration-200 ${
            p1Tapped
              ? "border-[#FF4444] bg-[#FF4444]/20"
              : "border-white/10 bg-white/5"
          }`}
        >
          <div className={`h-3 w-3 rounded-full ${p1Tapped ? "bg-[#FF4444]" : "bg-white/20"}`} />
          <span className="font-display text-[clamp(0.9rem,2vw,1.5rem)] font-black uppercase text-white">
            {p1?.name ?? "P1"}
          </span>
          {p1Tapped && (
            <span className="font-body text-[clamp(0.55rem,1vw,0.8rem)] uppercase tracking-widest text-[#FF4444]">
              ✓
            </span>
          )}
        </motion.div>

        <motion.div
          animate={{ scale: p2Tapped ? [1, 1.3, 1] : 1 }}
          className={`flex items-center gap-3 rounded-full px-6 py-3 border-2 transition-colors duration-200 ${
            p2Tapped
              ? "border-[#4488FF] bg-[#4488FF]/20"
              : "border-white/10 bg-white/5"
          }`}
        >
          {p2Tapped && (
            <span className="font-body text-[clamp(0.55rem,1vw,0.8rem)] uppercase tracking-widest text-[#4488FF]">
              ✓
            </span>
          )}
          <span className="font-display text-[clamp(0.9rem,2vw,1.5rem)] font-black uppercase text-white">
            {p2?.name ?? "P2"}
          </span>
          <div className={`h-3 w-3 rounded-full ${p2Tapped ? "bg-[#4488FF]" : "bg-white/20"}`} />
        </motion.div>
      </div>
    </motion.div>
  );
}

function RoundResultView({ room }: { room: GameRoom }) {
  const [p1, p2] = room.players;
  const lastRound = room.rounds[room.rounds.length - 1];
  const roundWinnerId = lastRound?.winner ?? null;
  const roundWinner = room.players.find((p) => p.id === roundWinnerId);

  const getReactionLabel = (playerId: string) => {
    const ms = lastRound?.reactionTimes[playerId];
    if (ms === undefined) return "—";
    if (ms > 2500) return "MISS";
    return `${ms}ms`;
  };

  return (
    <motion.div
      key="round_result"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full w-full flex-col items-center justify-between px-16 py-14"
    >
      {/* Round label */}
      <div className="flex flex-col items-center gap-2">
        <span className="font-body text-[clamp(0.65rem,1.4vw,1rem)] uppercase tracking-[0.5em] text-white/40">
          ROUND {lastRound?.number ?? room.currentRound} RESULT
        </span>
      </div>

      {/* Winner announcement */}
      <div className="flex flex-col items-center gap-6">
        {roundWinner ? (
          <>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`font-display text-[clamp(4rem,12vw,10rem)] font-black uppercase leading-none tracking-wide ${
                PLAYER_COLORS[roundWinner.color].text
              } ${PLAYER_COLORS[roundWinner.color].glow}`}
            >
              {roundWinner.name}
            </motion.div>
            <span className="font-display text-[clamp(1.5rem,4vw,3rem)] font-black uppercase text-white/80 tracking-widest">
              WINS THE ROUND
            </span>
          </>
        ) : (
          <span className="font-display text-[clamp(3rem,9vw,7rem)] font-black uppercase text-white/60 tracking-widest">
            DRAW
          </span>
        )}
      </div>

      {/* Scores + reaction times */}
      <div className="flex w-full items-end justify-between">
        {/* P1 */}
        <div className="flex flex-col items-start gap-2">
          <span className={`font-display text-[clamp(1.2rem,3vw,2.2rem)] font-black uppercase ${PLAYER_COLORS[p1?.color ?? "red"].text}`}>
            {p1?.name ?? "P1"}
          </span>
          <span className="font-display text-[clamp(3rem,8vw,6rem)] font-black text-white leading-none">
            {room.scores[p1?.id ?? ""] ?? 0}
          </span>
          <span className="font-body text-[clamp(0.6rem,1.2vw,0.9rem)] uppercase tracking-[0.3em] text-white/40">
            {p1 ? getReactionLabel(p1.id) : "—"}
          </span>
        </div>

        {/* Separator */}
        <div className="flex flex-col items-center gap-1">
          <div className="h-24 w-px bg-white/10" />
          <span className="font-display text-[clamp(1.5rem,3.5vw,2.5rem)] text-white/20 font-black">—</span>
          <div className="h-24 w-px bg-white/10" />
        </div>

        {/* P2 */}
        <div className="flex flex-col items-end gap-2">
          <span className={`font-display text-[clamp(1.2rem,3vw,2.2rem)] font-black uppercase ${PLAYER_COLORS[p2?.color ?? "blue"].text}`}>
            {p2?.name ?? "P2"}
          </span>
          <span className="font-display text-[clamp(3rem,8vw,6rem)] font-black text-white leading-none">
            {room.scores[p2?.id ?? ""] ?? 0}
          </span>
          <span className="font-body text-[clamp(0.6rem,1.2vw,0.9rem)] uppercase tracking-[0.3em] text-white/40">
            {p2 ? getReactionLabel(p2.id) : "—"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function MatchWinnerView({ room }: { room: GameRoom }) {
  const winner = room.players.find((p) => p.id === room.winner);
  const loser = room.players.find((p) => p.id !== room.winner);
  const colors = winner ? PLAYER_COLORS[winner.color] : null;

  return (
    <motion.div
      key="match_winner"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden"
    >
      {/* Background glow */}
      {colors && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.15, scale: 2 }}
          transition={{ duration: 1 }}
          className={`absolute h-[60vw] w-[60vw] rounded-full blur-3xl ${colors.bg}`}
        />
      )}

      <div className="relative z-10 flex flex-col items-center gap-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-body text-[clamp(0.8rem,1.8vw,1.3rem)] uppercase tracking-[0.6em] text-white/50"
        >
          MATCH WINNER
        </motion.div>

        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
          className={`font-display text-[clamp(5rem,16vw,13rem)] font-black uppercase leading-none tracking-wide ${
            colors?.text ?? "text-buns-yellow"
          } ${colors?.glow ?? ""}`}
        >
          {winner?.name ?? "WINNER"}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-6"
        >
          <span className="font-display text-[clamp(2rem,6vw,5rem)] font-black text-white leading-none">
            {room.scores[winner?.id ?? ""] ?? 0}
          </span>
          <span className="font-display text-[clamp(1.5rem,4vw,3rem)] text-white/30 font-black">
            —
          </span>
          <span className="font-display text-[clamp(2rem,6vw,5rem)] font-black text-white/40 leading-none">
            {room.scores[loser?.id ?? ""] ?? 0}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="font-body text-[clamp(0.65rem,1.3vw,1rem)] uppercase tracking-[0.4em] text-white/30"
        >
          Deciding rematch...
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── Rematch wait view ─────────────────────────────────────────────────────────

function RematchWaitView({ room }: { room: GameRoom }) {
  const [p1, p2] = room.players;
  const p1Vote = p1 ? (room.rematchVotes[p1.id] as RematchVote | undefined) : undefined;
  const p2Vote = p2 ? (room.rematchVotes[p2.id] as RematchVote | undefined) : undefined;
  const isLastGame = room.consecutiveMatchCount >= MAX_CONSECUTIVE_MATCHES;

  const voteLabel = (vote: RematchVote | undefined) => {
    if (vote === "rematch") return { text: "REMATCH ✓", cls: "text-buns-yellow" };
    if (vote === "leave") return { text: "LEAVING", cls: "text-white/30" };
    return { text: "DECIDING...", cls: "text-white/25" };
  };

  const p1Display = voteLabel(p1Vote);
  const p2Display = voteLabel(p2Vote);

  return (
    <motion.div
      key="rematch_wait"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full w-full flex-col items-center justify-between px-16 py-14"
    >
      {/* Header */}
      <div className="flex flex-col items-center gap-2">
        {isLastGame && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-body text-[clamp(0.6rem,1.3vw,1rem)] uppercase tracking-[0.4em] text-buns-orange"
          >
            FAIR PLAY LIMIT · NEW CHALLENGERS AFTER THIS
          </motion.span>
        )}
        <span className="font-display text-[clamp(2.5rem,6vw,5rem)] font-black uppercase tracking-wider text-white">
          REMATCH?
        </span>
      </div>

      {/* Countdown */}
      <div className="flex flex-col items-center gap-3">
        <AnimatePresence mode="wait">
          <motion.span
            key={room.rematchCountdown}
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="font-display text-[clamp(7rem,20vw,16rem)] font-black leading-none text-white/70"
          >
            {room.rematchCountdown ?? "—"}
          </motion.span>
        </AnimatePresence>
        <span className="font-body text-[clamp(0.6rem,1.2vw,0.9rem)] uppercase tracking-[0.5em] text-white/30">
          seconds to decide
        </span>
      </div>

      {/* Player decision panels */}
      <div className="flex w-full items-end justify-between">
        {/* P1 */}
        <div className="flex flex-col items-start gap-3">
          <span
            className={`font-display text-[clamp(1.5rem,3.5vw,2.8rem)] font-black uppercase ${
              PLAYER_COLORS[p1?.color ?? "red"].text
            }`}
          >
            {p1?.name ?? "P1"}
          </span>
          <motion.span
            key={p1Vote ?? "pending"}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`font-display text-[clamp(1rem,2.5vw,2rem)] font-black uppercase ${p1Display.cls}`}
          >
            {p1Display.text}
          </motion.span>
        </div>

        <span className="font-body text-[clamp(0.55rem,1.1vw,0.85rem)] uppercase tracking-[0.4em] text-white/25">
          DECIDE ON YOUR PHONE
        </span>

        {/* P2 */}
        <div className="flex flex-col items-end gap-3">
          <span
            className={`font-display text-[clamp(1.5rem,3.5vw,2.8rem)] font-black uppercase ${
              PLAYER_COLORS[p2?.color ?? "blue"].text
            }`}
          >
            {p2?.name ?? "P2"}
          </span>
          <motion.span
            key={p2Vote ?? "pending"}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`font-display text-[clamp(1rem,2.5vw,2rem)] font-black uppercase ${p2Display.cls}`}
          >
            {p2Display.text}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DuelScreenClient() {
  const { room, connected } = useDuelRoom();
  const [qrUrl, setQrUrl] = useState("");
  useScreenLock();

  useEffect(() => {
    setQrUrl(buildQrUrl(JOIN_URL_PATH));
  }, []);

  const status: RoomStatus = room?.status ?? "waiting";

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#0a0a0a] text-white">
      {/* Subtle grid texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,212,0,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,212,0,0.4)_1px,transparent_1px)] [background-size:40px_40px]" />

      {/* Left brand stripe */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-transparent via-buns-yellow to-transparent opacity-50" />

      {/* Right brand stripe */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[3px] bg-gradient-to-b from-transparent via-buns-yellow to-transparent opacity-50" />

      {/* Content area */}
      <AnimatePresence mode="wait">
        {!room ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-full items-center justify-center"
          >
            <span className="font-display text-[clamp(1.5rem,4vw,3rem)] font-black uppercase text-white/30 tracking-widest">
              BUNS DUEL
            </span>
          </motion.div>
        ) : status === "waiting" ? (
          <WaitingView key="waiting" room={room} qrUrl={qrUrl} />
        ) : status === "countdown" ? (
          <CountdownView key="countdown" room={room} />
        ) : status === "get_ready" ? (
          <GetReadyView key={`get_ready_${room.currentRound}`} room={room} />
        ) : status === "signal" ? (
          <SignalView key={`signal_${room.currentRound}`} room={room} />
        ) : status === "round_result" ? (
          <RoundResultView key={`result_${room.currentRound}`} room={room} />
        ) : status === "match_winner" ? (
          <MatchWinnerView key="match_winner" room={room} />
        ) : status === "rematch_wait" ? (
          <RematchWaitView key="rematch_wait" room={room} />
        ) : null}
      </AnimatePresence>

      {/* Connection status badge */}
      <div
        className={`absolute right-5 top-5 flex items-center gap-2 rounded border px-3 py-1.5 backdrop-blur-sm ${
          connected
            ? "border-green-500/30 bg-green-500/10"
            : "border-red-500/30 bg-red-500/10"
        }`}
      >
        <div
          className={`h-2 w-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`}
        />
        <span className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-white/50">
          {connected ? "LIVE" : "RECONNECTING"}
        </span>
      </div>

      {/* BUNS watermark */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
        <span className="font-display text-[0.65rem] font-black uppercase tracking-[0.6em] text-white/15">
          BUNS · ERICEIRA
        </span>
      </div>
    </div>
  );
}
