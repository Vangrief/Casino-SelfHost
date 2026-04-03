import type { Card, PokerPhase, PokerTableConfig, PokerClientState } from '@casino/shared';
import { POKER_DEFAULTS } from '@casino/shared';
import { Shoe } from '../common/deck.js';
import { getBestFive, compareHands, type HandRank } from './hand-evaluator.js';
import { PotManager, type PayoutResult } from './pot-manager.js';

interface PlayerInfo {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface PokerPlayer {
  info: PlayerInfo;
  seatNumber: number;
  chipCount: number;       // chips at the table (bought in)
  holeCards: Card[];
  currentBet: number;      // bet this betting round
  totalBetThisHand: number;
  isFolded: boolean;
  isAllIn: boolean;
  isSittingOut: boolean;
  isConnected: boolean;
}

export interface PokerPayoutEntry {
  playerId: string;
  amount: number;
  handName?: string;
}

export class PokerGame {
  private deck: Shoe;
  private players = new Map<string, PokerPlayer>();
  private seatOrder: string[] = []; // ordered by seat
  private communityCards: Card[] = [];
  private phase: PokerPhase = 'poker:waiting';
  private config: PokerTableConfig;
  private potManager = new PotManager();

  private dealerSeatIndex = 0;
  private currentPlayerIndex = 0;
  private lastRaiserIndex = -1;
  private highestBet = 0;
  private minRaise: number;
  private handsPlayed = 0;

  private actionTimer: ReturnType<typeof setTimeout> | null = null;
  private actionTimerStart = 0;
  private onTimeout: (() => void) | null = null;

  private lastPayouts: PokerPayoutEntry[] = [];
  private lastShowdownHands = new Map<string, HandRank>();

  constructor(config?: Partial<PokerTableConfig>) {
    this.config = { ...POKER_DEFAULTS, ...config };
    this.deck = new Shoe(1); // single deck for poker
    this.minRaise = this.config.bigBlind;
  }

  // --- Player Management ---

  addPlayer(player: PlayerInfo, seatNumber: number, buyIn: number): boolean {
    if (this.players.has(player.id)) return false;
    if (buyIn < this.config.minBuyIn || buyIn > this.config.maxBuyIn) return false;

    this.players.set(player.id, {
      info: player,
      seatNumber,
      chipCount: buyIn,
      holeCards: [],
      currentBet: 0,
      totalBetThisHand: 0,
      isFolded: false,
      isAllIn: false,
      isSittingOut: false,
      isConnected: true,
    });

    this.rebuildSeatOrder();
    return true;
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);
    this.rebuildSeatOrder();
  }

  hasPlayer(playerId: string): boolean {
    return this.players.has(playerId);
  }

  getPlayerCount(): number {
    return this.players.size;
  }

  getPlayerChips(playerId: string): number {
    return this.players.get(playerId)?.chipCount || 0;
  }

  getPhase(): PokerPhase {
    return this.phase;
  }

  private rebuildSeatOrder(): void {
    this.seatOrder = Array.from(this.players.entries())
      .sort(([, a], [, b]) => a.seatNumber - b.seatNumber)
      .map(([id]) => id);
  }

  private getActivePlayers(): PokerPlayer[] {
    return this.seatOrder
      .map((id) => this.players.get(id)!)
      .filter((p) => !p.isFolded && !p.isSittingOut);
  }

  private getActivePlayerIds(): string[] {
    return this.getActivePlayers().map((p) => p.info.id);
  }

  private getPlayersInHand(): PokerPlayer[] {
    return this.seatOrder
      .map((id) => this.players.get(id)!)
      .filter((p) => !p.isSittingOut);
  }

  // --- Game Flow ---

  canStartHand(): boolean {
    const eligible = this.seatOrder.filter((id) => {
      const p = this.players.get(id)!;
      return !p.isSittingOut && p.chipCount > 0;
    });
    return eligible.length >= 2;
  }

