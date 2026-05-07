import { useReducer, useCallback, useEffect, useRef } from 'react';
import type { GameState, GameAction, Player, ChatMessage, NightAction, Vote } from '../types/game';
import { generateRoomCode, randomAvatar, MOCK_PLAYERS } from '../data/mockPlayers';
import {
  assignRoles,
  resolveNightActions,
  resolveVotes,
  checkWinCondition,
  eliminatePlayer,
} from '../utils/gameLogic';

// ─── Phase durations (seconds) ────────────────────────────────────────────────
// TODO: In Socket.io mode, the server broadcasts phase start/end timestamps
//       and these durations are managed server-side.
const PHASE_DURATIONS: Record<string, number> = {
  'role-reveal': 10,
  night:         45,
  day:           120,
  voting:        60,
};

// ─── Initial State ────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function narratorMessage(content: string, round?: number): ChatMessage {
  return {
    id: makeId(),
    type: 'narrator',
    content,
    timestamp: Date.now(),
    round,
  };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {

    case 'SET_NICKNAME':
      return { ...state, localNickname: action.payload };

    // TODO: Emit 'room:create' event to server via socket.emit(...)
    case 'CREATE_ROOM': {
      const localId = makeId();
      const localPlayer: Player = {
        id: localId,
        nickname: state.localNickname || 'You',
        isAlive: true,
        isHost: true,
        isLocal: true,
        hasActed: false,
        hasVoted: false,
        avatar: randomAvatar(),
      };
      // Add mock players to simulate a full lobby
      const mockFriends = MOCK_PLAYERS.slice(1).map(p => ({ ...p, id: makeId() }));
      return {
        ...state,
        localPlayerId: localId,
        room: {
          code: action.payload.code,
          hostId: localId,
          maxPlayers: 12,
          minPlayers: 4,
        },
        players: [localPlayer, ...mockFriends],
        phase: 'lobby',
        messages: [
          narratorMessage('Room created. Waiting for players to join...'),
        ],
      };
    }

    // TODO: Emit 'room:join' event to server via socket.emit(...)
    case 'JOIN_ROOM': {
      const localPlayer = action.payload.player;
      return {
        ...state,
        localPlayerId: localPlayer.id,
        room: {
          code: action.payload.code,
          hostId: state.players[0]?.id ?? localPlayer.id,
          maxPlayers: 12,
          minPlayers: 4,
        },
        players: [...state.players, localPlayer],
        phase: 'lobby',
        messages: [narratorMessage(`You joined room ${action.payload.code}.`)],
      };
    }

    case 'ADD_PLAYER':
      return { ...state, players: [...state.players, action.payload] };

    case 'REMOVE_PLAYER':
      return {
        ...state,
        players: state.players.filter(p => p.id !== action.payload.id),
      };

    // TODO: Only host can trigger; emit 'game:start' on server
    case 'START_GAME': {
      return {
        ...state,
        phase: 'role-reveal',
        round: 1,
        phaseTimeLeft: PHASE_DURATIONS['role-reveal'],
        messages: [
          ...state.messages,
          narratorMessage('The game begins. Learn your role. Trust no one.', 1),
        ],
      };
    }

    // TODO: Server handles role assignment and emits 'role:assigned' privately to each player
    case 'ASSIGN_ROLES': {
      const roleMap = assignRoles(state.players);
      const updatedPlayers = state.players.map(p => ({
        ...p,
        role: (roleMap[p.id] ?? 'Citizen') as Player['role'],
      }));
      return { ...state, players: updatedPlayers };
    }

    case 'CONFIRM_ROLE_REVEAL':
      return { ...state, phase: 'night', phaseTimeLeft: PHASE_DURATIONS.night };

    case 'START_NIGHT': {
      const newRound = state.phase === 'day' ? state.round + 1 : state.round;
      return {
        ...state,
        phase: 'night',
        round: newRound,
        phaseTimeLeft: PHASE_DURATIONS.night,
        nightActions: [],
        eliminatedThisRound: null,
        savedThisRound: null,
        investigationResult: null,
        players: state.players.map(p => ({ ...p, hasActed: false })),
        messages: [
          ...state.messages,
          narratorMessage(`Night ${newRound} falls. The village sleeps.`, newRound),
        ],
      };
    }

    // TODO: Emit 'night:action' to server; only the server collects and resolves
    case 'SUBMIT_NIGHT_ACTION': {
      const existing = state.nightActions.filter(
        a => a.actorId !== action.payload.actorId
      );
      const updatedPlayers = state.players.map(p =>
        p.id === action.payload.actorId ? { ...p, hasActed: true } : p
      );
      return {
        ...state,
        nightActions: [...existing, action.payload],
        players: updatedPlayers,
      };
    }

    case 'RESOLVE_NIGHT': {
      const { eliminatedId, savedId, isTargetMafia } = resolveNightActions(
        state.nightActions,
        state.players
      );
      let updatedPlayers = state.players;
      const newMessages: ChatMessage[] = [];

      if (eliminatedId) {
        updatedPlayers = eliminatePlayer(updatedPlayers, eliminatedId, state.round);
        const victim = state.players.find(p => p.id === eliminatedId);
        newMessages.push(
          narratorMessage(
            `Dawn breaks. ${victim?.nickname ?? 'Someone'} was found dead in the night.`,
            state.round
          )
        );
      } else {
        newMessages.push(
          narratorMessage(
            savedId
              ? 'Dawn breaks. The Doctor saved someone tonight — no one was harmed.'
              : 'Dawn breaks. The Mafia struck, but their target survived.',
            state.round
          )
        );
      }

      const winResult = checkWinCondition(updatedPlayers);

      return {
        ...state,
        players: updatedPlayers,
        eliminatedThisRound: eliminatedId,
        savedThisRound: savedId,
        investigationResult: isTargetMafia,
        messages: [...state.messages, ...newMessages],
        winningTeam: winResult,
        phase: winResult ? 'ended' : state.phase,
      };
    }

    case 'START_DAY': {
      return {
        ...state,
        phase: 'day',
        phaseTimeLeft: PHASE_DURATIONS.day,
        messages: [
          ...state.messages,
          narratorMessage(`Day ${state.round} — Discuss. Debate. Vote out the Mafia.`, state.round),
        ],
      };
    }

    // TODO: Broadcast 'chat:message' via socket to all players in room
    case 'SEND_MESSAGE': {
      const msg: ChatMessage = {
        ...action.payload,
        id: makeId(),
        timestamp: Date.now(),
        round: state.round,
      };
      return { ...state, messages: [...state.messages, msg] };
    }

    case 'START_VOTING': {
      return {
        ...state,
        phase: 'voting',
        phaseTimeLeft: PHASE_DURATIONS.voting,
        votes: [],
        players: state.players.map(p => ({ ...p, hasVoted: false, votedForId: undefined })),
        messages: [
          ...state.messages,
          narratorMessage('Voting has begun. Cast your vote to eliminate a suspect.', state.round),
        ],
      };
    }

    // TODO: Emit 'vote:submit' event to server; server collects all votes
    case 'SUBMIT_VOTE': {
      const existing = state.votes.filter(v => v.voterId !== action.payload.voterId);
      const updatedPlayers = state.players.map(p =>
        p.id === action.payload.voterId
          ? { ...p, hasVoted: true, votedForId: action.payload.targetId }
          : p
      );
      return {
        ...state,
        votes: [...existing, action.payload],
        players: updatedPlayers,
      };
    }

    // TODO: Server resolves votes and broadcasts 'vote:resolved' event
    case 'RESOLVE_VOTE': {
      const alivePlayers = state.players.filter(p => p.isAlive);
      const eliminatedId = resolveVotes(state.votes, alivePlayers);
      let updatedPlayers = state.players;
      const newMessages: ChatMessage[] = [];

      if (eliminatedId) {
        updatedPlayers = eliminatePlayer(updatedPlayers, eliminatedId, state.round);
        const victim = state.players.find(p => p.id === eliminatedId);
        const victimRole = victim?.role ?? 'Unknown';
        newMessages.push(
          narratorMessage(
            `The village has spoken. ${victim?.nickname ?? 'A player'} has been eliminated. They were ${victimRole === 'Mafia' ? 'MAFIA' : 'not Mafia'}.`,
            state.round
          )
        );
      } else {
        newMessages.push(
          narratorMessage('The vote was tied. No one was eliminated.', state.round)
        );
      }

      const winResult = checkWinCondition(updatedPlayers);

      return {
        ...state,
        players: updatedPlayers,
        eliminatedThisRound: eliminatedId,
        votes: [],
        messages: [...state.messages, ...newMessages],
        winningTeam: winResult,
        phase: winResult ? 'ended' : state.phase,
      };
    }

    case 'TICK_TIMER': {
      const newTime = Math.max(0, state.phaseTimeLeft - 1);
      return { ...state, phaseTimeLeft: newTime };
    }

    // TODO: Server checks win condition after every elimination ('game:win_check')
    case 'CHECK_WIN_CONDITION': {
      const winner = checkWinCondition(state.players);
      if (!winner) return state;
      return {
        ...state,
        winningTeam: winner,
        phase: 'ended',
        messages: [
          ...state.messages,
          narratorMessage(
            winner === 'town'
              ? '☀️ The Town has won! All Mafia have been eliminated.'
              : '🌑 The Mafia wins! They have taken control of the town.',
            state.round
          ),
        ],
      };
    }

    // TODO: Emit 'game:reset' to server; cleans up room state
    case 'RESET_GAME':
      return {
        ...INITIAL_STATE,
        localNickname: state.localNickname,
      };

    default:
      return state;
  }
}

