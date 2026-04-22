import {
  hasDurableDuelGameStore,
  hydrateRuntimeActiveDuelGameState,
} from "./activeGameStore";
import { getActiveDuelGameType } from "./config";
import { syncRoomGameType } from "./gameState";

export async function syncDuelRoomWithActiveGame() {
  const state = await hydrateRuntimeActiveDuelGameState();
  const activeGameType = state.gameType ?? getActiveDuelGameType();

  if (hasDurableDuelGameStore() && state.source === "error") {
    throw new Error("Active duel game is not available from durable storage.");
  }

  return syncRoomGameType(activeGameType);
}
