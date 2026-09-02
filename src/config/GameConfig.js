/**
 * GameConfig – Central configuration for Gift Rush slot game.
 * All tuneable parameters live here to keep the rest of the code
 * free of magic numbers.
 */
export const GameConfig = Object.freeze({
  // ── Canvas Base Dimensions (16:9 / 9:16) ──────────────
  WIDTH: 1280,
  HEIGHT: 720,

  // ── Target Full-HD Display Resolutions ─────────────────
  TARGET_WIDTH: 1920,
  TARGET_HEIGHT: 1080,
  PORTRAIT_TARGET_WIDTH: 1080,
  PORTRAIT_TARGET_HEIGHT: 1920,

  // ── Portrait Canvas Base Dimensions ─────────────────────
  PORTRAIT_WIDTH: 720,
  PORTRAIT_HEIGHT: 1280,

  // ── Grid ────────────────────────────────────────────────
  REELS: 3,
  ROWS: 3,
  PAYLINES: 5,

  // ── Symbol display ──────────────────────────────────────
  SYMBOL_SIZE: 130,   // px (square cell)
  REEL_GAP: 130,   // default gap reference
  REEL_MASK_PAD: 4,     // extra clip padding

  // ── Per-Reel X positions (Shifted 1st & 2nd reels left, 3rd reel unchanged)
  REEL_OFFSETS: [-25, 180, 385],
  getReelX: (idx) => [-25, 180, 385][idx] ?? 0,

  // ── Reel origin (top-left of reel grid) ─────────────────
  GRID_X: 375,  // left edge of reel area (Landscape)
  GRID_Y: 135,  // top edge of reel area (Landscape)
  PORTRAIT_GRID_X: 95,  // left edge of reel area (Portrait)
  PORTRAIT_GRID_Y: 340, // top edge of reel area (Portrait)
  getGridX: (isPortrait = false) => isPortrait ? 95 : 375,
  getGridY: (isPortrait = false) => isPortrait ? 340 : 135,
  REEL_Y_OFFSET: 20, // shift reel container down relative to frame

  // ── Spinning ────────────────────────────────────────────
  SPIN_SPEED: 42,    // symbols/second during spin
  SPIN_DURATION_BASE: 1800,  // ms, first reel stops after this
  REEL_STOP_DELAY: 300,   // ms between consecutive reel stops
  REEL_BOUNCE_DIST: 18,    // px overshoot before settling
  TURBO_MULTIPLIER: 0.4,   // multiply durations when turbo on

  // ── Testing Toggles ──────────────────────────────────────
  FORCE_TEST_BONUS: false, // Set to true to test 3-bonus trigger on EVERY spin; set false for normal play

  // ── Betting ─────────────────────────────────────────────
  BET_STEPS: [0.10, 0.20, 0.30, 0.50, 0.70, 1.00, 1.50, 2.00, 3.00, 4.00, 5.00, 7.00, 10.00, 15.00, 20.00, 30.00, 50.00, 70.00, 100.00, 150.00, 200.00, 300.00],
  DEFAULT_BET_INDEX: 0,    // index into BET_STEPS → 0.10
  DEFAULT_BALANCE: 1000,
  BUY_BONUS_COST_X: 80,   // cost = bet × 80

  // ── Autoplay ────────────────────────────────────────────
  AUTOPLAY_OPTIONS: [5, 10, 25, 50, 100],

  // ── Paytable multipliers per symbol (3-of-a-kind) ───────
  // Stored in SymbolConfig.js; here just for reference.

  // ── Win animation ───────────────────────────────────────
  WIN_FLASH_DURATION: 1500, // ms display duration per payline during one-by-one presentation
  WIN_COUNT_DURATION: 1200,  // ms to count up win amount
  WIN_BG_SIZE_MULTIPLIER: 1.45, // Scale relative to symbol size (SYMBOL_SIZE = 130px)
  WIN_BG_WIDTH: 235,         // Width in px for win-bg.png_80_80.webp
  WIN_BG_HEIGHT: 150,        // Height in px for win-bg.png_80_80.webp

  // ── Black Reel Overlay Size ────────────────────────────────
  DARK_OVERLAY_WIDTH: 640,    // Width of dark reel backdrop overlay
  DARK_OVERLAY_HEIGHT: 420,   // Height of dark reel backdrop overlay
  DARK_OVERLAY_ALPHA: 0.40,   // Semi-transparent black opacity (0.0 to 1.0)
  DARK_OVERLAY_RADIUS: 16,    // Corner rounding radius in px
  DARK_OVERLAY_X_OFFSET: -14, // Slight left offset in px

  // ── RTP hint (informational only) ───────────────────────
  RTP: 96.07,
});
