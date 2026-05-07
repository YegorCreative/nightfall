import type { Player, NightAction, Vote, Team } from '../types/game';
import { getRoleDistribution } from '../data/roles';

// ─── Shuffle array (Fisher-Yates) ─────────────────────────────────────────────
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── assignRoles ──────────────────────────────────────────────────────────────
// Returns a map of playerId → RoleName.
// TODO: In production, this runs server-side and emits role assignments via Socket.io.
export function assignRoles(players: Player[]): Record<string, string> {
  const rolePool = shuffle(getRoleDistribution(players.length));
  const assignments: Record<string, string> = {};
  const shuffledPlayers = shuffle(players);
  shuffledPlayers.forEach((p, i) => {
    assignments[p.id] = rolePool[i] ?? 'Citizen';
  });
  return assignments;
}

// ─── resolveNightActions ──────────────────────────────────────────────────────
// Given night actions, returns:
//   - eliminatedId: the player the Mafia targeted (null if none or saved)
//   - savedId: the player the Doctor protected
//   - investigationTarget: player the Detective investigated
//   - isTargetMafia: result of the Detective's investigation
//
// TODO: Replace with server-side event 'night:resolve' payload in Socket.io.
export function resolveNightActions(
  actions: NightAction[],
  players: Player[]
): {
  eliminatedId: string | null;
  savedId: string | null;
  investigationTarget: string | null;
  isTargetMafia: boolean | null;
} {
  let mafiaTarget: string | null = null;
  let doctorTarget: string | null = null;
  let detectiveTarget: string | null = null;

  for (const action of actions) {
    if (action.actorRole === 'Mafia') mafiaTarget = action.targetId;
    if (action.actorRole === 'Doctor') doctorTarget = action.targetId;
    if (action.actorRole === 'Detective') detectiveTarget = action.targetId;
  }

  const eliminatedId =
    mafiaTarget && mafiaTarget !== doctorTarget ? mafiaTarget : null;

  let isTargetMafia: boolean | null = null;
  if (detectiveTarget) {
    const target = players.find(p => p.id === detectiveTarget);
    isTargetMafia = target?.role === 'Mafia' ?? false;
  }

  return {
    eliminatedId,
    savedId: doctorTarget,
    investigationTarget: detectiveTarget,
    isTargetMafia,
  };
}

// ─── resolveVotes ─────────────────────────────────────────────────────────────
// Tallies votes and returns the player with the most votes (or null on tie).
// TODO: This logic runs server-side and result is broadcast via 'vote:resolved'.
export function resolveVotes(votes: Vote[], alivePlayers: Player[]): string | null {
  const tally: Record<string, number> = {};
  for (const vote of votes) {
    tally[vote.targetId] = (tally[vote.targetId] ?? 0) + 1;
  }

  // Only count votes for alive players
  const aliveIds = new Set(alivePlayers.map(p => p.id));
  const validTally = Object.entries(tally).filter(([id]) => aliveIds.has(id));

  if (validTally.length === 0) return null;

  const sorted = validTally.sort((a, b) => b[1] - a[1]);
  const topVotes = sorted[0][1];

  // Check for tie (more than one player with max votes → no elimination)
  const topCandidates = sorted.filter(([, v]) => v === topVotes);
  if (topCandidates.length > 1) return null;

  return sorted[0][0];
}

// ─── checkWinCondition ───────────────────────────────────────────────────────
// Returns the winning team or null if game continues.
// Town wins when all Mafia are eliminated.
// Mafia wins when mafia count >= town count.
//
// TODO: Evaluated server-side after every elimination. Broadcast via 'game:over'.
export function checkWinCondition(players: Player[]): Team | null {
  const alive = players.filter(p => p.isAlive);
  const mafiaCount = alive.filter(p => p.role === 'Mafia').length;
  const townCount = alive.filter(p => p.role !== 'Mafia').length;

  if (mafiaCount === 0) return 'town';
  if (mafiaCount >= townCount) return 'mafia';
  return null;
}

// ─── eliminatePlayer ─────────────────────────────────────────────────────────
// Returns updated players array with the target marked as dead.
// TODO: Triggered by 'player:eliminated' Socket.io event.
export function eliminatePlayer(players: Player[], targetId: string, round: number): Player[] {
  return players.map(p =>
    p.id === targetId ? { ...p, isAlive: false, eliminatedRound: round } : p
  );
}

// ─── formatPhaseTime ─────────────────────────────────────────────────────────
export function formatPhaseTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
}

// ─── getVoteCount ────────────────────────────────────────────────────────────
export function getVoteCount(votes: Vote[], targetId: string): number {
  return votes.filter(v => v.targetId === targetId).length;
}
