import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  glow?: 'none' | 'red' | 'blue' | 'green' | 'amber';
}

const glowMap: Record<string, string> = {
  none: '',
  red: 'shadow-red-glow border-red-800/30',
  blue: 'shadow-[0_0_20px_rgba(59,130,246,0.3)] border-blue-800/30',
  green: 'shadow-[0_0_20px_rgba(52,211,153,0.25)] border-emerald-800/30',
  amber: 'shadow-[0_0_20px_rgba(245,158,11,0.25)] border-amber-800/30',
};

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
  onClick,
  glow = 'none',
}) => {
  const base = 'glass rounded-2xl shadow-card overflow-hidden';

  if (hover || onClick) {
    return (
      <motion.div
        className={cn(base, glowMap[glow], 'cursor-pointer', className)}
        whileHover={{ scale: 1.01, translateY: -2 }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={cn(base, glowMap[glow], className)}>{children}</div>
  );
};

// ─── Card.Header ─────────────────────────────────────────────────────────────
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

Card.Header = function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('px-6 py-4 border-b border-white/5', className)}>
      {children}
    </div>
  );
} as React.FC<CardHeaderProps>;

// ─── Card.Body ────────────────────────────────────────────────────────────────
Card.Body = function CardBody({ children, className }: CardHeaderProps) {
  return <div className={cn('p-6', className)}>{children}</div>;
} as React.FC<CardHeaderProps>;
