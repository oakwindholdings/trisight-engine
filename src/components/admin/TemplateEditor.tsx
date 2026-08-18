// src/components/admin/TemplateEditor.tsx
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { ReportTemplate, TemplateSection, addTemplateSection, listPrompts, PromptRow, updateTemplateSection, getStoredAdminKey } from '../../services/adminApi';
import { SectionPreview } from './SectionPreview';
import { SECTIONS as KNOWN_SECTIONS, FORMATS } from '../../models/adminConstants';

const Container = styled.div` display: flex; flex-direction: column; gap: 12px; `;
const Row = styled.div` display: flex; gap: 8px; align-items: center; flex-wrap: wrap; `;
const Card = styled.div` border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; padding: 10px; `;
const Button = styled.button` padding: 6px 10px; border: 1px solid #d1d5db; background: #fff; border-radius: 6px; cursor: pointer; font-size: 0.9rem; &:hover { background: #f9fafb; }`;
const Select = styled.select` border: 1px solid #d1d5db; padding: 6px 8px; border-radius: 6px; `;
const Input = styled.input` border: 1px solid #d1d5db; padding: 6px 8px; border-radius: 6px; `;
const TitleText = styled.div` font-weight: 600; min-width: 220px; `;
const PosTag = styled.span` color: #6b7280; `;
const PreviewWrap = styled.div` margin-top: 10px; `;

export const TemplateEditor: React.FC<{ template: ReportTemplate | null, onChanged?: (t: ReportTemplate) => void } > = ({ template, onChanged }) => {
  const [rows, setRows] = useState<TemplateSection[]>(template?.sections || []);
  const [newKey, setNewKey] = useState('executive_summary');
  const [newFmt, setNewFmt] = useState<'markdown'|'json'|'bullets'>('markdown');
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const adminKey = getStoredAdminKey();

  useEffect(() => { setRows(template?.sections || []); }, [template?.id]);
  useEffect(() => { (async () => { try { const p = await listPrompts(); setPrompts(p); } catch {} })(); }, []);

  const ordered = useMemo(() => (rows || []).slice().sort((a,b) => (a.position ?? 0) - (b.position ?? 0)), [rows]);

  if (!template) return <div>Select a template</div>;

  async function addRow() {
    if (!template) return;
    const pos = (rows?.length || 0);
    const created = await addTemplateSection({ templateId: template.id, section_key: newKey, expected_format: newFmt, position: pos, enabled: true }, adminKey);
    const next: ReportTemplate = { ...template, sections: [ ...(template.sections||[]), created ] };
    setRows(next.sections!); onChanged?.(next);
  }

  async function bindPrompt(row: TemplateSection, prompt_id: string | null) {
    const updated = await updateTemplateSection(row.id, { prompt_id }, adminKey);
    const next = (rows || []).map(r => r.id === row.id ? updated : r);
    setRows(next); onChanged?.({ ...(template as any), sections: next });
  }

  async function toggleEnabled(row: TemplateSection) {
    const updated = await updateTemplateSection(row.id, { enabled: !row.enabled }, adminKey);
    const next = (rows || []).map(r => r.id === row.id ? updated : r);
    setRows(next); onChanged?.({ ...(template as any), sections: next });
  }

  async function updateFormat(row: TemplateSection, expected_format: 'markdown'|'json'|'bullets') {
    const updated = await updateTemplateSection(row.id, { expected_format }, adminKey);
    const next = (rows || []).map(r => r.id === row.id ? updated : r);
    setRows(next); onChanged?.({ ...(template as any), sections: next });
  }

  async function move(row: TemplateSection, dir: -1 | 1) {
    const arr = (ordered || []);
    const idx = arr.findIndex(r => r.id === row.id);
    if (idx < 0) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= arr.length) return;
    const a = arr[idx], b = arr[swapIdx];
    const aPos = a.position ?? idx, bPos = b.position ?? swapIdx;
    const ua = await updateTemplateSection(a.id, { position: bPos }, adminKey);
    const ub = await updateTemplateSection(b.id, { position: aPos }, adminKey);
    const next = arr.slice();
    next[idx] = ub; next[swapIdx] = ua;
    setRows(next);
    onChanged?.({ ...(template as any), sections: next });
  }

  return (
    <Container>
      <Card>
        <Row>
          <Select data-testid="admin-te-new-key" value={newKey} onChange={e => setNewKey(e.target.value)}>
            {KNOWN_SECTIONS.map(k => <option key={k} value={k}>{k}</option>)}
          </Select>
          <Select data-testid="admin-te-new-format" value={newFmt} onChange={e => setNewFmt(e.target.value as any)}>
            {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
          </Select>
          <Button data-testid="admin-te-add-section" onClick={addRow}>Add Section</Button>
        </Row>
      </Card>

      {(ordered || []).map(r => (
        <Card key={r.id}>
          <Row>
            <TitleText data-testid={`admin-te-sec-key-${r.id}`}>{r.section_key}</TitleText>
            <PosTag data-testid={`admin-te-sec-pos-${r.id}`}>pos {r.position}</PosTag>
            <Select data-testid={`admin-te-sec-format-${r.id}`} value={r.expected_format} onChange={e => updateFormat(r, e.target.value as any)}>
              {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
            <Button data-testid={`admin-te-sec-toggle-${r.id}`} onClick={() => toggleEnabled(r)}>{r.enabled ? 'Disable' : 'Enable'}</Button>
            <Button data-testid={`admin-te-sec-up-${r.id}`} onClick={() => move(r, -1)}>Up</Button>
            <Button data-testid={`admin-te-sec-down-${r.id}`} onClick={() => move(r, 1)}>Down</Button>
          </Row>
          <Row>
            <label>Bind Prompt:</label>
            <Select data-testid={`admin-te-sec-prompt-${r.id}`} value={r.prompt_id || ''} onChange={e => bindPrompt(r, e.target.value || null)}>
              <option value="">Default</option>
              {prompts.filter(p => p.section_key === r.section_key).map(p => (
                <option key={p.id} value={p.id}>{p.provider} • {p.model || ''} • {new Date(p.updated_at||'').toLocaleString()}</option>
              ))}
            </Select>
          </Row>
          <PreviewWrap data-testid={`admin-te-sec-prev-${r.id}`}>
            <SectionPreview section_key={r.section_key} />
          </PreviewWrap>
        </Card>
      ))}

    </Container>
  );
};

