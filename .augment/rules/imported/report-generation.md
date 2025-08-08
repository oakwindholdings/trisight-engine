---
type: "manual"
---

# File: .cursor/rules/report-generation.mdc
---
description: Guidelines for report generation in TriSight
globs: "src/utils/report*.ts,src/patternEngine/*.ts"
alwaysApply: false
---

# Report Generation
- Generate reports modularly: Create functions per section (e.g., generate_company_description(), generate_financial_highlights()) using grok-4 MAX for content synthesis.
- Data Sources: Prioritize company filings (10-K/10-Q transcripts via SEC EDGAR or open sources), licensed APIs (e.g., TwelveData for market data), and TriSight Scoring engine for metrics/ratings.
- AI Practices: Use RAG (Retrieval-Augmented Generation) with grok-4 MAX—fetch/retrieve data first, then prompt for summaries (e.g., "Summarize NVDA's Q1 2026 earnings transcript focusing on revenue growth"). Chain prompts: Plan structure, generate content, validate.
- Human Oversight: Always include a review step—flag AI-generated content for manual verification (e.g., "Human review required for analyst summaries").
- Output Format: Generate Markdown/HTML first with matplotlib for charts (save as PNG); convert to PDF/PPTX externally (e.g., via pandoc or online tools). Embed confidentiality notice in all outputs.
- Error Handling: Validate data (e.g., cross-check EPS against filings); handle API limits (e.g., retry on TwelveData rate errors).
- Testing: Unit test sections (e.g., Jest for JS summaries, or Python for data processing); aim for 90% coverage on financial metrics.
- For new libraries (e.g., if adding PDF gen), document integration and test compatibility as per # Documentation.