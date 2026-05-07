// ─── useSocketGame ────────────────────────────────────────────────────────────
// Drop-in replacement for useGameState that wires all actions through Socket.io.
// The returned interface is identical to useGameState so GameContext needs no changes.

import { useReducer, useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/socket';
import type {
  GameState, GameAction, Player, ChatMessage, NightAction, Vote, RoleName,
} from '../types/game';
import { randomAvatar } from '../data/mockPlayers';

// ─── Shared initial state ─────────────────────────────────────────────────────
const INITIAL_STATE: GameState = {
  room: null,
  players: [],
  phase: 'lobby',
  round: 0,
  phaseTimeLeft: 0,
  messages: [],
  nightActions: [],
  votes: [],
  eliminatedThisRound: null,
  savedThisRound: null,
  investigationResult: null,
  winningTeam: null,
  localPlayerId: null,
  localNickname: '',
};

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function narratorMsg(content: string, round?: number): ChatMessage {
  return { id: makeId(), type: 'narrator', content, timestamp: Date.now(), round };
}

// ─── Reducer (identical to useGameState reducer for local optimistic updates) ─
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_NICKNAME':
      return { ...state, localNickname: action.payload };

    case 'CREATE_ROOM': {
      return {
        ...state,
        room: {
          code: action.payload.code,
          hostId: state.localPlayerId ?? '',
          maxPlayers: 12,
          minPlayers: 4,
        },
        phase: 'lobby',
        messages: [narratorMsg('Room created. Waiting for players…')],
      };
    }

    case 'JOIN_ROOM': {
      return {
        ...state,
        room: {
          code: action.payload.code,
          hostId: action.payload.player.isHost ? action.payload.player.id : state.room?.hostId ?? '',
          maxPlayers: 12,
          minPlayers: 4,
        },
        localPlayerId: action.payload.player.id,
        players: action.payload.players ?? [action.payload.player],
        phase: 'lobby',
        messages: [narratorMsg(`Joined room ${action.payload.code}.`)],
      };
    }

    case 'ADD_PLAYER':
      return { ...state, players: [...state.players.filter(p => p.id !== action.payload.id), action.payload] };

    case 'REMOVE_PLAYER':
      return { ...state, players: state.players.filter(p => p.id !== action.payload.id) };

    case 'START_GAME':
      return { ...state, phase: 'role-reveal', round: 1, phaseTimeLeft: 12 };

    case 'ASSIGN_ROLES': {
      const updated = state.players.map(p => {
        const found = action.payload.assignments.find(a => a.playerId === p.id);
        return found ? { ...p, role: found.role } : p;
      });
      return { ...state, players: updated };
    }

    case 'CONFIRM_ROLE_REVEAL':
      return { ...state };   // Server drives the next phase

    case 'START_NIGHT':
      return {
        ...state,
        phase: 'night',
        nightActions: [],
        eliminatedThisRound: null,
        savedThisRound: null,
        investigationResult: null,
        players: state.players.map(p => ({ ...p, hasActed: false })),
      };

    case 'SUBMIT_NIGHT_ACTION': {
      const existing = state.nightActions.filter(a => a.actorId !== action.payload.actorId);
      return {
        ...state,
        nightActions: [...existing, action.payload],
        players: state.players.map(p =>
          p.id === action.payload.actorId ? { ...p, hasActed: true } : p
        ),
      };
    }

    case 'RESOLVE_NIGHT':
      return { ...state };   // Server resolves, results come via 'night:resolved'

    case 'START_DAY':
      return { ...state, phase: 'day', nightActions: [] };

    case 'SEND_MESSAGE': {
      const msg: ChatMessage = {
        ...action.payload,
        id: makeId(),
        timestamp: Date.now(),
        round: state.round,
      };
      return { ...state, messages: [...state.messages, msg] };
    }

    case 'START_VOTING':
      return {
        ...state,
        phase: 'voting',
        votes: [],
        players: state.players.map(p => ({ ...p, hasVoted: false, votedForId: undefined })),
      };

    case 'SUBMIT_VOTE': {
      const existing = state.votes.filter(v => v.voterId !== action.payload.voterId);
      return {
        ...state,
        votes: [...existing, action.payload],
        players: state.players.map(p =>
          p.id === action.payload.voterId
            ? { ...p, hasVoted: true, votedForId: action.payload.targetId }
            : p
        ),
      };
    }

    case 'RESOLVE_VOTE':
      return { ...state };

    case 'TICK_TIMER':
      return { ...state, phaseTimeLeft: Math.max(0, state.phaseTimeLeft - 1) };

    case 'CHECK_WIN_CONDITION':
      return { ...state };

    case 'RESET_GAME':
      return { ...INITIAL_STATE, localNickname: state.localNickname };

    // ── Socket-only sync actions ───────────────────────────────────────────
    case 'SYNC_PLAYERS': {
      const localId = state.localPlayerId;
      const mapped = action.payload.players.map(p => ({ ...p, isLocal: p.id === localId }));
      return { ...state, players: mapped };
    }

    case 'SYNC_SERVER_STATE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useSocketGame() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef  = useRef(state);
  stateRef.current = state;

  // ─── Connect socket once ────────────────────────────────────────────────
  useEffect(() => {
    const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // ── Incoming events ──────────────────────────────────────────────────

    socket.on('room:created', ({ room, player }) => {
      dispatch({ type: 'SET_NICKNAME', payload: player.nickname });
      dispatch({
        type: 'JOIN_ROOM',
        payload: { code: room.code, player: { ...player, isLocal: true }, players: [{ ...player, isLocal: true }] },
      });
    });

    socket.on('room:joined', ({ room, players, localPlayer }) => {
      const mapped = players.map(p => ({ ...p, isLocal: p.id === localPlayer.id }));
      dispatch({
        type: 'JOIN_ROOM',
        payload: { code: room.code, player: { ...localPlayer, isLocal: true }, players: mapped },
      });
    });

    socket.on('room:player_joined', ({ player }) => {
      dispatch({ type: 'ADD_PLAYER', payload: { ...player, isLocal: false } });
    });

    socket.on('room:player_left', ({ playerId }) => {
      dispatch({ type: 'REMOVE_PLAYER', payload: { id: playerId } });
    });

    socket.on('room:error', ({ message }) => {
      console.warn('[room:error]', message);
    });

    socket.on('game:started', () => {
      dispatch({ type: 'START_GAME' });
    });

    socket.on('game:role_assigned', ({ role }) => {
      const localId = stateRef.current.localPlayerId;
      if (!localId) return;
      dispatch({
        type: 'ASSIGN_ROLES',
        payload: { assignments: [{ playerId: localId, role }] },
      });
    });

    socket.on('game:phase_changed', ({ phase, round, phaseTimeLeft }) => {
      if (phase === 'night')        dispatch({ type: 'START_NIGHT' });
      else if (phase === 'day')     dispatch({ type: 'START_DAY' });
      else if (phase === 'voting')  dispatch({ type: 'START_VOTING' });
      // Always sync authoritative time/round from server last
      dispatch({ type: 'SYNC_SERVER_STATE', payload: { phaseTimeLeft, round } });
    });

    socket.on('night:resolved', ({ eliminatedId, savedId, investigationResult }) => {
      // players:updated follows immediately with correct player list;
      // here we just record the round summary + detective result
      dispatch({
        type: 'SYNC_SERVER_STATE',
        payload: {
          eliminatedThisRound: eliminatedId,
          savedThisRound: savedId,
          investigationResult,   // null for everyone except the Detective
        },
      });
    });

    socket.on('players:updated', ({ players }) => {
      dispatch({ type: 'SYNC_PLAYERS', payload: { players } });
    });

    socket.on('chat:message', (msg) => {
      dispatch({ type: 'SEND_MESSAGE', payload: msg });
    });

    socket.on('narrator:message', ({ content }) => {
      dispatch({
        type: 'SEND_MESSAGE',
        payload: { type: 'narrator', content },
      });
    });

    socket.on('vote:updated', ({ votes }) => {
      const localId = stateRef.current.localPlayerId;
      votes.forEach(v => {
        if (v.voterId !== localId) {
          dispatch({ type: 'SUBMIT_VOTE', payload: v });
        }
      });
    });

    socket.on('vote:resolved', ({ eliminatedId, players }) => {
      dispatch({ type: 'SYNC_PLAYERS', payload: { players } });
      dispatch({ type: 'SYNC_SERVER_STATE', payload: { eliminatedThisRound: eliminatedId } });
    });

    socket.on('game:over', ({ winningTeam, players }) => {
      dispatch({ type: 'SYNC_PLAYERS', payload: { players } });
      dispatch({ type: 'SYNC_SERVER_STATE', payload: { winningTeam, phase: 'ended' } });
    });

    socket.on('error', ({ message }) => {
      console.error('[socket error]', message);
    });

    socket.connect();

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // ─── Phase timer (client-side countdown, synced from server) ────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (state.phaseTimeLeft > 0 && state.phase !== 'lobby' && state.phase !== 'ended') {
      timerRef.current = setInterval(() => dispatch({ type: 'TICK_TIMER' }), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.phase]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const setNickname = useCallback((nickname: string) => {
    dispatch({ type: 'SET_NICKNAME', payload: nickname });
  }, []);

  const createRoom = useCallback(() => {
    const nickname = stateRef.current.localNickname || 'Player';
    const avatar   = randomAvatar();
    const socket   = socketRef.current;
    if (!socket) return '';
    socket.emit('room:create', { nickname, avatar });
    return ''; // code arrives asynchronously via 'room:created'
  }, []);

  const joinRoom = useCallback((code: string, nickname: string) => {
    const avatar = randomAvatar();
    const socket = socketRef.current;
    if (!socket) return;
    dispatch({ type: 'SET_NICKNAME', payload: nickname });
    socket.emit('room:join', { code: code.toUpperCase(), nickname, avatar });
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('room:leave');
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit('game:start');
  }, []);

  const confirmRoleReveal = useCallback(() => {
    // Role reveal is client-side only; server drives phase after role-reveal timer
    // Nothing to emit; state transition happens via 'game:phase_changed'
  }, []);

  const submitNightAction = useCallback((action: NightAction) => {
    socketRef.current?.emit('night:action', { targetId: action.targetId });
    dispatch({ type: 'SUBMIT_NIGHT_ACTION', payload: action }); // optimistic
  }, []);

  const resolveNight = useCallback(() => {
    socketRef.current?.emit('host:resolve_night');
  }, []);

  const sendMessage = useCallback((content: string, type: ChatMessage['type'] = 'public') => {
    socketRef.current?.emit('day:message', { content });
    // Optimistic local echo
    const local = stateRef.current.players.find(p => p.isLocal);
    if (local) {
      dispatch({
        type: 'SEND_MESSAGE',
        payload: { type, senderId: local.id, senderName: local.nickname, content },
      });
    }
  }, []);

  const startVoting = useCallback(() => {
    socketRef.current?.emit('host:start_voting');
  }, []);

  const submitVote = useCallback((targetId: string) => {
    const local = stateRef.current.players.find(p => p.isLocal);
    if (!local || !local.isAlive || local.hasVoted) return;
    socketRef.current?.emit('vote:submit', { targetId });
    dispatch({ type: 'SUBMIT_VOTE', payload: { voterId: local.id, targetId } }); // optimistic
  }, []);

  const resolveVote = useCallback(() => {
    socketRef.current?.emit('host:resolve_vote');
  }, []);

  const startNight = useCallback(() => {
    socketRef.current?.emit('host:start_night');
  }, []);

  const resetGame = useCallback(() => {
    socketRef.current?.emit('room:leave');
    dispatch({ type: 'RESET_GAME' });
  }, []);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const localPlayer    = state.players.find(p => p.isLocal) ?? null;
  const alivePlayers   = state.players.filter(p => p.isAlive);
  const deadPlayers    = state.players.filter(p => !p.isAlive);
  const canStartGame   = state.players.length >= 4 && localPlayer?.isHost;
  const localRole      = localPlayer?.role;
  const localIsAlive   = localPlayer?.isAlive ?? true;

  return {
    state,
    dispatch,
    setNickname,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    confirmRoleReveal,
    submitNightAction,
    resolveNight,
    sendMessage,
    startVoting,
    submitVote,
    resolveVote,
    startNight,
    resetGame,
    localPlayer,
    alivePlayers,
    deadPlayers,
    canStartGame,
    localRole,
    localIsAlive,
  };
}
