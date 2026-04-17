// Player action endpoint.
// POST body: { type: "join" | "tap" | "rematch_vote" | "heartbeat" | "leave", playerId: string, ... }

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  addPlayer,
  heartbeat,
  leavePlayer,
  recordRematchVote,
  recordTap,
} from "@/lib/duel/reactionDuel";
import { getRoom } from "@/lib/duel/gameState";
import type { RematchVote } from "@/lib/duel/types";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, playerId, playerName, vote } = body as {
    type?: string;
    playerId?: string;
    playerName?: string;
    vote?: unknown;
  };

  if (!playerId || typeof playerId !== "string") {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  switch (type) {
    case "join": {
      const name = typeof playerName === "string" ? playerName : "";
      const success = addPlayer(playerId, name);
      return NextResponse.json({ success, room: getRoom() });
    }

    case "tap": {
      const success = recordTap(playerId);
      return NextResponse.json({ success, room: getRoom() });
    }

    case "rematch_vote": {
      if (vote !== "rematch" && vote !== "leave") {
        return NextResponse.json(
          { error: 'vote must be "rematch" or "leave"' },
          { status: 400 }
        );
      }
      const success = recordRematchVote(playerId, vote as RematchVote);
      return NextResponse.json({ success, room: getRoom() });
    }

    case "heartbeat": {
      // Silent presence ping — no room snapshot needed in the response.
      // The client already gets room state via SSE; this is fire-and-forget.
      const success = heartbeat(playerId);
      return NextResponse.json({ success });
    }

    case "leave": {
      // Explicit leave triggered by pagehide / beforeunload.
      leavePlayer(playerId);
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action type" }, { status: 400 });
  }
}
