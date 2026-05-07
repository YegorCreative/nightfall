// ─── GameRoom ─────────────────────────────────────────────────────────────────
// Manages the full lifecycle of a single game room: players, phases, actions.

import type { Player, ChatMessage, GamePhase, NightAction, Vote, Team, RoleName, RoomInfo } from '../src/types/game.js';
import {
  assignRoles,
  resolveNightActions,
  resolveVotes,
  checkWinCondition,
  eliminatePlayer,
  makeId,
  generateRoomCode,
} from './gameLogic.js';

const PHASE_DURATIONS: Record<string, number> = {
  'role-reveal': 12,
  night:         45,
  day:           120,
  voting:        60,
};

type PhaseChangedCb = (phase: GamePhase, round: number, timeLeft: number) => void;
type NightResolvedCb = (
  eliminatedId: string | null,
  savedId: string | null,
  detectiveId: string | null,
  isTargetMafia: boolean | null,
  players: Player[]
) => void;
type VoteResolvedCb = (eliminatedId: string | null, players: Player[]) => void;
type GameOverCb     = (winningTeam: Team, players: Player[]) => void;
type MessageCb      = (msg: ChatMessage) => void;
type PlayersUpdatedCb = (players: Player[]) => void;

export interface GameRoomCallbacks {
  onPhaseChanged:   PhaseChangedCb;
  onNightResolved:  NightResolvedCb;
  onVoteResolved:   VoteResolvedCb;
  onGameOver:       GameOverCb;
  onMessage:        MessageCb;
  onPlayersUpdated: PlayersUpdatedCb;
}

export class GameRoom {
  readonly code: string;
  private players: Player[] = [];
  private phase: GamePhase = 'lobby';
  private round = 0;
  private nightActions: NightAction[] = [];
  private votes: Vote[] = [];
  private phaseTimer: NodeJS.Timeout | null = null;
  private callbacks: GameRoomCallbacks;

  constructor(callbacks: GameRoomCallbacks) {
    this.code = generateRoomCode();
    this.callbacks = callbacks;
  }

  // ─── Player management ────────────────────────────────────────────────────

  addPlayer(id: string, nickname: string, avatar: string, isHost = false): Player {
    const player: Player = {
      id,
      nickname,
      avatar,
      isAlive: true,
      isHost,
      isLocal: false, // server has no concept of "local"
      hasActed: false,
      hasVoted: false,
    };
    this.players.push(player);
    this.callbacks.onPlayersUpdated([...this.players]);
    return player;
  }

  removePlayer(id: string): void {
    this.players = this.players.filter(p => p.id !== id);
    // Transfer host to next player if host left
    if (this.players.length > 0 && !this.players.some(p => p.isHost)) {
      this.players[0] = { ...this.players[0], isHost: true };
    }
    this.callbacks.onPlayersUpdated([...this.players]);
  }

  getPlayer(id: string): Player | undefined {
    return this.players.find(p => p.id === id);
  }

  getPlayers(): Player[] {
    return [...this.players];
  }

  getHostId(): string | undefined {
    return this.players.find(p => p.isHost)?.id;
  }

  getRoomInfo(): RoomInfo {
    return {
      code: this.code,
      hostId: this.getHostId() ?? '',
      maxPlayers: 12,
      minPlayers: 4,
    };
  }

  getPhase(): GamePhase {
    return this.phase;
  }

  isEmpty(): boolean {
    return this.players.length === 0;
  }

  // ─── Game start ───────────────────────────────────────────────────────────

  startGame(requestingPlayerId: string): boolean {
    if (!this.isHost(requestingPlayerId)) return false;
    if (this.players.length < 4) return false;
    if (this.phase !== 'lobby') return false;

    // Assign roles server-side
    const roleMap = assignRoles(this.players);
    this.players = this.players.map(p => ({
      ...p,
      role: roleMap.get(p.id) ?? 'Citizen',
    }));

    this.round = 1;
    this.setPhase('role-reveal');
    return true;
  }

  // ─── Night phase ──────────────────────────────────────────────────────────

  submitNightAction(actorId: string, targetId: string): boolean {
    if (this.phase !== 'night') return false;
    const actor = this.getPlayer(actorId);
    if (!actor || !actor.isAlive || !actor.role) return false;
    if (actor.role === 'Citizen') return false;
    if (actor.hasActed) return false;

    // Deduplicate by actor
    this.nightActions = this.nightActions.filter(a => a.actorId !== actorId);
    this.nightActions.push({ actorId, actorRole: actor.role, targetId });
    this.players = this.players.map(p =>
      p.id === actorId ? { ...p, hasActed: true } : p
    );
    return true;
  }

  resolveNight(requestingPlayerId: string): boolean {
    if (!this.isHost(requestingPlayerId)) return false;
    if (this.phase !== 'night') return false;
    this._resolveNight();
    return true;
  }

  private _resolveNight(): void {
    this.clearPhaseTimer();
    const { eliminatedId, savedId, detectiveTargetId, isTargetMafia } =
      resolveNightActions(this.nightActions, this.players);

    if (eliminatedId) {
      this.players = eliminatePlayer(this.players, eliminatedId, this.round);
    }

    this.callbacks.onNightResolved(
      eliminatedId,
      savedId,
      detectiveTargetId,
      isTargetMafia,
      [...this.players]
    );

    const winner = checkWinCondition(this.players);
    if (winner) {
      this.endGame(winner);
      return;
    }

    setTimeout(() => {
      this.setPhase('day');
      this.callbacks.onMessage(this.narratorMsg(
        eliminatedId
          ? `Dawn breaks. ${this.players.find(p => p.id === eliminatedId)?.nickname ?? 'Someone'} was found dead.`
          : savedId
          ? 'Dawn breaks. The Doctor saved someone — no one was harmed.'
          : 'Dawn breaks. The night passed quietly.',
      ));
      this.callbacks.onMessage(this.narratorMsg(
        `Day ${this.round} — Discuss. Debate. Vote out the Mafia.`
      ));
    }, 2500);
  }

