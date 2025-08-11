// src/models/adminConstants.ts
// Canonical constants for Admin UI + Backend

export const SECTIONS = [
  'executive_summary',
  'investment_thesis',
  'risk_assessment',
  'citations'
] as const;
export type SectionKey = typeof SECTIONS[number];

export const FORMATS = [
  'markdown',
  'json',
  'bullets'
] as const;
export type ExpectedFormat = typeof FORMATS[number];

export const PROVIDERS = [
  'anthropic',
  'openai',
  'perplexity',
  'firecrawl',
  'twelvedata',
  'hybrid',
  'heuristic'
] as const;
export type Provider = typeof PROVIDERS[number];

