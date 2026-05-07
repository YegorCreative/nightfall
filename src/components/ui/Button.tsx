import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}) => {
  const base =
    'relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden';

  const variants: Record<string, string> = {
    primary:
      'bg-gradient-red text-white shadow-red-glow hover:brightness-110 active:scale-95',
    ghost:
      'glass text-white/80 hover:text-white hover:bg-white/5 active:scale-95',
    danger:
      'bg-red-900/50 text-red-300 border border-red-700/40 hover:bg-red-800/60 active:scale-95',
    outline:
      'border border-white/10 text-white/70 hover:border-white/20 hover:text-white active:scale-95',
  };

  const sizes: Record<string, string> = {
    sm: 'px-4 py-2 text-sm h-9',
    md: 'px-6 py-3 text-sm h-11',
    lg: 'px-8 py-4 text-base h-14',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center bg-inherit rounded-xl">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </span>
      )}
      {leftIcon && !isLoading && <span className="shrink-0">{leftIcon}</span>}
      {!isLoading && children}
      {rightIcon && !isLoading && <span className="shrink-0">{rightIcon}</span>}
    </motion.button>
  );
};
