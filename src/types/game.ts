// ─── Game Types ───────────────────────────────────────────────────────────────

export type RoleName = 'Mafia' | 'Doctor' | 'Detective' | 'Citizen';

export type GamePhase = 'lobby' | 'role-reveal' | 'night' | 'day' | 'voting' | 'ended';

export type Team = 'mafia' | 'town';

export type MessageType = 'public' | 'mafia' | 'narrator' | 'system';

// ─── Role Definition ──────────────────────────────────────────────────────────

export interface Role {
  name: RoleName;
  team: Team;
  description: string;
  nightActionLabel?: string;
  nightActionDescription?: string;
  emoji: string;
  color: string;           // Tailwind text color class
  bgColor: string;         // Tailwind bg color class
}

// ─── Player ───────────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  nickname: string;
  role?: RoleName;
  isAlive: boolean;
  isHost: boolean;
  isLocal: boolean;         // Is this the player on this device?
  hasActed: boolean;        // Whether they've taken their night action
  hasVoted: boolean;        // Whether they've submitted a vote this round
  votedForId?: string;      // Who they voted for
  eliminatedRound?: number; // Which round they were eliminated
  avatar: string;           // Emoji avatar
}

// ─── Chat Message ─────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  type: MessageType;
  senderId?: string;
  senderName?: string;
  content: string;
  timestamp: number;
  round?: number;
}

// ─── Night Action ─────────────────────────────────────────────────────────────

export interface NightAction {
  actorId: string;
  actorRole: RoleName;
  targetId: string;
}

// ─── Vote ─────────────────────────────────────────────────────────────────────

export interface Vote {
  voterId: string;
  targetId: string;
}

// ─── Room Info ────────────────────────────────────────────────────────────────

export interface RoomInfo {
  code: string;
  hostId: string;
  maxPlayers: number;
  minPlayers: number;
}

// ─── Game State ───────────────────────────────────────────────────────────────

export interface GameState {
  room: RoomInfo | null;
  players: Player[];
  phase: GamePhase;
  round: number;
  phaseTimeLeft: number;     // seconds remaining in current phase
  messages: ChatMessage[];
  nightActions: NightAction[];
  votes: Vote[];
  eliminatedThisRound: string | null;   // id of player eliminated via vote
  savedThisRound: string | null;        // id of player saved by doctor
  investigationResult: boolean | null;  // Detective's investigation result
  winningTeam: Team | null;
  localPlayerId: string | null;
  localNickname: string;
}

// ─── Action Types for reducer (Socket.io payloads later) ─────────────────────

export type GameAction =
  | { type: 'SET_NICKNAME'; payload: string }
  | { type: 'CREATE_ROOM'; payload: { code: string } }
  | { type: 'JOIN_ROOM'; payload: { code: string; player: Player; players?: Player[] } }
  | { type: 'ADD_PLAYER'; payload: Player }
  | { type: 'REMOVE_PLAYER'; payload: { id: string } }
  | { type: 'START_GAME' }
  | { type: 'ASSIGN_ROLES'; payload: { assignments: { playerId: string; role: RoleName }[] } }
  | { type: 'CONFIRM_ROLE_REVEAL' }
  | { type: 'START_NIGHT' }
  | { type: 'SUBMIT_NIGHT_ACTION'; payload: NightAction }
  | { type: 'RESOLVE_NIGHT' }
  | { type: 'START_DAY' }
  | { type: 'SEND_MESSAGE'; payload: Omit<ChatMessage, 'id' | 'timestamp'> }
  | { type: 'START_VOTING' }
  | { type: 'SUBMIT_VOTE'; payload: Vote }
  | { type: 'RESOLVE_VOTE' }
  | { type: 'TICK_TIMER' }
  | { type: 'CHECK_WIN_CONDITION' }
  | { type: 'RESET_GAME' }
  // ─── Socket sync actions (server is authoritative source of truth) ─────────
  | { type: 'SYNC_PLAYERS'; payload: { players: Player[] } }
  | { type: 'SYNC_SERVER_STATE'; payload: Partial<Pick<GameState, 'phaseTimeLeft' | 'round' | 'winningTeam' | 'investigationResult' | 'eliminatedThisRound' | 'savedThisRound' | 'phase'>> };
