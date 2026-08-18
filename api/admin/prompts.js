// api/admin/prompts.js
// Serverless-safe admin endpoint: list, create, and update prompts (Supabase-backed)

const { createClient } = require('../_lib/dbclient');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
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
    if (!['GET', 'POST', 'PUT'].includes(req.method)) return res.status(405).json({ success:false, code:'METHOD' });

    const supabase = requireSupabase(res); if (!supabase) return;

    if (req.method === 'GET') {
      const { section_key, provider, search } = req.query || {};
      let q = supabase.from('report_prompts').select('*').order('updated_at', { ascending: false });
      if (section_key) q = q.eq('section_key', section_key);
      if (provider) q = q.eq('provider', provider);
      if (search) q = q.ilike('template', `%${search}%`);
      const { data, error } = await q;
      if (error) return res.status(200).json({ success:false, code:'DB', message:error.message });
      return res.status(200).json({ success:true, data });
    }

    if (req.method === 'POST') {
      const gate = checkAdmin(req, res); if (!gate.ok) return res.status(403).json({ success:false, code: gate.reason });
      const body = normalizeBody(req);
      const { section_key, provider='heuristic', model=null, template, expected_format='markdown', output_schema=null, variables_hint=null, max_tokens=null, temperature=null, enabled=true } = body || {};
      if (!section_key || !template) return res.status(200).json({ success:false, code:'VALIDATION', message:'section_key and template required' });
      const { data, error } = await supabase
        .from('report_prompts')
        .insert({ section_key, provider, model, template, expected_format, output_schema, variables_hint, max_tokens, temperature, enabled })
        .select('*').single();
      if (error) return res.status(200).json({ success:false, code:'DB', message:error.message });
      return res.status(200).json({ success:true, data });
    }

    if (req.method === 'PUT') {
      const gate = checkAdmin(req, res); if (!gate.ok) return res.status(403).json({ success:false, code: gate.reason });
      const { id } = req.query || {};
      if (!id) return res.status(200).json({ success:false, code:'VALIDATION', message:'id query param required' });
      const patch = normalizeBody(req);
      const allowed = ['section_key','provider','model','template','expected_format','output_schema','variables_hint','max_tokens','temperature','enabled'];
      const payload = {}; allowed.forEach(k => { if (patch[k] !== undefined) payload[k] = patch[k]; });
      const { data, error } = await supabase
        .from('report_prompts')
        .update(payload)
        .eq('id', id)
        .select('*').single();
      if (error) return res.status(200).json({ success:false, code:'DB', message:error.message });
      return res.status(200).json({ success:true, data });
    }

  } catch (e) {
    return res.status(200).json({ success:false, code:'HANDLER', message: String(e?.message||e) });
  }
};

