// ─── Nightfall Socket.io Server ───────────────────────────────────────────────
// Express + socket.io server. Run with: tsx server/index.ts

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from '../src/types/socket.js';
import { gameManager } from './GameManager.js';
import type { GameRoomCallbacks } from './GameRoom.js';
import type { ChatMessage, GamePhase, Player, Team } from '../src/types/game.js';

const PORT = Number(process.env.PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

// ─── HTTP + Socket.io setup ───────────────────────────────────────────────────
const app = express();
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', rooms: gameManager.size, ts: Date.now() });
});

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(
  httpServer,
  {
    cors: {
      origin: CLIENT_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  }
);

// ─── Socket.io connection handler ────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  // ── room:create ─────────────────────────────────────────────────────────
  socket.on('room:create', ({ nickname, avatar }) => {
    const room = gameManager.createRoom(buildCallbacks(socket.id));

    const player = room.addPlayer(socket.id, nickname, avatar, true);
    socket.data = { playerId: socket.id, roomCode: room.code, nickname };
    socket.join(room.code);

    socket.emit('room:created', { room: room.getRoomInfo(), player });

    // Greet
    io.to(room.code).emit('narrator:message', {
      content: `Room ${room.code} created. Waiting for players…`,
    });
    console.log(`[room:create] ${room.code} by ${nickname}`);
  });

  // ── room:join ───────────────────────────────────────────────────────────
  socket.on('room:join', ({ code, nickname, avatar }) => {
    const room = gameManager.getRoom(code);
    if (!room) {
      socket.emit('room:error', { message: `Room "${code}" not found.` });
      return;
    }
    if (room.getPhase() !== 'lobby') {
      socket.emit('room:error', { message: 'Game has already started.' });
      return;
    }
    if (room.getPlayers().length >= 12) {
      socket.emit('room:error', { message: 'Room is full.' });
      return;
    }

    const player = room.addPlayer(socket.id, nickname, avatar, false);
    socket.data = { playerId: socket.id, roomCode: room.code, nickname };
    socket.join(room.code);

    socket.emit('room:joined', {
      room: room.getRoomInfo(),
      players: room.getPlayers(),
      localPlayer: player,
    });

    // Notify others
    socket.to(room.code).emit('room:player_joined', { player });
    io.to(room.code).emit('narrator:message', {
      content: `${nickname} joined the room.`,
    });
    console.log(`[room:join] ${nickname} → ${code}`);
  });

  // ── room:leave ──────────────────────────────────────────────────────────
  socket.on('room:leave', () => handleLeave(socket.id));

  // ── game:start ──────────────────────────────────────────────────────────
  socket.on('game:start', () => {
    const room = gameManager.getRoom(socket.data?.roomCode ?? '');
    if (!room) return;

    const started = room.startGame(socket.id);
    if (!started) {
      socket.emit('error', { message: 'Cannot start game — not host or too few players.' });
      return;
    }

    io.to(room.code).emit('game:started');

    // Emit private role to each player
    for (const player of room.getPlayers()) {
      if (player.role) {
        io.to(player.id).emit('game:role_assigned', { role: player.role });
      }
    }
    console.log(`[game:start] ${room.code}`);
  });

  // ── night:action ─────────────────────────────────────────────────────────
  socket.on('night:action', ({ targetId }) => {
    const room = gameManager.getRoom(socket.data?.roomCode ?? '');
    if (!room) return;
    const ok = room.submitNightAction(socket.id, targetId);
    if (ok) socket.emit('night:action_ack');
  });

  // ── day:message ──────────────────────────────────────────────────────────
  socket.on('day:message', ({ content }) => {
    const room = gameManager.getRoom(socket.data?.roomCode ?? '');
    if (!room) return;
    room.sendMessage(socket.id, content, 'public');
  });

  // ── host controls ────────────────────────────────────────────────────────
  socket.on('host:resolve_night', () => {
    const room = gameManager.getRoom(socket.data?.roomCode ?? '');
    if (!room) return;
    const ok = room.resolveNight(socket.id);
    if (!ok) socket.emit('error', { message: 'Cannot resolve night.' });
  });

  socket.on('host:start_voting', () => {
    const room = gameManager.getRoom(socket.data?.roomCode ?? '');
    if (!room) return;
    room.startVoting(socket.id);
  });

  socket.on('vote:submit', ({ targetId }) => {
    const room = gameManager.getRoom(socket.data?.roomCode ?? '');
    if (!room) return;
    const ok = room.submitVote(socket.id, targetId);
    if (ok) {
      // Broadcast updated vote tally to everyone in room
      io.to(room.code).emit('vote:updated', { votes: room.getPlayers()
        .filter(p => p.hasVoted && p.votedForId)
        .map(p => ({ voterId: p.id, targetId: p.votedForId! })) });
    }
  });

  socket.on('host:resolve_vote', () => {
    const room = gameManager.getRoom(socket.data?.roomCode ?? '');
    if (!room) return;
    const ok = room.resolveVote(socket.id);
    if (!ok) socket.emit('error', { message: 'Cannot resolve votes.' });
  });

  socket.on('host:start_night', () => {
    const room = gameManager.getRoom(socket.data?.roomCode ?? '');
    if (!room) return;
    const ok = room.startNight(socket.id);
    if (!ok) socket.emit('error', { message: 'Cannot start night.' });
  });

  // ── disconnect ───────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);
    handleLeave(socket.id);
  });
});

