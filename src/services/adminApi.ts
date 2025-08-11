// src/services/adminApi.ts
// Supabase-backed admin API client (serverless-safe). Uses header X-Admin-Key for writes.

export interface ReportTemplate {
  id: string; name: string; description?: string | null; is_default?: boolean; updated_at?: string;
  sections?: TemplateSection[];
}
export interface TemplateSection {
  id: string; template_id: string; section_key: string; prompt_id?: string | null;
  position: number; enabled: boolean; expected_format: 'markdown'|'json'|'bullets';
}
export interface PromptRow {
  id: string; section_key: string; provider: string; model?: string | null; template: string;
  expected_format: 'markdown'|'json'|'bullets'; output_schema?: any; variables_hint?: any;
  max_tokens?: number | null; temperature?: number | null; enabled: boolean; updated_at?: string;
}
export interface VariableRow { id: string; namespace: string; var_key: string; label?: string; example?: string; description?: string; enabled: boolean; }

const json = (r: Response) => r.json();
function adminHeaders(adminKey?: string) {
  const headers: Record<string,string> = { 'Content-Type': 'application/json' };
  if (adminKey) headers['X-Admin-Key'] = adminKey;
  return headers;
}
export function getStoredAdminKey(): string | undefined {
  try { return localStorage.getItem('trisight_admin_key') || undefined; } catch { return undefined; }
}
export function setStoredAdminKey(key: string) { try { localStorage.setItem('trisight_admin_key', key); } catch {} }

// Templates
export async function listTemplates(): Promise<ReportTemplate[]> {
  const res = await fetch('/api/admin/report-templates');
  const data = await json(res);
  if (!data?.success) throw new Error(data?.message || data?.code || 'TEMPLATES_FETCH');
  return data.data || [];
}
export async function createTemplate(name: string, description: string, adminKey?: string): Promise<ReportTemplate> {
  const res = await fetch('/api/admin/report-templates', { method: 'POST', headers: adminHeaders(adminKey || getStoredAdminKey()), body: JSON.stringify({ name, description }) });
  const data = await json(res);
  if (!data?.success) throw new Error(data?.message || data?.code || 'TEMPLATE_CREATE');
  return data.data;
}

// Template sections
export async function addTemplateSection(input: { templateId: string; section_key: string; prompt_id?: string | null; position?: number; expected_format?: 'markdown'|'json'|'bullets'; enabled?: boolean }, adminKey?: string): Promise<TemplateSection> {
  const res = await fetch('/api/admin/report-templates-sections', { method: 'POST', headers: adminHeaders(adminKey || getStoredAdminKey()), body: JSON.stringify(input) });
  const data = await json(res);
  if (!data?.success) throw new Error(data?.message || data?.code || 'SECTION_CREATE');
  return data.data;
}
export async function updateTemplateSection(id: string, patch: Partial<Pick<TemplateSection, 'prompt_id'|'position'|'expected_format'|'enabled'|'section_key'>>, adminKey?: string): Promise<TemplateSection> {
  const qp = new URLSearchParams({ id });
  const res = await fetch(`/api/admin/report-templates-sections?${qp.toString()}`, { method: 'PUT', headers: adminHeaders(adminKey || getStoredAdminKey()), body: JSON.stringify(patch) });
  const data = await json(res);
  if (!data?.success) throw new Error(data?.message || data?.code || 'SECTION_UPDATE');
  return data.data;
}

// Prompts
export async function listPrompts(params?: { section_key?: string; provider?: string; search?: string }): Promise<PromptRow[]> {
  const qp = new URLSearchParams();
  if (params?.section_key) qp.set('section_key', params.section_key);
  if (params?.provider) qp.set('provider', params.provider);
  if (params?.search) qp.set('search', params.search);
  const res = await fetch(`/api/admin/prompts${qp.size ? `?${qp.toString()}` : ''}`);
  const data = await json(res);
  if (!data?.success) throw new Error(data?.message || data?.code || 'PROMPTS_FETCH');
  return data.data || [];
}
export async function createPrompt(input: Omit<PromptRow,'id'|'updated_at'|'enabled'> & { enabled?: boolean }, adminKey?: string): Promise<PromptRow> {
  const res = await fetch('/api/admin/prompts', { method: 'POST', headers: adminHeaders(adminKey || getStoredAdminKey()), body: JSON.stringify(input) });
  const data = await json(res);
  if (!data?.success) throw new Error(data?.message || data?.code || 'PROMPT_CREATE');
  return data.data;
}
export async function updatePrompt(id: string, patch: Partial<PromptRow>, adminKey?: string): Promise<PromptRow> {
  const qp = new URLSearchParams({ id });
  const res = await fetch(`/api/admin/prompts?${qp.toString()}`, { method: 'PUT', headers: adminHeaders(adminKey || getStoredAdminKey()), body: JSON.stringify(patch) });
  const data = await json(res);
  if (!data?.success) throw new Error(data?.message || data?.code || 'PROMPT_UPDATE');
  return data.data;
}

// Variables
export async function listVariables(): Promise<VariableRow[]> {
  const res = await fetch('/api/admin/variables');
  const data = await json(res);
  if (!data?.success) throw new Error(data?.message || data?.code || 'VARS_FETCH');
  return data.data || [];
}

// Generate flow (client-side orchestration)
export async function generateComprehensive(input: { ticker: string; timeframe: string; templateId?: string }) {
  const res = await fetch('/api/reports/generate-comprehensive', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  const data = await json(res);
  if (!data?.success) throw new Error(data?.message || data?.code || 'COMPREHENSIVE');
  return data;
}
export async function generatePdf(ticker: string, reportData: any) {
  const res = await fetch('/api/reports/generate-complete-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticker, reportData }) });
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const j = await res.json();
    throw new Error(j?.code || 'PDF_JSON_ERROR');
  }
  const blob = await res.blob();
  return blob;
}

