// api/admin/report-templates.js
// Serverless-safe admin endpoint: list and create report templates (Supabase-backed)

const { createClient } = require('@supabase/supabase-js');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');
}

function normalizeBody(req) {
  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  return body;
}

function requireSupabase(res) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    res.status(200).json({ success: false, code: 'SUPABASE-CONFIG', message: 'Supabase env missing' });
    return null;
  }
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
}

function isWrite(method) { return method === 'POST'; }

function checkAdmin(req, res) {
  const adminKey = process.env.ADMIN_API_KEY || '';
  if (!adminKey) return { ok: false, reason: 'ADMIN-KEY-NOT-SET' };
  const header = req.headers['x-admin-key'] || req.headers['X-Admin-Key'] || req.headers['x-admin-key'.toLowerCase()];
  if (header !== adminKey) return { ok: false, reason: 'ADMIN-FORBIDDEN' };
  return { ok: true };
}

module.exports = async function handler(req, res) {
  try {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ success:false, code:'METHOD' });

    const supabase = requireSupabase(res); if (!supabase) return;

    if (req.method === 'GET') {
      const { data: templates, error } = await supabase
        .from('report_templates')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) return res.status(200).json({ success:false, code:'DB', message:error.message });

      const ids = (templates || []).map(t => t.id);
      let sections = [];
      if (ids.length) {
        const { data, error: e2 } = await supabase
          .from('report_template_sections')
          .select('*')
          .in('template_id', ids)
          .order('position', { ascending: true });
        if (!e2) sections = data || [];
      }
      const map = {}; sections.forEach(s => { (map[s.template_id] ||= []).push(s); });
      const out = (templates || []).map(t => ({ ...t, sections: map[t.id] || [] }));
      return res.status(200).json({ success:true, data: out });
    }

    // POST create template
    if (isWrite(req.method)) {
      const gate = checkAdmin(req, res); if (!gate.ok) return res.status(403).json({ success:false, code: gate.reason });
      const body = normalizeBody(req);
      const name = String(body.name || '').trim();
      const description = String(body.description || '').trim();
      if (!name) return res.status(200).json({ success:false, code:'VALIDATION', message:'name required' });

      const { data, error } = await supabase
        .from('report_templates')
        .insert({ name, description })
        .select('*').single();
      if (error) return res.status(200).json({ success:false, code:'DB', message:error.message });
      return res.status(200).json({ success:true, data });
    }

  } catch (e) {
    return res.status(200).json({ success:false, code:'HANDLER', message: String(e?.message||e) });
  }
};

