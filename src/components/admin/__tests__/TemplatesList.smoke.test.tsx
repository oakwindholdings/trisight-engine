jest.mock('../../../services/adminApi');

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TemplatesList } from '../TemplatesList';

jest.mock('../../../services/adminApi');

test('TemplatesList exposes critical testids', async () => {
  const onSelect = jest.fn();
  render(<TemplatesList onSelect={onSelect} />);

  expect(await screen.findByTestId('admin-templateslist-adminkey-input')).toBeInTheDocument();
  fireEvent.change(screen.getByTestId('admin-templateslist-adminkey-input'), { target: { value: 'KEY' } });
  fireEvent.click(screen.getByTestId('admin-templateslist-save-adminkey'));

  fireEvent.change(screen.getByTestId('admin-templateslist-new-name'), { target: { value: 'New T' } });
  fireEvent.change(screen.getByTestId('admin-templateslist-new-desc'), { target: { value: 'Desc' } });
  fireEvent.click(screen.getByTestId('admin-templateslist-create'));

  const list = await screen.findByTestId('admin-templateslist-list');
  expect(list).toBeInTheDocument();
  expect(list.querySelector('[data-testid="admin-templateslist-row-t1"]')).toBeTruthy();
});



// Empty state lock: when API returns no templates, show placeholder
it('TemplatesList shows empty state when no items', async () => {
  const onSelect = jest.fn();
  const api = require('../../../services/adminApi');
  // Override listTemplates for refresh to return empty
  (api as any).listTemplates = jest.fn(async () => []);
  render(<TemplatesList onSelect={onSelect} />);
  // Trigger a refresh to use the new mock
  const refreshBtn = await screen.findByTestId('admin-templateslist-refresh');
  fireEvent.click(refreshBtn);
  const list = await screen.findByTestId('admin-templateslist-list');
  expect(list).toBeInTheDocument();
  expect(await screen.findByTestId('admin-templateslist-empty')).toBeInTheDocument();
});
