import type { Player } from '../types/game';

// ─── Emoji Avatars Pool ───────────────────────────────────────────────────────
export const AVATARS = ['🦊', '🐺', '🦅', '🐍', '🦁', '🐻', '🦇', '🦉', '🐉', '🦂'];

// ─── Mock Players ─────────────────────────────────────────────────────────────
// Used to simulate a full lobby in development / demo mode.
// Replace with real Socket.io player join events in production.
export const MOCK_PLAYERS: Player[] = [
  {
    id: 'p1',
    nickname: 'ShadowWolf',
    isAlive: true,
    isHost: true,
    isLocal: true,
    hasActed: false,
    hasVoted: false,
    avatar: '🦊',
  },
  {
    id: 'p2',
    nickname: 'CrimsonAce',
    isAlive: true,
    isHost: false,
    isLocal: false,
    hasActed: false,
    hasVoted: false,
    avatar: '🐺',
  },
  {
    id: 'p3',
    nickname: 'NightOwl',
    isAlive: true,
    isHost: false,
    isLocal: false,
    hasActed: false,
    hasVoted: false,
    avatar: '🦉',
  },
  {
    id: 'p4',
    nickname: 'IronFang',
    isAlive: true,
    isHost: false,
    isLocal: false,
    hasActed: false,
    hasVoted: false,
    avatar: '🦁',
  },
  {
    id: 'p5',
    nickname: 'VoidWalker',
    isAlive: true,
    isHost: false,
    isLocal: false,
    hasActed: false,
    hasVoted: false,
    avatar: '🐍',
  },
];

// ─── Generate random room code ────────────────────────────────────────────────
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─── Generate random avatar ───────────────────────────────────────────────────
export function randomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}
