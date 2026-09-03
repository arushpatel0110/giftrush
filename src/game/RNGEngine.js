import { ALL_SYMBOL_IDS, SYMBOL_WEIGHTS, SYMBOL_IDS } from '../config/SymbolConfig.js';
import { GameConfig } from '../config/GameConfig.js';
import { MathUtils } from '../utils/MathUtils.js';

/**
 * RNGEngine – Generates provably-random spin outcomes.
 *
 * Symbols are selected via weighted sampling so rarer high-value
 * symbols appear less often, matching a realistic slot RNG.
 */
export class RNGEngine {
  constructor() {
    /** Pre-compute a flat weighted pool for fast random draws. */
    this._pool = this._buildPool();
  }

  // ── Public API ──────────────────────────────────────────────

  /**
   * Generate a complete 3×3 spin result.
   * @returns {number[][]} [reel][row] → symbolId
   */
  generateSpinResult() {
    const result = [];
    for (let r = 0; r < GameConfig.REELS; r++) {
      const col = [];
      for (let row = 0; row < GameConfig.ROWS; row++) {
        col.push(this._drawSymbol());
      }
      result.push(col);
    }
    return result;
  }

  /**
   * Force-trigger the bonus by placing BONUS symbols on every reel
   * in the middle row; all other positions are random.
   * @returns {number[][]}
   */
  generateBonusTrigger() {
    const result = this.generateSpinResult();
    for (let r = 0; r < GameConfig.REELS; r++) {
      result[r][1] = SYMBOL_IDS.BONUS; // middle row
    }
    return result;
  }

  /**
   * Force payline 1 (Top Row) to win – useful for testing win animations.
   * Places the same non-bonus symbol on row 0 of all 3 reels.
   */
  generatePayline1Win() {
    const result = this.generateSpinResult();
    const nonBonusIds = ALL_SYMBOL_IDS.filter(id => id !== SYMBOL_IDS.BONUS);
    const winSymbol = nonBonusIds[Math.floor(Math.random() * nonBonusIds.length)];
    for (let r = 0; r < GameConfig.REELS; r++) {
      result[r][0] = winSymbol; // row 0 = top row = payline 1
    }
    return result;
  }

  /**
   * Force two paylines (Top Row & Middle Row) to win – useful for testing multi-payline win presentation.
   */
  generateTwoPaylinesWin() {
    const result = this.generateSpinResult();
    const nonBonusIds = ALL_SYMBOL_IDS.filter(id => id !== SYMBOL_IDS.BONUS);
    const sym1 = nonBonusIds[Math.floor(Math.random() * nonBonusIds.length)];
    let sym2 = nonBonusIds[Math.floor(Math.random() * nonBonusIds.length)];
    while (sym2 === sym1) {
      sym2 = nonBonusIds[Math.floor(Math.random() * nonBonusIds.length)];
    }

    for (let r = 0; r < GameConfig.REELS; r++) {
      result[r][0] = sym1; // Row 0 = Payline 1
      result[r][1] = sym2; // Row 1 = Payline 2
    }
    return result;
  }

  /**
   * Generate an array of 5 random gift multipliers for the bonus game.
   * Multipliers range dynamically between 2x and 599x.
   * @returns {number[]}
   */
  generateGiftMultipliers() {
    return Array.from({ length: 5 }, () => this._getRandomGiftMultiplier());
  }

  _getRandomGiftMultiplier() {
    const r = Math.random();
    if (r < 0.60) {
      return Math.floor(2 + Math.random() * 24); // 2..25
    } else if (r < 0.85) {
      return Math.floor(26 + Math.random() * 75); // 26..100
    } else if (r < 0.96) {
      return Math.floor(101 + Math.random() * 150); // 101..250
    } else {
      return Math.floor(251 + Math.random() * 349); // 251..599
    }
  }

  /**
   * Generate a strip of symbols for one reel column (used for
   * the visual reel tape that scrolls during a spin).
   * @param {number} length  Number of symbols in the strip
   * @returns {number[]}
   */
  generateReelStrip(length) {
    return Array.from({ length }, () => this._drawSymbol());
  }

  // ── Private ─────────────────────────────────────────────────

  /** Draw one symbol ID using weighted probability. */
  _drawSymbol() {
    return this._pool[Math.floor(Math.random() * this._pool.length)];
  }

  /** Build a flat pool (array) from the weighted symbol list. */
  _buildPool() {
    const pool = [];
    ALL_SYMBOL_IDS.forEach((id, i) => {
      const w = Math.round(SYMBOL_WEIGHTS[i] * 10); // scale up to integers
      for (let j = 0; j < w; j++) pool.push(id);
    });
    return MathUtils.shuffle(pool);
  }
}
