// server/routes/review.js
// Dick's input-review API: serves the sealed review data and captures per-element
// feedback (append-only). Gated by a shared access code so the review isn't public.

const express = require('express');
const fs = require('fs');
const path = require('path');
const { db } = require('../db');
const router = express.Router();

const DATA_PATH = path.join(__dirname, '..', '..', 'assay', 'reports', 'review', 'review-data.json');

function requireCode(req, res, next) {
  const expected = process.env.REVIEW_ACCESS_CODE;
  if (!expected) {
    // No code configured: allow in dev, refuse loudly in production (never silently public)
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ error: 'review access code not configured on the server' });
    }
    return next();
  }
  const got = req.get('x-review-code') || req.query.code;
  if (got !== expected) return res.status(401).json({ error: 'access code required' });
  next();
}

router.get('/data', requireCode, (req, res) => {
  try {
    res.json(JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')));
  } catch (e) {
    res.status(500).json({ error: `review data unavailable: ${e.message}` });
  }
});

// Latest answer per (strategy, element) + total history count
router.get('/feedback', requireCode, async (req, res) => {
  let q = db('input_review_feedback').select('*');
  if (req.query.strategy) q = q.eq('strategy', String(req.query.strategy));
  const out = await q.order('created_at', { ascending: false }).limit(5000);
  if (out.error) return res.status(500).json({ error: out.error.message });
  const latest = {};
  for (const row of out.data) {
    const key = `${row.strategy}::${row.element_id}`;
    if (!latest[key]) latest[key] = { ...row, history_count: 0 };
    latest[key].history_count += 1;
  }
  res.json({ data: Object.values(latest) });
});

router.post('/feedback', requireCode, async (req, res) => {
  const { strategy, element_id, decision, correction_text, guidance_text, reviewer } = req.body || {};
  if (!strategy || !element_id || !['confirmed', 'correction'].includes(decision)) {
    return res.status(400).json({ error: 'strategy, element_id, and decision (confirmed|correction) required' });
  }
  const out = await db('input_review_feedback').insert({
    strategy, element_id, decision,
    correction_text: correction_text || null,
    guidance_text: guidance_text || null,
    reviewer: reviewer || "Dick O'Leary",
  }).select();
  if (out.error) return res.status(500).json({ error: out.error.message });
  res.status(201).json({ data: out.data });
});

// Export everything for Bob (all history, ordered)
router.get('/export', requireCode, async (req, res) => {
  const out = await db('input_review_feedback').select('*').order('created_at', { ascending: true }).limit(10000);
  if (out.error) return res.status(500).json({ error: out.error.message });
  res.json({ data: out.data });
});

module.exports = router;