  startHand(): boolean {
    if (!this.canStartHand()) return false;

    this.deck.shuffle();
    this.communityCards = [];
    this.potManager.reset();
    this.lastPayouts = [];
    this.lastShowdownHands.clear();
    this.highestBet = 0;
    this.minRaise = this.config.bigBlind;

    // Reset player state
    for (const player of this.players.values()) {
      player.holeCards = [];
      player.currentBet = 0;
      player.totalBetThisHand = 0;
      player.isFolded = false;
      player.isAllIn = false;
    }

    // Move dealer button
    if (this.handsPlayed > 0) {
      this.dealerSeatIndex = (this.dealerSeatIndex + 1) % this.seatOrder.length;
    }

    // Post blinds
    const activePlayers = this.seatOrder.filter((id) => {
      const p = this.players.get(id)!;
      return !p.isSittingOut && p.chipCount > 0;
    });

    if (activePlayers.length < 2) return false;

    const sbIndex = activePlayers.length === 2
      ? this.dealerSeatIndex % activePlayers.length
      : (this.dealerSeatIndex + 1) % activePlayers.length;
    const bbIndex = (sbIndex + 1) % activePlayers.length;

    const sbPlayer = this.players.get(activePlayers[sbIndex])!;
    const bbPlayer = this.players.get(activePlayers[bbIndex])!;

    this.placeBetInternal(sbPlayer, Math.min(this.config.smallBlind, sbPlayer.chipCount));
    this.placeBetInternal(bbPlayer, Math.min(this.config.bigBlind, bbPlayer.chipCount));

    // Deal hole cards
    for (const id of activePlayers) {
      const player = this.players.get(id)!;
      player.holeCards = [this.deck.draw(), this.deck.draw()];
    }

    // Set phase and first player
    this.phase = 'poker:pre_flop';

    // First to act is player after BB
    this.currentPlayerIndex = (bbIndex + 1) % activePlayers.length;
    this.lastRaiserIndex = bbIndex;

    this.handsPlayed++;

    // Check if everyone is all-in already
    if (this.checkAllInShowdown()) return true;

    this.startActionTimer();
    return true;
  }

  getCurrentPlayerId(): string | null {
    if (this.phase === 'poker:waiting' || this.phase === 'poker:showdown') return null;
    const active = this.getActiveNonAllInPlayers();
    if (active.length === 0) return null;
    return active[this.currentPlayerIndex % active.length]?.info.id || null;
  }

  private getActiveNonAllInPlayers(): PokerPlayer[] {
    return this.seatOrder
      .map((id) => this.players.get(id)!)
      .filter((p) => !p.isFolded && !p.isAllIn && !p.isSittingOut && p.chipCount > 0);
  }

  // --- Actions ---

  fold(playerId: string): { success: boolean; error?: string } {
    if (!this.isPlayersTurn(playerId)) return { success: false, error: 'Not your turn' };

    const player = this.players.get(playerId)!;
    player.isFolded = true;

    this.clearActionTimer();

    // Check if only one player left
    const remaining = this.getActivePlayers();
    if (remaining.length === 1) {
      this.winByFold(remaining[0]);
      return { success: true };
    }

    this.advanceAction();
    return { success: true };
  }

  check(playerId: string): { success: boolean; error?: string } {
    if (!this.isPlayersTurn(playerId)) return { success: false, error: 'Not your turn' };

    const player = this.players.get(playerId)!;
    if (player.currentBet < this.highestBet) {
      return { success: false, error: 'Cannot check, must call or raise' };
    }

    this.clearActionTimer();
    this.advanceAction();
    return { success: true };
  }

  call(playerId: string): { success: boolean; error?: string; amount?: number } {
    if (!this.isPlayersTurn(playerId)) return { success: false, error: 'Not your turn' };

    const player = this.players.get(playerId)!;
    const toCall = this.highestBet - player.currentBet;

    if (toCall <= 0) {
      return { success: false, error: 'Nothing to call' };
    }

    const amount = Math.min(toCall, player.chipCount);
    this.placeBetInternal(player, amount);

    this.clearActionTimer();
    this.advanceAction();
    return { success: true, amount };
  }

