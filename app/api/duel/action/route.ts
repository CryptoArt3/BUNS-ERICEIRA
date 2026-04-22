// Player action endpoint.
// POST body: { type: "join" | "tap" | "rematch_vote" | "heartbeat" | "leave", playerId: string, ... }

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getRoom } from "@/lib/duel/gameState";
import { syncDuelRoomWithActiveGame } from "@/lib/duel/serverSync";
import type { RematchVote } from "@/lib/duel/types";
import * as reactionDuel from "@/lib/duel/reactionDuel";
import * as tapBattle from "@/lib/duel/tapBattle";
import * as memoryFlash from "@/lib/duel/memoryFlash";

function getActiveEngine() {
  const gameType = getRoom().gameType;
  if (gameType === "tap_battle") return tapBattle;
  if (gameType === "memory_flash") return memoryFlash;
  return reactionDuel;
}

export async function POST(request: Request) {
  try {
    await syncDuelRoomWithActiveGame();
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to synchronize active duel game.",
      },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    type,
    playerId,
    playerName,
    vote,
    tapCount,
    symbol,
    roomSessionId,
    roundNumber,
    roundId,
  } = body as {
    type?: string;
    playerId?: string;
    playerName?: string;
    vote?: unknown;
    tapCount?: unknown;
    symbol?: unknown;
    roomSessionId?: unknown;
    roundNumber?: unknown;
    roundId?: unknown;
  };

  if (!playerId || typeof playerId !== "string") {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  if (
    typeof roomSessionId === "string" &&
    roomSessionId.length > 0 &&
    roomSessionId !== getRoom().sessionId
  ) {
    return NextResponse.json({ success: false, room: getRoom(), staleSession: true });
  }

  switch (type) {
    case "join": {
      const name = typeof playerName === "string" ? playerName : "";
      const success = getActiveEngine().addPlayer(playerId, name);
      return NextResponse.json({ success, room: getRoom() });
    }

    case "tap": {
      const room = getRoom();
      if (
        typeof roundNumber === "number" &&
        Number.isFinite(roundNumber) &&
        roundNumber !== room.currentRound
      ) {
        return NextResponse.json({ success: false, room, staleRound: true });
      }
      const currentRoundId = room.rounds[room.rounds.length - 1]?.id;
      if (
        typeof roundId === "string" &&
        roundId.length > 0 &&
        currentRoundId &&
        roundId !== currentRoundId
      ) {
        return NextResponse.json({ success: false, room, staleRound: true });
      }
      const parsedTapCount =
        typeof tapCount === "number" && Number.isFinite(tapCount)
          ? Math.max(1, Math.floor(tapCount))
          : 1;
      const success =
        room.gameType === "tap_battle"
          ? tapBattle.recordTap(playerId, parsedTapCount)
          : room.gameType === "reaction"
          ? reactionDuel.recordTap(playerId)
          : false;
      return NextResponse.json({ success, room: getRoom() });
    }

    case "memory_input": {
      if (typeof symbol !== "string" || symbol.length === 0) {
        return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
      }

      const room = getRoom();
      if (
        typeof roundNumber === "number" &&
        Number.isFinite(roundNumber) &&
        roundNumber !== room.currentRound
      ) {
        return NextResponse.json({ success: false, room, staleRound: true });
      }
      const currentRoundId = room.rounds[room.rounds.length - 1]?.id;
      if (
        typeof roundId === "string" &&
        roundId.length > 0 &&
        currentRoundId &&
        roundId !== currentRoundId
      ) {
        return NextResponse.json({ success: false, room, staleRound: true });
      }

      const success =
        room.gameType === "memory_flash"
          ? memoryFlash.recordMemoryInput(playerId, symbol)
          : false;
      return NextResponse.json({ success, room: getRoom() });
    }

    case "rematch_vote": {
      if (vote !== "rematch" && vote !== "leave") {
        return NextResponse.json(
          { error: 'vote must be "rematch" or "leave"' },
          { status: 400 }
        );
      }
      const success = getActiveEngine().recordRematchVote(
        playerId,
        vote as RematchVote
      );
      return NextResponse.json({ success, room: getRoom() });
    }

    case "heartbeat": {
      // Silent presence ping — no room snapshot needed in the response.
      // The client already gets room state via SSE; this is fire-and-forget.
      const success = getActiveEngine().heartbeat(playerId);
      return NextResponse.json({ success });
    }

    case "leave": {
      // Explicit leave triggered by pagehide / beforeunload.
      getActiveEngine().leavePlayer(playerId);
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action type" }, { status: 400 });
  }
}
