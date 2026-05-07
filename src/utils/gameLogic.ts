import { ROLE_MAP, ROLE_ORDER } from '../data/roles'
import type {
  ChatMessage,
  GameRoomState,
  NightAction,
  Phase,
  Player,
  RoleId,
  Team,
  VoteRecord,
} from '../types/game'

const DAY_TIME = 120
const NIGHT_TIME = 60
const VOTE_TIME = 45

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const systemMessage = (text: string): ChatMessage => ({
  id: uid(),
  nickname: 'Narrator',
  text,
  channel: 'system',
  createdAt: new Date().toISOString(),
})

const buildRoomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase()

const shuffle = <T>(items: T[]): T[] => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export const createRoom = (hostNickname: string): GameRoomState => ({
  roomCode: buildRoomCode(),
  phase: 'lobby',
  phaseTimer: 0,
  players: [
    {
      id: uid(),
      nickname: hostNickname.trim(),
      alive: true,
      isHost: true,
      isReady: true,
    },
  ],
  chat: [systemMessage('Room created. Share the code with your friends.')],
  nightActions: [],
  votes: [],
})

export const joinRoom = (room: GameRoomState, nickname: string): GameRoomState => {
  if (room.players.some((player) => player.nickname.toLowerCase() === nickname.toLowerCase())) {
    return {
      ...room,
      chat: [...room.chat, systemMessage(`${nickname} is already in this room.`)],
    }
  }

  const player: Player = {
    id: uid(),
    nickname: nickname.trim(),
    alive: true,
    isHost: false,
    isReady: true,
  }

  return {
    ...room,
    players: [...room.players, player],
    chat: [...room.chat, systemMessage(`${player.nickname} joined the room.`)],
  }
}

export const leaveRoom = (room: GameRoomState, playerId: string): GameRoomState => {
  const leaving = room.players.find((player) => player.id === playerId)
  if (!leaving) return room

  const remaining = room.players.filter((player) => player.id !== playerId)
  const hostExists = remaining.some((player) => player.isHost)

  const players = hostExists
    ? remaining
    : remaining.map((player, index) => ({ ...player, isHost: index === 0 }))

  return {
    ...room,
    players,
    chat: [...room.chat, systemMessage(`${leaving.nickname} left the room.`)],
  }
}

export const assignRoles = (players: Player[]): Player[] => {
  const ids = shuffle(players.map((player) => player.id))
  const mafiaCount = Math.max(1, Math.floor(players.length / 4))
  const rolePool: RoleId[] = []
  rolePool.push(...Array.from({ length: mafiaCount }, () => 'mafia' as RoleId))
  rolePool.push('detective', 'doctor')
  rolePool.push(
    ...Array.from({ length: Math.max(0, players.length - rolePool.length) }, () => 'citizen' as RoleId),
  )
  rolePool.splice(players.length)

  return players.map((player) => {
    const index = ids.indexOf(player.id)
    return {
      ...player,
      alive: true,
      role: rolePool[index] ?? 'citizen',
    }
  })
}

export const startGame = (room: GameRoomState): GameRoomState => ({
  ...room,
  phase: 'roleReveal',
  phaseTimer: 0,
  startedAt: new Date().toISOString(),
  players: assignRoles(room.players),
  chat: [...room.chat, systemMessage('The game has begun. Roles assigned.')],
})

export const revealRole = (room: GameRoomState, playerId: string): RoleId | undefined =>
  room.players.find((player) => player.id === playerId)?.role

export const startNightPhase = (room: GameRoomState): GameRoomState => ({
  ...room,
  phase: 'night',
  phaseTimer: NIGHT_TIME,
  nightActions: [],
  votes: [],
  chat: [...room.chat, systemMessage('Night falls. Special roles, act in secret.')],
})

export const submitNightAction = (room: GameRoomState, action: NightAction): GameRoomState => {
  const withoutPrior = room.nightActions.filter((item) => item.actorId !== action.actorId)

  return {
    ...room,
    nightActions: [...withoutPrior, action],
  }
}

const resolveNight = (room: GameRoomState): { room: GameRoomState; eliminatedId?: string } => {
  const mafiaTargets = room.nightActions.filter((action) => action.role === 'mafia').map((action) => action.targetId)
  const doctorTargets = new Set(
    room.nightActions.filter((action) => action.role === 'doctor').map((action) => action.targetId),
  )

  const targetId = mafiaTargets[0]
  if (!targetId || doctorTargets.has(targetId)) {
    return {
      room: {
        ...room,
        chat: [...room.chat, systemMessage('Dawn arrives. Nobody was eliminated tonight.')],
      },
    }
  }

  return {
    room: eliminatePlayer(room, targetId),
    eliminatedId: targetId,
  }
}