  raise(playerId: string, totalAmount: number): { success: boolean; error?: string; amount?: number } {
    if (!this.isPlayersTurn(playerId)) return { success: false, error: 'Not your turn' };

    const player = this.players.get(playerId)!;
    const raiseAmount = totalAmount - player.currentBet;

    if (raiseAmount <= 0) return { success: false, error: 'Raise must be greater than current bet' };

    const minRaiseTotal = this.highestBet + this.minRaise;
    if (totalAmount < minRaiseTotal && totalAmount < player.chipCount + player.currentBet) {
      return { success: false, error: `Minimum raise to ${minRaiseTotal}` };
    }

    const actualAmount = Math.min(raiseAmount, player.chipCount);
    const actualRaise = player.currentBet + actualAmount - this.highestBet;

    this.placeBetInternal(player, actualAmount);

    if (actualRaise > 0) {
      this.minRaise = Math.max(this.minRaise, actualRaise);
    }

    // Set last raiser
    const activeNonAllIn = this.getActiveNonAllInPlayers();
    this.lastRaiserIndex = activeNonAllIn.findIndex((p) => p.info.id === playerId);

    this.clearActionTimer();
    this.advanceAction();
    return { success: true, amount: actualAmount };
  }

  allIn(playerId: string): { success: boolean; error?: string; amount?: number } {
    if (!this.isPlayersTurn(playerId)) return { success: false, error: 'Not your turn' };

    const player = this.players.get(playerId)!;
    if (player.chipCount <= 0) return { success: false, error: 'No chips to go all-in' };

    const amount = player.chipCount;
    const newTotal = player.currentBet + amount;

    this.placeBetInternal(player, amount);
    this.potManager.handleAllIn(playerId);

    if (newTotal > this.highestBet) {
      const raiseAmount = newTotal - this.highestBet;
      if (raiseAmount >= this.minRaise) {
        this.minRaise = raiseAmount;
      }
      const activeNonAllIn = this.getActiveNonAllInPlayers();
      this.lastRaiserIndex = activeNonAllIn.findIndex((p) => p.info.id === playerId);
    }

    this.clearActionTimer();
    this.advanceAction();
    return { success: true, amount };
  }

  // --- Internal ---

  private placeBetInternal(player: PokerPlayer, amount: number): void {
    const actual = Math.min(amount, player.chipCount);
    player.chipCount -= actual;
    player.currentBet += actual;
    player.totalBetThisHand += actual;

    if (player.currentBet > this.highestBet) {
      this.highestBet = player.currentBet;
    }

    if (player.chipCount === 0) {
      player.isAllIn = true;
    }

    this.potManager.addBet(player.info.id, actual);
  }

  private isPlayersTurn(playerId: string): boolean {
    return this.getCurrentPlayerId() === playerId;
  }

  private advanceAction(): void {
    const active = this.getActiveNonAllInPlayers();

    if (active.length === 0) {
      // Everyone is all-in or folded
      this.dealRemainingAndShowdown();
      return;
    }

    if (active.length === 1 && this.getActivePlayers().length === 1) {
      // Only one player total remaining
      this.winByFold(this.getActivePlayers()[0]);
      return;
    }

    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % active.length;

    // Check if betting round is complete
    const allCalledOrChecked = active.every(
      (p) => p.currentBet === this.highestBet || p.isAllIn,
    );

    if (allCalledOrChecked && this.currentPlayerIndex === (this.lastRaiserIndex + 1) % active.length) {
      this.endBettingRound();
      return;
    }

    // Also end if we've gone around and everyone matches
    if (allCalledOrChecked) {
      // Check if we're back to the last raiser
      const currentPlayer = active[this.currentPlayerIndex % active.length];
      if (currentPlayer && this.lastRaiserIndex >= 0) {
        const lastRaiser = active[this.lastRaiserIndex % active.length];
        if (currentPlayer.info.id === lastRaiser?.info.id) {
          this.endBettingRound();
          return;
        }
      }
    }

    this.startActionTimer();
  }

