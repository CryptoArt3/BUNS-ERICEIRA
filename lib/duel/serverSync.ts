import {
  hasDurableDuelGameStore,
  hydrateRuntimeActiveDuelGameState,
} from "./activeGameStore";
import { getActiveDuelGameType } from "./config";
import { resetRoomForGame, syncRoomGameType } from "./gameState";
import type { GameRoom } from "./types";

const TRANSIENT_STATUS_TIMEOUT_MS = 30_000;

function recoverStuckRoom(room: GameRoom): GameRoom {
  if (room.status === "waiting" || room.status === "rematch_wait") {
    return room;
  }

  if (Date.now() - room.lastUpdatedAt <= TRANSIENT_STATUS_TIMEOUT_MS) {
    return room;
  }

  return resetRoomForGame(room.gameType);
}

export async function syncDuelRoomWithActiveGame() {
  const state = await hydrateRuntimeActiveDuelGameState();

  if (
    hasDurableDuelGameStore() &&
    (state.source === "error" || state.source === "missing" || state.source === "none")
  ) {
    throw new Error("Active duel game is not available from durable storage.");
  }

  const activeGameType = state.gameType ?? getActiveDuelGameType();

  return recoverStuckRoom(syncRoomGameType(activeGameType));
}
