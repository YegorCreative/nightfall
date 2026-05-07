export type Team = 'mafia' | 'town'

export type RoleId = 'mafia' | 'detective' | 'doctor' | 'citizen'

export type Phase = 'lobby' | 'roleReveal' | 'day' | 'night' | 'voting' | 'results' | 'ended'

export type MessageChannel = 'public' | 'system' | 'mafia'

export interface RoleDefinition {
  id: RoleId
  name: string
  team: Team
  summary: string
}

export interface Player {
  id: string
  nickname: string
  role?: RoleId
  alive: boolean
  isHost: boolean
  isReady: boolean
}

export interface ChatMessage {
  id: string
  playerId?: string
  nickname: string
  text: string
  channel: MessageChannel
  createdAt: string
}

export interface NightAction {
  actorId: string
  role: RoleId
  targetId: string
}

export interface VoteRecord {
  voterId: string
  targetId: string
}

export interface GameRoomState {
  roomCode: string
  phase: Phase
  phaseTimer: number
  players: Player[]
  chat: ChatMessage[]
  nightActions: NightAction[]
  votes: VoteRecord[]
  winnerTeam?: Team
  startedAt?: string
}
