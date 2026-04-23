export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import {
  getActiveDuelGameType,
  normalizeDuelGameType,
} from "@/lib/duel/config";
import {
  getDuelGameStorePath,
} from "@/lib/duel/activeGameStore";
import { resetRoomForGame } from "@/lib/duel/gameState";

export async function GET() {
  return NextResponse.json({
    ok: true,
    activeGameType: "memory_flash",
    runtimeGameType: "memory_flash",
    envGameType: "memory_flash",
    source: "frozen",
    storePath: getDuelGameStorePath(),
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  normalizeDuelGameType(body.gameType);
  const frozenGameType = getActiveDuelGameType();
  const room = resetRoomForGame(frozenGameType);

  return NextResponse.json({
    ok: true,
    activeGameType: frozenGameType,
    runtimeGameType: frozenGameType,
    source: "frozen",
    room,
  });
}
