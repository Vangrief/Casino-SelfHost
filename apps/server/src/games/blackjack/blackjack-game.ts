import type { Card, BlackjackPhase, BlackjackTableConfig, BlackjackClientState, BlackjackPlayerHand } from '@casino/shared';
import { BLACKJACK_DEFAULTS, RESHUFFLE_THRESHOLD } from '@casino/shared';
import { Shoe } from '../common/deck.js';
import { getBestHandValue, isBusted, isBlackjack, isSoft } from '../common/hand.js';

interface PlayerInfo {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface PlayerState {
  info: PlayerInfo;
  seatNumber: number;
  hands: Card[][];
  bets: number[];
  currentHandIndex: number;
  insuranceBet: number;
  hasInsurance: boolean;
  settled: boolean;
}

export interface PayoutEntry {
  playerId: string;
  amount: number; // positive = won, negative = lost
  description: string;
}

export class BlackjackGame {
  private shoe: Shoe;
  private dealerHand: Card[] = [];
  private players = new Map<string, PlayerState>();
  private phase: BlackjackPhase = 'bj:betting';
  private turnOrder: string[] = [];
  private currentTurnIndex = 0;
  private config: BlackjackTableConfig;
  private lastPayouts: PayoutEntry[] = [];

  constructor(config?: Partial<BlackjackTableConfig>) {
    this.config = { ...BLACKJACK_DEFAULTS, ...config };
    this.shoe = new Shoe(this.config.deckCount);
  }

  // --- Player Management ---

  addPlayer(player: PlayerInfo, seatNumber: number): void {
    if (this.phase !== 'bj:betting') return;
    this.players.set(player.id, {
      info: player,
      seatNumber,
      hands: [],
      bets: [],
      currentHandIndex: 0,
      insuranceBet: 0,
      hasInsurance: false,
      settled: false,
    });
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);
  }

  hasPlayer(playerId: string): boolean {
    return this.players.has(playerId);
  }

  getPlayerCount(): number {
    return this.players.size;
  }

  getPhase(): BlackjackPhase {
    return this.phase;
  }

  // --- Actions ---

  placeBet(playerId: string, amount: number): { success: boolean; error?: string } {
    if (this.phase !== 'bj:betting') return { success: false, error: 'Not in betting phase' };

    const player = this.players.get(playerId);
    if (!player) return { success: false, error: 'Not at table' };

    if (amount < this.config.minBet || amount > this.config.maxBet) {
      return { success: false, error: `Bet must be between ${this.config.minBet} and ${this.config.maxBet}` };
    }

    player.bets = [amount];
    player.hands = [];
    player.currentHandIndex = 0;
    player.insuranceBet = 0;
    player.hasInsurance = false;
    player.settled = false;

    return { success: true };
  }

  allBetsPlaced(): boolean {
    for (const player of this.players.values()) {
      if (player.bets.length === 0) return false;
    }
    return this.players.size > 0;
  }

  deal(): void {
    if (this.phase !== 'bj:betting') return;
    if (!this.allBetsPlaced()) return;

    if (this.shoe.needsReshuffle(RESHUFFLE_THRESHOLD)) {
      this.shoe.shuffle();
    }

    // Reset
    this.dealerHand = [];
    for (const player of this.players.values()) {
      player.hands = [[]];
    }

    this.phase = 'bj:dealing';

    // Deal 2 cards to each player, then 2 to dealer
    for (let round = 0; round < 2; round++) {
      for (const player of this.players.values()) {
        player.hands[0].push(this.shoe.draw());
      }
      this.dealerHand.push(this.shoe.draw());
    }

    // Check for dealer blackjack with Ace showing — insurance phase would go here
    // For now, move directly to player turns
    this.startPlayerTurns();
  }

  private startPlayerTurns(): void {
    this.turnOrder = Array.from(this.players.keys());
    this.currentTurnIndex = 0;
    this.phase = 'bj:player_turn';

    // Skip players with blackjack
    this.skipBlackjackPlayers();
  }

  private skipBlackjackPlayers(): void {
    while (this.currentTurnIndex < this.turnOrder.length) {
      const player = this.players.get(this.turnOrder[this.currentTurnIndex]);
      if (player && isBlackjack(player.hands[player.currentHandIndex])) {
        this.currentTurnIndex++;
      } else {
        break;
      }
    }

    if (this.currentTurnIndex >= this.turnOrder.length) {
      this.startDealerTurn();
    }
  }

  getCurrentPlayerId(): string | null {
    if (this.phase !== 'bj:player_turn') return null;
    return this.turnOrder[this.currentTurnIndex] || null;
  }

  hit(playerId: string): { success: boolean; error?: string } {
    if (!this.isPlayersTurn(playerId)) return { success: false, error: 'Not your turn' };

    const player = this.players.get(playerId)!;
    const hand = player.hands[player.currentHandIndex];
    hand.push(this.shoe.draw());

    if (isBusted(hand)) {
      this.advanceHand(player);
    }

    return { success: true };
  }

