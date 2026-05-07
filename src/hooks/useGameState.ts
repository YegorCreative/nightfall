import { useMemo, useState } from 'react'
import { mockPlayers } from '../data/mockPlayers'
import { ROLE_MAP } from '../data/roles'
import type { GameRoomState, NightAction, RoleDefinition } from '../types/game'
import {
  checkWinCondition,
  createRoom,
  joinRoom,
  leaveRoom,
  resetGame,
  revealRole,
  sendChatMessage,
  startDayPhase,
  startGame,
  startNightPhase,
  startVotingPhase,
  submitNightAction,
  submitVote,
  resolveVote,
} from '../utils/gameLogic'

type Screen = 'landing' | 'lobby' | 'game' | 'end'

export const useGameState = () => {
  const [screen, setScreen] = useState<Screen>('landing')
  const [room, setRoom] = useState<GameRoomState | null>(null)
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('')
  const [roleModalOpen, setRoleModalOpen] = useState(false)

  const currentPlayer = room?.players.find((player) => player.id === currentPlayerId)
  const currentRole: RoleDefinition | undefined = currentPlayer?.role ? ROLE_MAP[currentPlayer.role] : undefined

  const createRoomFlow = (nickname: string) => {
    const newRoom = createRoom(nickname)
    const seats = mockPlayers(newRoom.players)
    const withBots = {
      ...newRoom,
      players: [...newRoom.players, ...seats],
    }

    setRoom(withBots)
    setCurrentPlayerId(withBots.players[0].id)
    setScreen('lobby')
  }

  const joinRoomFlow = (roomCode: string, nickname: string) => {
    const initialRoom = room ?? {
      ...createRoom('Host'),
      roomCode: roomCode.trim().toUpperCase(),
      players: [{ ...createRoom('Host').players[0], nickname: 'Host' }],
    }

    const joined = joinRoom(initialRoom, nickname)
    const newest = joined.players[joined.players.length - 1]
    setRoom(joined)
    setCurrentPlayerId(newest.id)
    setScreen('lobby')
  }

  const leaveRoomFlow = () => {
    if (!room || !currentPlayerId) return

    const updated = leaveRoom(room, currentPlayerId)
    if (updated.players.length === 0) {
      setRoom(null)
      setCurrentPlayerId('')
      setScreen('landing')
      return
    }

    setRoom(updated)
    setCurrentPlayerId(updated.players[0].id)
    setScreen('landing')
  }

  const startGameFlow = () => {
    if (!room) return
    setRoom(startGame(room))
    setRoleModalOpen(true)
    setScreen('game')
  }

  const revealRoleFlow = () => {
    if (!room || !currentPlayerId) return
    const role = revealRole(room, currentPlayerId)
    setRoleModalOpen(false)

    if (role) {
      setRoom(startDayPhase(room))
    }
  }

  const postMessage = (text: string, channel: 'public' | 'mafia' = 'public') => {
    if (!room || !currentPlayerId) return

    // TODO(socket.io): emit and receive chat events here when backend is connected.
    setRoom(sendChatMessage(room, currentPlayerId, text, channel))
  }

  const chooseNightAction = (role: NightAction['role'], targetId: string) => {
    if (!room || !currentPlayerId) return

    // TODO(socket.io): sync night actions across clients with secure server validation.
    setRoom(submitNightAction(room, { actorId: currentPlayerId, role, targetId }))
  }

  const openVoting = () => {
    if (!room) return
    setRoom(startVotingPhase(room))
  }

  const castVote = (targetId: string) => {
    if (!room || !currentPlayerId) return
    setRoom(submitVote(room, { voterId: currentPlayerId, targetId }))
  }

  const resolveVoting = () => {
    if (!room) return
    const updated = resolveVote(room)
    const winner = checkWinCondition(updated)

    if (winner) {
      setRoom({ ...updated, winnerTeam: winner, phase: 'ended' })
      setScreen('end')
      return
    }

    setRoom(updated)
  }

  const runNight = () => {
    if (!room) return
    setRoom(startNightPhase(room))
  }

  const runDay = () => {
    if (!room) return
    const updated = startDayPhase(room)
    const winner = checkWinCondition(updated)

    if (winner) {
      setRoom({ ...updated, winnerTeam: winner, phase: 'ended' })
      setScreen('end')
      return
    }

    setRoom(updated)
  }

  const playAgain = () => {
    if (!room) return
    setRoom(resetGame(room))
    setRoleModalOpen(false)
    setScreen('lobby')
  }

  const state = useMemo(
    () => ({
      screen,
      room,
      currentPlayer,
      currentRole,
      roleModalOpen,
    }),
    [currentPlayer, currentRole, roleModalOpen, room, screen],
  )

  return {
    state,
    createRoomFlow,
    joinRoomFlow,
    leaveRoomFlow,
    startGameFlow,
    revealRoleFlow,
    postMessage,
    chooseNightAction,
    openVoting,
    castVote,
    resolveVoting,
    runNight,
    runDay,
    playAgain,
    setRoleModalOpen,
  }
}
