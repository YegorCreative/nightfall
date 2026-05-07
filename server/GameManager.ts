// ─── GameManager ─────────────────────────────────────────────────────────────
// Registry of all active GameRoom instances, keyed by room code.

import { GameRoom } from './GameRoom.js';
import type { GameRoomCallbacks } from './GameRoom.js';

export class GameManager {
  private rooms = new Map<string, GameRoom>();

  createRoom(callbacks: GameRoomCallbacks): GameRoom {
    const room = new GameRoom(callbacks);
    this.rooms.set(room.code, room);
    return room;
  }

  getRoom(code: string): GameRoom | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  deleteRoom(code: string): void {
    this.rooms.delete(code.toUpperCase());
  }

  pruneEmpty(): void {
    for (const [code, room] of this.rooms) {
      if (room.isEmpty()) this.rooms.delete(code);
    }
  }

  get size(): number {
    return this.rooms.size;
  }
}

// Singleton instance used by the server
export const gameManager = new GameManager();
