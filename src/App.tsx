import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';

// Lazy-load pages for faster initial load
const LandingPage  = lazy(() => import('./pages/LandingPage'));
const LobbyPage    = lazy(() => import('./pages/LobbyPage'));
const GamePage     = lazy(() => import('./pages/GamePage'));
const EndGamePage  = lazy(() => import('./pages/EndGamePage'));

// Simple loader overlay
const PageLoader = () => (
  <div className="min-h-dvh flex items-center justify-center bg-void">
    <div className="w-6 h-6 border-2 border-crimson-700/40 border-t-crimson-500 rounded-full animate-spin" />
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────
const App: React.FC = () => (
  <BrowserRouter>
    <GameProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"      element={<LandingPage />} />
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/game"  element={<GamePage />} />
          <Route path="/end"   element={<EndGamePage />} />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </GameProvider>
  </BrowserRouter>
);

export default App;
