import { useState } from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from '../components/layout/GlassCard'

interface LandingPageProps {
  onCreateRoom: (nickname: string) => void
  onJoinRoom: (roomCode: string, nickname: string) => void
}

const features = [
  { title: 'Secret Roles', text: 'Every player receives a hidden identity and objective.' },
  { title: 'Live Chat', text: 'Debate in public while preserving private secrets at night.' },
  { title: 'Voting', text: 'Read the room and decide who gets eliminated.' },
  { title: 'Night Actions', text: 'Mafia, Doctor, and Detective reshape every round.' },
]

export const LandingPage = ({ onCreateRoom, onJoinRoom }: LandingPageProps) => {
  const [nickname, setNickname] = useState('')
  const [roomCode, setRoomCode] = useState('')

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">Social Deduction</p>
        <h1 className="text-5xl font-semibold text-white sm:text-6xl">Nightfall</h1>
        <p className="text-lg text-red-300">Trust No One.</p>
        <p className="mx-auto max-w-xl text-sm text-zinc-300">
          Gather your crew, claim a secret role, survive the night, and outplay the opposing team in real-time deception.
        </p>
      </motion.div>

      <GlassCard className="mx-auto max-w-xl space-y-3">
        <input
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="Enter nickname"
          className="w-full rounded-xl border border-white/20 bg-black/50 px-3 py-2 text-sm outline-none ring-red-500/70 focus:ring"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
            onClick={() => onCreateRoom(nickname || 'Player')}
          >
            Create Room
          </button>
          <button
            type="button"
            className="rounded-xl border border-white/25 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
            onClick={() => onJoinRoom(roomCode || 'NIGHT1', nickname || 'Guest')}
          >
            Join Room
          </button>
        </div>
        <input
          value={roomCode}
          onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
          placeholder="Room code"
          className="w-full rounded-xl border border-white/20 bg-black/50 px-3 py-2 text-sm outline-none ring-red-500/70 focus:ring"
        />
      </GlassCard>

      <div className="grid gap-3 sm:grid-cols-2">
        {features.map((feature) => (
          <GlassCard key={feature.title}>
            <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
            <p className="mt-1 text-sm text-zinc-300">{feature.text}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
