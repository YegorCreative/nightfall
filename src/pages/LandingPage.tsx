import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Hash, Users, Eye, Vote, Moon } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useGame } from '../context/GameContext';
import { cn } from '../utils/cn';

// ─── LandingPage ──────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Eye,
    title: 'Secret Roles',
    desc: 'Every player receives a hidden role — Mafia, Detective, Doctor, or Citizen. Trust no one.',
    color: 'text-red-400',
    bg: 'bg-red-900/20',
  },
  {
    icon: Moon,
    title: 'Night Actions',
    desc: 'When darkness falls, the Mafia strikes. The Doctor heals. The Detective investigates.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-900/20',
  },
  {
    icon: Vote,
    title: 'Town Voting',
    desc: 'Each day the village debates and votes to eliminate one suspect. Choose wisely.',
    color: 'text-amber-400',
    bg: 'bg-amber-900/20',
  },
  {
    icon: Users,
    title: 'Live Multiplayer',
    desc: '4–12 players in private rooms. Invite your friends and begin the deception.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-900/20',
  },
];

type EntryMode = 'none' | 'create' | 'join';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { createRoom, joinRoom, setNickname } = useGame();
  const [mode, setMode] = useState<EntryMode>('none');
  const [nickname, setNicknameLocal] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!nickname.trim()) { setError('Enter your nickname first.'); return; }
    setNickname(nickname.trim());
    createRoom();
    navigate('/lobby');
  };

  const handleJoin = () => {
    if (!nickname.trim()) { setError('Enter your nickname first.'); return; }
    if (!roomCode.trim() || roomCode.trim().length < 4) {
      setError('Enter a valid room code.');
      return;
    }
    setNickname(nickname.trim());
    joinRoom(roomCode.trim().toUpperCase(), nickname.trim());
    navigate('/lobby');
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-dvh">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="flex flex-col items-center justify-center flex-1 px-4 pt-20 pb-12 text-center">

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 mb-6"
          >
            <span className="w-8 h-px bg-gradient-to-r from-transparent to-crimson-600" />
            <span className="text-crimson-400 text-xs font-semibold uppercase tracking-[0.3em]">
              Social Deduction · Multiplayer
            </span>
            <span className="w-8 h-px bg-gradient-to-l from-transparent to-crimson-600" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-7xl md:text-8xl font-black tracking-tight mb-4"
            style={{ fontVariationSettings: "'wght' 900" }}
          >
            <span className="text-gradient-red">Nightfall</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-2xl md:text-3xl text-white/30 font-light tracking-wide mb-12"
          >
            Trust No One.
          </motion.p>

          {/* CTA Block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="w-full max-w-sm"
          >
            {/* Nickname input (always shown once a mode is selected) */}
            {mode !== 'none' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4"
              >
                <input
                  id="nickname-input"
                  type="text"
                  value={nickname}
                  onChange={e => { setNicknameLocal(e.target.value); setError(''); }}
                  placeholder="Your nickname"
                  maxLength={20}
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-crimson-600/50 text-center font-semibold tracking-wide transition-colors"
                />
              </motion.div>
            )}

            {/* Room code input for join mode */}
            {mode === 'join' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4"
              >
                <input
                  id="room-code-input"
                  type="text"
                  value={roomCode}
                  onChange={e => { setRoomCode(e.target.value.toUpperCase()); setError(''); }}
                  placeholder="Room code (e.g. NF7X2Q)"
                  maxLength={8}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-crimson-600/50 text-center font-mono font-bold tracking-widest transition-colors"
                />
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <p className="text-red-400 text-sm text-center mb-3">{error}</p>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              {mode === 'none' && (
                <>
                  <Button
                    id="cta-create-room"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    leftIcon={<Plus size={18} />}
                    onClick={() => setMode('create')}
                  >
                    Create Room
                  </Button>
                  <Button
                    id="cta-join-room"
                    variant="ghost"
                    size="lg"
                    className="w-full"
                    leftIcon={<Hash size={18} />}
                    onClick={() => setMode('join')}
                  >
                    Join Room
                  </Button>
                </>
              )}

              {mode === 'create' && (
                <>
                  <Button
                    id="confirm-create-room"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleCreate}
                  >
                    Create My Room
                  </Button>
                  <Button
                    id="back-to-landing"
                    variant="ghost"
                    size="md"
                    className="w-full"
                    onClick={() => { setMode('none'); setError(''); }}
                  >
                    Back
                  </Button>
                </>
              )}

              {mode === 'join' && (
                <>
                  <Button
                    id="confirm-join-room"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleJoin}
                  >
                    Enter Room
                  </Button>
                  <Button
                    id="back-to-landing-join"
                    variant="ghost"
                    size="md"
                    className="w-full"
                    onClick={() => { setMode('none'); setError(''); }}
                  >
                    Back
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </section>

        {/* ── How to Play ──────────────────────────────────────────── */}
        <section className="px-4 pb-8 max-w-4xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-xl font-bold text-white/80 text-center mb-6">
              How It Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                >
                  <Card hover className={cn('p-5', f.bg)}>
                    <div className="flex items-start gap-4">
                      <div className={cn('p-2 rounded-lg bg-black/20 shrink-0', f.color)}>
                        <f.icon size={18} />
                      </div>
                      <div>
                        <h3 className={cn('font-semibold mb-1', f.color)}>{f.title}</h3>
                        <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <footer className="text-center pb-8 text-white/20 text-xs">
          Nightfall · Trust No One · Prototype v0.1
        </footer>

      </div>
    </Layout>
  );
};

export default LandingPage;
