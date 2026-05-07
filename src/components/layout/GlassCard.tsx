import type { PropsWithChildren } from 'react'

interface GlassCardProps extends PropsWithChildren {
  className?: string
}

export const GlassCard = ({ className = '', children }: GlassCardProps) => (
  <div className={`rounded-2xl border border-red-900/30 bg-black/35 p-4 shadow-2xl backdrop-blur-xl ${className}`}>
    {children}
  </div>
)
