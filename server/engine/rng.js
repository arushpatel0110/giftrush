/**
 * rng.js – Cryptographically-seeded RNG engine.
 * Uses Node's built-in `crypto` for provably-fair draws.
 *
 * Every spin has:
 *  - serverSeed (kept secret until reveal)
 *  - clientSeed (provided by player or generated)
 *  - nonce      (incremented per spin per session)
 * Combined hash determines the spin outcome.
 */

const crypto = require('crypto');
const { ALL_SYMBOL_IDS, SYMBOL_WEIGHTS, SYMBOL_IDS } = require('../config/symbols');
const { GameConfig } = require('../config/gameConfig');

class RNGEngine {
  constructor() {
    /** Pre-compute a flat weighted pool for fast random draws. */
    this._pool = this._buildPool();
  }

  // ── Provably-fair API ────────────────────────────────────────

  /**
   * Generate a new server seed (secret until revealed).
   * @returns {{ serverSeed: string, serverSeedHash: string }}
   */
  generateServerSeed() {
    const serverSeed = crypto.randomBytes(32).toString('hex');
    const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
    return { serverSeed, serverSeedHash };
  }

  /**
   * Generate a complete provably-fair 3×3 spin result.
   * @param {string} serverSeed  Secret server seed for this round
   * @param {string} clientSeed  Client-provided seed
   * @param {number} nonce       Session spin counter
   * @returns {number[][]}       [reel][row] → symbolId
   */
  generateSpinResult(serverSeed, clientSeed, nonce) {
    const combined = `${serverSeed}:${clientSeed}:${nonce}`;
    const hash = crypto.createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex');

    const result = [];
    let byteOffset = 0;
    for (let r = 0; r < GameConfig.REELS; r++) {
      const col = [];
      for (let row = 0; row < GameConfig.ROWS; row++) {
        const intVal = parseInt(hash.slice(byteOffset, byteOffset + 8), 16);
        byteOffset = (byteOffset + 8) % (hash.length - 8 + 1);
        const idx = intVal % this._pool.length;
        col.push(this._pool[idx]);
      }
      result.push(col);
    }
    return result;
  }

  /**
   * Force-trigger the bonus by placing BONUS symbols on every reel
   * in the middle row (row index 1); all other positions are random via hash.
   */
  generateBonusTrigger(serverSeed, clientSeed, nonce) {
    const result = this.generateSpinResult(serverSeed, clientSeed, nonce);
    for (let r = 0; r < GameConfig.REELS; r++) {
      result[r][1] = SYMBOL_IDS.BONUS; // middle row forced
    }
    return result;
  }

  /**
   * Generate an array of bonus gift multipliers.
   * Multipliers range dynamically between 2x and 499x.
   * @returns {{ multipliers: number[], winIndex: number }}
   */
  generateGiftMultipliers(serverSeed, clientSeed, nonce) {
    const BONUS_GIFT_COUNT = 5;
    const hash = crypto.createHmac('sha256', serverSeed).update(`bonus:${clientSeed}:${nonce}`).digest('hex');

    const multipliers = [];
    for (let i = 0; i < BONUS_GIFT_COUNT; i++) {
      const intVal = parseInt(hash.slice(i * 8, i * 8 + 8), 16);
      const randFloat = intVal / 0xFFFFFFFF;
      multipliers.push(this._getRandomMultiplier(randFloat));
    }

    // Determine which gift box position receives the winning multiplier
    const revealInt = parseInt(hash.slice(40, 48), 16);
    const winIndex = revealInt % BONUS_GIFT_COUNT;

    return { multipliers, winIndex };
  }

  _getRandomMultiplier(r) {
    if (r < 0.60) {
      return Math.floor(2 + (r / 0.60) * 24); // 2..25
    } else if (r < 0.85) {
      return Math.floor(26 + ((r - 0.60) / 0.25) * 75); // 26..100
    } else if (r < 0.96) {
      return Math.floor(101 + ((r - 0.85) / 0.11) * 150); // 101..250
    } else {
      return Math.floor(251 + ((r - 0.96) / 0.04) * 249); // 251..499
    }
  }

  // ── Private ──────────────────────────────────────────────────

  /** Build a flat pool (array) from the weighted symbol list. */
  _buildPool() {
    const pool = [];
    ALL_SYMBOL_IDS.forEach((id, i) => {
      const w = Math.round(SYMBOL_WEIGHTS[i] * 10);
      for (let j = 0; j < w; j++) pool.push(id);
    });
    return this._shuffle(pool);
  }

  /** Select an index from a weights array given a random int. */
  _weightedIndex(intVal, weights) {
    const total = weights.reduce((s, w) => s + w, 0);
    let r = (intVal / 0xFFFFFFFF) * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return weights.length - 1;
  }

  /** Fisher–Yates shuffle (in-place). */
  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

module.exports = { RNGEngine };
