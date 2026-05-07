import type { RoleDefinition, RoleId } from '../types/game'

export const ROLE_MAP: Record<RoleId, RoleDefinition> = {
  mafia: {
    id: 'mafia',
    name: 'Mafia',
    team: 'mafia',
    summary: 'Choose one target each night. Survive until mafia equals or outnumbers town.',
  },
  detective: {
    id: 'detective',
    name: 'Detective',
    team: 'town',
    summary: 'Investigate one player each night to learn if they are mafia.',
  },
  doctor: {
    id: 'doctor',
    name: 'Doctor',
    team: 'town',
    summary: 'Protect one player each night. If they are targeted, they survive.',
  },
  citizen: {
    id: 'citizen',
    name: 'Citizen',
    team: 'town',
    summary: 'No night action. Discuss, deduce, and vote during the day.',
  },
}

export const ROLE_ORDER: RoleId[] = ['mafia', 'detective', 'doctor', 'citizen']
