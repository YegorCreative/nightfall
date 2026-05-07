import { ActionPanel } from '../components/game/ActionPanel'
import { VotingPanel } from '../components/game/VotingPanel'
import { ChatPanel } from '../components/chat/ChatPanel'
import { GlassCard } from '../components/layout/GlassCard'
import { PhaseChip } from '../components/layout/PhaseChip'
import { PlayerList } from '../components/players/PlayerList'
import type { GameRoomState, Player, RoleId } from '../types/game'

interface GamePageProps {
  room: GameRoomState
  currentPlayer?: Player
  onSendChat: (text: string, channel?: 'public' | 'mafia') => void
  onNightAction: (role: RoleId, targetId: string) => void
  onVote: (targetId: string) => void
  onOpenVoting: () => void
  onResolveVote: () => void
  onStartNight: () => void
  onStartDay: () => void
}

export const GamePage = ({
  room,
  currentPlayer,
  onSendChat,
  onNightAction,
  onVote,
  onOpenVoting,
  onResolveVote,
  onStartNight,
  onStartDay,
}: GamePageProps) => (
  <div className="space-y-4">
    <GlassCard className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Current Phase</p>
        <p className="mt-1 text-xl font-semibold text-white">{room.phase.toUpperCase()}</p>
      </div>
      <div className="flex items-center gap-3">
        <PhaseChip phase={room.phase} />
        <p className="text-sm text-zinc-300">Timer: {room.phaseTimer}s</p>
      </div>
    </GlassCard>

    <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
      <div className="space-y-4">
        <PlayerList players={room.players} currentPlayerId={currentPlayer?.id} />
        {room.phase === 'night' && currentPlayer ? (
          <ActionPanel
            role={currentPlayer.role}
            alive={currentPlayer.alive}
            players={room.players.filter((player) => player.id !== currentPlayer.id)}
            onAction={onNightAction}
          />
        ) : null}
        {room.phase === 'voting' ? <VotingPanel players={room.players} onVote={onVote} /> : null}
      </div>

      <ChatPanel phase={room.phase} currentPlayer={currentPlayer} chat={room.chat} onSend={onSendChat} />
    </div>

    <GlassCard className="flex flex-wrap gap-2">
      {room.phase === 'day' ? (
        <button
          type="button"
          className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
          onClick={onOpenVoting}
        >
          Start Voting
        </button>
      ) : null}
      {room.phase === 'voting' ? (
        <button
          type="button"
          className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
          onClick={onResolveVote}
        >
          Resolve Vote
        </button>
      ) : null}
      {room.phase === 'results' ? (
        <button
          type="button"
          className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
          onClick={onStartNight}
        >
          Start Night
        </button>
      ) : null}
      {room.phase === 'night' ? (
        <button
          type="button"
          className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
          onClick={onStartDay}
        >
          Start Day
        </button>
      ) : null}
    </GlassCard>
  </div>
)
