// src/components/admin/TemplatesList.tsx
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { createTemplate, listTemplates, ReportTemplate, setStoredAdminKey, getStoredAdminKey } from '../../services/adminApi';

const Container = styled.div`
  display: flex; flex-direction: column; gap: 12px;
`;
const Row = styled.div`
  display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff;
`;
const Actions = styled.div` display: flex; gap: 8px; align-items: center; `;
const Button = styled.button`
  padding: 6px 10px; border: 1px solid #d1d5db; background: #fff; border-radius: 6px; cursor: pointer; font-size: 0.9rem;
  &:hover { background: #f9fafb; }
`;
const Input = styled.input`
  border: 1px solid #d1d5db; padding: 6px 8px; border-radius: 6px; width: 100%;
`;
const Label = styled.label` font-size: 0.85rem; color: #374151; `;

export const TemplatesList: React.FC<{ onSelect: (t: ReportTemplate) => void } > = ({ onSelect }) => {
  const [items, setItems] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [adminKey, setAdminKey] = useState(getStoredAdminKey() || '');
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setLoading(true); setError(null);
      const data = await listTemplates();
      setItems(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load templates');
    } finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, []);

  function saveAdminKey() { setStoredAdminKey(adminKey); }

  async function handleCreate() {
    try {
      setError(null);
      if (!name.trim()) return;
      const t = await createTemplate(name.trim(), desc.trim(), adminKey);
      setName(''); setDesc('');
      setItems(prev => [t, ...prev]);
    } catch (e: any) { setError(e?.message || 'Create template failed'); }
  }

  return (
    <Container>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Label>Admin Key</Label>
        <Input data-testid="admin-templateslist-adminkey-input" value={adminKey} onChange={e => setAdminKey(e.target.value)} placeholder="X-Admin-Key" />
        <Button data-testid="admin-templateslist-save-adminkey" onClick={saveAdminKey}>Save</Button>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Input data-testid="admin-templateslist-new-name" placeholder="Template name" value={name} onChange={e => setName(e.target.value)} />
        <Input data-testid="admin-templateslist-new-desc" placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
        <Button data-testid="admin-templateslist-create" onClick={handleCreate}>New Template</Button>
        <Button data-testid="admin-templateslist-refresh" onClick={refresh}>{loading ? 'Loading...' : 'Refresh'}</Button>
      </div>

      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      <div data-testid="admin-templateslist-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(t => (
          <Row key={t.id} data-testid={`admin-templateslist-row-${t.id}`}>
            <div>
              <div style={{ fontWeight: 600 }}>{t.name}</div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{t.description}</div>
            </div>
            <Actions>
              <Button data-testid={`admin-templateslist-edit-${t.id}`} onClick={() => onSelect(t)}>Edit</Button>
            </Actions>
          </Row>
        ))}
      </div>
    </Container>
  );
};

