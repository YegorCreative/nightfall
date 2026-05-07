import type { Player, RoleId } from '../../types/game'
import { roleSummary } from '../../utils/gameLogic'
import { GlassCard } from '../layout/GlassCard'

interface ActionPanelProps {
  role?: RoleId
  alive: boolean
  players: Player[]
  onAction: (role: RoleId, targetId: string) => void
}

export const ActionPanel = ({ role, alive, players, onAction }: ActionPanelProps) => {
  const targets = players.filter((player) => player.alive)

  if (!role) return null

  const canAct = alive && ['mafia', 'doctor', 'detective'].includes(role)

  return (
    <GlassCard className="space-y-3">
      <h3 className="text-sm uppercase tracking-[0.2em] text-zinc-300">Night Action</h3>
      <p className="text-sm text-zinc-300">{roleSummary(role)}</p>
      {!canAct ? <p className="text-xs text-zinc-500">Your role has no night action.</p> : null}
      {canAct ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {targets.map((target) => (
            <button
              key={target.id}
              type="button"
              onClick={() => onAction(role, target.id)}
              className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-left text-sm transition hover:border-red-500 hover:bg-red-900/40"
            >
              {target.nickname}
            </button>
          ))}
        </div>
      ) : null}
    </GlassCard>
  )
}
