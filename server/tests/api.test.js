/**
 * api.test.js – Basic integration test for the Gift Rush slot API.
 * Run with: node tests/api.test.js
 *
 * Requires the server to be running on localhost:3001
 */

'use strict';

const http = require('http');

const BASE = 'http://localhost:3001/api';
let passed = 0;
let failed = 0;

// ── Mini HTTP client ─────────────────────────────────────────

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url  = new URL(BASE + path);
    const opts = {
      hostname: url.hostname,
      port:     url.port || 80,
      path:     url.pathname + url.search,
      method,
      headers:  { 'Content-Type': 'application/json' },
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── Assertion helpers ────────────────────────────────────────

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  \x1b[32m✓\x1b[0m ${label}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✗\x1b[0m ${label} ${detail}`);
    failed++;
  }
}

// ── Tests ────────────────────────────────────────────────────

async function runTests() {
  console.log('\n\x1b[36m🎰 Gift Rush Server – API Integration Tests\x1b[0m\n');

  // ── 1. Health check ─────────────────────────────────────────
  console.log('\x1b[33mHealth Check\x1b[0m');
  {
    const res = await request('GET', '/../../health');
    const r2  = await fetch('http://localhost:3001/health').then(r => r.json());
    assert('Server is up', r2.status === 'ok');
  }

  // ── 2. Config ───────────────────────────────────────────────
  console.log('\n\x1b[33mConfig\x1b[0m');
  {
    const res = await request('GET', '/config');
    assert('GET /config returns success',  res.body.success);
    assert('Config has betSteps',          Array.isArray(res.body.data?.betSteps));
    assert('Config has reels = 3',         res.body.data?.reels === 3);
    assert('Config has rows = 3',          res.body.data?.rows  === 3);
  }

  // ── 3. Paytable ──────────────────────────────────────────────
  console.log('\n\x1b[33mPaytable\x1b[0m');
  {
    const res = await request('GET', '/paytable?bet=1.00');
    assert('GET /paytable returns success', res.body.success);
    assert('Has 9 symbols',  res.body.data?.symbols?.length === 9);
    assert('Has paylines',   res.body.data?.paylines?.length === 5);
  }

  // ── 4. Paylines ──────────────────────────────────────────────
  console.log('\n\x1b[33mPaylines\x1b[0m');
  {
    const res = await request('GET', '/paylines');
    assert('GET /paylines returns 5 paylines', res.body.data?.length === 5);
  }

  // ── 5. Session creation ──────────────────────────────────────
  console.log('\n\x1b[33mSession\x1b[0m');
  let sessionId;
  {
    const res = await request('POST', '/session/create', { startingBalance: 500 });
    assert('POST /session/create → 201',    res.status === 201);
    assert('Has sessionId',                  !!res.body.data?.sessionId);
    assert('Balance = 500',                  res.body.data?.balance === 500);
    assert('Has serverSeedHash',             !!res.body.data?.serverSeedHash);
    sessionId = res.body.data?.sessionId;
  }

  // GET session
  {
    const res = await request('GET', `/session/${sessionId}`);
    assert('GET /session/:id → 200',        res.status === 200);
    assert('Balance matches',               res.body.data?.balance === 500);
  }

  // ── 6. Spin ──────────────────────────────────────────────────
  console.log('\n\x1b[33mSpin\x1b[0m');
  let lastGrid;
  for (let i = 0; i < 5; i++) {
    const res = await request('POST', '/spin', { sessionId, bet: 0.10 });
    assert(`Spin ${i + 1}: success`,          res.body.success === true, JSON.stringify(res.body));
    assert(`Spin ${i + 1}: has 3×3 grid`,     res.body.data?.grid?.length === 3);
    assert(`Spin ${i + 1}: balance updated`,  typeof res.body.data?.balance === 'number');
    lastGrid = res.body.data?.grid;
  }

  // Invalid bet
  {
    const res = await request('POST', '/spin', { sessionId, bet: 0.99 });
    assert('Invalid bet → 400', res.status === 400);
  }

  // ── 7. Win evaluation on forced bonus ────────────────────────
  console.log('\n\x1b[33mBuy Bonus\x1b[0m');
  {
    const res = await request('POST', '/buybonus', { sessionId, bet: 0.10 });
    assert('POST /buybonus → success',     res.body.success === true, JSON.stringify(res.body.error));
    assert('bonusTriggered = true',        res.body.data?.bonusTriggered === true);

    // Pick a gift
    const pickRes = await request('POST', '/bonus/pick', { sessionId, giftIndex: 2 });
    assert('POST /bonus/pick → success',   pickRes.body.success === true);
    assert('Has multiplier',               typeof pickRes.body.data?.multiplier === 'number');
    assert('Has totalWin',                 typeof pickRes.body.data?.totalWin   === 'number');
    assert('Reveals all multipliers',      Array.isArray(pickRes.body.data?.multipliers));
  }

  // ── 8. Seed operations ───────────────────────────────────────
  console.log('\n\x1b[33mSeed Rotation\x1b[0m');
  {
    const res = await request('POST', '/seed/rotate', { sessionId });
    assert('POST /seed/rotate → success',  res.body.success);
    assert('Reveals serverSeed',           typeof res.body.data?.revealedServerSeed === 'string');
    assert('Seed is 64 hex chars',         res.body.data?.revealedServerSeed?.length === 64);
  }

  // Client seed
  {
    const res = await request('POST', '/seed/client', { sessionId, clientSeed: 'my-lucky-seed-12345' });
    assert('POST /seed/client → success',  res.body.success);
    assert('New client seed saved',        res.body.data?.clientSeed === 'my-lucky-seed-12345');
  }

  // ── 9. History ───────────────────────────────────────────────
  console.log('\n\x1b[33mHistory\x1b[0m');
  {
    const res = await request('GET', `/history/${sessionId}?page=1&limit=10`);
    assert('GET /history → success',       res.body.success);
    assert('Has records array',            Array.isArray(res.body.data?.records));
    assert('Has total count',              typeof res.body.data?.total === 'number');
  }

  // ── Summary ──────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  const total = passed + failed;
  console.log(`\x1b[36mResults: ${passed}/${total} passed\x1b[0m`);
  if (failed > 0) {
    console.log(`\x1b[31m${failed} test(s) FAILED\x1b[0m`);
    process.exit(1);
  } else {
    console.log('\x1b[32mAll tests passed! 🎉\x1b[0m');
  }
}

runTests().catch(err => {
  console.error('\x1b[31m[FATAL] Test runner crashed:\x1b[0m', err.message);
  process.exit(1);
});
