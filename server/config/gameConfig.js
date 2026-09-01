/**
 * gameConfig.js – Central server-side game configuration.
 * Single source of truth for all game rules.
 */

const GameConfig = Object.freeze({
  // ── Grid ────────────────────────────────────────────────
  REELS:   3,
  ROWS:    3,

  // ── Betting ─────────────────────────────────────────────
  BET_STEPS: [
    0.10, 0.20, 0.30, 0.50, 0.70, 1.00, 1.50, 2.00, 3.00, 4.00,
    5.00, 7.00, 10.00, 15.00, 20.00, 30.00, 50.00, 70.00, 100.00,
    150.00, 200.00, 300.00,
  ],
  MIN_BET:         0.10,
  MAX_BET:         300.00,
  DEFAULT_BET:     0.10,
  DEFAULT_BALANCE: 1000,

  // ── Buy Bonus ────────────────────────────────────────────
  BUY_BONUS_COST_X: 80,  // cost = bet × 80

  // ── Autoplay ────────────────────────────────────────────
  AUTOPLAY_OPTIONS: [5, 10, 25, 50, 100],

  // ── RTP & Volatility ────────────────────────────────────
  RTP:        96.07,
  VOLATILITY: 'HIGH',

  // ── Bonus Gift multiplier pool ───────────────────────────
  BONUS_GIFT_POOL:    [2, 3, 5, 8, 10, 15, 20, 30, 50, 100, 200, 499],
  BONUS_GIFT_WEIGHTS: [40, 30, 20, 18, 14, 10, 8, 6, 4, 2, 1, 0.5],
  BONUS_GIFT_COUNT:   5,  // how many gift boxes appear

  // ── Session ──────────────────────────────────────────────
  SESSION_EXPIRY_MS: 3600_000,  // 1 hour
});

module.exports = { GameConfig };