  // ─── Day / Chat ───────────────────────────────────────────────────────────

  sendMessage(senderId: string, content: string, type: 'public' | 'mafia' = 'public'): ChatMessage | null {
    const sender = this.getPlayer(senderId);
    if (!sender || !sender.isAlive) return null;
    if (type === 'mafia' && sender.role !== 'Mafia') return null;
    if (this.phase !== 'day' && !(this.phase === 'night' && type === 'mafia')) return null;

    const msg: ChatMessage = {
      id: makeId(),
      type,
      senderId,
      senderName: sender.nickname,
      content: content.slice(0, 280),
      timestamp: Date.now(),
      round: this.round,
    };
    this.callbacks.onMessage(msg);
    return msg;
  }

  // ─── Voting ───────────────────────────────────────────────────────────────

  startVoting(requestingPlayerId: string): boolean {
    if (!this.isHost(requestingPlayerId)) return false;
    if (this.phase !== 'day') return false;
    this.votes = [];
    this.players = this.players.map(p => ({ ...p, hasVoted: false, votedForId: undefined }));
    this.setPhase('voting');
    this.callbacks.onMessage(this.narratorMsg('Voting has begun. Cast your vote.'));
    return true;
  }

  submitVote(voterId: string, targetId: string): boolean {
    if (this.phase !== 'voting') return false;
    const voter = this.getPlayer(voterId);
    if (!voter || !voter.isAlive || voter.hasVoted) return false;
    const target = this.getPlayer(targetId);
    if (!target || !target.isAlive) return false;

    this.votes = this.votes.filter(v => v.voterId !== voterId);
    this.votes.push({ voterId, targetId });
    this.players = this.players.map(p =>
      p.id === voterId ? { ...p, hasVoted: true, votedForId: targetId } : p
    );
    return true;
  }

  resolveVote(requestingPlayerId: string): boolean {
    if (!this.isHost(requestingPlayerId)) return false;
    if (this.phase !== 'voting') return false;
    this._resolveVote();
    return true;
  }

  private _resolveVote(): void {
    this.clearPhaseTimer();
    const alivePlayers = this.players.filter(p => p.isAlive);
    const eliminatedId = resolveVotes(this.votes, alivePlayers);

    if (eliminatedId) {
      this.players = eliminatePlayer(this.players, eliminatedId, this.round);
      const victim = this.players.find(p => p.id === eliminatedId);
      const victimRole = victim?.role ?? 'Unknown';
      this.callbacks.onMessage(this.narratorMsg(
        `The village has spoken. ${victim?.nickname ?? 'A player'} has been eliminated. They were ${victimRole === 'Mafia' ? 'MAFIA' : 'not Mafia'}.`
      ));
    } else {
      this.callbacks.onMessage(this.narratorMsg('The vote was tied. No one was eliminated.'));
    }

    this.callbacks.onVoteResolved(eliminatedId, [...this.players]);

    const winner = checkWinCondition(this.players);
    if (winner) {
      this.endGame(winner);
    }
  }

  startNight(requestingPlayerId: string): boolean {
    if (!this.isHost(requestingPlayerId)) return false;
    if (this.phase !== 'voting') return false;
    this.round++;
    this.nightActions = [];
    this.players = this.players.map(p => ({ ...p, hasActed: false }));
    this.setPhase('night');
    this.callbacks.onMessage(this.narratorMsg(`Night ${this.round} falls. The village sleeps.`));
    return true;
  }

  // ─── Win / Reset ──────────────────────────────────────────────────────────

  private endGame(winner: Team): void {
    this.clearPhaseTimer();
    this.phase = 'ended';
    this.callbacks.onMessage(this.narratorMsg(
      winner === 'town'
        ? '☀️ The Town has won! All Mafia have been eliminated.'
        : '🌑 The Mafia wins! They have taken control of the town.'
    ));
    this.callbacks.onGameOver(winner, [...this.players]);
  }

  // ─── Phase management ─────────────────────────────────────────────────────

  private setPhase(phase: GamePhase): void {
    this.phase = phase;
    const duration = PHASE_DURATIONS[phase] ?? 0;
    this.callbacks.onPhaseChanged(phase, this.round, duration);

    this.clearPhaseTimer();
    if (duration > 0) {
      this.phaseTimer = setTimeout(() => this.onPhaseTimeout(), duration * 1000);
    }
  }

  private onPhaseTimeout(): void {
    switch (this.phase) {
      case 'night':   this._resolveNight(); break;
      case 'voting':  this._resolveVote();  break;
      default: break;
    }
  }

  private clearPhaseTimer(): void {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private isHost(id: string): boolean {
    return this.players.find(p => p.id === id)?.isHost ?? false;
  }

  private narratorMsg(content: string): ChatMessage {
    return {
      id: makeId(),
      type: 'narrator',
      content,
      timestamp: Date.now(),
      round: this.round,
    };
  }
}