  private endBettingRound(): void {
    // Reset current bets for next round
    for (const player of this.players.values()) {
      player.currentBet = 0;
    }
    this.highestBet = 0;
    this.minRaise = this.config.bigBlind;

    const activePlayers = this.getActivePlayers();
    const activeNonAllIn = this.getActiveNonAllInPlayers();

    // Check if we need to deal remaining cards
    if (activeNonAllIn.length <= 1 && activePlayers.some((p) => p.isAllIn)) {
      this.dealRemainingAndShowdown();
      return;
    }

    switch (this.phase) {
      case 'poker:pre_flop':
        this.phase = 'poker:flop';
        this.communityCards.push(this.deck.draw(), this.deck.draw(), this.deck.draw());
        break;
      case 'poker:flop':
        this.phase = 'poker:turn';
        this.communityCards.push(this.deck.draw());
        break;
      case 'poker:turn':
        this.phase = 'poker:river';
        this.communityCards.push(this.deck.draw());
        break;
      case 'poker:river':
        this.showdown();
        return;
      default:
        return;
    }

    // First to act after flop is first active player after dealer
    this.currentPlayerIndex = 0;
    this.lastRaiserIndex = -1;

    if (activeNonAllIn.length <= 1) {
      this.dealRemainingAndShowdown();
      return;
    }

    this.startActionTimer();
  }

  private dealRemainingAndShowdown(): void {
    // Deal remaining community cards
    while (this.communityCards.length < 5) {
      this.communityCards.push(this.deck.draw());
    }
    this.showdown();
  }

  private showdown(): void {
    this.phase = 'poker:showdown';
    this.clearActionTimer();

    const activePlayers = this.getActivePlayers();
    const foldedPlayers = new Set<string>();
    const rankings = new Map<string, HandRank>();

    for (const player of this.getPlayersInHand()) {
      if (player.isFolded) {
        foldedPlayers.add(player.info.id);
      } else {
        const allCards = [...player.holeCards, ...this.communityCards];
        const handRank = getBestFive(allCards);
        rankings.set(player.info.id, handRank);
        this.lastShowdownHands.set(player.info.id, handRank);
      }
    }

    const allPlayerIds = this.seatOrder.filter((id) => {
      const p = this.players.get(id)!;
      return !p.isSittingOut;
    });

    const payoutResults = this.potManager.distributePots(rankings, foldedPlayers, allPlayerIds);

    this.lastPayouts = [];
    for (const payout of payoutResults) {
      const player = this.players.get(payout.playerId);
      if (player) {
        player.chipCount += payout.amount;
        const hand = rankings.get(payout.playerId);
        this.lastPayouts.push({
          playerId: payout.playerId,
          amount: payout.amount,
          handName: hand?.name,
        });
      }
    }
  }

  private winByFold(winner: PokerPlayer): void {
    this.phase = 'poker:showdown';
    this.clearActionTimer();

    const totalPot = this.potManager.getTotalPot();
    winner.chipCount += totalPot;

    this.lastPayouts = [{
      playerId: winner.info.id,
      amount: totalPot,
    }];
  }

  private checkAllInShowdown(): boolean {
    const active = this.getActivePlayers();
    const activeNonAllIn = this.getActiveNonAllInPlayers();

    if (active.length >= 2 && activeNonAllIn.length <= 1) {
      // Check if all bets are settled
      const allMatched = active.every(
        (p) => p.currentBet === this.highestBet || p.isAllIn,
      );
      if (allMatched) {
        this.dealRemainingAndShowdown();
        return true;
      }
    }
    return false;
  }

  // --- Timer ---

  setTimeoutCallback(callback: () => void): void {
    this.onTimeout = callback;
  }

