/**
 * slotController.js – HTTP route handlers for all slot game actions.
 *
 * Routes handled:
 *   POST /api/session/create     – Start a new game session
 *   GET  /api/session/:id        – Get session info (balance, seeds, nonce)
 *   POST /api/spin               – Execute a regular spin
 *   POST /api/buybonus           – Execute a Buy Bonus spin (forced bonus trigger)
 *   POST /api/bonus/pick         – Player picks a gift in the bonus game
 *   POST /api/seed/rotate        – Reveal current seed & rotate to next
 *   POST /api/seed/client        – Player sets a custom client seed
 *   GET  /api/history/:sessionId – Retrieve spin history
 *   GET  /api/paytable           – Symbol payout info
 *   GET  /api/paylines           – Payline definitions
 *   GET  /api/config             – Game configuration
 */

const { GameConfig }     = require('../config/gameConfig');
const { SYMBOL_CONFIG, SYMBOL_IDS } = require('../config/symbols');
const { PAYLINES }       = require('../config/paylines');
const { RNGEngine }      = require('../engine/rng');
const { WinEvaluator }   = require('../engine/winEvaluator');
const sessionManager     = require('../engine/sessionManager');

const _rng       = new RNGEngine();
const _evaluator = new WinEvaluator();

// ── Helpers ──────────────────────────────────────────────────────────────────

function validateBet(bet) {
  const b = parseFloat(bet);
  if (isNaN(b) || b < GameConfig.MIN_BET || b > GameConfig.MAX_BET) return null;
  if (!GameConfig.BET_STEPS.includes(parseFloat(b.toFixed(2)))) return null;
  return parseFloat(b.toFixed(2));
}

function sessionPublicView(session) {
  return {
    sessionId:          session.id,
    balance:            session.balance,
    currency:           session.currency,
    serverSeedHash:     session.serverSeedHash,
    nextServerSeedHash: session.nextServerSeedHash,
    clientSeed:         session.clientSeed,
    nonce:              session.nonce,
  };
}

/**
 * Build a human-readable grid display from a raw [reel][row] grid.
 * Returns both a visual ASCII board and structured row/reel objects.
 *
 * @param {number[][]} grid   [reel][row] → symbolId
 * @returns {GridDisplay}
 */
function buildGridDisplay(grid) {
  const ROWS  = 3;
  const REELS = 3;

  // Row-major view: rows[0] = top row across all 3 reels
  const rows = [];
  for (let row = 0; row < ROWS; row++) {
    const rowLabel = row === 0 ? 'TOP   ' : row === 1 ? 'MIDDLE' : 'BOTTOM';
    const cells = [];
    for (let reel = 0; reel < REELS; reel++) {
      const id  = grid[reel][row];
      const sym = SYMBOL_CONFIG[id];
      cells.push({
        reel,
        row,
        id,
        name:  sym?.name  ?? 'Unknown',
        label: sym?.label ?? '?',
      });
    }
    rows.push({ rowIndex: row, rowLabel, cells });
  }

  // ASCII visual — easy to read in Postman / DevTools
  const LINE  = '+' + '-'.repeat(18) + '+' + '-'.repeat(18) + '+' + '-'.repeat(18) + '+';
  const lines = [
    '       REEL 0           REEL 1           REEL 2     ',
    LINE,
  ];
  for (let row = 0; row < ROWS; row++) {
    const rowLabel = row === 0 ? 'TOP   ' : row === 1 ? 'MIDDLE' : 'BOTTOM';
    const cells = [0, 1, 2].map(reel => {
      const id  = grid[reel][row];
      const sym = SYMBOL_CONFIG[id];
      const txt = `${sym?.label ?? '?'} ${sym?.name ?? 'Unknown'}`;
      return ` ${txt.padEnd(16)} `;
    });
    lines.push(`|${cells.join('|')}|  ← ${rowLabel}`);
    lines.push(LINE);
  }

  return { rows, ascii: lines.join('\n') };
}

// ── Controllers ──────────────────────────────────────────────────────────────

