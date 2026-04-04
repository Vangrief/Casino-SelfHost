import type { Card, VisibleOrHiddenCard } from './card.js';

// --- Enums ---

export enum GameType {
  Blackjack = 'blackjack',
  Poker = 'poker',
  Slots = 'slots',
}

export type BlackjackPhase = 'bj:betting' | 'bj:dealing' | 'bj:player_turn' | 'bj:dealer_turn' | 'bj:payout';

export type PokerPhase =
  | 'poker:waiting'
  | 'poker:pre_flop'
  | 'poker:flop'
  | 'poker:turn'
  | 'poker:river'
  | 'poker:showdown';

export type SlotsPhase = 'slots:idle' | 'slots:spinning' | 'slots:result';

export type GamePhase = BlackjackPhase | PokerPhase | SlotsPhase;

export enum BlackjackAction {
  PlaceBet = 'place_bet',
  Hit = 'hit',
  Stand = 'stand',
  DoubleDown = 'double_down',
  Split = 'split',
  Insurance = 'insurance',
}

export enum PokerAction {
  Fold = 'fold',
  Check = 'check',
  Call = 'call',
  Raise = 'raise',
  AllIn = 'all_in',
}

export enum TransactionType {
  BuyIn = 'buy_in',
  CashOut = 'cash_out',
  Win = 'win',
  Loss = 'loss',
  Bonus = 'bonus',
  AdminGrant = 'admin_grant',
}

// --- Player State ---

export interface PlayerState {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  seatNumber: number;
  chipCount: number;
  isActive: boolean;
  isConnected: boolean;
}

// --- Blackjack ---

export interface BlackjackPlayerHand {
  cards: VisibleOrHiddenCard[];
  value: number;
  isBusted: boolean;
  isBlackjack: boolean;
  bet: number;
}

export interface BlackjackClientState {
  id: string;
  phase: BlackjackPhase;
  players: (PlayerState & {
    hands: BlackjackPlayerHand[];
    currentHandIndex: number;
  })[];
  dealerHand: {
    cards: VisibleOrHiddenCard[];
    value: number | null;
  };
  currentPlayerId: string | null;
  shoe: { remaining: number; total: number };
}

// --- Poker ---

export interface PokerHandRank {
  rank: number;
  name: string;
  value: number;
  cards: Card[];
}

export interface Pot {
  amount: number;
  eligible: string[];
}

export interface PokerClientState {
  id: string;
  phase: PokerPhase;
  players: (PlayerState & {
    holeCards: VisibleOrHiddenCard[];
    currentBet: number;
    totalBetThisRound: number;
    isFolded: boolean;
    isAllIn: boolean;
  })[];
  communityCards: Card[];
  pots: Pot[];
  dealerSeat: number;
  smallBlindSeat: number;
  bigBlindSeat: number;
  currentPlayerId: string | null;
  minRaise: number;
  timeRemaining: number | null;
}

// --- Table Info (Lobby) ---

export interface TableInfo {
  id: string;
  gameType: GameType;
  name: string;
  players: { id: string; username: string; displayName: string }[];
  maxPlayers: number;
  config: BlackjackTableConfig | PokerTableConfig | SlotsTableConfig;
  status: 'waiting' | 'playing';
  createdBy: string;
}

export interface BlackjackTableConfig {
  minBet: number;
  maxBet: number;
  deckCount: number;
  dealerStandsSoft17: boolean;
  blackjackPays: number; // 1.5 = 3:2
  allowSurrender: boolean;
  maxSplits: number;
}

export interface PokerTableConfig {
  smallBlind: number;
  bigBlind: number;
  minBuyIn: number;
  maxBuyIn: number;
  maxPlayers: number;
  actionTimeout: number; // seconds
  blindIncreaseHands: number | null; // null = no increase
}

// --- Slots ---

export type SlotSymbol =
  | 'cherry'
  | 'lemon'
  | 'orange'
  | 'plum'
  | 'bell'
  | 'bar'
  | 'seven'
  | 'diamond';

export interface SlotReel {
  symbols: SlotSymbol[];
  stopped: SlotSymbol; // final symbol after spin
}

export interface SlotWinLine {
  lineIndex: number;
  symbols: SlotSymbol[];
  positions: [number, number][]; // [reel, row]
  multiplier: number;
  payout: number;
}

export interface SlotsClientState {
  phase: SlotsPhase;
  reels: SlotSymbol[][]; // 5 reels × 3 visible rows
  winLines: SlotWinLine[];
  bet: number;
  totalWin: number;
  lastSpinId: string | null;
}

export interface SlotsTableConfig {
  minBet: number;
  maxBet: number;
  reelCount: number;
  rowCount: number;
}
