// src/pages/ReportsAdmin.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { TemplatesList } from '../components/admin/TemplatesList';
import { TemplateEditor } from '../components/admin/TemplateEditor';
import { PromptDrawer } from '../components/admin/PromptDrawer';
import type { ReportTemplate } from '../services/adminApi';

const Page = styled.div` display:flex; gap: 16px; padding: 16px; `;
const Column = styled.div` flex: 1; min-width: 0; `;

const ReportsAdmin: React.FC = () => {
  const [selected, setSelected] = useState<ReportTemplate | null>(null);
  return (
    <Page>
      <Column>
        <h2>Templates</h2>
        <TemplatesList onSelect={setSelected} />
        <div style={{ height: 16 }} />
        <h2>Editor</h2>
        <TemplateEditor template={selected} onChanged={setSelected} />
      </Column>
      <PromptDrawer />
    </Page>
  );
};

export default ReportsAdmin;

