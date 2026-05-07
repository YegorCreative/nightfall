import { useState } from 'react'
import type { ChatMessage, Phase, Player, RoleId } from '../../types/game'
import { GlassCard } from '../layout/GlassCard'

interface ChatPanelProps {
  phase: Phase
  currentPlayer?: Player
  chat: ChatMessage[]
  onSend: (text: string, channel?: 'public' | 'mafia') => void
}

const messageTone = (message: ChatMessage) => {
  if (message.channel === 'system') return 'border-l-red-500/70 bg-red-900/20 text-red-100'
  if (message.channel === 'mafia') return 'border-l-purple-400/70 bg-purple-900/20 text-purple-100'
  return 'border-l-zinc-500/60 bg-zinc-900/30 text-zinc-100'
}

export const ChatPanel = ({ phase, currentPlayer, chat, onSend }: ChatPanelProps) => {
  const [text, setText] = useState('')
  const [nightChannel, setNightChannel] = useState<'public' | 'mafia'>('public')

  const canUseMafiaChannel = phase === 'night' && currentPlayer?.role === ('mafia' as RoleId)
  const canSpeakPublic = phase !== 'night' && currentPlayer?.alive

  const submit = () => {
    if (!text.trim()) return
    const channel = canUseMafiaChannel ? nightChannel : 'public'
    onSend(text, channel)
    setText('')
  }

  return (
    <GlassCard className="h-full space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-[0.2em] text-zinc-300">Chat</h3>
        {canUseMafiaChannel ? (
          <select
            className="rounded-lg border border-white/20 bg-black/60 px-2 py-1 text-xs"
            value={nightChannel}
            onChange={(event) => setNightChannel(event.target.value as 'public' | 'mafia')}
          >
            <option value="public">Public (locked at night)</option>
            <option value="mafia">Mafia private (placeholder)</option>
          </select>
        ) : null}
      </div>
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {chat.slice(-30).map((message) => (
          <div key={message.id} className={`rounded-lg border-l-2 p-2 text-sm ${messageTone(message)}`}>
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-400">{message.nickname}</p>
            <p>{message.text}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={canSpeakPublic ? 'Share your thoughts...' : 'Public chat is unavailable right now'}
          className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-sm outline-none ring-red-500/70 transition focus:ring"
          disabled={!canSpeakPublic && nightChannel === 'public'}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit()
          }}
        />
        <button
          type="button"
          onClick={submit}
          className="rounded-xl bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
        >
          Send
        </button>
      </div>
    </GlassCard>
  )
}
