// Player action endpoint.
// POST body: { type: "join" | "tap", playerId: string, playerName?: string }

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { addPlayer, recordTap } from "@/lib/duel/reactionDuel";
import { getRoom } from "@/lib/duel/gameState";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, playerId, playerName } = body as {
    type?: string;
    playerId?: string;
    playerName?: string;
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

    default:
      return NextResponse.json({ error: "Unknown action type" }, { status: 400 });
  }
}
