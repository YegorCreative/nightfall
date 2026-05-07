import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, LogOut, Play, Users } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PlayerList } from '../components/players/PlayerList';
import { useGame } from '../context/GameContext';

// ─── LobbyPage ────────────────────────────────────────────────────────────────
const LobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, startGame, leaveRoom, canStartGame, localPlayer } = useGame();
  const [copied, setCopied] = useState(false);

  // Redirect if no room
  if (!state.room) {
    navigate('/');
    return null;
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(state.room!.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    startGame();
    navigate('/game');
  };

  const handleLeave = () => {
    leaveRoom();
    navigate('/');
  };

  const aliveCount = state.players.length;
  const MIN = state.room.minPlayers;
  const canStart = canStartGame && aliveCount >= MIN;

  return (
    <Layout>
      <div className="min-h-dvh flex flex-col">

        {/* ── Top bar ──────────────────────────────────────────────── */}
        <motion.header
          className="flex items-center justify-between px-4 pt-6 pb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-xl font-black text-gradient-red">Nightfall</h1>
          <Button
            id="leave-room-btn"
            variant="ghost"
            size="sm"
            leftIcon={<LogOut size={14} />}
            onClick={handleLeave}
          >
            Leave
          </Button>
        </motion.header>

        <div className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full space-y-4">

          {/* ── Room Code Card ───────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 text-center" glow="red">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-2">
                Room Code
              </p>
              <p className="text-4xl font-black tracking-[0.25em] text-white mb-4 font-mono">
                {state.room.code}
              </p>
              <Button
                id="copy-room-code"
                variant="outline"
                size="sm"
                leftIcon={copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                onClick={copyCode}
                className={copied ? 'border-emerald-700/40 text-emerald-400' : ''}
              >
                {copied ? 'Copied!' : 'Copy Code'}
              </Button>
            </Card>
          </motion.div>

          {/* ── Player List ──────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={15} className="text-white/40" />
                    <span className="text-white/60 text-sm font-medium">Players</span>
                  </div>
                  <span className="text-white/30 text-xs">
                    {aliveCount} / {state.room.maxPlayers}
                  </span>
                </div>
              </Card.Header>
              <Card.Body>
                <PlayerList
                  players={state.players}
                  localPlayerId={localPlayer?.id}
                />

                {aliveCount < MIN && (
                  <p className="text-white/30 text-xs text-center mt-4">
                    Need at least {MIN} players to start.
                  </p>
                )}
              </Card.Body>
            </Card>
          </motion.div>

          {/* ── Waiting indicator ─────────────────────────────────────── */}
          {!localPlayer?.isHost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-5 text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                <p className="text-amber-400/80 text-sm font-medium">
                  Waiting for host to start the game
                </p>
              </div>
              <p className="text-white/25 text-xs">Invite your friends using the room code above.</p>
            </motion.div>
          )}

          {/* ── Host controls ─────────────────────────────────────────── */}
          {localPlayer?.isHost && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="space-y-3"
            >
              <div className="glass-heavy rounded-2xl p-4">
                <p className="text-white/40 text-xs uppercase tracking-widest text-center mb-3">
                  Host Controls
                </p>
                <Button
                  id="start-game-btn"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  leftIcon={<Play size={18} />}
                  disabled={!canStart}
                  onClick={handleStart}
                >
                  {canStart ? 'Start Game' : `Need ${MIN - aliveCount} more players`}
                </Button>
              </div>

              <p className="text-white/20 text-xs text-center">
                Roles will be assigned automatically when the game starts.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LobbyPage;
