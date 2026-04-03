import { CardSuit, CardRank, type Card } from '@casino/shared';

const ALL_SUITS = [CardSuit.Hearts, CardSuit.Diamonds, CardSuit.Clubs, CardSuit.Spades];
const ALL_RANKS = [
  CardRank.Two, CardRank.Three, CardRank.Four, CardRank.Five,
  CardRank.Six, CardRank.Seven, CardRank.Eight, CardRank.Nine,
  CardRank.Ten, CardRank.Jack, CardRank.Queen, CardRank.King, CardRank.Ace,
];

function createSingleDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/**
 * Fisher-Yates shuffle (in-place, cryptographically not needed for friends game).
 */
function shuffle(cards: Card[]): Card[] {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export class Shoe {
  private cards: Card[] = [];
  private readonly totalCards: number;

  constructor(private deckCount: number = 6) {
    this.totalCards = deckCount * 52;
    this.shuffle();
  }

  shuffle(): void {
    this.cards = [];
    for (let i = 0; i < this.deckCount; i++) {
      this.cards.push(...createSingleDeck());
    }
    shuffle(this.cards);
  }

  draw(): Card {
    if (this.cards.length === 0) {
      this.shuffle();
    }
    return this.cards.pop()!;
  }

  get remaining(): number {
    return this.cards.length;
  }

  get total(): number {
    return this.totalCards;
  }

  needsReshuffle(threshold = 0.75): boolean {
    return (this.totalCards - this.cards.length) / this.totalCards >= threshold;
  }
}
