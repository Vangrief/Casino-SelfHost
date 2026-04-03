import type { PokerTableConfig } from '../types/game.js';

export const POKER_DEFAULTS: PokerTableConfig = {
  smallBlind: 50,
  bigBlind: 100,
  minBuyIn: 2000,
  maxBuyIn: 20000,
  maxPlayers: 8,
  actionTimeout: 30,
  blindIncreaseHands: null,
};

export enum HandRankName {
  RoyalFlush = 'Royal Flush',
  StraightFlush = 'Straight Flush',
  FourOfAKind = 'Four of a Kind',
  FullHouse = 'Full House',
  Flush = 'Flush',
  Straight = 'Straight',
  ThreeOfAKind = 'Three of a Kind',
  TwoPair = 'Two Pair',
  OnePair = 'One Pair',
  HighCard = 'High Card',
}

export const HAND_RANK_VALUES: Record<string, number> = {
  [HandRankName.RoyalFlush]: 1,
  [HandRankName.StraightFlush]: 2,
  [HandRankName.FourOfAKind]: 3,
  [HandRankName.FullHouse]: 4,
  [HandRankName.Flush]: 5,
  [HandRankName.Straight]: 6,
  [HandRankName.ThreeOfAKind]: 7,
  [HandRankName.TwoPair]: 8,
  [HandRankName.OnePair]: 9,
  [HandRankName.HighCard]: 10,
};
