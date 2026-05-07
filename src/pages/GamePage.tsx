import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Vote, Clock, ChevronRight, Zap } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ChatPanel } from '../components/chat/ChatPanel';
import { PlayerList } from '../components/players/PlayerList';
import { RoleRevealModal } from '../components/modals/RoleRevealModal';
import { useGame } from '../context/GameContext';
import { ROLES } from '../data/roles';
import { formatPhaseTime } from '../utils/gameLogic';
import { cn } from '../utils/cn';

// ─── Phase config ─────────────────────────────────────────────────────────────
const PHASE_CONFIG = {
  'role-reveal': { label: 'Role Reveal', icon: null, ambient: 'night' as const, color: 'text-purple-400' },
  night:   { label: 'Night Phase', icon: Moon,  ambient: 'night' as const,  color: 'text-indigo-400' },
  day:     { label: 'Day Phase',   icon: Sun,   ambient: 'day' as const,    color: 'text-amber-400'  },
  voting:  { label: 'Voting',      icon: Vote,  ambient: 'voting' as const, color: 'text-red-400'    },
  lobby:   { label: 'Lobby',       icon: null,  ambient: 'none' as const,   color: 'text-white/40'   },
  ended:   { label: 'Game Over',   icon: null,  ambient: 'none' as const,   color: 'text-white/40'   },
};

