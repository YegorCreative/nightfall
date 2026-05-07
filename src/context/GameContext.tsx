import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useGameState } from '../hooks/useGameState';

// ─── GameContext ──────────────────────────────────────────────────────────────
// Wraps the entire app so any component can access game state.
// TODO: When Socket.io is integrated, replace the local useGameState hook here
//       with a socket-aware context that listens to 'game:state_update' events.

type GameContextType = ReturnType<typeof useGameState>;

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const game = useGameState();
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
};

export const useGame = (): GameContextType => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
};
