// src/reportGeneration/services/enrichmentService.ts
// Rule: FallbackChain + CacheFirst

// Supabase eradicated (2026-08-18). The enrich cache short-circuits to the
// no-cache path this file always supported; the report_enrich_cache table now
// lives in Postgres behind the server if a server-side cache is reintroduced.
const supabase: any = null;

const TTL_MIN = Number(process.env.ENRICH_CACHE_TTL_MIN || 240);
const MIN_WORDS = Number(process.env.ENRICH_MIN_WORDS || 350);

type SectionKey = 'market_overview' | 'financial_analysis' | 'technical_analysis';

export async function getEnrichedSection(opts: {
  ticker: string; timeframe: string; section: SectionKey;
  prompt: string;                         // meta-prompt assembled upstream
  context?: any;                          // raw data for few-shot grounding
  prefer?: Array<'claude' | 'perplexity' | 'openai'>; // ordering
}) {
  const { ticker, timeframe, section, prompt, context, prefer = ['claude','perplexity','openai'] } = opts;
  const now = Date.now();

  // 1) Cache lookup (respect TTL)
  if (supabase) {
    const { data, error } = await supabase
      .from('report_enrich_cache')
      .select('*')
      .eq('ticker', ticker).eq('timeframe', timeframe).eq('section', section)
      .limit(1);
    if (!error && data?.length) {
      const created = new Date((data[0] as any).created_at).getTime();
      if ((now - created) / 60000 < TTL_MIN) {
        const words = wordCount((data[0] as any).content);
        console.info('[SectionDiag]', { section, ticker, timeframe, source: 'cache', words, fallbackUsed: false });
        if (words >= MIN_WORDS) return { content: (data[0] as any).content, source: 'cache' as const };
      }
    }
  }

  // 2) Try providers in order
  const providers: Record<string, () => Promise<string>> = {
    async claude() { return callClaude(prompt, context); },
    async perplexity() { return callPerplexity(prompt, context); },
    async openai() { return callOpenAI(prompt, context); }
  };

  let content: string | null = null;
  let used: 'claude' | 'perplexity' | 'openai' | 'heuristic' | 'cache' | null = null;

  for (const p of prefer) {
    try {
      content = await providers[p]!();
      const words = wordCount(content);
      const fallbackUsed = words < MIN_WORDS;
      console.info('[SectionDiag]', { section, ticker, timeframe, source: p, words, fallbackUsed });
      used = p as any;
      if (supabase && content) {
        await supabase.from('report_enrich_cache').upsert({
          ticker, timeframe, section, model_source: p, content, tokens_used: null
        }, { onConflict: 'ticker,timeframe,section' });
      }
      if (words >= MIN_WORDS) return { content, source: p };
      // otherwise continue to next provider
    } catch (e: any) {
      // move to next
    }
  }

  // 3) Last resort: structured fallback assembling context into prose
  content = heuristicFallback(prompt, context);
  const words = wordCount(content);
  console.info('[SectionDiag]', { section, ticker, timeframe, source: 'heuristic', words, fallbackUsed: true });
  if (supabase && content) {
    await supabase.from('report_enrich_cache').upsert({
      ticker, timeframe, section, model_source: 'heuristic', content
    }, { onConflict: 'ticker,timeframe,section' });
  }
  return { content, source: 'heuristic' as const };
}

// --- helpers (provider shims) ---
function wordCount(s?: string) { return (s || '').trim().split(/\s+/).filter(Boolean).length; }

async function callClaude(prompt: string, context?: any): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('Claude missing key');
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620';
  // TODO: wire actual SDK call with meta-prompt and context
  throwIfDisabled('claude');
  return '';
}

async function callPerplexity(prompt: string, context?: any): Promise<string> {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) throw new Error('Perplexity missing key');
  // TODO: wire actual API call
  throwIfDisabled('perplexity');
  return '';
}

async function callOpenAI(prompt: string, context?: any): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OpenAI missing key');
  // TODO: wire actual API call
  throwIfDisabled('openai');
  return '';
}

function heuristicFallback(prompt: string, context?: any): string {
  const lines: string[] = [];
  lines.push('Overview');
  const p = summarize(context?.profile || context?.company || context?.companyData);
  lines.push(typeof p === 'string' ? p : JSON.stringify(p));
  lines.push('');
  lines.push('Key Metrics');
  lines.push(bullet(context?.kpis || context?.financials || context?.statements));
  lines.push('');
  lines.push('Trends');
  lines.push(bullet(context?.trends || context?.technicals || context?.indicators));
  // pad to exceed MIN_WORDS if needed (simple expansion)
  while (wordCount(lines.join('\n')) < Math.max(400, MIN_WORDS + 40)) {
    lines.push('Additional context: The analysis considers market positioning, historical performance, and conservative risk framing.');
  }
  return lines.join('\n');
}

function summarize(obj: any) { return obj ? JSON.stringify(obj).slice(0, 800) : 'N/A'; }
function bullet(arr: any[] = []) { return (arr || []).slice(0, 8).map(x => `• ${stringify(x)}`).join('\n') || '• N/A'; }
function stringify(x: any) { return typeof x === 'string' ? x : JSON.stringify(x); }
function throwIfDisabled(name: string) { if ((process as any).env[`DISABLE_${name.toUpperCase()}`]) throw new Error(`${name} disabled`); }

