// src/components/Reports/TemplateDropdown.tsx
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { listTemplates, ReportTemplate } from '../../services/adminApi';

const Wrap = styled.div`
  display: inline-flex; align-items: center; gap: 8px;
`;
const Label = styled.label`
  font-size: 0.85rem; color: #374151;
`;
const Select = styled.select`
  border: 1px solid #d1d5db; padding: 6px 8px; border-radius: 6px; min-width: 220px; background: #fff;
`;

const STORAGE_KEY = 'trisight_selected_template_id';

export const TemplateDropdown: React.FC = () => {
  const [items, setItems] = useState<ReportTemplate[]>([]);
  const [val, setVal] = useState<string | ''>('');

  useEffect(() => {
    (async () => {
      try {
        const t = await listTemplates();
        setItems(t);
        const saved = localStorage.getItem(STORAGE_KEY) || '';
        if (saved && t.some(x => x.id === saved)) setVal(saved);
      } catch {}
    })();
  }, []);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    setVal(v);
    try { localStorage.setItem(STORAGE_KEY, v); } catch {}
  }

  return (
    <Wrap>
      <Label>Template</Label>
      <Select value={val} onChange={onChange} aria-label="Select report template">
        <option value="">Default (4 sections)</option>
        {items.map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </Select>
    </Wrap>
  );
};

