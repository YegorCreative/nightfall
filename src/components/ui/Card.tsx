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

interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
}

const glowMap: Record<string, string> = {
  none: '',
  red: 'shadow-red-glow border-red-800/30',
  blue: 'shadow-[0_0_20px_rgba(59,130,246,0.3)] border-blue-800/30',
  green: 'shadow-[0_0_20px_rgba(52,211,153,0.25)] border-emerald-800/30',
  amber: 'shadow-[0_0_20px_rgba(245,158,11,0.25)] border-amber-800/30',
};

// Extend Card component type to include sub-components
interface CardComponent extends React.FC<CardProps> {
  Header: React.FC<CardSectionProps>;
  Body: React.FC<CardSectionProps>;
}

const CardBase: React.FC<CardProps> = ({
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
const CardHeader: React.FC<CardSectionProps> = ({ children, className }) => (
  <div className={cn('px-6 py-4 border-b border-white/5', className)}>
    {children}
  </div>
);

// ─── Card.Body ────────────────────────────────────────────────────────────────
const CardBody: React.FC<CardSectionProps> = ({ children, className }) => (
  <div className={cn('p-6', className)}>{children}</div>
);

export const Card = CardBase as CardComponent;
Card.Header = CardHeader;
Card.Body = CardBody;
