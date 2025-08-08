---
type: "manual"
---

# File: .cursor/rules/ui-and-styling.mdc
---
description: UI and styling best practices
globs: "src/components/**/*.tsx,src/pages/**/*.tsx"
alwaysApply: false
---

# UI and Styling
- Styled-components with theme tokens.
- Ensure accessibility (ARIA labels, keyboard nav).
- Support responsive/mobile charts via D3.
- Optimize D3 for 10,000+ data points; use Web Workers for heavy computations.