# AGENTS.md – TriSight Intelligence System

> This file defines how AI agents, tools, and collaborators operate within the TriSight codebase. It provides organizational context, contribution guidance, system expectations, and behavioral rules for Codex- and Claude-style agent interactions.

---

# MODUS OPERANDI
- You are here to build and maintain the AI-powered TriSight platform.
- Avoid feature creep. Avoid over-engineering. Avoid unnecessary abstraction.
- Execute exactly what is requested—no more, no less.
- Prioritize **clean**, **simple**, and **modular** code.
- Prefer brevity and clarity in logic, documentation, and comments.
- Do not introduce complexity unless justified. **SIMPLE = GOOD**.
- Check that you've implemented **every requirement fully and exactly**.
- Never rename or move files unless instructed. Minimize friction.

---

# TECH STACK
- **Frontend**: React (Create-React-App + TypeScript) — `/src/`
- **Backend**: Node.js for local CLI/dev scripts
- **AI Logic**: Python/TS-based agent logic via Codex/Windsurf
- **Data Handling**: Static datasets; integrated with TwelveData.com APIs
- **Storage**: Local FS, browser state, no mock API hooks
- **Auth**: TBD (MVP uses client-side context)
- **CI/CD**: GitHub Actions (test + lint + deploy stub)
- **Visualization**: D3 (time scaling), mermaid (architecture diagrams)

---

# CURRENT FILE STRUCTURE
Below is the current, deeply nested directory structure for TriSight. This layout is considered canonical for all Codex, Claude, and Windsurf agent operations.

trisight-equity-analyst/  
├── build/  
│   └── static/  
│       ├── css/  
│       └── js/  
├── client-package/  
│   └── build/  
│       └── static/  
│           ├── css/  
│           └── js/  
├── public/  
└── src/  
    ├── api/  
    ├── cascades/  
    │   └── introspection/  
    ├── components/  
    │   ├── Analysis/  
    │   ├── Chart/  
    │   ├── Dashboard/  
    │   ├── Feedback/  
    │   ├── Learning/  
    │   ├── Modals/  
    │   ├── Navigation/  
    │   ├── PatternDetails/  
    │   ├── Patterns/  
    │   ├── Settings/  
    │   └── Visualizations/  
    ├── contexts/  
    ├── hooks/  
    ├── models/  
    ├── pages/  
    ├── styles/  
    ├── types/  
    └── utils/  
        ├── learning/  
        ├── patternDetection/  
        │   ├── core/  
        │   └── helper/  
        └── visualization/  

> Do not create or modify files outside `/src/` unless explicitly instructed. Prioritize changes in `/src/hooks`, `/src/utils`, `/src/components`, and `/src/cascades`. Avoid changes to `build/`, `client-package/`, and `public/` except for debug packaging or runtime staging.

---

# AGENT ROLES & FILE DOMAINS
| Agent Name         | Purpose                                                            |
|--------------------|--------------------------------------------------------------------|
| `PatternScanner`   | Detects chart formations from historical and live data             |
| `FeedbackIntegrator` | Learns from analyst feedback; retrains lightweight models          |
| `ModelTrainer`     | Trains core detection models offline or via interactive mode       |
| `CascadeExecutor`  | Runs YAML-based workflows on command                              |
| `RiskSentinel`     | Flags risks and confidence degradation in signals                  |
| `DashboardPublisher` | Publishes verified signals to the live UI                         |
| `ComplianceWatcher` | Records audit logs, validates policy conformance                  |

Focus work in:
- `/src/hooks/` — all interactive agent logic lives here
- `/src/api/` — fetch interfaces, client-only
- `/src/utils/` — reusable, testable data ops
- `/cascades/` — YAML declarative chains

Do NOT touch:
- `/node_modules/`, `package-lock.json`, `build/`, `dist/`
- Any backup artifacts (`*.bak`, `*.backup`, `*.broken`, `client-package/build/`)
- Build artifacts and logs should not be committed

---

