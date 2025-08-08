---
type: "manual"
---

# File: .cursor/rules/typescript-usage.mdc
---
description: TypeScript best practices
globs: "**/*.ts,**/*.tsx"
alwaysApply: false
---

# TypeScript Usage
- Use TypeScript everywhere; prefer interfaces over types.
- Avoid enums; use const objects with 'as const'.
- Explicit return types for functions.
- Absolute imports: @/src/...