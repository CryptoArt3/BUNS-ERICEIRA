// Player action endpoint.
// POST body: { type: "join" | "tap" | "rematch_vote", playerId: string, ... }

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { addPlayer, recordTap, recordRematchVote } from "@/lib/duel/reactionDuel";
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

    default:
      return NextResponse.json({ error: "Unknown action type" }, { status: 400 });
  }
}