// ─── Shared leave handler ─────────────────────────────────────────────────────
function handleLeave(socketId: string): void {
  const code = io.sockets.sockets.get(socketId)?.data?.roomCode;
  if (!code) return;
  const room = gameManager.getRoom(code);
  if (!room) return;

  const player = room.getPlayer(socketId);
  room.removePlayer(socketId);

  if (player) {
    io.to(code).emit('room:player_left', { playerId: socketId });
    io.to(code).emit('narrator:message', { content: `${player.nickname} left the room.` });
  }

  if (room.isEmpty()) {
    gameManager.deleteRoom(code);
    console.log(`[room:deleted] ${code} — empty`);
  }
}

// ─── Build callbacks for a room (captures io + roomCode) ─────────────────────
function buildCallbacks(creatorSocketId: string): GameRoomCallbacks {
  // roomCode is not yet known at construction time, so we use a getter closure
  let roomCode = '';

  // We set roomCode after room is created — use a proxy object
  const cbs: GameRoomCallbacks = {
    onPhaseChanged(phase: GamePhase, round: number, timeLeft: number) {
      if (!roomCode) return;
      io.to(roomCode).emit('game:phase_changed', { phase, round, phaseTimeLeft: timeLeft });
    },
    onNightResolved(eliminatedId, savedId, detectiveTargetId, isTargetMafia, players) {
      if (!roomCode) return;
      // Broadcast public result to all
      io.to(roomCode).emit('night:resolved', {
        eliminatedId,
        savedId,
        investigationResult: null, // default: hidden
      });
      io.to(roomCode).emit('players:updated', { players });

      // Send private investigation result only to the Detective
      if (detectiveTargetId !== null) {
        const detective = players.find(p => p.role === 'Detective' && p.isAlive);
        if (detective) {
          io.to(detective.id).emit('night:resolved', {
            eliminatedId,
            savedId,
            investigationResult: isTargetMafia,
          });
        }
      }
    },
    onVoteResolved(eliminatedId, players) {
      if (!roomCode) return;
      io.to(roomCode).emit('vote:resolved', { eliminatedId, players });
      io.to(roomCode).emit('players:updated', { players });
    },
    onGameOver(winningTeam: Team, players: Player[]) {
      if (!roomCode) return;
      io.to(roomCode).emit('game:over', { winningTeam, players });
    },
    onMessage(msg: ChatMessage) {
      if (!roomCode) return;
      if (msg.type === 'mafia') {
        // Only emit to Mafia players
        const room = gameManager.getRoom(roomCode);
        if (room) {
          for (const p of room.getPlayers()) {
            if (p.role === 'Mafia') {
              io.to(p.id).emit('chat:message', msg);
            }
          }
        }
      } else {
        io.to(roomCode).emit('chat:message', msg);
      }
    },
    onPlayersUpdated(players: Player[]) {
      if (!roomCode) return;
      io.to(roomCode).emit('players:updated', { players });
    },
  };

  // After room is created, the caller sets roomCode via the created room's .code
  // We defer by reading it at call time, so wire up immediately after construction
  setTimeout(() => {
    const sock = io.sockets.sockets.get(creatorSocketId);
    if (sock?.data?.roomCode) roomCode = sock.data.roomCode;
  }, 0);

  // Return a wrapper that lazily reads roomCode from the socket
  return new Proxy(cbs, {
    get(target, prop) {
      if (!roomCode) {
        // Try to read from socket data once
        const sock = io.sockets.sockets.get(creatorSocketId);
        if (sock?.data?.roomCode) roomCode = sock.data.roomCode;
      }
      return (target as Record<string | symbol, unknown>)[prop];
    },
  });
}

// ─── Start ────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`\n🌑 Nightfall server running on http://localhost:${PORT}`);
  console.log(`   Accepting connections from: ${CLIENT_ORIGIN}\n`);
});

export default httpServer;