export const startDayPhase = (room: GameRoomState): GameRoomState => {
  const { room: resolvedRoom, eliminatedId } = resolveNight(room)
  const detectiveAction = room.nightActions.find((action) => action.role === 'detective')
  const investigated = detectiveAction
    ? room.players.find((player) => player.id === detectiveAction.targetId)
    : undefined

  const detectiveText = investigated
    ? `Detective report: ${investigated.nickname} appears ${investigated.role === 'mafia' ? 'suspicious' : 'clean'}.`
    : undefined

  return {
    ...resolvedRoom,
    phase: 'day',
    phaseTimer: DAY_TIME,
    nightActions: [],
    chat: [
      ...resolvedRoom.chat,
      ...(eliminatedId ? [systemMessage('The town gathers to discuss what happened.')] : []),
      ...(detectiveText ? [systemMessage(detectiveText)] : []),
    ],
  }
}

export const sendChatMessage = (
  room: GameRoomState,
  playerId: string,
  text: string,
  channel: 'public' | 'mafia' = 'public',
): GameRoomState => {
  const player = room.players.find((item) => item.id === playerId)
  if (!player || !text.trim()) return room

  if (!player.alive && channel === 'public') {
    return {
      ...room,
      chat: [...room.chat, systemMessage(`${player.nickname} is now a spectator and cannot speak in public chat.`)],
    }
  }

  if (room.phase === 'night' && channel === 'public') {
    return {
      ...room,
      chat: [...room.chat, systemMessage('Public chat is paused during the night.')],
    }
  }

  return {
    ...room,
    chat: [
      ...room.chat,
      {
        id: uid(),
        playerId,
        nickname: player.nickname,
        text: text.trim(),
        channel,
        createdAt: new Date().toISOString(),
      },
    ],
  }
}

export const startVotingPhase = (room: GameRoomState): GameRoomState => ({
  ...room,
  phase: 'voting',
  phaseTimer: VOTE_TIME,
  votes: [],
  chat: [...room.chat, systemMessage('Voting has started. Choose carefully.')],
})

export const submitVote = (room: GameRoomState, vote: VoteRecord): GameRoomState => {
  const voter = room.players.find((player) => player.id === vote.voterId)
  const target = room.players.find((player) => player.id === vote.targetId)
  if (!voter || !target || !voter.alive || !target.alive) return room

  return {
    ...room,
    votes: [...room.votes.filter((entry) => entry.voterId !== vote.voterId), vote],
  }
}

export const eliminatePlayer = (room: GameRoomState, playerId: string): GameRoomState => {
  const target = room.players.find((player) => player.id === playerId)
  if (!target || !target.alive) return room

  return {
    ...room,
    players: room.players.map((player) => (player.id === playerId ? { ...player, alive: false } : player)),
    chat: [...room.chat, systemMessage(`${target.nickname} has been eliminated.`)],
  }
}

export const resolveVote = (room: GameRoomState): GameRoomState => {
  const tally = room.votes.reduce<Record<string, number>>((acc, vote) => {
    acc[vote.targetId] = (acc[vote.targetId] ?? 0) + 1
    return acc
  }, {})

  const ordered = Object.entries(tally).sort((a, b) => b[1] - a[1])
  const topVotes = ordered[0]?.[1]
  const tied = ordered.filter((entry) => entry[1] === topVotes)

  const baseRoom = {
    ...room,
    phase: 'results' as Phase,
    phaseTimer: 0,
    votes: [],
  }

  if (!topVotes || tied.length !== 1) {
    return {
      ...baseRoom,
      chat: [...room.chat, systemMessage('Vote result: no consensus. No elimination this round.')],
    }
  }

  return {
    ...eliminatePlayer(baseRoom, tied[0][0]),
    chat: [...eliminatePlayer(baseRoom, tied[0][0]).chat, systemMessage('Vote resolved. Night approaches.')],
  }
}

export const checkWinCondition = (room: GameRoomState): Team | undefined => {
  const alive = room.players.filter((player) => player.alive)
  const mafiaAlive = alive.filter((player) => player.role === 'mafia').length
  const townAlive = alive.length - mafiaAlive

  if (mafiaAlive === 0) return 'town'
  if (mafiaAlive >= townAlive) return 'mafia'
  return undefined
}

export const resetGame = (room: GameRoomState): GameRoomState => ({
  ...room,
  phase: 'lobby',
  phaseTimer: 0,
  winnerTeam: undefined,
  nightActions: [],
  votes: [],
  players: room.players.map((player) => ({ ...player, alive: true, role: undefined })),
  chat: [...room.chat, systemMessage('Game reset. Waiting in the lobby.')],
})

export const roleName = (role: RoleId | undefined) => (role ? ROLE_MAP[role].name : 'Unknown')
export const roleSummary = (role: RoleId | undefined) => (role ? ROLE_MAP[role].summary : '')
export const allRoleNames = ROLE_ORDER.map((role) => ROLE_MAP[role].name)
