/**
 * routes.js – Express router – mounts all slot API endpoints.
 */

const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/slotController');

// ── Session ───────────────────────────────────────────────────
router.post('/session/create',    ctrl.createSession);
router.get('/session/:id',        ctrl.getSession);

// ── Core Game ─────────────────────────────────────────────────
router.post('/spin',              ctrl.spin);
router.post('/buybonus',          ctrl.buyBonus);
router.post('/bonus/pick',        ctrl.bonusPick);

// ── Provably Fair ─────────────────────────────────────────────
router.post('/seed/rotate',       ctrl.rotateSeed);
router.post('/seed/client',       ctrl.setClientSeed);

// ── Info & History ────────────────────────────────────────────
router.get('/history/:sessionId', ctrl.getHistory);
router.get('/paytable',           ctrl.getPaytable);
router.get('/paylines',           ctrl.getPaylines);
router.get('/config',             ctrl.getConfig);

module.exports = router;
