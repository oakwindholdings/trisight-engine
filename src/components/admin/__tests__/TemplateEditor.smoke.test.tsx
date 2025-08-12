jest.mock('../../../services/adminApi');

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TemplateEditor } from '../TemplateEditor';

jest.mock('../../../services/adminApi', () => ({
  addTemplateSection: jest.fn(async ({ section_key, expected_format }) => ({ id: 's2', template_id: 't1', section_key, expected_format, position: 1, enabled: true })),
  listPrompts: jest.fn(async () => ([{ id: 'p1', section_key: 'executive_summary', provider: 'anthropic', template: '', expected_format: 'markdown', enabled: true }])),
  updateTemplateSection: jest.fn(async (_id: string, patch: any) => ({ id: 's1', template_id: 't1', section_key: 'executive_summary', expected_format: patch.expected_format || 'markdown', position: 0, enabled: patch.enabled ?? true, prompt_id: patch.prompt_id ?? null })),
  getStoredAdminKey: jest.fn(() => 'KEY')
}));

test('TemplateEditor exposes critical testids', async () => {
  const tpl = { id: 't1', name: 'T1', sections: [{ id: 's1', template_id: 't1', section_key: 'executive_summary', position: 0, enabled: true, expected_format: 'markdown' }] } as any;
  render(<TemplateEditor template={tpl} />);

  expect(screen.getByTestId('admin-te-new-key')).toBeInTheDocument();
  expect(screen.getByTestId('admin-te-new-format')).toBeInTheDocument();
  expect(screen.getByTestId('admin-te-add-section')).toBeInTheDocument();

  expect(await screen.findByTestId('admin-te-sec-key-s1')).toBeInTheDocument();
  fireEvent.change(screen.getByTestId('admin-te-sec-format-s1'), { target: { value: 'json' } });
  fireEvent.click(screen.getByTestId('admin-te-sec-toggle-s1'));
});

