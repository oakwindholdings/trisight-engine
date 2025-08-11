// api/admin/report-templates-sections.js
// Serverless-safe admin endpoint: add or update template sections (Supabase-backed)

const { createClient } = require('@supabase/supabase-js');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, OPTIONS');
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
    if (!['POST', 'PUT'].includes(req.method)) return res.status(405).json({ success:false, code:'METHOD' });

    const gate = checkAdmin(req, res); if (!gate.ok) return res.status(403).json({ success:false, code: gate.reason });
    const supabase = requireSupabase(res); if (!supabase) return;

    const body = normalizeBody(req);

    if (req.method === 'POST') {
      // Create a section
      const { templateId, section_key, prompt_id = null, position = 0, expected_format = 'markdown', enabled = true } = body || {};
      if (!templateId || !section_key) return res.status(200).json({ success:false, code:'VALIDATION', message:'templateId and section_key required' });
      const { data, error } = await supabase
        .from('report_template_sections')
        .insert({ template_id: templateId, section_key, prompt_id, position, expected_format, enabled })
        .select('*').single();
      if (error) return res.status(200).json({ success:false, code:'DB', message:error.message });
      return res.status(200).json({ success:true, data });
    }

    if (req.method === 'PUT') {
      // Update a section by id from query param
      const { id } = req.query || {};
      if (!id) return res.status(200).json({ success:false, code:'VALIDATION', message:'id query param required' });
      const patch = {};
      ['prompt_id','position','expected_format','enabled','section_key'].forEach(k => { if (body[k] !== undefined) patch[k] = body[k]; });
      const { data, error } = await supabase
        .from('report_template_sections')
        .update(patch)
        .eq('id', id)
        .select('*').single();
      if (error) return res.status(200).json({ success:false, code:'DB', message:error.message });
      return res.status(200).json({ success:true, data });
    }

  } catch (e) {
    return res.status(200).json({ success:false, code:'HANDLER', message: String(e?.message||e) });
  }
};

