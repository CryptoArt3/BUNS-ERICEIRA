// Snapshot endpoint — allows polling fallback if SSE isn't available.

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { syncDuelRoomWithActiveGame } from "@/lib/duel/serverSync";

export async function GET() {
  try {
    return NextResponse.json(await syncDuelRoomWithActiveGame());
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to synchronize active duel game.",
      },
      { status: 503 }
    );
  }
}
