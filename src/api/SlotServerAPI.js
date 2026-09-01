/**
 * SlotServerAPI.js – Frontend client for the Gift Rush slot game backend.
 *
 * Usage:
 *   import { SlotServerAPI } from './SlotServerAPI.js';
 *   const api = new SlotServerAPI('http://localhost:3001');
 *   const session = await api.createSession();
 *   const spin    = await api.spin(session.sessionId, 0.10);
 */

const DEFAULT_BASE_URL = import.meta.env?.VITE_SERVER_URL ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

export class SlotServerAPI {
  /**
   * @param {string} [baseUrl]  Server base URL (e.g. 'http://localhost:3001')
   */
  constructor(baseUrl = DEFAULT_BASE_URL) {
    this._base = baseUrl.replace(/\/$/, '');
    this._sessionId = null;
  }

  // ── Session ────────────────────────────────────────────────

  /**
   * Create a new session on the server.
   * @param {number} [startingBalance]
   * @returns {Promise<SessionData>}
   */
  async createSession(startingBalance) {
    const data = await this._post('/api/session/create', { startingBalance });
    this._sessionId = data.sessionId;
    return data;
  }

  /**
   * Resume an existing session by ID.
   * @param {string} sessionId
   * @returns {Promise<SessionData>}
   */
  async resumeSession(sessionId) {
    const data = await this._get(`/api/session/${sessionId}`);
    this._sessionId = sessionId;
    return data;
  }

  // ── Core Game ──────────────────────────────────────────────

  /**
   * Execute a regular spin.
   * @param {string} sessionId
   * @param {number} bet
   * @param {string} [clientSeed]  Optional custom client seed
   * @returns {Promise<SpinResult>}
   */
  async spin(sessionId, bet, clientSeed) {
    return this._post('/api/spin', { sessionId, bet, clientSeed });
  }

  /**
   * Execute a Buy Bonus spin (forces bonus trigger).
   * @param {string} sessionId
   * @param {number} bet
   * @returns {Promise<SpinResult>}
   */
  async buyBonus(sessionId, bet) {
    return this._post('/api/buybonus', { sessionId, bet });
  }

  /**
   * Pick a gift box in the bonus round.
   * @param {string} sessionId
   * @param {number} giftIndex  0–4
   * @returns {Promise<BonusPickResult>}
   */
  async bonusPick(sessionId, giftIndex) {
    return this._post('/api/bonus/pick', { sessionId, giftIndex });
  }

  // ── Provably Fair ──────────────────────────────────────────

  /**
   * Rotate server seeds (reveals current seed).
   * @param {string} sessionId
   * @returns {Promise<SeedRotateResult>}
   */
  async rotateSeed(sessionId) {
    return this._post('/api/seed/rotate', { sessionId });
  }

  /**
   * Set a custom client seed.
   * @param {string} sessionId
   * @param {string} clientSeed
   * @returns {Promise<{clientSeed: string}>}
   */
  async setClientSeed(sessionId, clientSeed) {
    return this._post('/api/seed/client', { sessionId, clientSeed });
  }

  // ── Info ───────────────────────────────────────────────────

  /**
   * Get spin history for a session.
   * @param {string} sessionId
   * @param {number} [page=1]
   * @param {number} [limit=20]
   * @returns {Promise<HistoryResult>}
   */
  async getHistory(sessionId, page = 1, limit = 20) {
    return this._get(`/api/history/${sessionId}?page=${page}&limit=${limit}`);
  }

  /**
   * Get the paytable for a given bet amount.
   * @param {number} [bet=0.10]
   * @returns {Promise<PaytableResult>}
   */
  async getPaytable(bet = 0.10) {
    return this._get(`/api/paytable?bet=${bet}`);
  }

  /** Get all payline definitions. */
  async getPaylines() {
    return this._get('/api/paylines');
  }

  /** Get game configuration (bet steps, RTP, etc.). */
  async getConfig() {
    return this._get('/api/config');
  }

  /** Ping the server. */
  async healthCheck() {
    return this._get('/health');
  }

  // ── Private helpers ────────────────────────────────────────

  async _post(path, body) {
    const res = await fetch(`${this._base}${path}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Server error');
    return json.data;
  }

  async _get(path) {
    const res  = await fetch(`${this._base}${path}`);
    const json = await res.json();
    if (!json.success && json.status !== 'ok') throw new Error(json.error ?? 'Server error');
    return json.data ?? json;
  }
}

/**
 * @typedef {Object} SessionData
 * @property {string} sessionId
 * @property {number} balance
 * @property {string} currency
 * @property {string} serverSeedHash
 * @property {string} nextServerSeedHash
 * @property {string} clientSeed
 * @property {number} nonce
 */

/**
 * @typedef {Object} SpinResult
 * @property {string}     spinId
 * @property {string}     timestamp
 * @property {number[][]} grid               [reel][row] → symbolId
 * @property {WinEntry[]} wins
 * @property {boolean}    bonusTriggered
 * @property {number[][]} bonusPositions
 * @property {number}     totalWin
 * @property {number}     balance
 * @property {string}     currency
 * @property {number}     nonce
 * @property {string}     serverSeedHash
 * @property {string}     clientSeed
 */

/**
 * @typedef {Object} WinEntry
 * @property {number}     paylineId
 * @property {string}     paylineName
 * @property {number}     symbolId
 * @property {string}     symbolName
 * @property {number}     multiplier
 * @property {number}     amount
 * @property {number[][]} positions
 * @property {number}     color
 * @property {string}     colorHex
 */
