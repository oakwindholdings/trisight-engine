-- TriSight Admin Fixtures (SQL seed)
-- Templates
INSERT INTO report_templates (id, name, description, is_default) VALUES
  ('tmpl_earnings_snapshot', 'Earnings Snapshot', 'Quick earnings-oriented overview', false),
  ('tmpl_momentum_playbook', 'Momentum Playbook', 'Momentum-focused trading commentary', false);

-- Sections (Earnings Snapshot)
INSERT INTO report_template_sections (id, template_id, section_key, prompt_id, position, enabled, expected_format) VALUES
  ('sec_es_exec',  'tmpl_earnings_snapshot', 'executive_summary',  'prm_es_exec',   0, true, 'markdown'),
  ('sec_es_thesis','tmpl_earnings_snapshot', 'investment_thesis',  'prm_es_thesis', 1, true, 'bullets'),
  ('sec_es_risk',  'tmpl_earnings_snapshot', 'risk_assessment',    'prm_es_risk',   2, true, 'markdown'),
  ('sec_es_cites', 'tmpl_earnings_snapshot', 'citations',          'prm_es_cites',  3, true, 'json');

-- Sections (Momentum Playbook)
INSERT INTO report_template_sections (id, template_id, section_key, prompt_id, position, enabled, expected_format) VALUES
  ('sec_mp_exec',  'tmpl_momentum_playbook', 'executive_summary',  'prm_mp_exec',   0, true, 'markdown'),
  ('sec_mp_thesis','tmpl_momentum_playbook', 'investment_thesis',  'prm_mp_thesis', 1, true, 'bullets'),
  ('sec_mp_risk',  'tmpl_momentum_playbook', 'risk_assessment',    'prm_mp_risk',   2, true, 'markdown'),
  ('sec_mp_cites', 'tmpl_momentum_playbook', 'citations',          'prm_mp_cites',  3, true, 'json');

-- Prompts
INSERT INTO prompts (id, section_key, provider, model, template, expected_format, enabled) VALUES
  ('prm_es_exec',   'executive_summary', 'anthropic',  'claude-3-5-sonnet-20240620', 'Exec summary for {{INPUT.ticker}}', 'markdown', true),
  ('prm_es_thesis', 'investment_thesis', 'openai',     'gpt-4o',                      'Thesis bullets for {{INPUT.ticker}}', 'bullets', true),
  ('prm_es_risk',   'risk_assessment',   'perplexity', 'sonar-large',                 'Risks for {{INPUT.ticker}}', 'markdown', true),
  ('prm_es_cites',  'citations',         'firecrawl',  NULL,                          'Citations JSON for {{INPUT.ticker}}', 'json', true),
  ('prm_mp_exec',   'executive_summary', 'anthropic',  'claude-3-5-sonnet-20240620', 'Momentum exec summary for {{INPUT.ticker}}', 'markdown', true),
  ('prm_mp_thesis', 'investment_thesis', 'openai',     'gpt-4o',                      'Momentum thesis bullets for {{INPUT.ticker}}', 'bullets', true),
  ('prm_mp_risk',   'risk_assessment',   'perplexity', 'sonar-large',                 'Momentum risks for {{INPUT.ticker}}', 'markdown', true),
  ('prm_mp_cites',  'citations',         'firecrawl',  NULL,                          'Momentum citations JSON for {{INPUT.ticker}}', 'json', true);

-- Variables
INSERT INTO variables (id, namespace, var_key, label, example, description, enabled) VALUES
  ('var_input_ticker', 'INPUT', 'ticker', 'Ticker', 'NVDA', 'Symbol under analysis', true),
  ('var_input_timeframe', 'INPUT', 'timeframe', 'Timeframe', '1min', 'Time resolution', true),
  ('var_meta_date', 'META', 'date', 'Run Date', '2025-01-01', 'Report generation date', true);

-- Preview inputs (documented only; not stored)
-- NVDA/1min, MSFT/5min, SPY/daily

