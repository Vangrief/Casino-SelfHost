import type { SlotSymbol, SlotsClientState, SlotWinLine, SlotsPhase } from '@casino/shared';
import { SYMBOL_WEIGHTS, SYMBOL_PAYOUTS, WIN_LINES, SLOTS_DEFAULTS } from '@casino/shared';

const ALL_SYMBOLS = Object.keys(SYMBOL_WEIGHTS) as SlotSymbol[];

/**
 * Build a weighted pool of symbols for reel generation.
 */
function buildWeightedPool(): SlotSymbol[] {
  const pool: SlotSymbol[] = [];
  for (const sym of ALL_SYMBOLS) {
    const weight = SYMBOL_WEIGHTS[sym];
    for (let i = 0; i < weight; i++) {
      pool.push(sym);
    }
  }
  return pool;
}

const WEIGHTED_POOL = buildWeightedPool();

function randomSymbol(): SlotSymbol {
  return WEIGHTED_POOL[Math.floor(Math.random() * WEIGHTED_POOL.length)];
}

/**
 * Generate a grid of random symbols: reelCount × rowCount
 */
function generateGrid(reelCount: number, rowCount: number): SlotSymbol[][] {
  const reels: SlotSymbol[][] = [];
  for (let r = 0; r < reelCount; r++) {
    const reel: SlotSymbol[] = [];
    for (let row = 0; row < rowCount; row++) {
      reel.push(randomSymbol());
    }
    reels.push(reel);
  }
  return reels;
}

/**
 * Check all win lines against the grid and return matches.
 */
function evaluateWinLines(
  grid: SlotSymbol[][],
  bet: number,
  reelCount: number,
): SlotWinLine[] {
  const winLines: SlotWinLine[] = [];

  for (let lineIdx = 0; lineIdx < WIN_LINES.length; lineIdx++) {
    const line = WIN_LINES[lineIdx];
    // Get the symbols on this line
    const lineSymbols: SlotSymbol[] = [];
    const positions: [number, number][] = [];
    for (let reel = 0; reel < reelCount; reel++) {
      const row = line[reel];
      lineSymbols.push(grid[reel][row]);
      positions.push([reel, row]);
    }

    // Count consecutive matching from left
    const firstSym = lineSymbols[0];
    let count = 1;
    for (let i = 1; i < lineSymbols.length; i++) {
      if (lineSymbols[i] === firstSym) {
        count++;
      } else {
        break;
      }
    }

    // Need at least 3 matching from left
    if (count >= 3) {
      const payoutTable = SYMBOL_PAYOUTS[firstSym];
      let multiplier = 0;
      if (count === 5) multiplier = payoutTable.five;
      else if (count === 4) multiplier = payoutTable.four;
      else multiplier = payoutTable.three;

      winLines.push({
        lineIndex: lineIdx,
        symbols: lineSymbols.slice(0, count),
        positions: positions.slice(0, count),
        multiplier,
        payout: multiplier * bet,
      });
    }
  }

  return winLines;
}

export interface SpinResult {
  grid: SlotSymbol[][];
  winLines: SlotWinLine[];
  totalWin: number;
}

export class SlotMachine {
  private phase: SlotsPhase = 'slots:idle';
  private lastGrid: SlotSymbol[][] = [];
  private lastWinLines: SlotWinLine[] = [];
  private lastBet = 0;
  private lastTotalWin = 0;
  private lastSpinId: string | null = null;
  private reelCount: number;
  private rowCount: number;

  constructor(reelCount = SLOTS_DEFAULTS.reelCount, rowCount = SLOTS_DEFAULTS.rowCount) {
    this.reelCount = reelCount;
    this.rowCount = rowCount;
    // Initialize with empty grid
    this.lastGrid = generateGrid(this.reelCount, this.rowCount);
  }

  spin(bet: number): SpinResult {
    this.phase = 'slots:spinning';
    const grid = generateGrid(this.reelCount, this.rowCount);
    const winLines = evaluateWinLines(grid, bet, this.reelCount);
    const totalWin = winLines.reduce((sum, wl) => sum + wl.payout, 0);

    this.lastGrid = grid;
    this.lastWinLines = winLines;
    this.lastBet = bet;
    this.lastTotalWin = totalWin;
    this.lastSpinId = crypto.randomUUID();
    this.phase = 'slots:result';

    return { grid, winLines, totalWin };
  }

  setIdle(): void {
    this.phase = 'slots:idle';
    this.lastWinLines = [];
    this.lastTotalWin = 0;
  }

  getClientState(): SlotsClientState {
    return {
      phase: this.phase,
      reels: this.lastGrid,
      winLines: this.lastWinLines,
      bet: this.lastBet,
      totalWin: this.lastTotalWin,
      lastSpinId: this.lastSpinId,
    };
  }
}
