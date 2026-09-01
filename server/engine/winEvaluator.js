/**
 * winEvaluator.js – Server-side win evaluator.
 * Analyses a 3×3 spin result against all 5 paylines
 * and returns a fully-structured win report.
 */

const { PAYLINES } = require('../config/paylines');
const { SYMBOL_CONFIG, SYMBOL_IDS } = require('../config/symbols');

class WinEvaluator {
  /**
   * Evaluate a spin result.
   *
   * @param {number[][]} grid   [reel][row] → symbolId   (3×3)
   * @param {number}     bet    Current bet amount per spin
   * @returns {EvalResult}
   */
  evaluate(grid, bet) {
    const wins         = [];
    let   totalWin     = 0;
    let   bonusTriggered = false;
    const bonusPositions = [];

    // 1. Check Scatter Bonus: at least 1 Bonus symbol on Reel 0, Reel 1, AND Reel 2
    const bonusCellsPerReel = [[], [], []];
    for (let r = 0; r < 3; r++) {
      for (let row = 0; row < 3; row++) {
        const symbolId = grid[r][row];
        const cfg = SYMBOL_CONFIG[symbolId];
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
    for (const payline of PAYLINES) {
      const symbolsOnLine = payline.positions.map(([reel, row]) => grid[reel][row]);
      const [s0, s1, s2] = symbolsOnLine;

      if (s0 === s1 && s1 === s2) {
        const cfg = SYMBOL_CONFIG[s0];
        if (!cfg || cfg.isBonus || s0 === SYMBOL_IDS.BONUS) continue;

        if (cfg.payout3 > 0) {
          const multiplier = cfg.payout3;
          const amount     = parseFloat((multiplier * bet).toFixed(2));

          wins.push({
            paylineId:   payline.id,
            paylineName: payline.name,
            symbolId:    s0,
            symbolName:  cfg.name,
            multiplier,
            amount,
            positions:   payline.positions,
            color:       payline.color,
            colorHex:    payline.colorHex,
          });

          totalWin += amount;
        }
      }
    }

    totalWin = parseFloat(totalWin.toFixed(2));

    return {
      wins,
      bonusTriggered,
      bonusPositions,
      totalWin,
    };
  }

  /**
   * Compute win line summary for a response payload.
   * @param {WinEntry[]} wins
   * @returns {string}
   */
  summarize(wins) {
    if (!wins.length) return 'No win';
    return wins.map(w => `${w.paylineName}: ${w.symbolName} ×${w.multiplier} = ${w.amount}`).join(' | ');
  }
}

/**
 * @typedef {Object} EvalResult
 * @property {WinEntry[]}     wins
 * @property {boolean}        bonusTriggered
 * @property {number[][]}     bonusPositions    [reel, row] pairs
 * @property {number}         totalWin
 */

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
 * @property {string}   colorHex
 */

module.exports = { WinEvaluator };
