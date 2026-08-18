// server/db.js
// Postgres access for the trisight-engine server: pool, boot-time schema provisioning, and a small
// chainable query helper matching the subset of operations the app uses. Plain SQL underneath —
// parameterized everywhere, no string-splicing of values.

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let pool = null;

function getPool() {
  if (pool === null) {
    const url = process.env.DATABASE_URL;
    if (!url) return null;
    pool = new Pool({ connectionString: url, max: 10 });
  }
  return pool;
}

async function applySchema() {
  const p = getPool();
  if (p === null) return { ok: false, reason: 'DATABASE_URL not set' };
  const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  await p.query(schema); // idempotent: IF NOT EXISTS / OR REPLACE throughout
  return { ok: true };
}

async function dbHealth() {
  const p = getPool();
  if (p === null) return { ok: false, reason: 'DATABASE_URL not set' };
  try {
    const r = await p.query('SELECT 1 AS ok');
    return { ok: r.rows[0].ok === 1 };
  } catch (e) {
    return { ok: false, reason: String(e.message ?? e) };
  }
}

const IDENT = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
function ident(name) {
  if (!IDENT.test(name)) throw new Error(`invalid identifier: ${name}`);
  return `"${name}"`;
}

/** Chainable query helper over one table. Supported (the app's exact usage set):
 *  select(cols).eq/gte/lte/in/ilike().order().limit().single()
 *  insert(row|rows).select()   update(patch).eq()   upsert(row,{onConflict}).select()   delete().eq()
 *  Resolves to { data, error } — error.code 'PGRST116' on empty single() for handler compatibility. */
function db(table) {
  const t = ident(table);
  const state = { op: 'select', cols: '*', wheres: [], params: [], order: null, limit: null, single: false, payload: null, onConflict: null, returning: false };

  const push = (frag, val) => {
    state.params.push(val);
    state.wheres.push(frag.replace('$?', `$${state.params.length}`));
  };

  const api = {
    select(cols = '*') {
      if (state.op === 'insert' || state.op === 'update' || state.op === 'upsert') {
        state.returning = true;
        return api;
      }
      state.op = 'select';
      state.cols = cols === '*' ? '*' : cols.split(',').map((c) => ident(c.trim())).join(', ');
      return api;
    },
    insert(payload) { state.op = 'insert'; state.payload = payload; return api; },
    update(patch) { state.op = 'update'; state.payload = patch; return api; },
    upsert(payload, opts = {}) { state.op = 'upsert'; state.payload = payload; state.onConflict = opts.onConflict ?? null; return api; },
    delete() { state.op = 'delete'; return api; },
    eq(col, val) { push(`${ident(col)} = $?`, val); return api; },
    neq(col, val) { push(`${ident(col)} <> $?`, val); return api; },
    gte(col, val) { push(`${ident(col)} >= $?`, val); return api; },
    lte(col, val) { push(`${ident(col)} <= $?`, val); return api; },
    in(col, vals) { push(`${ident(col)} = ANY($?)`, vals); return api; },
    ilike(col, val) { push(`${ident(col)} ILIKE $?`, val); return api; },
    order(col, opts = {}) { state.order = `${ident(col)} ${opts.ascending === false ? 'DESC' : 'ASC'}`; return api; },
    limit(n) { state.limit = Math.max(0, parseInt(n, 10) || 0); return api; },
    single() { state.single = true; state.limit = 1; return api; },
    maybeSingle() { state.single = 'maybe'; state.limit = 1; return api; },
    then(resolve, reject) { return run().then(resolve, reject); },
  };

  async function run() {
    const p = getPool();
    if (p === null) return { data: null, error: { message: 'database not configured', code: 'DB_UNCONFIGURED' } };
    try {
      let sql;
      let params = state.params;
      const where = state.wheres.length > 0 ? ` WHERE ${state.wheres.join(' AND ')}` : '';
      if (state.op === 'select') {
        sql = `SELECT ${state.cols} FROM ${t}${where}`;
        if (state.order) sql += ` ORDER BY ${state.order}`;
        if (state.limit !== null) sql += ` LIMIT ${state.limit}`;
      } else if (state.op === 'insert' || state.op === 'upsert') {
        const rows = Array.isArray(state.payload) ? state.payload : [state.payload];
        const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
        const colSql = cols.map(ident).join(', ');
        params = [];
        const valuesSql = rows
          .map((r) => `(${cols.map((c) => { params.push(r[c] === undefined ? null : r[c]); return `$${params.length}`; }).join(', ')})`)
          .join(', ');
        sql = `INSERT INTO ${t} (${colSql}) VALUES ${valuesSql}`;
        if (state.op === 'upsert' && state.onConflict) {
          const conflictCols = state.onConflict.split(',').map((c) => ident(c.trim())).join(', ');
          const updates = cols.map((c) => `${ident(c)} = EXCLUDED.${ident(c)}`).join(', ');
          sql += ` ON CONFLICT (${conflictCols}) DO UPDATE SET ${updates}`;
        } else if (state.op === 'upsert') {
          sql += ' ON CONFLICT DO NOTHING';
        }
        sql += ' RETURNING *';
      } else if (state.op === 'update') {
        params = [];
        const sets = Object.entries(state.payload)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => { params.push(v); return `${ident(k)} = $${params.length}`; });
        const whereAdj = state.wheres.map((w, i) => w.replace(/\$\d+/, () => `$${sets.length + i + 1}`));
        params = params.concat(state.params);
        sql = `UPDATE ${t} SET ${sets.join(', ')}${whereAdj.length ? ` WHERE ${whereAdj.join(' AND ')}` : ''} RETURNING *`;
      } else if (state.op === 'delete') {
        sql = `DELETE FROM ${t}${where} RETURNING *`;
      }
      const res = await p.query(sql, params);
      let data = res.rows;
      if (state.single) {
        if (data.length === 0) {
          if (state.single === 'maybe') return { data: null, error: null };
          return { data: null, error: { message: 'no rows found', code: 'PGRST116' } };
        }
        data = data[0];
      }
      return { data, error: null };
    } catch (e) {
      return { data: null, error: { message: String(e.message ?? e), code: e.code ?? 'DB_ERROR' } };
    }
  }

  return api;
}

async function rpc(fn, args = {}) {
  const p = getPool();
  if (p === null) return { data: null, error: { message: 'database not configured', code: 'DB_UNCONFIGURED' } };
  if (!IDENT.test(fn)) return { data: null, error: { message: `invalid function ${fn}`, code: 'DB_ERROR' } };
  try {
    const keys = Object.keys(args);
    const call = `SELECT * FROM ${ident(fn)}(${keys.map((k, i) => `${ident(k)} => $${i + 1}`).join(', ')})`;
    const res = await p.query(call, keys.map((k) => args[k]));
    return { data: res.rows, error: null };
  } catch (e) {
    return { data: null, error: { message: String(e.message ?? e), code: e.code ?? 'DB_ERROR' } };
  }
}

module.exports = { getPool, applySchema, dbHealth, db, rpc };
