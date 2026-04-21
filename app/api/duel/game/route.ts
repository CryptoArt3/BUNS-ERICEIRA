export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import {
  getActiveDuelGameType,
  getEnvDuelGameType,
  normalizeDuelGameType,
} from "@/lib/duel/config";
import {
  getDuelGameStorePath,
  readRuntimeActiveDuelGameType,
  writeRuntimeActiveDuelGameType,
} from "@/lib/duel/activeGameStore";
import { resetRoom } from "@/lib/duel/gameState";

export async function GET() {
  const runtimeGameType = readRuntimeActiveDuelGameType();
  const envGameType = getEnvDuelGameType();

  return NextResponse.json({
    ok: true,
    activeGameType: getActiveDuelGameType(),
    runtimeGameType,
    envGameType,
    source: runtimeGameType ? "runtime" : "env",
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

  const gameType = normalizeDuelGameType(body.gameType);
  if (!gameType) {
    return NextResponse.json(
      {
        ok: false,
        error: 'gameType must be "reaction", "tap-battle", or "memory-flash"',
      },
      { status: 400 }
    );
  }

  const state = writeRuntimeActiveDuelGameType(gameType);
  const room = resetRoom();

  return NextResponse.json({
    ok: true,
    activeGameType: gameType,
    runtimeGameType: state.gameType,
    source: "runtime",
    room,
  });
}
