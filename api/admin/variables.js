// api/admin/variables.js
// Serverless-safe admin endpoint: list prompt variables registry (Supabase-backed)

const { createClient } = require('../_lib/dbclient');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  try {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ success:false, code:'METHOD' });

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return res.status(200).json({ success:false, code:'SUPABASE-CONFIG' });
    }
    const { createClient } = require('../_lib/dbclient');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    const { data, error } = await supabase
      .from('prompt_variables_registry')
      .select('*')
      .eq('enabled', true)
      .order('namespace', { ascending: true });
    if (error) return res.status(200).json({ success:false, code:'DB', message:error.message });

    return res.status(200).json({ success:true, data });
  } catch (e) {
    return res.status(200).json({ success:false, code:'HANDLER', message: String(e?.message||e) });
  }
};