// ─── GamePage ─────────────────────────────────────────────────────────────────
const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    state,
    localPlayer,
    confirmRoleReveal,
    submitNightAction,
    resolveNight,
    sendMessage,
    startVoting,
    submitVote,
    resolveVote,
  } = useGame();

  const [nightTarget, setNightTarget] = useState<string | null>(null);
  const [showNightResult, setShowNightResult] = useState(false);

  // Redirect guards
  useEffect(() => {
    if (!state.room) navigate('/');
    if (state.phase === 'ended') navigate('/end');
  }, [state.room, state.phase, navigate]);

  // Show night result briefly
  useEffect(() => {
    if (state.phase === 'day' && state.eliminatedThisRound !== null) {
      setShowNightResult(true);
      const t = setTimeout(() => setShowNightResult(false), 4000);
      return () => clearTimeout(t);
    }
  }, [state.phase, state.eliminatedThisRound]);

  if (!state.room || !localPlayer) return null;

  const phase = state.phase;
  const cfg = PHASE_CONFIG[phase] ?? PHASE_CONFIG.lobby;
  const PhaseIcon = cfg.icon;
  const role = localPlayer.role ? ROLES[localPlayer.role] : null;
  const isNight = phase === 'night';
  const isDay = phase === 'day';
  const isVoting = phase === 'voting';
  const isMafia = localPlayer.role === 'Mafia';
  const isAlive = localPlayer.isAlive;

  // Who can the local player target?
  const targetablePlayers = state.players.filter(
    p => p.isAlive && p.id !== localPlayer.id
  );

  const handleNightSubmit = () => {
    if (!nightTarget || !localPlayer.role) return;
    submitNightAction({
      actorId: localPlayer.id,
      actorRole: localPlayer.role,
      targetId: nightTarget,
    });
  };

  return (
    <Layout ambient={cfg.ambient}>
      {/* ── Role Reveal Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {phase === 'role-reveal' && localPlayer && (
          <RoleRevealModal player={localPlayer} onConfirm={confirmRoleReveal} />
        )}
      </AnimatePresence>

      {/* ── Night Result Banner ───────────────────────────────────── */}
      <AnimatePresence>
        {showNightResult && (
          <motion.div
            className="fixed top-0 left-0 right-0 z-40 p-4 flex justify-center"
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
          >
            <div className="glass-heavy rounded-2xl px-6 py-3 border border-crimson-800/30 shadow-red-glow max-w-sm text-center">
              <p className="text-white/80 text-sm">
                {state.eliminatedThisRound
                  ? `💀 ${state.players.find(p => p.id === state.eliminatedThisRound)?.nickname} was eliminated.`
                  : '🌅 No one was eliminated last night.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col min-h-dvh">

        {/* ── Header ───────────────────────────────────────────────── */}
        <motion.header
          className="flex items-center justify-between px-4 pt-5 pb-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-lg font-black text-gradient-red">Nightfall</h1>
            <p className="text-white/30 text-xs">Round {state.round}</p>
          </div>

          {/* Phase badge */}
          <div className={cn('flex items-center gap-2 glass rounded-xl px-3 py-2', cfg.color)}>
            {PhaseIcon && <PhaseIcon size={14} />}
            <span className="text-xs font-semibold">{cfg.label}</span>
          </div>
        </motion.header>

        {/* ── Timer bar ────────────────────────────────────────────── */}
        {state.phaseTimeLeft > 0 && (
          <div className="px-4 mb-3">
            <div className="flex items-center justify-between text-xs text-white/30 mb-1">
              <span className="flex items-center gap-1">
                <Clock size={10} />
                Phase time
              </span>
              <span className="font-mono font-bold">{formatPhaseTime(state.phaseTimeLeft)}</span>
            </div>
            <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full', cfg.color.replace('text-', 'bg-'))}
                style={{ originX: 0 }}
                animate={{ scaleX: 0 }}
                initial={{ scaleX: 1 }}
                transition={{ duration: state.phaseTimeLeft, ease: 'linear' }}
              />
            </div>
          </div>
        )}

        {/* ── Main layout ───────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col lg:flex-row gap-3 px-4 pb-4 min-h-0">

          {/* Left — player list + actions */}
          <div className="w-full lg:w-72 lg:shrink-0 space-y-3">

            {/* Role badge */}
            {role && (
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn('glass rounded-xl px-4 py-3 flex items-center gap-3', role.bgColor)}
              >
                <span className="text-2xl">{role.emoji}</span>
                <div>
                  <p className="text-white/40 text-xs">Your Role</p>
                  <p className={cn('text-sm font-bold', role.color)}>{role.name}</p>
                </div>
                {!isAlive && (
                  <span className="ml-auto text-xs text-white/25">Spectating</span>
                )}
              </motion.div>
            )}

            {/* Player list */}
            <Card className="overflow-hidden">
              <Card.Header>
                <p className="text-white/40 text-xs uppercase tracking-widest">Players</p>
              </Card.Header>
              <Card.Body className="p-3">
                <PlayerList
                  players={state.players}
                  localPlayerId={localPlayer.id}
                  votable={isVoting && isAlive && !localPlayer.hasVoted}
                  onVote={submitVote}
                  votes={state.votes}
                  targetable={isNight && isAlive && !localPlayer.hasActed && role?.nightActionLabel !== undefined}
                  onTarget={id => setNightTarget(id)}
                  targetedId={nightTarget}
                />
              </Card.Body>
            </Card>

            {/* Action panel */}
            <AnimatePresence>
              {isNight && isAlive && role?.nightActionLabel && (
                <NightActionPanel
                  key="night-action"
                  role={role}
                  target={nightTarget}
                  hasActed={localPlayer.hasActed}
                  onSubmit={handleNightSubmit}
                  targetablePlayers={targetablePlayers}
                  onTarget={setNightTarget}
                />
              )}

              {isDay && isAlive && localPlayer.isHost && (
                <motion.div
                  key="day-controls"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  <Button
                    id="resolve-night-btn"
                    variant="ghost"
                    size="sm"
                    className="w-full text-white/50"
                    leftIcon={<Zap size={14} />}
                    onClick={resolveNight}
                  >
                    Resolve Night
                  </Button>
                  <Button
                    id="start-voting-btn"
                    variant="danger"
                    size="sm"
                    className="w-full"
                    leftIcon={<Vote size={14} />}
                    onClick={startVoting}
                  >
                    Start Voting
                  </Button>
                </motion.div>
              )}

              {isVoting && isAlive && localPlayer.isHost && (
                <motion.div
                  key="voting-controls"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Button
                    id="resolve-vote-btn"
                    variant="danger"
                    size="sm"
                    className="w-full"
                    leftIcon={<ChevronRight size={14} />}
                    onClick={resolveVote}
                  >
                    Resolve Votes
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — chat panel */}
          <div className="flex-1 min-h-[360px] lg:min-h-0">
            <ChatPanel
              messages={state.messages.filter(m =>
                m.type !== 'mafia' || (m.type === 'mafia' && isMafia)
              )}
              onSend={text => sendMessage(text, isMafia && isNight ? 'mafia' : 'public')}
              disabled={!isAlive}
              phase={phase}
              isMafiaChannel={isMafia && isNight}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

// ─── Night Action Panel ───────────────────────────────────────────────────────
interface NightActionPanelProps {
  role: ReturnType<typeof ROLES[string]>;
  target: string | null;
  hasActed: boolean;
  onSubmit: () => void;
  targetablePlayers: { id: string; nickname: string; avatar: string }[];
  onTarget: (id: string) => void;
}

const NightActionPanel: React.FC<NightActionPanelProps> = ({
  role,
  target,
  hasActed,
  onSubmit,
  targetablePlayers,
  onTarget,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className={cn('glass rounded-2xl p-4', role.bgColor)}
  >
    <p className={cn('text-xs font-semibold uppercase tracking-wide mb-1', role.color)}>
      {role.nightActionLabel}
    </p>
    <p className="text-white/40 text-xs mb-3">{role.nightActionDescription}</p>

    {hasActed ? (
      <div className="flex items-center gap-2 text-emerald-400 text-sm">
        <span>✓</span>
        <span>Action submitted</span>
      </div>
    ) : (
      <>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {targetablePlayers.map(p => (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTarget(p.id)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                target === p.id
                  ? cn('bg-white/15 text-white border border-white/20')
                  : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10'
              )}
              id={`night-target-${p.id}`}
            >
              <span>{p.avatar}</span>
              <span>{p.nickname}</span>
            </motion.button>
          ))}
        </div>
        <Button
          id="submit-night-action"
          variant="primary"
          size="sm"
          className="w-full"
          disabled={!target}
          onClick={onSubmit}
        >
          Confirm Action
        </Button>
      </>
    )}
  </motion.div>
);

export default GamePage;