# COMMENT GUIDELINES
- Write **why**, not just what
- Focus on **intent, constraints, and decisions**
- DO NOT delete comments unless they are obsolete or wrong
- Annotate the **non-obvious**—reasoning, edge-cases, safety nets
- Any file over 500 lines MUST include a `// CONSIDER SPLIT` comment

Example:
```ts
// This function filters out invalid patterns before training.
// We avoid removing borderline cases to preserve feedback loops.
```

---

# UI DESIGN PRINCIPLES
- **Main font**: Inter, sans-serif
- **Primary color**: Slate (#1e293b)
- **Accent color**: Emerald (#10b981)
- **Background**: #f9fafb
- **Text**: #111827
- **Button default**: #374151
- **Button hover**: #1f2937
- **Button text**: #ffffff

All UI should:
- Favor clarity over novelty
- Support real-time feedback interactions
- Be mobile- and accessibility-considerate

---

# HEADER COMMENTS IN ALL FILES
Every file must begin with the following three-line header:
```ts
// src/hooks/usePatterns.ts
// Detects pattern candidates in timeseries stream
// Does NOT perform model scoring or logging
```
This establishes traceability for Codex and co-engineers.

## Automated Header Script
To check for and add standard headers to files missing them:
```bash
#!/bin/bash
for file in $(find src -name "*.ts" -o -name "*.tsx"); do
  if ! head -n 3 "$file" | grep -q "// src/"; then
    echo "// $file" > "$file.tmp"
    echo "// TODO: Add file description" >> "$file.tmp"
    echo "// TODO: Add additional context" >> "$file.tmp"
    cat "$file" >> "$file.tmp"
    mv "$file.tmp" "$file"
    echo "Added header to $file"
  fi
done
```

---

# PR / PATCH INSTRUCTIONS
**Title Format**:
```
[trisight] <concise but specific title>
```

**Validation Steps**:
```bash
npm test
npm run lint    # If a lint script isn't defined yet, use: npx eslint .
npm run build
npm start       # For local testing
npm run electron:package  # For client packaging
```

**Before Merge:**
- No security issues (e.g. hardcoded keys)
- No circular dependencies
- No dead imports or unused files
- No TODOs in production files unless tracked
- All API keys and secrets must use environment variables (.env files)
- No credentials should be committed to the repository

---

# AGENT OPERATIONS & EXPECTATIONS
Codex, Claude, and Windsurf-style agents must:
- Read `AGENTS.md` before proposing changes
- Limit changes to requested scope
- Comment reasoning inline
- Check complexity (keep < 30 cyclomatic score where possible)
- Annotate any logic ≥ 500 lines with a `// CONSIDER SPLIT`

When working in unknown files:
- Explain findings first
- Request confirmation before writing

---

# THINGS TO AVOID
- Deep nesting
- One-liner regex magic
- Adding files unless scoped by prompt
- Naming agents with unclear verbs (e.g. `handler`, `manager`)
- Silent fails — always log or throw
- Committing API keys or sensitive information
- Very large components (consider splitting the following into subcomponents or modules):
  - `TriSightChart`
  - `EnhancedFeedbackModal`
  - `PatternPanel`

---

# REPOSITORY HYGIENE
- **Do not commit:**
  - Build artifacts (build/, dist/)
  - Log files (*.log)
  - Environment files (.env, .env.local)
  - Backup files (*.bak, *.backup, *.broken)
  - client-package/build/ directory
  
- **Large files:**
  - Files exceeding 500 lines should be split into smaller, more focused components
  - Components with complex logic should be broken down into separate utilities
  
- **Security:**
  - All API keys must be stored in .env files (added to .gitignore)
  - Use environment variables with appropriate naming (REACT_APP_* prefix)
  - Never hardcode credentials or tokens in source code

---

# HUMAN CO-STEWARDSHIP
- You are co-creating the future of equity intelligence.
- Defer to human override on any feedback, patterns, or signals.
- Document edge-case handling, fallback behaviors, and thresholds.
- When unsure, prompt for analyst input or clarification.

> Remember: your clarity empowers our velocity.

Maintained by: **Bob Stewart** | bob@bobstewart.com of apexvelocity.ai
