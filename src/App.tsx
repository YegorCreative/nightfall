import { AnimatePresence, motion } from 'framer-motion'
import { RoleRevealModal } from './components/modals/RoleRevealModal'
import { useGameState } from './hooks/useGameState'
import { EndGamePage } from './pages/EndGamePage'
import { GamePage } from './pages/GamePage'
import { LandingPage } from './pages/LandingPage'
import { LobbyPage } from './pages/LobbyPage'

const transition = { duration: 0.35, ease: 'easeOut' as const }

function App() {
  const {
    state,
    createRoomFlow,
    joinRoomFlow,
    leaveRoomFlow,
    startGameFlow,
    revealRoleFlow,
    postMessage,
    chooseNightAction,
    castVote,
    openVoting,
    resolveVoting,
    runNight,
    runDay,
    playAgain,
  } = useGameState()

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 px-4 py-6 text-zinc-100 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.28),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background:radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:3px_3px]" />

      <div className="relative mx-auto max-w-5xl">
        <AnimatePresence mode="wait">
          <motion.section
            key={state.screen}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={transition}
            className="rounded-3xl border border-white/10 bg-black/35 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:p-6"
          >
            {state.screen === 'landing' ? (
              <LandingPage onCreateRoom={createRoomFlow} onJoinRoom={joinRoomFlow} />
            ) : null}

            {state.screen === 'lobby' && state.room ? (
              <LobbyPage
                roomCode={state.room.roomCode}
                players={state.room.players}
                currentPlayerId={state.currentPlayer?.id}
                onStart={startGameFlow}
                onLeave={leaveRoomFlow}
              />
            ) : null}

            {state.screen === 'game' && state.room ? (
              <GamePage
                room={state.room}
                currentPlayer={state.currentPlayer}
                onSendChat={postMessage}
                onNightAction={chooseNightAction}
                onVote={castVote}
                onOpenVoting={openVoting}
                onResolveVote={resolveVoting}
                onStartNight={runNight}
                onStartDay={runDay}
              />
            ) : null}

            {state.screen === 'end' && state.room ? <EndGamePage room={state.room} onPlayAgain={playAgain} /> : null}
          </motion.section>
        </AnimatePresence>
      </div>

      <RoleRevealModal open={state.roleModalOpen} role={state.currentRole} onConfirm={revealRoleFlow} />
    </main>
  )
}

export default App
