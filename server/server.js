/**
 * server.js – Gift Rush Slot Game Backend
 * ========================================
 * Express HTTP API server providing:
 *  - Provably-fair spin results (HMAC-SHA256)
 *  - Full payline evaluation (all 5 lines)
 *  - Balance management per session
 *  - Buy Bonus feature
 *  - Bonus pick game
 *  - Spin history
 *  - Paytable & config endpoints
 *
 * Usage:
 *   node server.js
 *   PORT=4000 node server.js
 */

'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { sessionManager } = require('./engine/sessionManager');
const routes = require('./routes/routes');
const {
  spinLimiter,
  sessionLimiter,
  requestLogger,
  errorHandler,
} = require('./middleware/middleware');
const { purgeExpired } = require('./engine/sessionManager');

// ── App setup ───────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,  // Required for game assets
  contentSecurityPolicy: false,
}));

// CORS – allow the Vite dev server (localhost:5173) and production origin
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_ORIGIN,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, same-origin, Postman, curl, Render)
    if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.includes('onrender.com') || process.env.NODE_ENV === 'production') return cb(null, true);
    cb(null, true); // Permissive fallback for production web clients
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// Request logging
app.use(requestLogger);

// ── Apply rate limits to hot paths ──────────────────────────
app.use('/api/session/create', sessionLimiter);
app.use('/api/spin', spinLimiter);
app.use('/api/buybonus', spinLimiter);

// ── Mount API routes ────────────────────────────────────────
app.use('/api', routes);

// ── Static Frontend Build (if compiled) ─────────────────────
const path = require('path');
const fs = require('fs');
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// ── Health check ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Gift Rush Slot Server',
    time: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── Root SPA / API info ─────────────────────────────────────
app.get('/', (req, res, next) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.json({
    name: 'Gift Rush Slot Game API',
    version: '1.0.0',
    endpoints: {
      'POST /api/session/create': 'Start a new game session',
      'GET  /api/session/:id': 'Get session info',
      'POST /api/spin': 'Execute a spin',
      'POST /api/buybonus': 'Buy Bonus spin',
      'POST /api/bonus/pick': 'Pick a gift in bonus round',
      'POST /api/seed/rotate': 'Reveal server seed & rotate',
      'POST /api/seed/client': 'Set custom client seed',
      'GET  /api/history/:sessionId': 'Spin history',
      'GET  /api/paytable': 'Symbol payouts',
      'GET  /api/paylines': 'Payline definitions',
      'GET  /api/config': 'Game configuration',
      'GET  /health': 'Server health check',
    },
  });
});

// ── SPA Fallback for any other page routes ─────────────────
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

// ── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.path}` });
});

// ── Error handler ───────────────────────────────────────────
app.use(errorHandler);

// ── Periodic cleanup of expired sessions ────────────────────
setInterval(purgeExpired, 5 * 60 * 1000); // Every 5 minutes

// ── Start listening ─────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log('\x1b[36m');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║        🎰 Gift Rush Slot Game Server 🎰      ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('\x1b[0m');
  console.log(`\x1b[32m✓ Server running at http://localhost:${PORT}\x1b[0m`);
  console.log(`\x1b[32m✓ API base:        http://localhost:${PORT}/api\x1b[0m`);
  console.log(`\x1b[32m✓ Health check:    http://localhost:${PORT}/health\x1b[0m`);
  console.log(`\x1b[33m  Allowed origins: ${ALLOWED_ORIGINS.join(', ')}\x1b[0m`);
  console.log('');
});

// ── Graceful error handling ─────────────────────────────────
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\x1b[31m\n✗ Port ${PORT} is already in use!\x1b[0m`);
    console.error('\x1b[33m  To fix, run this command:\x1b[0m');
    console.error(`\x1b[36m  netstat -ano | findstr :${PORT}\x1b[0m`);
    console.error(`\x1b[36m  taskkill /PID <PID_NUMBER> /F\x1b[0m`);
    console.error(`\x1b[33m  Or use a different port:\x1b[0m`);
    console.error(`\x1b[36m  set PORT=3002 && node server.js\x1b[0m\n`);
  } else {
    console.error('\x1b[31m[SERVER ERROR]\x1b[0m', err.message);
  }
  process.exit(1);
});

module.exports = app;

