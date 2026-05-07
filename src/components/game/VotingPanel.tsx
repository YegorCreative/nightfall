import type { Player } from '../../types/game'
import { GlassCard } from '../layout/GlassCard'

interface VotingPanelProps {
  players: Player[]
  onVote: (targetId: string) => void
}

export const VotingPanel = ({ players, onVote }: VotingPanelProps) => {
  const alive = players.filter((player) => player.alive)

  return (
    <GlassCard className="space-y-3">
      <h3 className="text-sm uppercase tracking-[0.2em] text-zinc-300">Voting Panel</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {alive.map((player) => (
          <button
            key={player.id}
            type="button"
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm transition hover:border-red-500 hover:bg-red-900/20"
            onClick={() => onVote(player.id)}
          >
            Vote {player.nickname}
          </button>
        ))}
      </div>
    </GlassCard>
  )
}
