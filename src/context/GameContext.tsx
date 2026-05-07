import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useSocketGame } from '../hooks/useSocketGame';

type GameContextType = ReturnType<typeof useSocketGame>;

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const game = useSocketGame();
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
};

export const useGame = (): GameContextType => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
};
