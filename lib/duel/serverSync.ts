import { getActiveDuelGameType } from "./config";
import { syncRoomGameType } from "./gameState";

export async function syncDuelRoomWithActiveGame() {
  return syncRoomGameType(getActiveDuelGameType());
}
