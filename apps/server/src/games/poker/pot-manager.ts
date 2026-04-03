import type { HandRank } from './hand-evaluator.js';
import { compareHands } from './hand-evaluator.js';

export interface Pot {
  amount: number;
  eligible: string[]; // player IDs eligible to win this pot
}

export interface PayoutResult {
  playerId: string;
  amount: number;
  potIndex: number;
}

export class PotManager {
  private contributions = new Map<string, number>(); // total contributed per player
  private allInAmounts: { playerId: string; amount: number }[] = [];

  addBet(playerId: string, amount: number): void {
    const current = this.contributions.get(playerId) || 0;
    this.contributions.set(playerId, current + amount);
  }

  handleAllIn(playerId: string): void {
    const total = this.contributions.get(playerId) || 0;
    this.allInAmounts.push({ playerId, amount: total });
  }

  getTotalPot(): number {
    let total = 0;
    for (const amount of this.contributions.values()) {
      total += amount;
    }
    return total;
  }

  getPlayerContribution(playerId: string): number {
    return this.contributions.get(playerId) || 0;
  }

  /**
   * Calculate side pots based on all-in amounts.
   * Each pot has a list of eligible players (those who contributed enough).
   */
  calculatePots(activePlayers: string[]): Pot[] {
    if (this.allInAmounts.length === 0) {
      // No side pots needed — single main pot
      return [{
        amount: this.getTotalPot(),
        eligible: activePlayers.filter((id) => this.contributions.has(id)),
      }];
    }

    // Sort all-in amounts ascending
    const sortedAllIns = [...this.allInAmounts].sort((a, b) => a.amount - b.amount);

    const pots: Pot[] = [];
    let previousLevel = 0;

    for (const allIn of sortedAllIns) {
      const level = allIn.amount;
      if (level <= previousLevel) continue;

      const slicePerPlayer = level - previousLevel;
      let potAmount = 0;
      const eligible: string[] = [];

      for (const [playerId, totalContrib] of this.contributions) {
        const effectiveContrib = Math.min(totalContrib - previousLevel, slicePerPlayer);
        if (effectiveContrib > 0) {
          potAmount += effectiveContrib;
          eligible.push(playerId);
        }
      }

      if (potAmount > 0) {
        pots.push({ amount: potAmount, eligible });
      }

      previousLevel = level;
    }

    // Remaining pot (above highest all-in)
    const maxAllIn = sortedAllIns[sortedAllIns.length - 1]?.amount || 0;
    let remainingPot = 0;
    const remainingEligible: string[] = [];

    for (const [playerId, totalContrib] of this.contributions) {
      const excess = totalContrib - maxAllIn;
      if (excess > 0) {
        remainingPot += excess;
        remainingEligible.push(playerId);
      }
    }

    if (remainingPot > 0) {
      pots.push({ amount: remainingPot, eligible: remainingEligible });
    }

    return pots;
  }

  /**
   * Distribute pots to winners based on hand rankings.
   * foldedPlayers: players who folded (not eligible).
   */
  distributePots(
    rankings: Map<string, HandRank>,
    foldedPlayers: Set<string>,
    activePlayers: string[],
  ): PayoutResult[] {
    const pots = this.calculatePots(activePlayers);
    const payouts: PayoutResult[] = [];

    for (let i = 0; i < pots.length; i++) {
      const pot = pots[i];

      // Filter eligible players: must have a ranking and not be folded
      const eligible = pot.eligible.filter(
        (id) => rankings.has(id) && !foldedPlayers.has(id),
      );

      if (eligible.length === 0) continue;

      // Find best hand among eligible
      let bestPlayers: string[] = [eligible[0]];
      let bestHand = rankings.get(eligible[0])!;

      for (let j = 1; j < eligible.length; j++) {
        const hand = rankings.get(eligible[j])!;
        const cmp = compareHands(hand, bestHand);
        if (cmp > 0) {
          bestPlayers = [eligible[j]];
          bestHand = hand;
        } else if (cmp === 0) {
          bestPlayers.push(eligible[j]);
        }
      }

      // Split pot among winners
      const share = Math.floor(pot.amount / bestPlayers.length);
      const remainder = pot.amount - share * bestPlayers.length;

      for (let j = 0; j < bestPlayers.length; j++) {
        payouts.push({
          playerId: bestPlayers[j],
          amount: share + (j === 0 ? remainder : 0), // first winner gets remainder
          potIndex: i,
        });
      }
    }

    return payouts;
  }

  reset(): void {
    this.contributions.clear();
    this.allInAmounts = [];
  }

  getPots(activePlayers: string[]): Pot[] {
    return this.calculatePots(activePlayers);
  }
}
