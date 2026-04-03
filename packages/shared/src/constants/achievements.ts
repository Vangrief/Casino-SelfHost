export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  totalGames: number;
  totalHands: number;
  totalWins: number;
  netProfit: number;
  biggestWin: number;
  bjBlackjacks: number;
  bestStreak: number;
  worstStreak: number;
  pokerBestHand: string | null;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_game',
    name: 'Erste Runde',
    description: 'Spiele dein erstes Spiel',
    icon: '\u{1F3B2}',
    check: (s) => s.totalGames >= 1,
  },
  {
    id: 'ten_games',
    name: 'Stammgast',
    description: 'Spiele 10 Spiele',
    icon: '\u{1F3B0}',
    check: (s) => s.totalGames >= 10,
  },
  {
    id: 'fifty_games',
    name: 'High Roller',
    description: 'Spiele 50 Spiele',
    icon: '\u{1F451}',
    check: (s) => s.totalGames >= 50,
  },
  {
    id: 'first_win',
    name: 'Erster Sieg',
    description: 'Gewinne deine erste Hand',
    icon: '\u{2705}',
    check: (s) => s.totalWins >= 1,
  },
  {
    id: 'ten_wins',
    name: 'Gewinner',
    description: 'Gewinne 10 Hände',
    icon: '\u{1F3C6}',
    check: (s) => s.totalWins >= 10,
  },
  {
    id: 'first_blackjack',
    name: 'Blackjack!',
    description: 'Erhalte deinen ersten Blackjack',
    icon: '\u{1F0CF}',
    check: (s) => s.bjBlackjacks >= 1,
  },
  {
    id: 'five_blackjacks',
    name: 'Kartenzähler',
    description: 'Erhalte 5 Blackjacks',
    icon: '\u{1F9E0}',
    check: (s) => s.bjBlackjacks >= 5,
  },
  {
    id: 'profit_1k',
    name: 'Im Plus',
    description: 'Erreiche 1.000 Profit',
    icon: '\u{1F4B0}',
    check: (s) => s.netProfit >= 1000,
  },
  {
    id: 'profit_10k',
    name: 'Vermögend',
    description: 'Erreiche 10.000 Profit',
    icon: '\u{1F4B5}',
    check: (s) => s.netProfit >= 10000,
  },
  {
    id: 'big_win',
    name: 'Jackpot',
    description: 'Gewinne 5.000 in einer Hand',
    icon: '\u{1F389}',
    check: (s) => s.biggestWin >= 5000,
  },
  {
    id: 'streak_3',
    name: 'Heisse Phase',
    description: '3 Siege in Folge',
    icon: '\u{1F525}',
    check: (s) => s.bestStreak >= 3,
  },
  {
    id: 'streak_5',
    name: 'Unaufhaltsam',
    description: '5 Siege in Folge',
    icon: '\u{26A1}',
    check: (s) => s.bestStreak >= 5,
  },
  {
    id: 'royal_flush',
    name: 'Royal Flush',
    description: 'Erhalte einen Royal Flush im Poker',
    icon: '\u{1F48E}',
    check: (s) => s.pokerBestHand === 'Royal Flush',
  },
  {
    id: 'comeback',
    name: 'Comeback Kid',
    description: 'Komme nach einem -3 Streak wieder ins Plus',
    icon: '\u{1F4AA}',
    check: (s) => s.worstStreak <= -3 && s.netProfit > 0,
  },
];
