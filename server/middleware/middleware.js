/**
 * middleware.js – Express middleware stack for the Gift Rush slot server.
 */

const rateLimit = require('express-rate-limit');

// ── Rate limiter: max 120 spins/min per IP ───────────────────
const spinLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      120,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, error: 'Too many requests, slow down.' },
});

// ── Rate limiter: session creation (5/min per IP) ────────────
const sessionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      5,
  message: { success: false, error: 'Too many sessions created.' },
});

// ── Request logger ───────────────────────────────────────────
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms   = Date.now() - start;
    const code = res.statusCode;
    const color = code >= 500 ? '\x1b[31m' : code >= 400 ? '\x1b[33m' : '\x1b[32m';
    console.log(`${color}[${new Date().toISOString()}] ${req.method} ${req.path} → ${code} (${ms}ms)\x1b[0m`);
  });
  next();
}

// ── Error handler ────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.stack ?? err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
}

module.exports = { spinLimiter, sessionLimiter, requestLogger, errorHandler };
