// api/_lib/section-generator.js
// Provider-agnostic, templated section generator with real APIs (Anthropic, OpenAI, Perplexity, Firecrawl)
// Serverless-safe: no FS writes; axios-only network calls; optional Supabase prompt fetch

const axios = require('axios');
let supabase = null;
try {
  const { createClient } = require('./dbclient');
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  }
} catch (_) {}

const DEFAULTS = {
  executive_summary: {
    provider: 'heuristic',
    expected_format: 'markdown',
    template:
      'Executive Summary for {{INPUT.ticker}} ({{INPUT.timeframe}}).\n' +
      'Sector: {{REPORT.companyData.sector||SYSTEM.sector||"N/A"}}\n' +
      'Use {{EXPECTED_FORMAT}}.'
  },
  investment_thesis: {
    provider: 'heuristic',
    expected_format: 'markdown',
    template: 'Investment Thesis for {{INPUT.ticker}}. Return {{EXPECTED_FORMAT}} with 3–5 bullets.'
  },
  risk_assessment: {
    provider: 'heuristic',
    expected_format: 'bullets',
    template: 'Top risks for {{INPUT.ticker}} with short mitigations. Format: {{EXPECTED_FORMAT}}.'
  },
  citations: {
    provider: 'heuristic',
    expected_format: 'bullets',
    template: 'Recent citations for {{INPUT.ticker}}. If none, say "No recent items." Format: {{EXPECTED_FORMAT}}.'
  }
};

// tiny safe getter: pluck(vars, 'A.B.C')
function pluck(obj, path) {
  try {
    return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  } catch { return undefined; }
}

// a tiny mustache-like renderer supporting {{A.B}} and {{A||B||"fallback"}}
function renderTemplate(tpl, vars) {
  return String(tpl).replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
    try {
      // support ORs: A.B || C.D || "text"
      const parts = expr.split('||').map(s => s.trim());
      for (const p of parts) {
        if ((p.startsWith('"') && p.endsWith('"')) || (p.startsWith("'") && p.endsWith("'"))) {
          const lit = p.slice(1, -1);
          if (lit) return lit;
          continue;
        }
        const v = pluck(vars, p);
        if (v !== undefined && v !== null && v !== '') return typeof v === 'object' ? JSON.stringify(v) : String(v);
      }
      return '';
    } catch {
      return '';
    }
  });
}

async function getPromptRow(where) {
  if (!supabase) return null;
  const q = supabase
    .from('report_prompts')
    .select('*')
    .eq(where.id ? 'id' : 'section_key', where.id || where.sectionKey)
    .eq('enabled', true)
    .limit(1);
  const { data, error } = await q;
  if (error) { console.warn('[SectionGen] supabase error', error.message); return null; }
  return (data && data[0]) || null;
}

function normalizeOut(sectionKey, format, content, meta = {}) {
  // format coerce
  let fmt = ['markdown','json','bullets'].includes(format) ? format : 'markdown';
  let outContent = content;
  if (fmt === 'bullets' && !Array.isArray(outContent)) {
    outContent = String(content || '')
      .split('\n')
      .map(s => s.replace(/^[•\-\*]\s?/, '').trim())
      .filter(Boolean);
  }
  if (fmt === 'json' && typeof outContent === 'string') {
    try { outContent = JSON.parse(outContent); } catch { outContent = { summary: outContent }; }
  }
  return { sectionKey, format: fmt, content: outContent, meta };
}

// Provider calls (axios-based)
async function callAnthropic(prompt, model, apiKey, expected) {
  const t0 = Date.now();
  try {
    const r = await axios.post('https://api.anthropic.com/v1/messages', {
      model: model || 'claude-3-5-sonnet-20240620',
      max_tokens: 1200,
      messages: [{ role: 'user', content: `${prompt}\n\nReturn format: ${expected}` }]
    }, {
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      timeout: 20000
    });
    const text = r.data?.content?.[0]?.text ?? '';
    return { text, meta: { provider: 'anthropic', model: model || 'claude-3-5-sonnet-20240620', latencyMs: Date.now() - t0 } };
  } catch (e) {
    return { error: String(e?.response?.status || e?.message || e), meta: { provider: 'anthropic', model, latencyMs: Date.now() - t0 } };
  }
}

