import React from 'react';
import { motion } from 'framer-motion';
import type { Player, Vote } from '../../types/game';
import { ROLES } from '../../data/roles';
import { cn } from '../../utils/cn';
import { Skull, ShieldCheck } from 'lucide-react';

// ─── PlayerCard ───────────────────────────────────────────────────────────────
interface PlayerCardProps {
  player: Player;
  showRole?: boolean;
  votable?: boolean;
  onVote?: (id: string) => void;
  votes?: Vote[];
  totalVoters?: number;
  isLocalPlayer?: boolean;
  targetable?: boolean;     // For night action targeting
  onTarget?: (id: string) => void;
  isTargeted?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  showRole = false,
  votable = false,
  onVote,
  votes = [],
  totalVoters = 0,
  isLocalPlayer = false,
  targetable = false,
  onTarget,
  isTargeted = false,
}) => {
  const role = player.role ? ROLES[player.role] : null;
  const voteCount = votes.filter(v => v.targetId === player.id).length;
  const votePercent = totalVoters > 0 ? (voteCount / totalVoters) * 100 : 0;
  const isClickable = (votable && player.isAlive && !isLocalPlayer) ||
                      (targetable && player.isAlive && !isLocalPlayer);

  const handleClick = () => {
    if (votable && player.isAlive && !isLocalPlayer && onVote) {
      onVote(player.id);
    } else if (targetable && player.isAlive && !isLocalPlayer && onTarget) {
      onTarget(player.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: player.isAlive ? 1 : 0.45, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative rounded-xl p-3 border transition-all duration-200',
        player.isAlive
          ? 'glass border-white/8'
          : 'bg-white/2 border-white/4',
        isLocalPlayer && 'border-crimson-700/40',
        isTargeted && 'border-crimson-500/60 shadow-red-glow',
        isClickable && 'cursor-pointer hover:border-white/20 hover:bg-white/5',
      )}
      onClick={isClickable ? handleClick : undefined}
      whileHover={isClickable ? { scale: 1.02 } : undefined}
      whileTap={isClickable ? { scale: 0.98 } : undefined}
      id={`player-${player.id}`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={cn(
          'relative w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0',
          player.isAlive ? 'bg-white/5' : 'bg-white/2 grayscale'
        )}>
          {player.avatar}
          {/* Status dot */}
          <span className={cn(
            'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-charcoal',
            player.isAlive ? 'bg-emerald-500' : 'bg-gray-600'
          )} />
        </div>

        {/* Name / role */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              'text-sm font-semibold truncate',
              player.isAlive ? 'text-white/90' : 'text-white/30 line-through',
              isLocalPlayer && 'text-crimson-300'
            )}>
              {player.nickname}
            </span>
            {isLocalPlayer && (
              <span className="text-crimson-400/60 text-[10px] font-medium shrink-0">(You)</span>
            )}
            {player.isHost && (
              <span className="text-amber-400/60 text-[10px] shrink-0">👑</span>
            )}
          </div>

          {showRole && role ? (
            <span className={cn('text-xs font-medium', role.color)}>
              {role.emoji} {role.name}
            </span>
          ) : !player.isAlive ? (
            <span className="text-white/20 text-xs flex items-center gap-1">
              <Skull size={10} />
              Eliminated
            </span>
          ) : null}
        </div>

        {/* Icons */}
        {isTargeted && (
          <ShieldCheck size={16} className="text-crimson-400 shrink-0" />
        )}
        {!player.isAlive && (
          <Skull size={14} className="text-white/20 shrink-0" />
        )}
      </div>

      {/* Vote bar */}
      {votable && player.isAlive && voteCount > 0 && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-white/30 mb-1">
            <span>{voteCount} vote{voteCount !== 1 ? 's' : ''}</span>
            <span>{Math.round(votePercent)}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-crimson-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${votePercent}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ─── PlayerList ───────────────────────────────────────────────────────────────
interface PlayerListProps {
  players: Player[];
  showRoles?: boolean;
  votable?: boolean;
  onVote?: (id: string) => void;
  votes?: Vote[];
  localPlayerId?: string | null;
  targetable?: boolean;
  onTarget?: (id: string) => void;
  targetedId?: string | null;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  showRoles = false,
  votable = false,
  onVote,
  votes = [],
  localPlayerId,
  targetable = false,
  onTarget,
  targetedId,
}) => {
  const aliveVoters = players.filter(p => p.isAlive).length;

  return (
    <div className="space-y-2">
      {players.map(p => (
        <PlayerCard
          key={p.id}
          player={p}
          showRole={showRoles}
          votable={votable}
          onVote={onVote}
          votes={votes}
          totalVoters={aliveVoters}
          isLocalPlayer={p.id === localPlayerId}
          targetable={targetable}
          onTarget={onTarget}
          isTargeted={p.id === targetedId}
        />
      ))}
    </div>
  );
};

export default PlayerList;
