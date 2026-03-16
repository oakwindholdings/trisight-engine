# Pre-Codex Prep Summary

Key gaps found
- Constants drift risk: SECTIONS/FORMATS/PROVIDERS were scattered; centralized into src/models/adminConstants.ts
- Missing test ids: No stable selectors; introduced a canonical scheme and audit list
- Deep-linking not implemented: Proposed URL/state plan for /reports?tab=admin&templateId=...&sectionId=...&mode=preview
- Guardrails: Write endpoints could be called without Admin Key; added guard spec and error banner pattern
- Telemetry: No unified events; published event names + payload schema and insertion points
- Fixture coverage: Added 2 templates, 8 prompts, 8 sections, variables, and preview inputs in both SQL and JSON

Ambiguities resolved
- Canonical entity definitions and API envelope shape
- Expected response structure for preview (ApiEnvelope or direct result) — mandate envelope with success/data
- Provider list consolidated and aligned with UI options
- Section keys explicitly enumerated for Codex

Recommendations for Codex hand-off
- Adopt data-testid exactly as specified; add them in UI before large UX refactors
- Use adminConstants.ts for any section/provider/format lists
- Use deep-link params as the only source of truth for initial Admin state
- Emit telemetry per telemetrySpec.md and use it for UX iteration analysis
- Seed dev/preview envs with fixtures.sql or fixtures.json for consistent demos
- Keep Admin Key out of client bundles; enter via UI and store in localStorage only

Open questions (flagged)
- Do we standardize preview response shape strictly as { success, data }? If server returns raw object, we should normalize client-side.
- Do we add RBAC beyond a single admin key? Future: Supabase auth with RLS policies for per-user admin.

