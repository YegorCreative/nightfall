import type { RoleDefinition } from '../../types/game'

interface RoleRevealModalProps {
  open: boolean
  role?: RoleDefinition
  onConfirm: () => void
}

export const RoleRevealModal = ({ open, role, onConfirm }: RoleRevealModalProps) => {
  if (!open || !role) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-red-900/60 bg-zinc-950/95 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.25em] text-red-300">Secret Role</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">{role.name}</h2>
        <p className="mt-3 text-sm text-zinc-300">{role.summary}</p>
        <button
          type="button"
          onClick={onConfirm}
          className="mt-6 w-full rounded-xl bg-red-700 px-4 py-2 font-semibold text-white transition hover:bg-red-600"
        >
          Confirm
        </button>
      </div>
    </div>
  )
}