// ─── useGameState Hook ────────────────────────────────────────────────────────
export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Phase timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (state.phaseTimeLeft > 0 && state.phase !== 'lobby' && state.phase !== 'ended') {
      timerRef.current = setInterval(() => {
        dispatch({ type: 'TICK_TIMER' });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.phase, state.phaseTimeLeft]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const setNickname = useCallback((nickname: string) => {
    dispatch({ type: 'SET_NICKNAME', payload: nickname });
  }, []);

  const createRoom = useCallback(() => {
    const code = generateRoomCode();
    dispatch({ type: 'CREATE_ROOM', payload: { code } });
    return code;
  }, []);

  const joinRoom = useCallback((code: string, nickname: string) => {
    const localId = makeId();
    const player: Player = {
      id: localId,
      nickname: nickname || 'Anonymous',
      isAlive: true,
      isHost: false,
      isLocal: true,
      hasActed: false,
      hasVoted: false,
      avatar: randomAvatar(),
    };
    dispatch({ type: 'JOIN_ROOM', payload: { code, player } });
  }, []);

  const leaveRoom = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const startGame = useCallback(() => {
    // ASSIGN_ROLES payload is inferred from state inside the reducer
    dispatch({ type: 'ASSIGN_ROLES', payload: { assignments: [] } });
    dispatch({ type: 'START_GAME' });
  }, []);

  const confirmRoleReveal = useCallback(() => {
    dispatch({ type: 'CONFIRM_ROLE_REVEAL' });
    // After role reveal transition to night
    setTimeout(() => {
      dispatch({ type: 'START_NIGHT' });
    }, 300);
  }, []);

  const submitNightAction = useCallback((action: NightAction) => {
    dispatch({ type: 'SUBMIT_NIGHT_ACTION', payload: action });
  }, []);

  const resolveNight = useCallback(() => {
    dispatch({ type: 'RESOLVE_NIGHT' });
    setTimeout(() => dispatch({ type: 'START_DAY' }), 3000);
  }, []);

  const sendMessage = useCallback((content: string, type: ChatMessage['type'] = 'public') => {
    const local = state.players.find(p => p.isLocal);
    if (!local || !local.isAlive) return;
    dispatch({
      type: 'SEND_MESSAGE',
      payload: {
        type,
        senderId: local.id,
        senderName: local.nickname,
        content,
      },
    });
  }, [state.players]);

  const startVoting = useCallback(() => {
    dispatch({ type: 'START_VOTING' });
  }, []);

  const submitVote = useCallback((targetId: string) => {
    const local = state.players.find(p => p.isLocal);
    if (!local || !local.isAlive || local.hasVoted) return;
    const vote: Vote = { voterId: local.id, targetId };
    dispatch({ type: 'SUBMIT_VOTE', payload: vote });
  }, [state.players]);

  const resolveVote = useCallback(() => {
    dispatch({ type: 'RESOLVE_VOTE' });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  // ─── Derived helpers ──────────────────────────────────────────────────────

  const localPlayer = state.players.find(p => p.isLocal) ?? null;
  const alivePlayers = state.players.filter(p => p.isAlive);
  const deadPlayers = state.players.filter(p => !p.isAlive);
  const canStartGame = state.players.length >= 4 && localPlayer?.isHost;
  const localRole = localPlayer?.role;
  const localIsAlive = localPlayer?.isAlive ?? true;

  return {
    state,
    dispatch,
    // Actions
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
    resetGame,
    // Derived
    localPlayer,
    alivePlayers,
    deadPlayers,
    canStartGame,
    localRole,
    localIsAlive,
  };
}
