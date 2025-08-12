// Manual Jest mock for adminApi used by admin smoke tests
export const listTemplates = async () => ([
  { id: 't1', name: 'Earnings Snapshot', description: 'Mock' },
  { id: 't2', name: 'Momentum Playbook', description: 'Mock' }
]);

export const createTemplate = async (name: string, description?: string) => ({
  id: 't3', name, description: description || ''
});

export const listPrompts = async () => ([
  { id: 'p_exec', section_key: 'executive_summary', provider: 'anthropic', model: 'claude', template: '', expected_format: 'markdown', enabled: true },
  { id: 'p_thesis', section_key: 'investment_thesis', provider: 'openai', model: 'gpt', template: '', expected_format: 'bullets', enabled: true },
  { id: 'p_risk', section_key: 'risk_assessment', provider: 'perplexity', model: 'sonar', template: '', expected_format: 'markdown', enabled: true },
  { id: 'p_cites', section_key: 'citations', provider: 'firecrawl', model: null, template: '', expected_format: 'json', enabled: true },
]);

export const listVariables = async () => ([
  { id: 'v1', namespace: 'INPUT', var_key: 'ticker', label: 'Ticker', enabled: true }
]);

export const setStoredAdminKey = (_: string) => {};
export const getStoredAdminKey = () => 'KEY';

export const addTemplateSection = async ({ templateId, section_key, expected_format, position, enabled }: any) => ({
  id: 's2', template_id: templateId, section_key, expected_format, position, enabled
});

export const updateTemplateSection = async (id: string, patch: any) => ({
  id, template_id: 't1', section_key: 'executive_summary', expected_format: patch.expected_format || 'markdown', position: 0, enabled: patch.enabled ?? true, prompt_id: patch.prompt_id ?? null
});

export type ReportTemplate = any;
export type TemplateSection = any;
export type PromptRow = any;
export type VariableRow = any;