  private startActionTimer(): void {
    this.clearActionTimer();
    this.actionTimerStart = Date.now();

    this.actionTimer = setTimeout(() => {
      // Auto-action: check if possible, otherwise fold
      const currentId = this.getCurrentPlayerId();
      if (!currentId) return;

      const player = this.players.get(currentId);
      if (!player) return;

      if (player.currentBet >= this.highestBet) {
        this.check(currentId);
      } else {
        this.fold(currentId);
      }

      this.onTimeout?.();
    }, this.config.actionTimeout * 1000);
  }

  private clearActionTimer(): void {
    if (this.actionTimer) {
      clearTimeout(this.actionTimer);
      this.actionTimer = null;
    }
  }

  getTimeRemaining(): number | null {
    if (!this.actionTimer) return null;
    const elapsed = Date.now() - this.actionTimerStart;
    return Math.max(0, this.config.actionTimeout * 1000 - elapsed);
  }

  // --- Results ---

  getPayouts(): PokerPayoutEntry[] {
    return this.lastPayouts;
  }

  getShowdownHands(): Map<string, HandRank> {
    return this.lastShowdownHands;
  }

  resetForNewHand(): void {
    this.phase = 'poker:waiting';
    this.communityCards = [];
    this.potManager.reset();
    this.lastPayouts = [];
    this.lastShowdownHands.clear();
    this.clearActionTimer();

    // Remove busted players
    for (const [id, player] of this.players) {
      if (player.chipCount <= 0) {
        player.isSittingOut = true;
      }
      player.holeCards = [];
      player.currentBet = 0;
      player.totalBetThisHand = 0;
      player.isFolded = false;
      player.isAllIn = false;
    }
  }

  // --- Client State ---

  getClientState(forPlayerId?: string): PokerClientState {
    const activePlayers = this.getActivePlayerIds();
    const timeRemaining = this.getTimeRemaining();

    // Determine blind seats
    const sbIndex = this.seatOrder.length === 2
      ? this.dealerSeatIndex % this.seatOrder.length
      : (this.dealerSeatIndex + 1) % this.seatOrder.length;
    const bbIndex = (sbIndex + 1) % this.seatOrder.length;

    return {
      id: '', // set by caller
      phase: this.phase,
      players: this.seatOrder.map((id) => {
        const p = this.players.get(id)!;
        return {
          id: p.info.id,
          username: p.info.username,
          displayName: p.info.displayName,
          avatarUrl: p.info.avatarUrl,
          seatNumber: p.seatNumber,
          chipCount: p.chipCount,
          isActive: !p.isFolded && !p.isSittingOut,
          isConnected: p.isConnected,
          holeCards:
            this.phase === 'poker:showdown' && !p.isFolded
              ? p.holeCards // reveal at showdown
              : p.info.id === forPlayerId
                ? p.holeCards
                : p.holeCards.map(() => ({ hidden: true as const })),
          currentBet: p.currentBet,
          totalBetThisRound: p.totalBetThisHand,
          isFolded: p.isFolded,
          isAllIn: p.isAllIn,
        };
      }),
      communityCards: this.communityCards,
      pots: this.potManager.getPots(activePlayers),
      dealerSeat: this.seatOrder[this.dealerSeatIndex % this.seatOrder.length]
        ? this.players.get(this.seatOrder[this.dealerSeatIndex % this.seatOrder.length])!.seatNumber
        : 0,
      smallBlindSeat: this.seatOrder[sbIndex]
        ? this.players.get(this.seatOrder[sbIndex])!.seatNumber
        : 0,
      bigBlindSeat: this.seatOrder[bbIndex]
        ? this.players.get(this.seatOrder[bbIndex])!.seatNumber
        : 0,
      currentPlayerId: this.getCurrentPlayerId(),
      minRaise: this.highestBet + this.minRaise,
      timeRemaining: timeRemaining !== null ? Math.ceil(timeRemaining / 1000) : null,
    };
  }
}
