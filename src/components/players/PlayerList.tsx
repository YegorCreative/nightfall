import type { Player } from '../../types/game'
import { roleName } from '../../utils/gameLogic'
import { GlassCard } from '../layout/GlassCard'

interface PlayerListProps {
  players: Player[]
  revealRoles?: boolean
  currentPlayerId?: string
}

export const PlayerList = ({ players, revealRoles = false, currentPlayerId }: PlayerListProps) => (
  <GlassCard className="space-y-2">
    <h3 className="text-sm uppercase tracking-[0.2em] text-zinc-300">Players</h3>
    {players.map((player) => (
      <div
        key={player.id}
        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
          player.alive ? 'border-white/20 bg-white/5' : 'border-zinc-700/70 bg-zinc-900/70 text-zinc-500'
        }`}
      >
        <span>
          {player.nickname}
          {player.id === currentPlayerId ? ' (You)' : ''}
          {player.isHost ? ' ★' : ''}
        </span>
        <span className="text-xs text-zinc-300">
          {player.alive ? 'Alive' : 'Spectator'}
          {revealRoles ? ` • ${roleName(player.role)}` : ''}
        </span>
      </div>
    ))}
  </GlassCard>
)
