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
  hydrateRuntimeActiveDuelGameState,
  readRuntimeActiveDuelGameType,
  writeRuntimeActiveDuelGameType,
} from "@/lib/duel/activeGameStore";
import { resetRoomForGame } from "@/lib/duel/gameState";

export async function GET() {
  const state = await hydrateRuntimeActiveDuelGameState();
  const runtimeGameType = readRuntimeActiveDuelGameType();
  const envGameType = getEnvDuelGameType();

  return NextResponse.json({
    ok: true,
    activeGameType: getActiveDuelGameType(),
    runtimeGameType,
    envGameType,
    source:
      state.source === "none" || state.source === "missing"
        ? "env"
        : state.source,
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

  let state: Awaited<ReturnType<typeof writeRuntimeActiveDuelGameType>>;
  try {
    state = await writeRuntimeActiveDuelGameType(gameType);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to persist active duel game.",
      },
      { status: 500 }
    );
  }

  const room = resetRoomForGame(gameType);

  return NextResponse.json({
    ok: true,
    activeGameType: gameType,
    runtimeGameType: state.gameType,
    source: "runtime",
    room,
  });
}
