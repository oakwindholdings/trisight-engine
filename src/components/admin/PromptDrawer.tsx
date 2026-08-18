// src/components/admin/PromptDrawer.tsx
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { PromptRow, createPrompt, listPrompts, listVariables, VariableRow, getStoredAdminKey } from '../../services/adminApi';
import { PROVIDERS, FORMATS } from '../../models/adminConstants';

const Drawer = styled.div`
  position: sticky; top: 0; align-self: flex-start; width: 380px; border-left: 1px solid #e5e7eb; padding: 12px; background: #fafafa;
`;
const Input = styled.input` border: 1px solid #d1d5db; padding: 6px 8px; border-radius: 6px; width: 100%; `;
const Textarea = styled.textarea` border: 1px solid #d1d5db; padding: 8px; border-radius: 6px; width: 100%; min-height: 180px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas; `;
const Button = styled.button` padding: 6px 10px; border: 1px solid #d1d5db; background: #fff; border-radius: 6px; cursor: pointer; font-size: 0.9rem; &:hover { background: #f9fafb; }`;
const Select = styled.select` border: 1px solid #d1d5db; padding: 6px 8px; border-radius: 6px; `;
const Row = styled.div` display: flex; gap: 8px; align-items: center; `;
const Small = styled.div` font-size: 0.8rem; color: #6b7280; `;

export const PromptDrawer: React.FC = () => {
  const [section_key, setSectionKey] = useState('executive_summary');
  const [provider, setProvider] = useState('anthropic');
  const [model, setModel] = useState('claude-3-5-sonnet-20240620');
  const [expected_format, setExpectedFormat] = useState<'markdown'|'json'|'bullets'>('markdown');
  const [template, setTemplate] = useState('You are TriSight’s report engine. Write the {{section_key}} for {{INPUT.ticker}} (timeframe: {{INPUT.timeframe}}).');
  const [vars, setVars] = useState<VariableRow[]>([]);
  const [msg, setMsg] = useState<string>('');
  const adminKey = getStoredAdminKey();

  useEffect(() => { (async () => { try { const v = await listVariables(); setVars(v || []); } catch (e: any) { setMsg(e?.message || 'Failed to load variables'); setVars([]);} })(); }, []);

  async function savePrompt() {
    try {
      setMsg('');
      const row = await createPrompt({ section_key, provider, model, template, expected_format, enabled: true }, adminKey);
      setMsg(`Saved: ${row.id}`);
    } catch (e: any) { setMsg(e?.message || 'Save failed'); }
  }

  function insertToken(ns: string, key: string) {
    const token = `{{${ns}.${key}}}`;
    setTemplate(prev => {
      const el = document.getElementById('prompt-editor-ta') as HTMLTextAreaElement | null;
      if (el && el.selectionStart != null) {
        const start = el.selectionStart; const end = el.selectionEnd;
        return prev.slice(0, start) + token + prev.slice(end);
      }
      return prev + token;
    });
  }

  return (
    <Drawer>
      <h3 style={{ marginTop: 0 }}>Prompt Editor</h3>
      <Row>
        <Select data-testid="admin-pd-section" value={section_key} onChange={e => setSectionKey(e.target.value)}>
          <option>executive_summary</option>
          <option>investment_thesis</option>
          <option>risk_assessment</option>
          <option>citations</option>
        </Select>
        <Select data-testid="admin-pd-provider" value={provider} onChange={e => setProvider(e.target.value)}>
          {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
        </Select>
      </Row>
      <Row>
        <Input data-testid="admin-pd-model" placeholder="model (optional)" value={model} onChange={e => setModel(e.target.value)} />
        <Select data-testid="admin-pd-format" value={expected_format} onChange={e => setExpectedFormat(e.target.value as any)}>
          {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
        </Select>
      </Row>
      <Textarea data-testid="admin-pd-template" id="prompt-editor-ta" value={template} onChange={e => setTemplate(e.target.value)} />
      <div style={{ display:'flex', gap: 8, flexWrap:'wrap' }}>
        {(vars || []).map(v => (
          <Button data-testid={`admin-pd-var-${v.namespace}-${v.var_key}`} key={v.id} onClick={() => insertToken(v.namespace, v.var_key)} title={v.description || ''}>
            {v.namespace}.{v.var_key}
          </Button>
        ))}
      </div>
      <Small>Tip: Use OR fallbacks like {'{{INPUT.ticker || "TICKER"}}'}</Small>
      <div style={{ display:'flex', gap:8, marginTop:8 }}>
        <Button data-testid="admin-pd-save" onClick={savePrompt}>Save Prompt</Button>
      </div>
      {msg && <Small data-testid="admin-pd-msg">{msg}</Small>}
    </Drawer>
  );
};

