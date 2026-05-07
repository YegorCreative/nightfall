// ─── Server-side game logic ───────────────────────────────────────────────────
// Pure functions — no I/O, no socket refs. Identical logic to client utils.

import type { Player, NightAction, Vote, Team, RoleName } from '../src/types/game.js';

// ─── Fisher-Yates shuffle ─────────────────────────────────────────────────────
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Role distribution by player count ───────────────────────────────────────
export function getRoleDistribution(playerCount: number): RoleName[] {
  if (playerCount <= 4) return ['Mafia', 'Doctor', 'Detective', 'Citizen'];
  if (playerCount === 5) return ['Mafia', 'Mafia', 'Doctor', 'Detective', 'Citizen'];
  if (playerCount === 6) return ['Mafia', 'Mafia', 'Doctor', 'Detective', 'Citizen', 'Citizen'];
  const mafiaCount = Math.floor(playerCount / 3);
  const roles: RoleName[] = Array(mafiaCount).fill('Mafia');
  roles.push('Doctor', 'Detective');
  const remaining = playerCount - roles.length;
  for (let i = 0; i < remaining; i++) roles.push('Citizen');
  return roles;
}

// ─── Assign roles to players ──────────────────────────────────────────────────
export function assignRoles(players: Player[]): Map<string, RoleName> {
  const pool = shuffle(getRoleDistribution(players.length));
  const shuffledPlayers = shuffle([...players]);
  const map = new Map<string, RoleName>();
  shuffledPlayers.forEach((p, i) => {
    map.set(p.id, pool[i] ?? 'Citizen');
  });
  return map;
}

// ─── Resolve night actions ────────────────────────────────────────────────────
export function resolveNightActions(
  actions: NightAction[],
  players: Player[]
): {
  eliminatedId: string | null;
  savedId: string | null;
  detectiveTargetId: string | null;
  isTargetMafia: boolean | null;
} {
  let mafiaTarget: string | null = null;
  let doctorTarget: string | null = null;
  let detectiveTarget: string | null = null;

  for (const a of actions) {
    if (a.actorRole === 'Mafia')     mafiaTarget    = a.targetId;
    if (a.actorRole === 'Doctor')    doctorTarget   = a.targetId;
    if (a.actorRole === 'Detective') detectiveTarget = a.targetId;
  }

  const eliminatedId = mafiaTarget && mafiaTarget !== doctorTarget ? mafiaTarget : null;

  let isTargetMafia: boolean | null = null;
  if (detectiveTarget) {
    const t = players.find(p => p.id === detectiveTarget);
    isTargetMafia = t?.role === 'Mafia' || false;
  }

  return { eliminatedId, savedId: doctorTarget, detectiveTargetId: detectiveTarget, isTargetMafia };
}

// ─── Tally votes ──────────────────────────────────────────────────────────────
export function resolveVotes(votes: Vote[], alivePlayers: Player[]): string | null {
  const tally: Record<string, number> = {};
  for (const v of votes) {
    tally[v.targetId] = (tally[v.targetId] ?? 0) + 1;
  }
  const aliveIds = new Set(alivePlayers.map(p => p.id));
  const valid = Object.entries(tally).filter(([id]) => aliveIds.has(id));
  if (!valid.length) return null;
  valid.sort((a, b) => b[1] - a[1]);
  if (valid.length > 1 && valid[0][1] === valid[1][1]) return null; // tie
  return valid[0][0];
}

// ─── Win condition ────────────────────────────────────────────────────────────
export function checkWinCondition(players: Player[]): Team | null {
  const alive = players.filter(p => p.isAlive);
  const mafiaCount = alive.filter(p => p.role === 'Mafia').length;
  const townCount  = alive.filter(p => p.role !== 'Mafia').length;
  if (mafiaCount === 0) return 'town';
  if (mafiaCount >= townCount) return 'mafia';
  return null;
}

// ─── Eliminate player (immutable) ────────────────────────────────────────────
export function eliminatePlayer(players: Player[], targetId: string, round: number): Player[] {
  return players.map(p =>
    p.id === targetId ? { ...p, isAlive: false, eliminatedRound: round } : p
  );
}

// ─── ID + code generators ─────────────────────────────────────────────────────
export function makeId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const AVATARS = ['🦊', '🐺', '🦅', '🐍', '🦁', '🐻', '🦇', '🦉', '🐉', '🦂', '🐱', '🦝'];

export function randomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}
