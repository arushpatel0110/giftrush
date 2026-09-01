import { PaylineConfig } from '../config/PaylineConfig.js';
import { SymbolConfig, SYMBOL_IDS } from '../config/SymbolConfig.js';

/**
 * WinEvaluator – Analyses a spin result against all 5 paylines
 * and returns a structured list of wins.
 */
export class WinEvaluator {
  /**
   * Evaluate a spin result.
   *
   * @param {number[][]} result  [reel][row] → symbolId   (3×3 grid)
   * @param {number}     bet     Current bet amount (per spin)
   * @returns {{ wins: WinEntry[], bonusTriggered: boolean, totalWin: number }}
   */
  evaluate(result, bet) {
    const wins = [];
    let totalWin = 0;
    let bonusTriggered = false;

    const bonusPositions = [];

    // 1. Check Scatter Bonus: at least 1 Bonus symbol on Reel 0, Reel 1, AND Reel 2
    const bonusCellsPerReel = [[], [], []];
    for (let r = 0; r < 3; r++) {
      for (let row = 0; row < 3; row++) {
        const symbolId = result[r]?.[row];
        const cfg = SymbolConfig[symbolId];
        if (symbolId === SYMBOL_IDS.BONUS || cfg?.isBonus) {
          bonusCellsPerReel[r].push([r, row]);
        }
      }
    }

    if (bonusCellsPerReel[0].length > 0 && bonusCellsPerReel[1].length > 0 && bonusCellsPerReel[2].length > 0) {
      bonusTriggered = true;
      for (let r = 0; r < 3; r++) {
        bonusPositions.push(...bonusCellsPerReel[r]);
      }
    }

    // 2. Check Paylines for regular symbol wins
    for (const payline of PaylineConfig) {
      const [s0, s1, s2] = payline.positions.map(([r, row]) => result[r]?.[row]);

      if (s0 === s1 && s1 === s2) {
        const cfg = SymbolConfig[s0];
        if (!cfg || cfg.isBonus || s0 === SYMBOL_IDS.BONUS) continue;

        const payout = cfg.payout3 ?? 0;
        if (payout > 0) {
          const amount = payout * bet;
          wins.push({
            paylineId: payline.id,
            paylineName: payline.name,
            symbolId: s0,
            symbolName: cfg.name,
            multiplier: payout,
            amount,
            positions: payline.positions,
            color: payline.color,
          });
          totalWin += amount;
        }
      }
    }

    return { wins, bonusTriggered, bonusPositions, totalWin };
  }
}

/**
 * @typedef {Object} WinEntry
 * @property {number}   paylineId
 * @property {string}   paylineName
 * @property {number}   symbolId
 * @property {string}   symbolName
 * @property {number}   multiplier
 * @property {number}   amount
 * @property {number[][]} positions
 * @property {number}   color
 */
