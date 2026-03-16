// TriSight Admin API Interfaces (frozen for Codex)
// Aligns with src/services/adminApi.ts and server routes

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export interface ReportTemplate { id: string; name: string; description?: string | null; is_default?: boolean; updated_at?: string; sections?: TemplateSection[] }
export interface TemplateSection { id: string; template_id: string; section_key: string; prompt_id?: string | null; position: number; enabled: boolean; expected_format: 'markdown'|'json'|'bullets' }
export interface PromptRow { id: string; section_key: string; provider: string; model?: string | null; template: string; expected_format: 'markdown'|'json'|'bullets'; output_schema?: any; variables_hint?: any; max_tokens?: number | null; temperature?: number | null; enabled: boolean; updated_at?: string; }
export interface VariableRow { id: string; namespace: string; var_key: string; label?: string; example?: string; description?: string; enabled: boolean; }

export type ExpectedFormat = 'markdown'|'json'|'bullets';
export type Provider = 'anthropic'|'openai'|'perplexity'|'firecrawl'|'twelvedata'|'hybrid'|'heuristic';

export interface PreviewRunRequest {
  section_key: string;
  inputs: { ticker: string; timeframe: string };
  override?: { provider?: Provider; expected_format?: ExpectedFormat; template?: string };
}
export interface PreviewRunResult { content: string | object; format: ExpectedFormat; meta?: { provider?: Provider; latencyMs?: number } }

// HTTP Contracts
export interface EndpointSpec {
  method: 'GET'|'POST'|'PUT';
  path: string;
  headers?: Record<string,string>;
  request?: any;
  response: any;
  errors?: Array<{ code: string; message: string; http: number }>;
}

export const AdminEndpoints: EndpointSpec[] = [
  // Templates
  { method: 'GET', path: '/api/admin/report-templates', response: {} as ApiEnvelope<ReportTemplate[]>, errors: [] },
  { method: 'POST', path: '/api/admin/report-templates', headers: { 'X-Admin-Key': '<required>' }, request: { name: '<string>', description: '<string>' }, response: {} as ApiEnvelope<ReportTemplate>, errors: [
    { code: 'TEMPLATE_CREATE', message: 'Create template failed', http: 400 }
  ]},

  // Template Sections
  { method: 'POST', path: '/api/admin/report-templates-sections', headers: { 'X-Admin-Key': '<required>' }, request: { templateId: '<string>', section_key: '<string>', prompt_id: '<string|null>?', position: '<number>?', expected_format: '<ExpectedFormat>?', enabled: '<boolean>?' }, response: {} as ApiEnvelope<TemplateSection>, errors: [
    { code: 'SECTION_CREATE', message: 'Section create failed', http: 400 }
  ]},
  { method: 'PUT', path: '/api/admin/report-templates-sections?id={id}', headers: { 'X-Admin-Key': '<required>' }, request: { prompt_id: '<string|null>?', position: '<number>?', expected_format: '<ExpectedFormat>?', enabled: '<boolean>?', section_key: '<string>?' }, response: {} as ApiEnvelope<TemplateSection>, errors: [
    { code: 'SECTION_UPDATE', message: 'Section update failed', http: 400 }
  ]},

  // Prompts
  { method: 'GET', path: '/api/admin/prompts?section_key=&provider=&search=', response: {} as ApiEnvelope<PromptRow[]>, errors: [
    { code: 'PROMPTS_FETCH', message: 'Failed to load prompts', http: 400 }
  ]},
  { method: 'POST', path: '/api/admin/prompts', headers: { 'X-Admin-Key': '<required>' }, request: { section_key: '<string>', provider: '<Provider>', model: '<string?>', template: '<string>', expected_format: '<ExpectedFormat>', enabled: '<boolean>' }, response: {} as ApiEnvelope<PromptRow>, errors: [
    { code: 'PROMPT_CREATE', message: 'Create prompt failed', http: 400 }
  ]},
  { method: 'PUT', path: '/api/admin/prompts?id={id}', headers: { 'X-Admin-Key': '<required>' }, request: '<Partial<PromptRow>>', response: {} as ApiEnvelope<PromptRow>, errors: [
    { code: 'PROMPT_UPDATE', message: 'Prompt update failed', http: 400 }
  ]},

  // Variables
  { method: 'GET', path: '/api/admin/variables', response: {} as ApiEnvelope<VariableRow[]>, errors: [
    { code: 'VARS_FETCH', message: 'Failed to load variables', http: 400 }
  ]},

  // Preview
  { method: 'POST', path: '/api/admin/preview-section', headers: { 'X-Admin-Key': '<required>' }, request: {} as PreviewRunRequest, response: {} as ApiEnvelope<{ data: PreviewRunResult } | PreviewRunResult>, errors: [
    { code: 'PREVIEW', message: 'Preview failed', http: 400 }
  ]}
];

