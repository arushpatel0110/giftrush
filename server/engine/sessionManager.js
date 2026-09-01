/**
 * sessionManager.js – In-memory player session store.
 *
 * Each session tracks:
 *  - balance
 *  - server seed (current + next for rotation)
 *  - client seed
 *  - nonce (incremented per spin)
 *  - spin history
 *
 * In production, replace the in-memory Map with Redis or a database.
 */

const crypto    = require('crypto');
const { GameConfig } = require('../config/gameConfig');
const { RNGEngine }  = require('../engine/rng');

const _rng      = new RNGEngine();
const _sessions = new Map();  // sessionId → SessionData

/**
 * Create or resume a session.
 * @param {string} [sessionId]  Existing session ID (optional)
 * @returns {SessionData}
 */
function createSession(sessionId = null, startingBalance = GameConfig.DEFAULT_BALANCE) {
  if (sessionId && _sessions.has(sessionId)) {
    const existing = _sessions.get(sessionId);
    // Renew expiry on access
    existing.expiresAt = Date.now() + GameConfig.SESSION_EXPIRY_MS;
    return existing;
  }

  const newId     = crypto.randomUUID();
  const { serverSeed, serverSeedHash } = _rng.generateServerSeed();
  // Pre-generate next server seed so we can reveal current on request
  const next      = _rng.generateServerSeed();

  const session = {
    id:              newId,
    balance:         startingBalance,
    currency:        'FUN',

    // Provably-fair seeds
    serverSeed,
    serverSeedHash,
    nextServerSeed:  next.serverSeed,
    nextServerSeedHash: next.serverSeedHash,
    clientSeed:      crypto.randomBytes(16).toString('hex'),
    nonce:           0,

    // History (last 100 spins)
    history:         [],
    createdAt:       Date.now(),
    expiresAt:       Date.now() + GameConfig.SESSION_EXPIRY_MS,
  };

  _sessions.set(newId, session);
  return session;
}

/**
 * Retrieve a session by ID.
 * @param {string} sessionId
 * @returns {SessionData | null}
 */
function getSession(sessionId) {
  const session = _sessions.get(sessionId);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    _sessions.delete(sessionId);
    return null;
  }
  session.expiresAt = Date.now() + GameConfig.SESSION_EXPIRY_MS;
  return session;
}

/**
 * Rotate server seeds (called after revealing the current seed).
 * @param {string} sessionId
 * @returns {SessionData}
 */
function rotateSeeds(sessionId) {
  const session = getSession(sessionId);
  if (!session) throw new Error('Session not found');

  session.serverSeed     = session.nextServerSeed;
  session.serverSeedHash = session.nextServerSeedHash;

  const next = _rng.generateServerSeed();
  session.nextServerSeed     = next.serverSeed;
  session.nextServerSeedHash = next.serverSeedHash;
  session.nonce              = 0;
  session.clientSeed         = crypto.randomBytes(16).toString('hex');

  return session;
}

/**
 * Push a record into session history (cap at 200).
 */
function pushHistory(session, record) {
  session.history.unshift(record);
  if (session.history.length > 200) session.history.pop();
}

/** Cleanup expired sessions (call on an interval). */
function purgeExpired() {
  const now = Date.now();
  for (const [id, session] of _sessions.entries()) {
    if (now > session.expiresAt) {
      _sessions.delete(id);
    }
  }
}

module.exports = { createSession, getSession, rotateSeeds, pushHistory, purgeExpired };

/**
 * @typedef {Object} SessionData
 * @property {string}   id
 * @property {number}   balance
 * @property {string}   currency
 * @property {string}   serverSeed
 * @property {string}   serverSeedHash
 * @property {string}   nextServerSeedHash
 * @property {string}   clientSeed
 * @property {number}   nonce
 * @property {Array}    history
 * @property {number}   createdAt
 * @property {number}   expiresAt
 */
