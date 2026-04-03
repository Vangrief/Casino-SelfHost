export enum CardSuit {
  Hearts = 'hearts',
  Diamonds = 'diamonds',
  Clubs = 'clubs',
  Spades = 'spades',
}

export enum CardRank {
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = '10',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
  Ace = 'A',
}

export interface Card {
  suit: CardSuit;
  rank: CardRank;
}

export interface HiddenCard {
  hidden: true;
}

export type VisibleOrHiddenCard = Card | HiddenCard;
