// Snapshot endpoint — allows polling fallback if SSE isn't available.

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getRoom } from "@/lib/duel/gameState";

export async function GET() {
  return NextResponse.json(getRoom());
}
