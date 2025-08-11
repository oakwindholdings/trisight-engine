# Admin Telemetry + Guardrails

Event Names
- admin.templates.load
- admin.templates.create
- admin.templates.select
- admin.templateSections.add
- admin.templateSections.update
- admin.prompts.create
- admin.preview.run
- admin.preview.success
- admin.preview.error

Payload Schema (common fields)
```
{
  template_id?: string,
  section_id?: string,
  section_key?: string,
  provider?: string,
  expected_format?: 'markdown'|'json'|'bullets',
  status?: 'ok'|'error',
  latency_ms?: number
}
```

UI Insertion Points
- TemplatesList
  - load: after listTemplates() resolves
  - create: after successful createTemplate
  - select: onSelect(template)
- TemplateEditor
  - section add/update: after successful POST/PUT for sections
- PromptDrawer
  - prompts.create: after successful prompt creation
- SectionPreview
  - preview.run: before POST /preview-section
  - preview.success/error: after response

Guardrails: Missing Admin Key
- Rule: All writes (POST/PUT) are blocked when X-Admin-Key missing
- UI: Inline error banner at top of TemplatesList and TemplateEditor panels when a write action is attempted without key
- Example error JSON
```
{ "code": "ADMIN_KEY_REQUIRED", "message": "Admin Key is required for this action. Go to Templates > Admin Key and save it first.", "severity": "error" }
```

Implementation Notes
- Read admin key from localStorage('trisight_admin_key') before any write call; if empty, set local error state and abort.
- Log telemetry via a centralized logger: logEvent(name, payload)
- Include timing for preview: measure start/end around fetch