  stand(playerId: string): { success: boolean; error?: string } {
    if (!this.isPlayersTurn(playerId)) return { success: false, error: 'Not your turn' };

    const player = this.players.get(playerId)!;
    this.advanceHand(player);

    return { success: true };
  }

  doubleDown(playerId: string): { success: boolean; error?: string; additionalBet?: number } {
    if (!this.isPlayersTurn(playerId)) return { success: false, error: 'Not your turn' };

    const player = this.players.get(playerId)!;
    const hand = player.hands[player.currentHandIndex];

    if (hand.length !== 2) {
      return { success: false, error: 'Can only double down on first two cards' };
    }

    const additionalBet = player.bets[player.currentHandIndex];
    player.bets[player.currentHandIndex] *= 2;

    hand.push(this.shoe.draw());
    this.advanceHand(player);

    return { success: true, additionalBet };
  }

  split(playerId: string): { success: boolean; error?: string; additionalBet?: number } {
    if (!this.isPlayersTurn(playerId)) return { success: false, error: 'Not your turn' };

    const player = this.players.get(playerId)!;
    const hand = player.hands[player.currentHandIndex];

    if (hand.length !== 2) {
      return { success: false, error: 'Can only split with two cards' };
    }

    if (hand[0].rank !== hand[1].rank) {
      return { success: false, error: 'Can only split matching cards' };
    }

    if (player.hands.length - 1 >= this.config.maxSplits) {
      return { success: false, error: `Maximum ${this.config.maxSplits} splits reached` };
    }

    const additionalBet = player.bets[player.currentHandIndex];

    // Split the hand
    const secondCard = hand.pop()!;
    const newHand = [secondCard];

    // Deal one card to each new hand
    hand.push(this.shoe.draw());
    newHand.push(this.shoe.draw());

    // Insert new hand right after current
    player.hands.splice(player.currentHandIndex + 1, 0, newHand);
    player.bets.splice(player.currentHandIndex + 1, 0, additionalBet);

    return { success: true, additionalBet };
  }

  insurance(playerId: string, accept: boolean): { success: boolean; error?: string; insuranceBet?: number } {
    const player = this.players.get(playerId);
    if (!player) return { success: false, error: 'Not at table' };

    if (!accept) {
      player.hasInsurance = true;
      return { success: true };
    }

    // Insurance costs half the original bet
    const insuranceBet = Math.floor(player.bets[0] / 2);
    player.insuranceBet = insuranceBet;
    player.hasInsurance = true;

    return { success: true, insuranceBet };
  }

  // --- Dealer Turn ---

  private startDealerTurn(): void {
    this.phase = 'bj:dealer_turn';

    // Check if all players busted
    let allBusted = true;
    for (const player of this.players.values()) {
      for (const hand of player.hands) {
        if (!isBusted(hand)) {
          allBusted = false;
          break;
        }
      }
      if (!allBusted) break;
    }

    if (!allBusted) {
      this.playDealerHand();
    }

    this.settleBets();
  }

  private playDealerHand(): void {
    while (true) {
      const value = getBestHandValue(this.dealerHand);

      if (value > 17) break;
      if (value === 17) {
        // Dealer stands on soft 17 if configured
        if (this.config.dealerStandsSoft17 && isSoft(this.dealerHand)) {
          break;
        }
        if (!isSoft(this.dealerHand)) {
          break;
        }
      }

      this.dealerHand.push(this.shoe.draw());
    }
  }

  // --- Settlement ---

