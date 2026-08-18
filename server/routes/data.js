// server/routes/data.js
// Browser-facing data API over Postgres — replaces every direct-from-browser Supabase call.
// Scoped endpoints per domain (no generic table access from the browser); parameterized SQL via db().

const express = require('express');
const { db, rpc } = require('../db');
const router = express.Router();

function send(res, out, status = 200) {
  if (out.error) return res.status(out.error.code === 'PGRST116' ? 404 : 500).json({ error: out.error.message });
  return res.status(status).json({ data: out.data });
}

// ---- pattern feedback ----
router.post('/feedback', async (req, res) => {
  send(res, await db('pattern_feedback').insert(req.body).select(), 201);
});
router.patch('/feedback/:id', async (req, res) => {
  send(res, await db('pattern_feedback').update(req.body).eq('id', req.params.id));
});
router.get('/feedback', async (req, res) => {
  let q = db('pattern_feedback').select('*');
  if (req.query.pattern_id) q = q.eq('pattern_id', String(req.query.pattern_id));
  if (req.query.symbol) q = q.eq('symbol', String(req.query.symbol));
  if (req.query.consented === '1') q = q.eq('consent_given', true);
  if (req.query.from) q = q.gte('created_at', String(req.query.from));
  if (req.query.to) q = q.lte('created_at', String(req.query.to));
  send(res, await q.order('created_at', { ascending: false }).limit(parseInt(String(req.query.limit ?? '500'), 10)));
});
router.get('/feedback-summary', async (req, res) => {
  send(res, await rpc('get_pattern_feedback_summary', { p_pattern_id: String(req.query.pattern_id ?? '') }));
});

// ---- pattern feed (polling replaces the old realtime channel) ----
router.post('/feed', async (req, res) => {
  send(res, await db('pattern_feed').insert(req.body).select(), 201);
});
router.patch('/feed/:id', async (req, res) => {
  send(res, await db('pattern_feed').update(req.body).eq('id', req.params.id));
});
router.get('/feed/recent', async (req, res) => {
  let q = db('pattern_feed').select('*');
  if (req.query.since) q = q.gte('created_at', String(req.query.since));
  send(res, await q.order('created_at', { ascending: false }).limit(parseInt(String(req.query.limit ?? '100'), 10)));
});

// ---- report audit metadata (written non-critically by the enhanced-report orchestrator) ----
router.post('/report-metadata', async (req, res) => {
  send(res, await db('report_metadata').insert(req.body).select(), 201);
});

// ---- privacy consent ----
router.post('/consent', async (req, res) => {
  send(res, await db('privacy_consent').upsert(req.body, { onConflict: 'session_id' }).select(), 201);
});

// ---- market-data cache (ohlcv + status + pattern cache) ----
router.get('/ohlcv', async (req, res) => {
  const { symbol, interval, start, end } = req.query;
  if (!symbol || !interval) return res.status(400).json({ error: 'symbol and interval required' });
  let q = db('ohlcv_data').select('*').eq('symbol', String(symbol).toUpperCase()).eq('interval', String(interval));
  if (start) q = q.gte('timestamp', String(start));
  if (end) q = q.lte('timestamp', String(end));
  send(res, await q.order('timestamp', { ascending: true }).limit(20000));
});
router.post('/ohlcv/batch', async (req, res) => {
  const rows = Array.isArray(req.body) ? req.body : [];
  if (rows.length === 0) return res.json({ data: [] });
  send(res, await db('ohlcv_data').upsert(rows, { onConflict: 'symbol,interval,timestamp' }).select(), 201);
});
router.get('/cache-status', async (req, res) => {
  const { symbol, interval } = req.query;
  if (!symbol || !interval) return res.status(400).json({ error: 'symbol and interval required' });
  send(res, await db('api_cache_status').select('*').eq('symbol', String(symbol).toUpperCase()).eq('interval', String(interval)).maybeSingle());
});
router.post('/cache-status', async (req, res) => {
  send(res, await db('api_cache_status').upsert(req.body, { onConflict: 'symbol,interval' }).select(), 201);
});
router.get('/cached-symbols', async (req, res) => {
  // distinct symbols across the cache-status table (fills the getCachedSymbols contract gap)
  const out = await db('api_cache_status').select('symbol').order('symbol');
  if (out.error) return res.status(500).json({ error: out.error.message });
  res.json({ data: [...new Set(out.data.map((r) => r.symbol))] });
});
router.delete('/cache/:symbol', async (req, res) => {
  const sym = req.params.symbol.toUpperCase();
  const a = await db('ohlcv_data').delete().eq('symbol', sym);
  const b = await db('api_cache_status').delete().eq('symbol', sym);
  const c = await db('pattern_cache').delete().eq('symbol', sym);
  const err = a.error ?? b.error ?? c.error;
  if (err) return res.status(500).json({ error: err.message });
  res.json({ data: { deleted: { ohlcv: a.data.length, status: b.data.length, patterns: c.data.length } } });
});

module.exports = router;
