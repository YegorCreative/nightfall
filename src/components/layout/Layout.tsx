import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { StarField } from '../ui/StarField';

// ─── Background layout with cinematic overlays ───────────────────────────────
interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  ambient?: 'none' | 'day' | 'night' | 'voting';
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  className,
  ambient = 'none',
}) => {
  const ambientClass =
    ambient === 'day'
      ? 'ambient-day'
      : ambient === 'night'
      ? 'ambient-night'
      : ambient === 'voting'
      ? 'ambient-voting'
      : '';

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-void">
      {/* Star field */}
      <StarField />

      {/* Noise texture overlay */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* Fog radial glow */}
      <div className="fog-layer" aria-hidden="true" />

      {/* Ambient phase glow */}
      {ambient !== 'none' && (
        <motion.div
          key={ambient}
          className={cn('absolute inset-0 pointer-events-none', ambientClass)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          aria-hidden="true"
        />
      )}

      {/* Page content */}
      <div className={cn('relative z-10 min-h-dvh', className)}>
        {children}
      </div>
    </div>
  );
};

export default Layout;
