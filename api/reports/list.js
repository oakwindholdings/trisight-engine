// api/reports/list.js
// Vercel serverless function for listing reports
// In serverless architecture, we'll integrate with Supabase for storage

const { createClient } = require('../_lib/dbclient');
const fs = require('fs').promises;
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
};

// Rule: StableList - helpers
function mapRow(row) {
  return {
    id: row.id,
    symbol: row.ticker || row.symbol,
    createdAt: row.created_at || row.createdAt,
    path: row.download_url || row.path,
    size: row.file_size || row.size,
    // Back-compat fields
    filename: row.filename || `${row.ticker || row.symbol}_report_${row.created_at}.${row.format || 'pptx'}`,
    created: row.created_at,
    downloadUrl: row.download_url || `/api/reports/download?id=${row.id}`,
    ticker: row.ticker,
    title: row.title,
    template: row.template,
    author: row.author,
    status: row.status || 'completed',
    metadata: row.metadata || {}
  };
}

function mapFile(fileEntry) {
  const { f, s } = fileEntry;
  return {
    id: f,
    symbol: f.split('_')[0],
    createdAt: new Date(s.mtimeMs).toISOString(),
    path: `/generated-reports/${f}`,
    size: s.size,
    // Back-compat fields
    filename: f,
    created: new Date(s.birthtimeMs || s.mtimeMs).toISOString(),
    downloadUrl: `/generated-reports/${f}`,
    ticker: f.split('_')[0],
    title: f,
    template: f.includes('comprehensive') ? 'comprehensive' : 'standard',
    status: 'completed',
    metadata: {}
  };
}

async function handler(req, res) {
  try {
    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({
        error: 'Method not allowed',
        allowedMethods: ['GET']
      });
    }

    const hasSupabase = !!(process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL) && !!(process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);

    // Supabase path
    if (hasSupabase) {
      try {
        console.log('[ListReports] { code:"OK", env:"supabase", msg:"query" }'); // Rule: StableList
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) {
          const code = /relation .* does not exist/i.test(error.message) ? 'LSUP-NOTABLE' : 'LSUP-001';
          console.error('[ListReports]', { code, env:'supabase', err:error.message });
          return res.status(200).json({ success:true, reports:[], errorCode: code });
        }

        const reports = Array.isArray(data) ? data : [];
        const mapped = reports.map(mapRow);
        console.log(`[ListReports] { code:"OK", env:"supabase", count:${mapped.length} }`); // Rule: StableList
        return res.status(200).json({ success: true, reports: mapped, total: mapped.length, timestamp: new Date().toISOString() });
      } catch (e) {
        console.error('[ListReports]', { code:'LSUP-UNCAUGHT', env:'supabase', err:String(e?.message||e) });
        return res.status(200).json({ success:true, reports:[], errorCode:'LSUP-UNCAUGHT' });
      }
    }

    // FS path
    try {
      const reportsDir = path.join(process.cwd(), 'generated-reports');
      await fs.mkdir(reportsDir, { recursive: true });
      const files = await fs.readdir(reportsDir);
      const stats = await Promise.all(files.map(async (f) => ({ f, s: await fs.stat(path.join(reportsDir, f)) })));
      const sorted = stats.sort((a, b) => b.s.mtimeMs - a.s.mtimeMs).slice(0, 50);
      const mapped = sorted.map(mapFile);
      console.log(`[ListReports] { code:"OK", env:"fs", count:${mapped.length} }`); // Rule: StableList
      return res.status(200).json({ success: true, reports: mapped, total: mapped.length, timestamp: new Date().toISOString() });
    } catch (e) {
      console.error('[ListReports] { code:"LFS-001", env:"fs", err:"'+ (e && e.message) +'" }'); // Rule: StableList
      return res.status(200).json({ success: true, reports: [], total: 0, errorCode: 'LFS-001', timestamp: new Date().toISOString() });
    }
  } catch (outerErr) {
    // Final catch-all should not 500 to client
    console.error('[ListReports] { code:"LGEN-001", env:"unknown", err:"'+ (outerErr && outerErr.message) +'" }'); // Rule: StableList
    return res.status(200).json({ success: true, reports: [], total: 0, errorCode: 'LGEN-001', timestamp: new Date().toISOString() });
  }
}

module.exports = handler;