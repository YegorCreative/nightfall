import { LobbyControls } from '../components/lobby/LobbyControls'
import { PlayerList } from '../components/players/PlayerList'
import type { Player } from '../types/game'

interface LobbyPageProps {
  roomCode: string
  players: Player[]
  currentPlayerId?: string
  onStart: () => void
  onLeave: () => void
}

export const LobbyPage = ({ roomCode, players, currentPlayerId, onStart, onLeave }: LobbyPageProps) => {
  const me = players.find((player) => player.id === currentPlayerId)

  return (
    <div className="space-y-4">
      <LobbyControls roomCode={roomCode} players={players} isHost={Boolean(me?.isHost)} onStart={onStart} />
      <PlayerList players={players} currentPlayerId={currentPlayerId} />
      <button
        type="button"
        onClick={onLeave}
        className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
      >
        Leave Room
      </button>
    </div>
  )
}
