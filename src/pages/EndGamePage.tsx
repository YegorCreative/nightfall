import { GlassCard } from '../components/layout/GlassCard'
import { PlayerList } from '../components/players/PlayerList'
import type { GameRoomState } from '../types/game'

interface EndGamePageProps {
  room: GameRoomState
  onPlayAgain: () => void
}

export const EndGamePage = ({ room, onPlayAgain }: EndGamePageProps) => (
  <div className="space-y-4">
    <GlassCard className="text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Game Over</p>
      <h2 className="mt-2 text-3xl font-semibold text-white">
        {room.winnerTeam === 'mafia' ? 'Mafia Wins' : 'Town Wins'}
      </h2>
      <p className="mt-2 text-sm text-zinc-300">Roles are now revealed. Review the round and queue the rematch.</p>
      <button
        type="button"
        onClick={onPlayAgain}
        className="mt-4 rounded-xl bg-red-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
      >
        Play Again
      </button>
    </GlassCard>

    <PlayerList players={room.players} revealRoles />
  </div>
)
