export interface ReportTemplate {
  id: string;
  name: string;
  prompt: string;
  variables: string[];
  enabled: boolean;
}

export const DEFAULT_TEMPLATES: Record<string, ReportTemplate> = {
  marketOverview: {
    id: 'market-overview',
    name: 'Market Overview',
    prompt: `Analyze {{TICKER}} trading at ${{PRICE}} with {{CHANGE_PERCENT}}% change.
    Market cap: ${{MARKET_CAP}}, P/E: {{PE_RATIO}}.
    Provide: 1) Valuation assessment 2) Momentum analysis 3) Key levels`,
    variables: ['TICKER', 'PRICE', 'CHANGE_PERCENT', 'MARKET_CAP', 'PE_RATIO'],
    enabled: true
  },
  financialAnalysis: {
    id: 'financial-analysis',
    name: 'Financial Analysis',
    prompt: `Analyze {{TICKER}} financials: Revenue ${{REVENUE}}, Net Income ${{NET_INCOME}}, 
    EPS ${{EPS}}, Gross Margin {{GROSS_MARGIN}}%.
    Assess: 1) Profitability 2) Growth trends 3) Financial strength`,
    variables: ['TICKER', 'REVENUE', 'NET_INCOME', 'EPS', 'GROSS_MARGIN'],
    enabled: true
  },
  technicalAnalysis: {
    id: 'technical-analysis',
    name: 'Technical Analysis',
    prompt: `Analyze {{TICKER}} technicals: RSI {{RSI}} ({{RSI_SIGNAL}}), 
    MACD {{MACD_SIGNAL}}, 50MA: ${{MA_50}}, 200MA: ${{MA_200}}.
    Provide: 1) Trend analysis 2) Entry/exit points 3) Risk levels`,
    variables: ['TICKER', 'RSI', 'RSI_SIGNAL', 'MACD_SIGNAL', 'MA_50', 'MA_200'],
    enabled: true
  }
};
