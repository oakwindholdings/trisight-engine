// server/routes/market.js
// Market-data proxy: Massive (Polygon) aggregates served in TwelveData-compatible response shapes,
// so the existing frontend parsers work unchanged. The API key lives HERE, server-side, only —
// the predecessor shipped it in the browser bundle and logged it to the console; both are dead.

const express = require('express');
const router = express.Router();

const MASSIVE_BASE = 'https://api.massive.com';

function requireKey(res) {
  const key = process.env.MASSIVE_API_KEY;
  if (key === undefined || key.length === 0) {
    res.status(503).json({ status: 'error', message: 'market data credential not configured (MASSIVE_API_KEY)' });
    return null;
  }
  return key;
}

// TwelveData interval → Massive (multiplier, timespan)
const INTERVAL_MAP = {
  '1min': [1, 'minute'],
  '5min': [5, 'minute'],
  '15min': [15, 'minute'],
  '30min': [30, 'minute'],
  '1h': [1, 'hour'],
  '4h': [4, 'hour'],
  '1day': [1, 'day'],
  '5day': [1, 'week'], // closest Massive timespan; disclosed mapping
  '1week': [1, 'week'],
  '1month': [1, 'month'],
};

// approximate ms per bar, for outputsize→window derivation (fetch generously, slice exactly)
const INTERVAL_MS = {
  '1min': 60e3, '5min': 300e3, '15min': 900e3, '30min': 1800e3,
  '1h': 3600e3, '4h': 4 * 3600e3, '1day': 86400e3, '5day': 5 * 86400e3,
  '1week': 7 * 86400e3, '1month': 30 * 86400e3,
};

const ET_DATE = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
const ET_TIME = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

// TwelveData-style datetime strings: date-only for daily+, "YYYY-MM-DD HH:mm:ss" (ET) intraday
function tdDatetime(ms, interval) {
  const d = new Date(ms);
  const date = ET_DATE.format(d); // en-CA gives YYYY-MM-DD
  if (interval === '1day' || interval === '5day' || interval === '1week' || interval === '1month') return date;
  return `${date} ${ET_TIME.format(d)}`;
}

function parseEtParam(s, endOfDay) {
  // accepts "YYYY-MM-DD" or "YYYY-MM-DD HH:mm:ss" interpreted as ET (predecessor convention)
  if (s === undefined) return undefined;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?$/);
  if (m === null) return undefined;
  // build an ET timestamp via the offset trick: format a UTC guess back into ET and adjust once
  const [y, mo, da, h, mi, se] = [m[1], m[2], m[3], m[4] ?? (endOfDay ? '23' : '00'), m[5] ?? (endOfDay ? '59' : '00'), m[6] ?? (endOfDay ? '59' : '00')];
  const guess = Date.parse(`${y}-${mo}-${da}T${h}:${mi}:${se}Z`);
  const etRendered = new Date(guess).toLocaleString('en-US', { timeZone: 'America/New_York' });
  const drift = Date.parse(new Date(guess).toLocaleString('en-US')) - Date.parse(etRendered);
  return guess + drift;
}

async function massive(path, key) {
  const res = await fetch(`${MASSIVE_BASE}${path}`, { headers: { Authorization: `Bearer ${key}` } });
  const text = await res.text();
  if (res.status !== 200) {
    // vendor bodies can echo credentials — redact before anything surfaces (ASSAY red-first lesson)
    const safe = text.split(key).join('[REDACTED]').slice(0, 200);
    const err = new Error(`vendor ${res.status}: ${safe}`);
    err.status = res.status;
    throw err;
  }
  return JSON.parse(text);
}

// GET /api/market/time_series?symbol&interval&outputsize | &start_date&end_date
router.get('/time_series', async (req, res) => {
  const key = requireKey(res);
  if (key === null) return;
  try {
    const { symbol, interval = '5min', outputsize, start_date, end_date } = req.query;
    if (!symbol) return res.status(400).json({ status: 'error', message: 'symbol required' });
    const mapped = INTERVAL_MAP[interval];
    if (!mapped) return res.status(400).json({ status: 'error', message: `unsupported interval ${interval}` });
    const [mult, timespan] = mapped;

    let fromMs;
    let toMs;
    if (start_date !== undefined || end_date !== undefined) {
      fromMs = parseEtParam(String(start_date), false);
      toMs = parseEtParam(String(end_date), true);
      if (fromMs === undefined || toMs === undefined) {
        return res.status(400).json({ status: 'error', message: 'bad start_date/end_date' });
      }
    } else {
      const n = Math.min(parseInt(String(outputsize ?? '150'), 10) || 150, 5000);
      toMs = Date.now();
      fromMs = toMs - n * (INTERVAL_MS[interval] ?? 300e3) * 3; // 3x fudge for closed sessions; sliced below
    }

    const path = `/v2/aggs/ticker/${encodeURIComponent(String(symbol))}/range/${mult}/${timespan}/${fromMs}/${toMs}?adjusted=true&sort=desc&limit=50000`;
    const data = await massive(path, key);
    const n = outputsize !== undefined ? (parseInt(String(outputsize), 10) || 150) : undefined;
    const rows = (data.results ?? []).slice(0, n); // desc → newest first, TwelveData convention
    res.json({
      meta: { symbol: String(symbol), interval: String(interval), currency: 'USD', exchange_timezone: 'America/New_York', type: 'Common Stock' },
      values: rows.map((r) => ({
        datetime: tdDatetime(r.t, String(interval)),
        open: String(r.o),
        high: String(r.h),
        low: String(r.l),
        close: String(r.c),
        volume: String(r.v),
      })),
      status: 'ok',
    });
  } catch (e) {
    res.status(e.status === 401 || e.status === 403 ? 502 : 500).json({ status: 'error', message: String(e.message ?? e) });
  }
});

// GET /api/market/symbol_search?symbol=<query>
router.get('/symbol_search', async (req, res) => {
  const key = requireKey(res);
  if (key === null) return;
  try {
    const q = String(req.query.symbol ?? req.query.query ?? '');
    if (q.length === 0) return res.json({ data: [], status: 'ok' });
    const data = await massive(`/v3/reference/tickers?search=${encodeURIComponent(q)}&market=stocks&active=true&limit=20`, key);
    res.json({
      data: (data.results ?? []).map((t) => ({
        symbol: t.ticker,
        instrument_name: t.name,
        exchange: t.primary_exchange ?? '',
        mic_code: t.primary_exchange ?? '',
        exchange_timezone: 'America/New_York',
        instrument_type: t.type ?? 'CS',
        country: t.locale === 'us' ? 'United States' : (t.locale ?? ''),
        currency: t.currency_name ?? 'USD',
      })),
      status: 'ok',
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: String(e.message ?? e) });
  }
});

// GET /api/market/market_state — TwelveData market_state-compatible (array of markets)
router.get('/market_state', async (req, res) => {
  const key = requireKey(res);
  if (key === null) return;
  try {
    const data = await massive('/v1/marketstatus/now', key);
    const isOpen = data.market === 'open';
    res.json([
      {
        name: 'NASDAQ',
        code: 'XNAS',
        country: 'United States',
        is_market_open: isOpen,
        time_after_open: '',
        time_to_open: '',
        time_to_close: '',
      },
    ]);
  } catch (e) {
    res.status(500).json({ status: 'error', message: String(e.message ?? e) });
  }
});

module.exports = router;
