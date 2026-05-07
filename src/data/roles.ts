import type { Role } from '../types/game';

// ─── Role Definitions ─────────────────────────────────────────────────────────
// Each role defines its team, flavor text, and visual identity.
// Night action descriptions serve as placeholder for Socket.io event documentation.

export const ROLES: Record<string, Role> = {
  Mafia: {
    name: 'Mafia',
    team: 'mafia',
    emoji: '🔪',
    color: 'text-red-400',
    bgColor: 'bg-red-900/20',
    description:
      'You are part of the Mafia. Each night, coordinate with your allies to silently eliminate one town member. Blend in during the day — your survival depends on deception.',
    nightActionLabel: 'Choose your target',
    nightActionDescription: 'Select a player to eliminate tonight. If the Doctor protects your target, they survive.',
  },

  Doctor: {
    name: 'Doctor',
    team: 'town',
    emoji: '💉',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-900/20',
    description:
      'You are the Doctor. Each night, choose one player to protect. If the Mafia targets them, they will survive. You may protect yourself, but only once.',
    nightActionLabel: 'Choose who to protect',
    nightActionDescription: 'Select a player to shield from elimination tonight.',
  },

  Detective: {
    name: 'Detective',
    team: 'town',
    emoji: '🔍',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    description:
      'You are the Detective. Each night, secretly investigate one player to learn if they are Mafia. Use your knowledge wisely — revealing yourself puts you in danger.',
    nightActionLabel: 'Investigate a player',
    nightActionDescription: 'Select a player to investigate. You will learn their true allegiance.',
  },

  Citizen: {
    name: 'Citizen',
    team: 'town',
    emoji: '👤',
    color: 'text-gray-400',
    bgColor: 'bg-gray-800/20',
    description:
      'You are a Citizen. You have no special abilities, but your voice matters most. Observe, discuss, and persuade others to vote out the Mafia during the day.',
    nightActionLabel: undefined,
    nightActionDescription: undefined,
  },
};

export const ROLE_ORDER: string[] = ['Mafia', 'Doctor', 'Detective', 'Citizen'];

// ─── Role distribution by player count ───────────────────────────────────────
// Returns an array of role names to assign for a given player count.
export function getRoleDistribution(playerCount: number): string[] {
  if (playerCount <= 4) return ['Mafia', 'Doctor', 'Detective', 'Citizen'];
  if (playerCount === 5) return ['Mafia', 'Mafia', 'Doctor', 'Detective', 'Citizen'];
  if (playerCount === 6) return ['Mafia', 'Mafia', 'Doctor', 'Detective', 'Citizen', 'Citizen'];
  // 7+: roughly 1/3 mafia
  const mafiaCount = Math.floor(playerCount / 3);
  const roles: string[] = Array(mafiaCount).fill('Mafia');
  roles.push('Doctor', 'Detective');
  const remaining = playerCount - roles.length;
  for (let i = 0; i < remaining; i++) roles.push('Citizen');
  return roles;
}