async function callOpenAI(prompt, model, apiKey, expected) {
  const t0 = Date.now();
  try {
    const r = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: `${prompt}\n\nReturn format: ${expected}` }],
      temperature: 0.2
    }, {
      headers: { 'authorization': `Bearer ${apiKey}`, 'content-type':'application/json' },
      timeout: 20000
    });
    const text = r.data?.choices?.[0]?.message?.content ?? '';
    return { text, meta: { provider: 'openai', model: model || 'gpt-4o-mini', latencyMs: Date.now() - t0 } };
  } catch (e) {
    return { error: String(e?.response?.status || e?.message || e), meta: { provider: 'openai', model, latencyMs: Date.now() - t0 } };
  }
}

async function callPerplexity(prompt, model, apiKey, expected) {
  const t0 = Date.now();
  try {
    const r = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: model || 'llama-3.1-sonar-small-128k-online',
      messages: [{ role: 'user', content: `${prompt}\n\nReturn format: ${expected}` }]
    }, {
      headers: { 'authorization': `Bearer ${apiKey}`, 'content-type':'application/json' },
      timeout: 20000
    });
    const text = r.data?.choices?.[0]?.message?.content ?? '';
    return { text, meta: { provider: 'perplexity', model: model || 'llama-3.1-sonar-small-128k-online', latencyMs: Date.now() - t0 } };
  } catch (e) {
    return { error: String(e?.response?.status || e?.message || e), meta: { provider: 'perplexity', model, latencyMs: Date.now() - t0 } };
  }
}

async function callFirecrawl(prompt, cfg, expected, inputs) {
  const t0 = Date.now();
  try {
    if (!cfg || !cfg.apiKey) throw new Error('Firecrawl key missing');
    const query = inputs?.ticker ? `${inputs.ticker} stock news latest` : (String(prompt).slice(0,120) || 'market news');
    // Search (v1)
    const search = await axios.post('https://api.firecrawl.dev/v1/search', { query, limit: 5 }, {
      headers: { 'authorization': `Bearer ${cfg.apiKey}`, 'content-type': 'application/json' }, timeout: 20000
    });
    const items = Array.isArray(search.data?.data) ? search.data.data : [];
    const sources = items.map(it => ({ title: it.title, url: it.url, date: new Date().toISOString().slice(0,10) }));
    if (expected === 'bullets') {
      const bullets = sources.map(s => `${s.title || 'Untitled'} — ${new URL(s.url||'').hostname || 'Unknown'} (${s.date})`);
      return { text: bullets, meta: { provider: 'firecrawl', latencyMs: Date.now() - t0, sources } };
    }
    const md = sources.map(s => `• ${s.title || 'Untitled'} — ${new URL(s.url||'').hostname || 'Unknown'} (${s.date})`).join('\n');
    return { text: md, meta: { provider: 'firecrawl', latencyMs: Date.now() - t0, sources } };
  } catch (e) {
    return { error: String(e?.response?.status || e?.message || e), meta: { provider: 'firecrawl', latencyMs: Date.now() - t0 } };
  }
}

function heuristicContent(sectionKey, expected, inputs, reportData) {
  const t = (inputs?.ticker || 'TICKER');
  if (expected === 'bullets') {
    if (sectionKey === 'citations') {
      const news = Array.isArray(reportData?.newsAndSentiment) ? reportData.newsAndSentiment.slice(0,5) : [];
      if (!news.length) return ['No recent items.'];
      return news.map(n => `${n.title || 'Untitled'} — ${n.source || 'Unknown'} (${String(n.date||'').slice(0,10)})`);
    }
    return [
      `${t}: diversified growth drivers`,
      `Valuation reflects leadership; monitor margin durability`,
      `Key risk: supply concentration; watch capacity signals`
    ];
  }
  return `${sectionKey.replace(/_/g,' ').toUpperCase()} — ${t}\n\nInitial analysis pending provider response.`;
}

