// ─── Socket.io Event Types ────────────────────────────────────────────────────
// Shared between client and server. Import from this file on both sides.

import type { Player, ChatMessage, GamePhase, NightAction, Vote, Team, RoleName, RoomInfo } from './game';

// ─── Events emitted FROM the client TO the server ─────────────────────────────
export interface ClientToServerEvents {
  'room:create': (payload: { nickname: string; avatar: string }) => void;
  'room:join':   (payload: { code: string; nickname: string; avatar: string }) => void;
  'room:leave':  () => void;

  'game:start': () => void;

  'night:action': (payload: { targetId: string }) => void;

  'day:message': (payload: { content: string }) => void;

  'vote:submit': (payload: { targetId: string }) => void;

  // Host controls
  'host:resolve_night': () => void;
  'host:start_voting':  () => void;
  'host:resolve_vote':  () => void;
  'host:start_night':   () => void;
}

// ─── Events emitted FROM the server TO the client ─────────────────────────────
export interface ServerToClientEvents {
  // Room lifecycle
  'room:created':  (payload: { room: RoomInfo; player: Player }) => void;
  'room:joined':   (payload: { room: RoomInfo; players: Player[]; localPlayer: Player }) => void;
  'room:player_joined': (payload: { player: Player }) => void;
  'room:player_left':   (payload: { playerId: string }) => void;
  'room:error':    (payload: { message: string }) => void;

  // Game lifecycle
  'game:started':  () => void;
  'game:role_assigned': (payload: { role: RoleName }) => void;
  'game:phase_changed': (payload: {
    phase: GamePhase;
    round: number;
    phaseTimeLeft: number;
  }) => void;

  // Night
  'night:action_ack':    () => void;
  'night:resolved': (payload: {
    eliminatedId: string | null;
    savedId: string | null;
    investigationResult: boolean | null; // only sent to the Detective
  }) => void;

  // Chat
  'chat:message': (payload: ChatMessage) => void;

  // Voting
  'vote:updated': (payload: { votes: Vote[] }) => void;
  'vote:resolved': (payload: {
    eliminatedId: string | null;
    players: Player[];
  }) => void;

  // Player state
  'players:updated': (payload: { players: Player[] }) => void;

  // Win condition
  'game:over': (payload: { winningTeam: Team; players: Player[] }) => void;

  // Server narrator messages
  'narrator:message': (payload: { content: string }) => void;

  // Error
  'error': (payload: { message: string }) => void;
}

// ─── Inter-server socket data (room metadata per socket) ─────────────────────
export interface SocketData {
  playerId: string;
  roomCode: string;
  nickname: string;
}