/** POST /api/session/create */
async function createSession(req, res) {
  try {
    const startingBalance = parseFloat(req.body?.startingBalance) || GameConfig.DEFAULT_BALANCE;
    const session = sessionManager.createSession(null, startingBalance);
    return res.status(201).json({
      success: true,
      data:    sessionPublicView(session),
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/** GET /api/session/:id */
async function getSession(req, res) {
  try {
    const session = sessionManager.getSession(req.params.id);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found or expired' });
    return res.json({ success: true, data: sessionPublicView(session) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/** POST /api/spin */
async function spin(req, res) {
  try {
    const { sessionId, bet, clientSeed } = req.body ?? {};

    // 1. Load session
    const session = sessionManager.getSession(sessionId);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found or expired' });

    // 2. Validate bet
    const validBet = validateBet(bet);
    if (!validBet) {
      return res.status(400).json({ success: false, error: `Invalid bet. Must be one of: ${GameConfig.BET_STEPS.join(', ')}` });
    }

    // 3. Check balance
    if (session.balance < validBet) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    // 4. Optionally update client seed
    if (clientSeed && typeof clientSeed === 'string' && clientSeed.trim()) {
      session.clientSeed = clientSeed.trim().slice(0, 64);
    }

    // 5. Increment nonce
    session.nonce++;

    // 6. Deduct bet
    const balanceBefore = session.balance;
    session.balance = parseFloat((session.balance - validBet).toFixed(2));

    // 7. Generate spin result via provably-fair RNG
    const grid = _rng.generateSpinResult(session.serverSeed, session.clientSeed, session.nonce);

    // 8. Evaluate wins
    const evalResult = _evaluator.evaluate(grid, validBet);

    // 9. Apply winnings
    let balanceAfter = session.balance;
    if (evalResult.totalWin > 0 && !evalResult.bonusTriggered) {
      balanceAfter = parseFloat((session.balance + evalResult.totalWin).toFixed(2));
      session.balance = balanceAfter;
    }

    // 10. Build response
    const timestamp = new Date().toISOString();

    const spinRecord = {
      id:             `${sessionId}_${session.nonce}`,
      timestamp,
      type:           evalResult.bonusTriggered ? 'BONUS_TRIGGER' : 'SPIN',
      bet:            validBet,
      grid,
      wins:           evalResult.wins,
      bonusTriggered: evalResult.bonusTriggered,
      bonusPositions: evalResult.bonusPositions,
      totalWin:       evalResult.bonusTriggered ? 0 : evalResult.totalWin,
      balanceBefore,
      balanceAfter,
      nonce:          session.nonce,
      serverSeedHash: session.serverSeedHash,
      clientSeed:     session.clientSeed,
    };

    sessionManager.pushHistory(session, spinRecord);

    // If bonus triggered, don't apply win yet — wait for pick
    if (evalResult.bonusTriggered) {
      // Pre-generate gift multipliers so they're ready for when the player picks
      const giftData = _rng.generateGiftMultipliers(
        session.serverSeed, session.clientSeed, session.nonce
      );
      session._pendingBonus = {
        nonce:       session.nonce,
        bet:         validBet,
        multipliers: giftData.multipliers,
        winIndex:    giftData.winIndex,
        balanceBefore,
      };
    }

    const display = buildGridDisplay(grid);

    return res.json({
      success: true,
      data: {
        spinId:         spinRecord.id,
        timestamp,
        bet:            validBet,
        // ── Readable grid ────────────────────────────────
        gridDisplay:    display.rows,   // structured rows with symbol names
        gridAscii:      display.ascii,  // copy-paste visual in terminal/Postman
        grid,                           // raw [reel][row] IDs (for frontend)
        // ── Results ─────────────────────────────────────
        wins:           evalResult.wins,
        bonusTriggered: evalResult.bonusTriggered,
        bonusPositions: evalResult.bonusPositions,
        totalWin:       evalResult.bonusTriggered ? 0 : evalResult.totalWin,
        // ── Balance ─────────────────────────────────────
        balanceBefore,
        balance:        session.balance,
        currency:       session.currency,
        // ── Provably fair ────────────────────────────────
        nonce:          session.nonce,
        serverSeedHash: session.serverSeedHash,
        clientSeed:     session.clientSeed,
      },
    });
  } catch (err) {
    console.error('[spin] Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/** POST /api/buybonus */
async function buyBonus(req, res) {
  try {
    const { sessionId, bet, clientSeed } = req.body ?? {};

    const session = sessionManager.getSession(sessionId);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found or expired' });

    const validBet = validateBet(bet);
    if (!validBet) return res.status(400).json({ success: false, error: 'Invalid bet amount' });

    const cost = parseFloat((validBet * GameConfig.BUY_BONUS_COST_X).toFixed(2));
    if (session.balance < cost) {
      return res.status(400).json({ success: false, error: 'Insufficient balance for Buy Bonus' });
    }

    if (clientSeed && typeof clientSeed === 'string') {
      session.clientSeed = clientSeed.trim().slice(0, 64);
    }

    session.nonce++;
    const balanceBefore = session.balance;
    session.balance = parseFloat((session.balance - cost).toFixed(2));

    // Force bonus trigger grid
    const grid = _rng.generateBonusTrigger(session.serverSeed, session.clientSeed, session.nonce);
    const evalResult = _evaluator.evaluate(grid, validBet);

    // Pre-generate gift multipliers
    const giftData = _rng.generateGiftMultipliers(session.serverSeed, session.clientSeed, session.nonce);
    session._pendingBonus = {
      nonce:       session.nonce,
      bet:         validBet,
      multipliers: giftData.multipliers,
      winIndex:    giftData.winIndex,
      balanceBefore,
    };

    const spinRecord = {
      id:             `${sessionId}_${session.nonce}`,
      timestamp:      new Date().toISOString(),
      type:           'BUY_BONUS',
      bet:            cost,
      grid,
      wins:           [],
      bonusTriggered: true,
      bonusPositions: evalResult.bonusPositions,
      totalWin:       0,
      balanceBefore,
      balanceAfter:   session.balance,
      nonce:          session.nonce,
      serverSeedHash: session.serverSeedHash,
      clientSeed:     session.clientSeed,
    };
    sessionManager.pushHistory(session, spinRecord);

    const display = buildGridDisplay(grid);

    return res.json({
      success: true,
      data: {
        spinId:         spinRecord.id,
        timestamp:      spinRecord.timestamp,
        type:           'BUY_BONUS',
        cost,
        // ── Readable grid ────────────────────────────────
        gridDisplay:    display.rows,
        gridAscii:      display.ascii,
        grid,
        // ── Results ─────────────────────────────────────
        bonusTriggered: true,
        bonusPositions: evalResult.bonusPositions,
        // ── Balance ─────────────────────────────────────
        balanceBefore,
        balance:        session.balance,
        currency:       session.currency,
        // ── Provably fair ────────────────────────────────
        nonce:          session.nonce,
        serverSeedHash: session.serverSeedHash,
      },
    });
  } catch (err) {
    console.error('[buyBonus] Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/** POST /api/bonus/pick */
async function bonusPick(req, res) {
  try {
    const { sessionId, giftIndex } = req.body ?? {};

    const session = sessionManager.getSession(sessionId);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found or expired' });

    const pending = session._pendingBonus;
    if (!pending) return res.status(400).json({ success: false, error: 'No active bonus round' });

    const idx = parseInt(giftIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= GameConfig.BONUS_GIFT_COUNT) {
      return res.status(400).json({ success: false, error: `Invalid gift index. Must be 0–${GameConfig.BONUS_GIFT_COUNT - 1}` });
    }

    // The win multiplier is whatever the player picked
    // winIndex is which box "the server decided" is the jackpot
    // For simplicity: the picked box gives its multiplier directly
    const pickedMultiplier = pending.multipliers[idx];
    const winAmount = parseFloat((pickedMultiplier * pending.bet).toFixed(2));

    session.balance = parseFloat((session.balance + winAmount).toFixed(2));

    // Clear pending bonus
    const bonusNonce = pending.nonce;
    delete session._pendingBonus;

    const record = {
      id:            `${sessionId}_bonus_${bonusNonce}`,
      timestamp:     new Date().toISOString(),
      type:          'BONUS_PICK',
      bet:           pending.bet,
      giftIndex:     idx,
      multipliers:   pending.multipliers,
      winIndex:      pending.winIndex,
      multiplier:    pickedMultiplier,
      totalWin:      winAmount,
      balanceBefore: pending.balanceBefore,
      balanceAfter:  session.balance,
    };
    sessionManager.pushHistory(session, record);

    return res.json({
      success: true,
      data: {
        giftIndex:   idx,
        multipliers: pending.multipliers,     // reveal all boxes after pick
        winIndex:    pending.winIndex,         // which was the "true" jackpot box
        multiplier:  pickedMultiplier,
        totalWin:    winAmount,
        balance:     session.balance,
        currency:    session.currency,
      },
    });
  } catch (err) {
    console.error('[bonusPick] Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/** POST /api/seed/rotate */
async function rotateSeed(req, res) {
  try {
    const { sessionId } = req.body ?? {};
    const session = sessionManager.getSession(sessionId);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    const revealedSeed = session.serverSeed;
    sessionManager.rotateSeeds(sessionId);

    return res.json({
      success: true,
      data: {
        revealedServerSeed:    revealedSeed,   // Now reveal the secret
        newServerSeedHash:     session.serverSeedHash,
        nextServerSeedHash:    session.nextServerSeedHash,
        clientSeed:            session.clientSeed,
        nonce:                 session.nonce,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/** POST /api/seed/client */
async function setClientSeed(req, res) {
  try {
    const { sessionId, clientSeed } = req.body ?? {};
    const session = sessionManager.getSession(sessionId);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    if (!clientSeed || typeof clientSeed !== 'string' || !clientSeed.trim()) {
      return res.status(400).json({ success: false, error: 'Invalid client seed' });
    }

    session.clientSeed = clientSeed.trim().slice(0, 64);

    return res.json({
      success: true,
      data: {
        clientSeed:     session.clientSeed,
        serverSeedHash: session.serverSeedHash,
        nonce:          session.nonce,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/** GET /api/history/:sessionId */
async function getHistory(req, res) {
  try {
    const session = sessionManager.getSession(req.params.sessionId);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    const page    = Math.max(1, parseInt(req.query.page)  || 1);
    const perPage = Math.min(50, parseInt(req.query.limit) || 20);
    const start   = (page - 1) * perPage;
    const slice   = session.history.slice(start, start + perPage);

    return res.json({
      success: true,
      data: {
        records:  slice,
        total:    session.history.length,
        page,
        perPage,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/** GET /api/paytable */
async function getPaytable(req, res) {
  const bet = parseFloat(req.query.bet) || GameConfig.DEFAULT_BET;
  const table = Object.values(SYMBOL_CONFIG).map(sym => ({
    id:        sym.id,
    name:      sym.name,
    label:     sym.label,
    payout3:   sym.payout3,
    winAmount: sym.isBonus ? 'BONUS' : parseFloat((sym.payout3 * bet).toFixed(2)),
    isBonus:   sym.isBonus,
    weight:    sym.weight,
  }));

  return res.json({
    success: true,
    data: {
      bet,
      symbols:  table,
      paylines: PAYLINES.map(p => ({ id: p.id, name: p.name, positions: p.positions, colorHex: p.colorHex })),
    },
  });
}

/** GET /api/paylines */
async function getPaylines(req, res) {
  return res.json({
    success: true,
    data: PAYLINES.map(p => ({
      id:        p.id,
      name:      p.name,
      positions: p.positions,
      colorHex:  p.colorHex,
    })),
  });
}

/** GET /api/config */
async function getConfig(req, res) {
  return res.json({
    success: true,
    data: {
      reels:          GameConfig.REELS,
      rows:           GameConfig.ROWS,
      betSteps:       GameConfig.BET_STEPS,
      minBet:         GameConfig.MIN_BET,
      maxBet:         GameConfig.MAX_BET,
      defaultBet:     GameConfig.DEFAULT_BET,
      defaultBalance: GameConfig.DEFAULT_BALANCE,
      buyBonusCostX:  GameConfig.BUY_BONUS_COST_X,
      autoplayOptions:GameConfig.AUTOPLAY_OPTIONS,
      rtp:            GameConfig.RTP,
      bonusRtp:       GameConfig.BONUS_RTP,
      volatility:     GameConfig.VOLATILITY,
      bonusGiftCount: GameConfig.BONUS_GIFT_COUNT,
    },
  });
}

module.exports = {
  createSession,
  getSession,
  spin,
  buyBonus,
  bonusPick,
  rotateSeed,
  setClientSeed,
  getHistory,
  getPaytable,
  getPaylines,
  getConfig,
};
