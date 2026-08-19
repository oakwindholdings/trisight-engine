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

// ---- Dialog layer: threaded per-element Q&A (round 2 of the review) ----

function isAdmin(req) {
  const admin = process.env.REVIEW_ADMIN_CODE;
  return Boolean(admin) && req.get('x-review-admin') === admin;
}

// Full dialog, grouped client-side; owner and assay both read everything
router.get('/dialog', requireCode, async (req, res) => {
  let q = db('input_review_dialog').select('*');
  if (req.query.strategy) q = q.eq('strategy', String(req.query.strategy));
  const out = await q.order('created_at', { ascending: true }).limit(10000);
  if (out.error) return res.status(500).json({ error: out.error.message });
  res.json({ data: out.data });
});

// Post to a thread. The server stamps the author from the credential used:
// the admin header makes it 'assay' (question/evidence/note); otherwise it is
// an 'owner' answer — the browser can never impersonate the study.
router.post('/dialog', requireCode, async (req, res) => {
  const { strategy, element_id, question_id, kind, body, evidence_json, options_json } = req.body || {};
  if (!strategy || !element_id || !body) {
    return res.status(400).json({ error: 'strategy, element_id, and body required' });
  }
  const admin = isAdmin(req);
  const row = {
    strategy, element_id,
    question_id: question_id || null,
    author: admin ? 'assay' : 'owner',
    kind: admin ? (kind || 'question') : 'answer',
    body,
    evidence_json: admin ? (evidence_json || null) : null,
    options_json: admin ? (options_json || null) : null,
  };
  const out = await db('input_review_dialog').insert(row).select();
  if (out.error) return res.status(500).json({ error: out.error.message });
  res.status(201).json({ data: out.data });
});

// Admin-only: retract study-authored dialog rows that have NO owner answer attached.
// Append-only for the OWNER's sake — this can only remove assay questions/evidence that
// nobody has answered yet, so a reviewer's input can never be erased. Used to replace a
// seed after the content is corrected. Requires the admin credential.
router.post('/dialog/retract-unanswered', requireCode, async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'admin credential required' });
  const all = await db('input_review_dialog').select('*').limit(10000);
  if (all.error) return res.status(500).json({ error: all.error.message });
  const answeredQids = new Set(all.data.filter((r) => r.author === 'owner' && r.question_id).map((r) => r.question_id));
  const removable = all.data.filter((r) => r.author === 'assay' && !answeredQids.has(r.id));
  let removed = 0;
  for (const r of removable) {
    const out = await db('input_review_dialog').delete().eq('id', r.id);
    if (!out.error) removed += out.data.length;
  }
  res.json({ data: { removed, kept_owner_rows: all.data.filter((r) => r.author === 'owner').length } });
});

// Evidence proxy: serves whitelisted study files through the review site itself,
// authenticated by the same access code — no GitHub sign-in, no 404s for the owner.
const SOURCE_ROOTS = {
  evidence: path.join(__dirname, '..', '..', 'assay', 'reports', 'review', 'evidence'),
  reports: path.join(__dirname, '..', '..', 'assay', 'reports'),
};
router.get('/source/:root/:name', requireCode, (req, res) => {
  const root = SOURCE_ROOTS[req.params.root];
  const name = req.params.name;
  if (!root || name.includes('/') || name.includes('..')) return res.status(400).json({ error: 'bad path' });
  const file = path.join(root, name);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'no such evidence file' });
  if (name.endsWith('.md') || name.endsWith('.csv') || name.endsWith('.txt')) {
    res.type('text/plain; charset=utf-8');
  }
  res.sendFile(file);
});

module.exports = router;
