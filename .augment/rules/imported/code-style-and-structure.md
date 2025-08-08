---
type: "manual"
---

# File: .cursor/rules/code-style-and-structure.mdc
---
description: Code style and file structure guidelines
globs: "**/*.ts,**/*.tsx"
alwaysApply: false
---

# Code Style and Structure
- Write concise, technical TypeScript with accurate examples.
- Use functional patterns; prefer hooks over classes.
- Avoid duplication via iteration/modularization.
- Use descriptive names (e.g., isDetecting, hasFeedback).
- Structure files as:
  src/
  ├── api/            # API integrations (e.g., twelveDataApi.ts)
  ├── components/     # React components (e.g., Chart/, Patterns/)
  ├── contexts/       # React contexts (e.g., PatternContext.tsx)
  ├── hooks/          # Custom hooks (e.g., usePatterns.ts)
  ├── models/         # Types/interfaces (e.g., PatternTypes.ts)
  ├── pages/          # Page components (e.g., TargetsPage.tsx)
  ├── patternEngine/  # Detection logic (e.g., blackjack.ts)
  ├── utils/          # Helpers (e.g., patternDetection/, audit/)
- Add 3-line headers: // path // Description // Context.