import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Home } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PlayerList } from '../components/players/PlayerList';
import { useGame } from '../context/GameContext';
import { cn } from '../utils/cn';

// ─── EndGamePage ──────────────────────────────────────────────────────────────
const EndGamePage: React.FC = () => {
  const navigate = useNavigate();
  const { state, resetGame } = useGame();
  const { winningTeam, players } = state;

  const istown = winningTeam === 'town';

  const handlePlayAgain = () => {
    resetGame();
    navigate('/lobby');
  };

  const handleHome = () => {
    resetGame();
    navigate('/');
  };

  return (
    <Layout ambient={istown ? 'day' : 'night'}>
      <div className="min-h-dvh flex flex-col items-center justify-start px-4 pt-12 pb-10">

        {/* ── Victory header ─────────────────────────────────────────── */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        >
          <motion.div
            className="text-6xl mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
          >
            {istown ? '☀️' : '🌑'}
          </motion.div>

          <p className={cn(
            'text-xs uppercase tracking-[0.3em] font-semibold mb-2',
            istown ? 'text-amber-400/70' : 'text-indigo-400/70'
          )}>
            {istown ? 'Town Victory' : 'Mafia Victory'}
          </p>

          <h1 className={cn(
            'text-5xl font-black mb-3',
            istown ? 'text-gradient-light' : 'text-gradient-red'
          )}>
            {istown ? 'Justice Served' : 'The Mafia Wins'}
          </h1>

          <p className="text-white/40 max-w-xs text-sm leading-relaxed">
            {istown
              ? 'The citizens banded together and eliminated all Mafia. Peace returns to the village.'
              : 'The Mafia claimed the night. The town never stood a chance.'}
          </p>
        </motion.div>

        {/* ── Revealed roles ────────────────────────────────────────── */}
        <motion.div
          className="w-full max-w-sm mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <Card.Header>
              <p className="text-white/40 text-xs uppercase tracking-widest">Role Reveal</p>
            </Card.Header>
            <Card.Body className="p-3">
              <PlayerList
                players={players}
                showRoles={true}
                localPlayerId={state.localPlayerId}
              />
            </Card.Body>
          </Card>
        </motion.div>

        {/* ── Stats ─────────────────────────────────────────────────── */}
        <motion.div
          className="w-full max-w-sm mb-8 grid grid-cols-3 gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          {[
            { label: 'Rounds', value: state.round },
            { label: 'Survivors', value: players.filter(p => p.isAlive).length },
            { label: 'Eliminated', value: players.filter(p => !p.isAlive).length },
          ].map(stat => (
            <div key={stat.label} className="glass rounded-xl p-3 text-center">
              <p className="text-xl font-black text-white">{stat.value}</p>
              <p className="text-white/30 text-xs">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── CTA buttons ───────────────────────────────────────────── */}
        <motion.div
          className="w-full max-w-sm space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <Button
            id="play-again-btn"
            variant="primary"
            size="lg"
            className="w-full"
            leftIcon={<RefreshCw size={18} />}
            onClick={handlePlayAgain}
          >
            Play Again
          </Button>
          <Button
            id="go-home-btn"
            variant="ghost"
            size="lg"
            className="w-full"
            leftIcon={<Home size={18} />}
            onClick={handleHome}
          >
            Back to Home
          </Button>
        </motion.div>

      </div>
    </Layout>
  );
};

export default EndGamePage;