// MAIN
async function generateSection(input) {
  const { promptId, sectionKey, inputs = {}, reportData = {}, providers = {}, prefer } = input || {};

  // 1) fetch row (DB or defaults)
  let row = null;
  try { row = await getPromptRow(promptId ? { id: promptId } : { sectionKey }); } catch {}
  if (!row) row = { ...DEFAULTS[sectionKey] } || { provider: 'heuristic', expected_format: 'markdown', template: '' };
  const expected = row.expected_format || 'markdown';

  // 2) synth variables bag
  const sysVars = {
    SYSTEM: { sector: reportData?.companyData?.sector || 'N/A' },
    INPUT: inputs,
    REPORT: reportData,
    MARKET: {
      summary: pluck(reportData, 'marketData.summary') || '',
      price: pluck(reportData, 'marketData.currentPrice') || '',
      range52w: `${pluck(reportData, 'marketData.yearLow')||''}–${pluck(reportData, 'marketData.yearHigh')||''}`
    },
    INDICATORS: pluck(reportData, 'technicalAnalysis') || {},
    EARNINGS: pluck(reportData, 'financialData.earnings') || {},
    WEB: pluck(reportData, 'webContent') || {},
    LIMIT: { words: 220 },
    EXPECTED_FORMAT: expected
  };

  // 3) render prompt
  const prompt = renderTemplate(row.template || '', sysVars);

  // 4) choose provider (prefer > row.provider > heuristic)
  const choice = prefer || row.provider || 'heuristic';

  // 5) call provider (guarded)
  let resp = null;
  try {
    if (choice === 'anthropic' && providers.anthropic?.apiKey) {
      resp = await callAnthropic(prompt, row.model || providers.anthropic.model, providers.anthropic.apiKey, expected);
    } else if (choice === 'openai' && providers.openai?.apiKey) {
      resp = await callOpenAI(prompt, row.model || providers.openai.model, providers.openai.apiKey, expected);
    } else if (choice === 'perplexity' && providers.perplexity?.apiKey) {
      resp = await callPerplexity(prompt, row.model || providers.perplexity.model, providers.perplexity.apiKey, expected);
    } else if (choice === 'firecrawl' && providers.firecrawl?.apiKey) {
      resp = await callFirecrawl(prompt, providers.firecrawl, expected, inputs);
    } else if (choice === 'twelvedata' && providers.twelvedata?.apiKey) {
      resp = { text: heuristicContent(sectionKey, expected, inputs, reportData), meta: { provider: 'twelvedata' } };
    } else {
      resp = { text: heuristicContent(sectionKey, expected, inputs, reportData), meta: { provider: 'heuristic' } };
    }
  } catch (e) {
    resp = { text: heuristicContent(sectionKey, expected, inputs, reportData), meta: { provider: 'heuristic', error: String(e?.message || e) } };
  }

  const meta = { ...(resp?.meta || {}), sectionKey, expected, promptPreview: prompt.slice(0, 240) };
  if (resp?.error) meta.error = resp.error;

  // 6) normalize
  return normalizeOut(sectionKey, expected, resp?.text ?? '', meta);
}

/**
 * Generate a section using an explicit row override (provider/model/template/expected_format)
 * Useful for admin previews without persisting a prompt row yet.
 */
async function generateSectionWithOverride(override, input) {
  const { sectionKey } = input || {};
  const row = {
    provider: override?.provider || 'heuristic',
    model: override?.model || undefined,
    template: override?.template || '',
    expected_format: override?.expected_format || 'markdown'
  };
  const expected = row.expected_format || 'markdown';

  const sysVars = {
    SYSTEM: { sector: (input?.reportData?.companyData?.sector) || 'N/A' },
    INPUT: input?.inputs || {},
    REPORT: input?.reportData || {},
    MARKET: { summary: '', price: '', range52w: '' },
    INDICATORS: {}, EARNINGS: {}, WEB: {}, LIMIT: { words: 220 }, EXPECTED_FORMAT: expected
  };
  const prompt = renderTemplate(row.template || '', sysVars);

  const choice = row.provider || 'heuristic';
  const providers = input?.providers || {};
  let resp = null;
  try {
    if (choice === 'anthropic' && providers.anthropic?.apiKey) {
      resp = await callAnthropic(prompt, row.model || providers.anthropic.model, providers.anthropic.apiKey, expected);
    } else if (choice === 'openai' && providers.openai?.apiKey) {
      resp = await callOpenAI(prompt, row.model || providers.openai.model, providers.openai.apiKey, expected);
    } else if (choice === 'perplexity' && providers.perplexity?.apiKey) {
      resp = await callPerplexity(prompt, row.model || providers.perplexity.model, providers.perplexity.apiKey, expected);
    } else if (choice === 'firecrawl' && providers.firecrawl?.apiKey) {
      resp = await callFirecrawl(prompt, providers.firecrawl, expected, input?.inputs);
    } else {
      resp = { text: heuristicContent(sectionKey, expected, input?.inputs, input?.reportData), meta: { provider: 'heuristic' } };
    }
  } catch (e) {
    resp = { text: heuristicContent(sectionKey, expected, input?.inputs, input?.reportData), meta: { provider: 'heuristic', error: String(e?.message || e) } };
  }
  const meta = { ...(resp?.meta || {}), sectionKey, expected, promptPreview: prompt.slice(0, 240) };
  if (resp?.error) meta.error = resp.error;
  return normalizeOut(sectionKey, expected, resp?.text ?? '', meta);
}

module.exports = { generateSection, generateSectionWithOverride };

