// api/admin/preview-section.js
// Admin-only: Preview a single section generation with explicit override (no DB write)

const { generateSection, generateSectionWithOverride } = require('../_lib/section-generator');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');
}
function normalizeBody(req) { let b = req.body || {}; if (typeof b === 'string') { try { b = JSON.parse(b) } catch { b = {} } } return b; }
function checkAdmin(req) {
  const adminKey = process.env.ADMIN_API_KEY || '';
  const header = req.headers['x-admin-key'] || req.headers['X-Admin-Key'] || req.headers['x-admin-key'.toLowerCase()];
  return adminKey && header === adminKey;
}

module.exports = async function handler(req, res) {
  try {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success:false, code:'METHOD' });
    if (!checkAdmin(req)) return res.status(403).json({ success:false, code:'ADMIN-FORBIDDEN' });

    const { section_key, override, inputs, reportData } = normalizeBody(req);
    if (!section_key) return res.status(200).json({ success:false, code:'VALIDATION', message:'section_key required' });

    const providers = {
      anthropic: process.env.ANTHROPIC_API_KEY ? { apiKey: process.env.ANTHROPIC_API_KEY, model: 'claude-3-5-sonnet-20240620' } : undefined,
      openai: process.env.OPENAI_API_KEY ? { apiKey: process.env.OPENAI_API_KEY, model: 'gpt-4o-mini' } : undefined,
      perplexity: process.env.PERPLEXITY_API_KEY ? { apiKey: process.env.PERPLEXITY_API_KEY, model: 'llama-3.1-sonar-small-128k-online' } : undefined,
      firecrawl: process.env.FIRECRAWL_API_KEY ? { apiKey: process.env.FIRECRAWL_API_KEY } : undefined,
      twelvedata: process.env.TWELVE_DATA_API_KEY ? { apiKey: process.env.TWELVE_DATA_API_KEY } : undefined
    };

    const input = { sectionKey: section_key, inputs, reportData, providers };
    let out = null;
    if (override && (override.template || override.provider)) {
      out = await generateSectionWithOverride(override, input);
    } else {
      out = await generateSection(input);
    }

    return res.status(200).json({ success:true, data: out });
  } catch (e) {
    return res.status(200).json({ success:false, code:'HANDLER', message: String(e?.message || e) });
  }
};

