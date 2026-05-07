import type { Player } from '../../types/game'
import { GlassCard } from '../layout/GlassCard'

interface LobbyControlsProps {
  roomCode: string
  players: Player[]
  isHost: boolean
  onStart: () => void
}

export const LobbyControls = ({ roomCode, players, isHost, onStart }: LobbyControlsProps) => (
  <GlassCard className="space-y-3">
    <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Room Code</p>
    <p className="text-2xl font-semibold tracking-[0.3em] text-red-300">{roomCode}</p>
    <p className="text-sm text-zinc-300">Waiting for players to lock in. Minimum 4 players for best experience.</p>
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
      >
        Invite Link
      </button>
      {isHost ? (
        <button
          type="button"
          onClick={onStart}
          disabled={players.length < 4}
          className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-zinc-700"
        >
          Start Game
        </button>
      ) : null}
    </div>
  </GlassCard>
)
