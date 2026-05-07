import type { Player } from '../types/game'

const names = ['Astra', 'Rook', 'Vex', 'Sable', 'Morrow', 'Echo', 'Nyx']

export const mockPlayers = (existing: Player[]): Player[] => {
  const used = new Set(existing.map((player) => player.nickname.toLowerCase()))

  return names
    .filter((name) => !used.has(name.toLowerCase()))
    .slice(0, 4)
    .map((name, index) => ({
      id: `bot-${name.toLowerCase()}`,
      nickname: name,
      alive: true,
      isHost: false,
      isReady: true,
      role: undefined,
      ...(index === 0 ? { isReady: false } : {}),
    }))
}
