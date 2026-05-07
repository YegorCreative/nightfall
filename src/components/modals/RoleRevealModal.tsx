import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '../../types/game';
import { ROLES } from '../../data/roles';
import { Button } from '../ui/Button';

// ─── RoleRevealModal ──────────────────────────────────────────────────────────
interface RoleRevealModalProps {
  player: Player;
  onConfirm: () => void;
}

export const RoleRevealModal: React.FC<RoleRevealModalProps> = ({ player, onConfirm }) => {
  const [revealed, setRevealed] = useState(false);
  const role = player.role ? ROLES[player.role] : null;

  const handleReveal = () => setRevealed(true);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Modal card */}
        <motion.div
          className="relative w-full max-w-sm glass-heavy rounded-3xl shadow-modal overflow-hidden"
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
        >
          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-red" />

          <div className="p-8 text-center">
            <p className="text-white/40 text-sm font-medium uppercase tracking-widest mb-2">
              Your Secret Role
            </p>
            <h2 className="text-2xl font-bold text-white mb-6">
              {player.nickname}
            </h2>

            {/* Role card — click to reveal */}
            <motion.div
              className="relative mx-auto w-40 h-40 mb-6 cursor-pointer"
              onClick={!revealed ? handleReveal : undefined}
              title={!revealed ? 'Click to reveal your role' : undefined}
            >
              {/* Back face */}
              <AnimatePresence>
                {!revealed && (
                  <motion.div
                    key="back"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-crimson-900/60 to-charcoal flex flex-col items-center justify-center border border-crimson-800/30"
                    initial={{ rotateY: 0 }}
                    exit={{ rotateY: 90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="text-5xl">🌑</span>
                    <p className="text-white/40 text-xs mt-3 font-medium">Tap to reveal</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Front face */}
              <AnimatePresence>
                {revealed && role && (
                  <motion.div
                    key="front"
                    className={`absolute inset-0 rounded-2xl ${role.bgColor} flex flex-col items-center justify-center border border-white/10`}
                    initial={{ rotateY: -90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="text-5xl">{role.emoji}</span>
                    <p className={`text-lg font-bold mt-2 ${role.color}`}>
                      {role.name}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Role description */}
            <AnimatePresence>
              {revealed && role && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${role.bgColor} ${role.color}`}>
                    {role.team === 'mafia' ? 'Mafia Team' : 'Town Team'}
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">
                    {role.description}
                  </p>

                  {role.nightActionLabel && (
                    <div className="glass rounded-xl p-3 mb-6 text-left">
                      <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Night Ability</p>
                      <p className="text-white/80 text-sm font-medium">{role.nightActionLabel}</p>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={onConfirm}
                    id="role-reveal-confirm"
                  >
                    I understand. Begin.
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {!revealed && (
              <p className="text-white/30 text-xs mt-2">
                Make sure no one else is watching.
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RoleRevealModal;
