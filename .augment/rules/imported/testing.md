---
type: "always_apply"
---

Testing Guidelines
Overview

Automate test script and Page Object Model (POM) generation/updates with Claude via MCP in Cursor for unit, integration, and E2E tests.
Use Vercel CI to auto-run tests on commits/previews.
Target 85%+ code coverage; prioritize critical paths (auth, data flows, UI interactions).
Claude monitors codebase changes (additions, updates, deletions) in src and api to generate or update test scripts and POMs.

Chc
Unit/Component Tests (Jest + React Testing Library)

Scope: React hooks, components, utils (TS/JS), Supabase client logic (e.g., auth, queries).
Guidelines:
Claude auto-generates Jest tests with RTL for new/updated components/hooks in src/** lacking tests.
Mock Supabase client (@supabase/supabase-js) using jest.mock; cover edge cases (empty data, null responses, invalid inputs).
Update tests when components/hooks change (e.g., new props, Supabase query changes).
Use describe/it blocks for clear structure.
Prompt Claude: "Scan src for new/updated components/hooks, generate or update Jest tests, mock Supabase queries, cover edge cases."


Example:
For useAuth hook: Generate/update tests for signInWithPassword success, failure, rate limits.


Coverage: 90% for utils/hooks, 80% for components.

Integration Tests (Pytest)

Scope: Python backend (Vercel functions), Supabase DB operations (queries, auth, RLS).
Guidelines:
Claude generates/updates Pytest scripts with pytest-asyncio for new/updated Supabase endpoints in api/**.
Auto-create or revise fixtures for Supabase schema (e.g., seed users, tables) via MCP.
Test edge cases: DB connection failures, RLS violations, invalid tokens.
Prompt Claude: "Scan api for new/updated Supabase endpoints, generate or update Pytest suite, include fixtures for [table], test error cases."


Example:
For get_user_data: Generate/update tests to verify query results, handle 404s.


Coverage: 85% for backend logic.

E2E Tests (Playwright + Cypress with POM)

Scope: Full-stack flows (React UI + Supabase backend), e.g., login, data rendering, CRUD ops.
Page Object Models (POMs):
Claude generates/updates POMs for each major UI page/feature (e.g., LoginPage, DashboardPage) in e2e/pages/.
Structure: Separate files per page, with methods for actions (e.g., login(email, password)) and assertions.
Update POMs when UI changes (e.g., new selectors, modified flows).
Prompt Claude: "Scan src for new/updated UI components, generate or update POM for [page/feature], save to e2e/pages/."


Playwright (Primary):
Generate/update test scripts for each user journey, referencing POMs.
Use MCP to run tests, capture screenshots, debug failures.
Test Vercel preview URLs for prod-like environments.
Prompt Claude: "Scan src for UI changes, generate or update Playwright tests using POMs, simulate Supabase auth, debug failures."


Cypress (Secondary):
Generate/update specs referencing POMs; use cy.intercept for Supabase mocks.
Prompt Claude: "Generate or update Cypress spec for [UI flow] using POM, mock Supabase API, verify UI state."


Guidelines:
Auto-generate/update tests for critical paths: auth, CRUD, error states (e.g., API timeouts).
Use POMs to encapsulate selectors and actions for maintainability.
Seed Supabase DB via Claude/MCP fixtures.
Run on Vercel CI: Trigger on PRs/deploys.


Example POM (Playwright):// e2e/pages/LoginPage.ts
import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}
  async goto() { await this.page.goto('/login'); }
  async login(email: string, password: string) {
    await this.page.fill('#email', email);
    await this.page.fill('#password', password);
    await this.page.click('button[type="submit"]');
  }
  async expectError() {
    await expect(this.page.locator('.error')).toBeVisible();
  }
}


Coverage: 80% of critical paths; prioritize happy paths + edge cases.

Automation Workflow

Claude + MCP:
Claude scans src and api for changes, generates/updates test scripts and POMs via MCP.
Use Cursor Composer: "Monitor codebase changes, identify new/updated components/endpoints, generate or update Jest/Pytest/Playwright tests with POMs, run, refine failures."
MCP executes tests and parses logs for Claude to suggest fixes.


Vercel CI:
Add scripts: test:unit (Jest), test:integration (Pytest), test:e2e (Playwright/Cypress).
Configure Vercel to run on commits/previews; Claude reviews logs.


Prompt Example: "Analyze [test failure log], update POM/test script, rerun via MCP."

Best Practices

Change Detection: Claude checks for additions, updates, deletions on save or commit.
Test Case Updates: Regenerate tests/POMs for modified code; archive obsolete tests.
Mocks: Use Jest/Cypress mocks for Supabase; avoid live DB in unit/E2E.
Coverage: Run jest --coverage and playwright test --reporter; maintain 85%+.
Error Handling: Include try-catch in async tests; Claude refines failures.
Refinement Prompt: "Debug [test file/POM], fix errors, regenerate, rerun."
