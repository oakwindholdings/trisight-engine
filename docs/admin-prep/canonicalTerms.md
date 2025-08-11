# TriSight Admin UI Canonical Terms

| Entity Name   | Definition | Primary Fields | DB Table/Schema | API Endpoints Used |
|---|---|---|---|---|
| Template | A report template definition containing ordered Sections and meta | id, name, description, is_default, updated_at, sections[] | report_templates | GET/POST /api/admin/report-templates |
| Section | One logical part of a Template, optionally bound to a Prompt | id, template_id, section_key, prompt_id, position, enabled, expected_format | report_template_sections | POST/PUT /api/admin/report-templates-sections |
| Prompt | A provider/model/template instruction used to generate a Section’s content | id, section_key, provider, model, template, expected_format, output_schema, variables_hint, max_tokens, temperature, enabled, updated_at | prompts | GET/POST/PUT /api/admin/prompts |
| Variable | A token (namespace.var_key) that can be used inside Prompt templates | id, namespace, var_key, label, example, description, enabled | variables | GET /api/admin/variables |
| Preview Run | A server-side dry-run that renders a Section with override Prompt + inputs | inputs: {ticker, timeframe}, override: {provider, expected_format, template}, result: {content, format, meta} | n/a (ephemeral) | POST /api/admin/preview-section |
| Generate Job | A full report generation request (non-admin) used for parity with admin preview | ticker, timeframe, templateId, output assets | n/a (service) | POST /api/reports/generate-comprehensive |
| Admin Key | Shared secret required for write admin endpoints | header: X-Admin-Key | n/a (secret) | All POST/PUT under /api/admin/* |
| Provider | Upstream content provider for prompts | 'anthropic'|'openai'|'perplexity'|'firecrawl'|'twelvedata'|'hybrid'|'heuristic' | n/a | used in /api/admin/prompts, /api/admin/preview-section |
| Expected Format | Output contract for prompt | 'markdown'|'json'|'bullets' | n/a | used in sections/prompts/preview |

Notes
- Section keys currently allowed: executive_summary, investment_thesis, risk_assessment, citations (centralized in adminConstants.ts)
- All write endpoints require X-Admin-Key; reads do not.
- Standard response envelope: { success: boolean; data?: any; error?: string; code?: string; message?: string }