  private settleBets(): void {
    this.phase = 'bj:payout';
    this.lastPayouts = [];
    const dealerValue = getBestHandValue(this.dealerHand);
    const dealerBJ = isBlackjack(this.dealerHand);
    const dealerBusted = isBusted(this.dealerHand);

    for (const player of this.players.values()) {
      // Insurance settlement
      if (player.insuranceBet > 0) {
        if (dealerBJ) {
          this.lastPayouts.push({
            playerId: player.info.id,
            amount: player.insuranceBet * 2,
            description: 'Insurance pays',
          });
        } else {
          this.lastPayouts.push({
            playerId: player.info.id,
            amount: -player.insuranceBet,
            description: 'Insurance lost',
          });
        }
      }

      // Hand settlements
      for (let i = 0; i < player.hands.length; i++) {
        const hand = player.hands[i];
        const bet = player.bets[i];
        const handValue = getBestHandValue(hand);
        const playerBJ = isBlackjack(hand);
        const playerBusted = isBusted(hand);

        if (playerBusted) {
          this.lastPayouts.push({
            playerId: player.info.id,
            amount: -bet,
            description: 'Busted',
          });
        } else if (playerBJ && dealerBJ) {
          // Push — return bet
          this.lastPayouts.push({
            playerId: player.info.id,
            amount: 0,
            description: 'Push (both Blackjack)',
          });
        } else if (playerBJ) {
          // Blackjack pays 3:2
          this.lastPayouts.push({
            playerId: player.info.id,
            amount: Math.floor(bet * this.config.blackjackPays),
            description: 'Blackjack!',
          });
        } else if (dealerBJ) {
          this.lastPayouts.push({
            playerId: player.info.id,
            amount: -bet,
            description: 'Dealer Blackjack',
          });
        } else if (dealerBusted) {
          this.lastPayouts.push({
            playerId: player.info.id,
            amount: bet,
            description: 'Dealer busted',
          });
        } else if (handValue > dealerValue) {
          this.lastPayouts.push({
            playerId: player.info.id,
            amount: bet,
            description: `Win (${handValue} vs ${dealerValue})`,
          });
        } else if (handValue === dealerValue) {
          this.lastPayouts.push({
            playerId: player.info.id,
            amount: 0,
            description: `Push (${handValue})`,
          });
        } else {
          this.lastPayouts.push({
            playerId: player.info.id,
            amount: -bet,
            description: `Lose (${handValue} vs ${dealerValue})`,
          });
        }
      }

      player.settled = true;
    }
  }

  getPayouts(): PayoutEntry[] {
    return this.lastPayouts;
  }

  /**
   * Aggregate net payout per player (for wallet operations).
   */
  getNetPayouts(): Map<string, number> {
    const net = new Map<string, number>();
    for (const p of this.lastPayouts) {
      net.set(p.playerId, (net.get(p.playerId) || 0) + p.amount);
    }
    return net;
  }

  resetForNewRound(): void {
    this.phase = 'bj:betting';
    this.dealerHand = [];
    this.lastPayouts = [];
    for (const player of this.players.values()) {
      player.hands = [];
      player.bets = [];
      player.currentHandIndex = 0;
      player.insuranceBet = 0;
      player.hasInsurance = false;
      player.settled = false;
    }
  }

  // --- Helpers ---

  private isPlayersTurn(playerId: string): boolean {
    return this.phase === 'bj:player_turn' && this.getCurrentPlayerId() === playerId;
  }

  private advanceHand(player: PlayerState): void {
    player.currentHandIndex++;

    // Check if player has more hands (from splits)
    if (player.currentHandIndex < player.hands.length) {
      return; // Still playing this player's next hand
    }

    // Move to next player
    this.currentTurnIndex++;
    if (this.currentTurnIndex >= this.turnOrder.length) {
      this.startDealerTurn();
    } else {
      // Reset current hand index for next player
      const nextPlayer = this.players.get(this.turnOrder[this.currentTurnIndex]);
      if (nextPlayer) {
        nextPlayer.currentHandIndex = 0;
        // Skip if blackjack
        if (isBlackjack(nextPlayer.hands[0])) {
          this.currentTurnIndex++;
          if (this.currentTurnIndex >= this.turnOrder.length) {
            this.startDealerTurn();
          }
        }
      }
    }
  }

  // --- Client State ---

  getClientState(forPlayerId?: string): BlackjackClientState {
    const showDealerCards = this.phase === 'bj:dealer_turn' || this.phase === 'bj:payout';

    return {
      id: '', // set by caller
      phase: this.phase,
      players: Array.from(this.players.values())
        .sort((a, b) => a.seatNumber - b.seatNumber)
        .map((p) => ({
          id: p.info.id,
          username: p.info.username,
          displayName: p.info.displayName,
          avatarUrl: p.info.avatarUrl,
          seatNumber: p.seatNumber,
          chipCount: 0, // filled by handler from wallet
          isActive: !p.settled,
          isConnected: true,
          hands: p.hands.map((hand, i) => ({
            cards: hand,
            value: getBestHandValue(hand),
            isBusted: isBusted(hand),
            isBlackjack: isBlackjack(hand),
            bet: p.bets[i] || 0,
          })),
          currentHandIndex: p.currentHandIndex,
        })),
      dealerHand: {
        cards: this.dealerHand.map((card, i) => {
          // Hide dealer's hole card (second card) unless it's dealer's turn or payout
          if (i === 1 && !showDealerCards) return { hidden: true as const };
          return card;
        }),
        value: showDealerCards ? getBestHandValue(this.dealerHand) : null,
      },
      currentPlayerId: this.getCurrentPlayerId(),
      shoe: {
        remaining: this.shoe.remaining,
        total: this.shoe.total,
      },
    };
  }

  /**
   * Get the total bet amount for a player across all hands (for debit purposes).
   */
  getTotalBet(playerId: string): number {
    const player = this.players.get(playerId);
    if (!player) return 0;
    return player.bets.reduce((sum, bet) => sum + bet, 0) + player.insuranceBet;
  }
}
