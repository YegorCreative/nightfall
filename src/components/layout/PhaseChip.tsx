import type { Phase } from '../../types/game'

interface PhaseChipProps {
  phase: Phase
}

const phaseColor: Record<Phase, string> = {
  lobby: 'text-zinc-300',
  roleReveal: 'text-red-300',
  day: 'text-amber-200',
  night: 'text-blue-300',
  voting: 'text-rose-300',
  results: 'text-zinc-100',
  ended: 'text-emerald-300',
}

export const PhaseChip = ({ phase }: PhaseChipProps) => (
  <span className={`rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.25em] ${phaseColor[phase]}`}>
    {phase}
  </span>
)
