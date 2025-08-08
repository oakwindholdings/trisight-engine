---
type: "manual"
---

# File: .cursor/rules/error-handling.mdc
---
description: Error handling practices
globs: "**/*.ts,**/*.tsx"
alwaysApply: false
---

# Error Handling
- Use ErrorBoundary for components.
- Log errors with logDebug; provide user-friendly messages.
- Handle API failures (e.g., TwelveData rate limits, Supabase errors).