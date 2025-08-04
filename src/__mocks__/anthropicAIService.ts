// src/__mocks__/anthropicAIService.ts
// Mock for Anthropic AI service
// Context: Provides mock AI responses for testing

export const mockAIContent = {
  summary: 'This is a mock AI-generated executive summary for testing purposes.',
  investmentThesis: 'Strong buy recommendation based on solid fundamentals and growth prospects.',
  risks: [
    'Market volatility risk',
    'Regulatory compliance risk',
    'Competition from emerging players'
  ],
  competitiveAnalysis: 'Company maintains strong competitive position with significant market share.',
  futureOutlook: 'Positive growth trajectory expected with expansion into new markets.',
  keyInsights: [
    'Revenue growth exceeding industry average',
    'Strong balance sheet with low debt',
    'Innovation pipeline shows promise'
  ]
};

export const generateExecutiveSummary = jest.fn().mockResolvedValue(mockAIContent.summary);

export const generateInvestmentThesis = jest.fn().mockResolvedValue(mockAIContent.investmentThesis);

export const analyzeRisks = jest.fn().mockResolvedValue(mockAIContent.risks);

export const generateCompetitiveAnalysis = jest.fn().mockResolvedValue(mockAIContent.competitiveAnalysis);

export const generateFutureOutlook = jest.fn().mockResolvedValue(mockAIContent.futureOutlook);

export const generateKeyInsights = jest.fn().mockResolvedValue(mockAIContent.keyInsights);

export const generateFullAnalysis = jest.fn().mockResolvedValue(mockAIContent);

export const summarizeFinancials = jest.fn().mockImplementation((financials) => {
  return Promise.resolve({
    summary: 'Strong financial performance with consistent revenue growth',
    highlights: [
      'Revenue increased by 15% YoY',
      'Operating margin improved to 25%',
      'Free cash flow generation remains robust'
    ]
  });
});

export const generateRecommendation = jest.fn().mockImplementation((data) => {
  return Promise.resolve({
    recommendation: 'BUY',
    targetPrice: 210,
    confidence: 0.85,
    reasoning: 'Based on strong fundamentals and growth prospects'
  });
});

export const analyzePatterns = jest.fn().mockImplementation((patterns) => {
  return Promise.resolve({
    summary: 'Technical patterns indicate bullish momentum',
    patterns: patterns.map((p: any) => ({
      ...p,
      aiInterpretation: 'Pattern shows positive technical setup'
    }))
  });
});

// Mock the Anthropic client
export class MockAnthropic {
  messages = {
    create: jest.fn().mockResolvedValue({
      content: [{
        text: JSON.stringify(mockAIContent)
      }]
    })
  };
}

export const createAIService = jest.fn().mockReturnValue({
  generateExecutiveSummary,
  generateInvestmentThesis,
  analyzeRisks,
  generateCompetitiveAnalysis,
  generateFutureOutlook,
  generateKeyInsights,
  generateFullAnalysis,
  summarizeFinancials,
  generateRecommendation,
  analyzePatterns
});

// Export as default for module replacement
export default {
  generateExecutiveSummary,
  generateInvestmentThesis,
  analyzeRisks,
  generateCompetitiveAnalysis,
  generateFutureOutlook,
  generateKeyInsights,
  generateFullAnalysis,
  summarizeFinancials,
  generateRecommendation,
  analyzePatterns,
  createAIService,
  MockAnthropic,
  mockAIContent
};