// src/components/admin/SectionPreview.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { PROVIDERS, FORMATS } from '../../models/adminConstants';

const Box = styled.div` border:1px solid #e5e7eb; border-radius:8px; padding:10px; background:#fff; `;
const Button = styled.button` padding: 6px 10px; border: 1px solid #d1d5db; background: #fff; border-radius: 6px; cursor: pointer; font-size: 0.9rem; &:hover { background: #f9fafb; }`;
const Textarea = styled.textarea` width:100%; min-height:120px; border:1px solid #d1d5db; border-radius:6px; padding:8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas; `;

export const SectionPreview: React.FC<{ section_key: string }> = ({ section_key }) => {
  const [ticker, setTicker] = useState('NVDA');
  const [timeframe, setTimeframe] = useState('1min');
  const [provider, setProvider] = useState('heuristic');
  const [expected_format, setExpected] = useState<'markdown'|'json'|'bullets'>('markdown');
  const [template, setTemplate] = useState('Write {{section_key}} for {{INPUT.ticker}}. Format: {{EXPECTED_FORMAT}}');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runPreview() {
    try {
      setLoading(true); setError(null); setResult(null);
      const res = await fetch('/api/admin/preview-section', {
        method: 'POST', headers: { 'Content-Type':'application/json', 'X-Admin-Key': localStorage.getItem('trisight_admin_key') || '' },
        body: JSON.stringify({ section_key, override: { provider, expected_format, template }, inputs: { ticker, timeframe } })
      });
      const data = await res.json().catch(() => ({ success: false, message: 'Invalid JSON' }));
      if (!data?.success) throw new Error(data?.message || data?.code || 'PREVIEW');
      setResult(data.data);
    } catch (e: any) { setError(e?.message || 'Preview failed'); }
    finally { setLoading(false); }
  }

  return (
    <Box>
      <div style={{ display:'flex', gap:8, marginBottom:8 }}>
        <input data-testid="admin-prev-ticker" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="Ticker" />
        <input data-testid="admin-prev-timeframe" value={timeframe} onChange={e => setTimeframe(e.target.value)} placeholder="Timeframe" />
        <select data-testid="admin-prev-provider" value={provider} onChange={e => setProvider(e.target.value)}>
          <option>heuristic</option>
          <option>anthropic</option>
          <option>openai</option>
          <option>perplexity</option>
          <option>firecrawl</option>
        </select>
        <select data-testid="admin-prev-format" value={expected_format} onChange={e => setExpected(e.target.value as any)}>
          <option>markdown</option>
          <option>bullets</option>
          <option>json</option>
        </select>
        <Button data-testid="admin-prev-run" onClick={runPreview}>{loading ? 'Running...' : 'Preview'}</Button>
      </div>
      <Textarea data-testid="admin-prev-template" value={template} onChange={e => setTemplate(e.target.value)} />
      {error && <div data-testid="admin-prev-error" style={{ color:'crimson' }}>{error}</div>}
      {result && (
        <div style={{ marginTop:8 }}>
          <div style={{ fontWeight: 600 }}>Output ({result.format})</div>
          <pre data-testid="admin-prev-output" style={{ whiteSpace:'pre-wrap' }}>{typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2)}</pre>
          <div style={{ color:'#6b7280', fontSize:'0.8rem' }}>provider: {result.meta?.provider} • latency: {result.meta?.latencyMs}ms</div>
        </div>
      )}
    </Box>
  );
};

