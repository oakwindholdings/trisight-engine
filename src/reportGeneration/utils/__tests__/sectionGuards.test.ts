// src/reportGeneration/utils/__tests__/sectionGuards.test.ts
// Tests for section guards utility functions
// Context: Ensures graceful fallback handling works correctly

import { 
  safeMaybe, 
  safeMaybeSync, 
  extractOrFallback, 
  extractOrGenerate,
  combineResults,
  combinePartial,
  SectionResult 
} from '../sectionGuards';

describe('Section Guards', () => {
  describe('safeMaybe', () => {
    it('should return success result for successful async operation', async () => {
      const result = await safeMaybe('TestOperation', async () => {
        return 'success data';
      });
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe('success data');
      }
    });

    it('should return failure result for failed async operation', async () => {
      const result = await safeMaybe('TestOperation', async () => {
        throw new Error('test error');
      });
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain('TestOperation: test error');
      }
    });
  });

  describe('safeMaybeSync', () => {
    it('should return success result for successful sync operation', () => {
      const result = safeMaybeSync('TestOperation', () => {
        return 'success data';
      });
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe('success data');
      }
    });

    it('should return failure result for failed sync operation', () => {
      const result = safeMaybeSync('TestOperation', () => {
        throw new Error('test error');
      });
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain('TestOperation: test error');
      }
    });
  });

  describe('extractOrFallback', () => {
    it('should extract data from successful result', () => {
      const successResult: SectionResult<string> = { ok: true, data: 'success' };
      const result = extractOrFallback(successResult, 'fallback');
      expect(result).toBe('success');
    });

    it('should return fallback for failed result', () => {
      const failureResult: SectionResult<string> = { ok: false, reason: 'error' };
      const result = extractOrFallback(failureResult, 'fallback');
      expect(result).toBe('fallback');
    });
  });

  describe('extractOrGenerate', () => {
    it('should extract data from successful result', () => {
      const successResult: SectionResult<string> = { ok: true, data: 'success' };
      const result = extractOrGenerate(successResult, (reason) => `fallback: ${reason}`);
      expect(result).toBe('success');
    });

    it('should generate fallback for failed result', () => {
      const failureResult: SectionResult<string> = { ok: false, reason: 'test error' };
      const result = extractOrGenerate(failureResult, (reason) => `fallback: ${reason}`);
      expect(result).toBe('fallback: test error');
    });
  });

  describe('combineResults', () => {
    it('should combine successful results', () => {
      const results = {
        data1: { ok: true, data: 'value1' } as SectionResult<string>,
        data2: { ok: true, data: 'value2' } as SectionResult<string>
      };
      
      const combined = combineResults(results);
      expect(combined.ok).toBe(true);
      if (combined.ok) {
        expect(combined.data.data1).toBe('value1');
        expect(combined.data.data2).toBe('value2');
      }
    });

    it('should fail when any result fails', () => {
      const results = {
        data1: { ok: true, data: 'value1' } as SectionResult<string>,
        data2: { ok: false, reason: 'error2' } as SectionResult<string>
      };
      
      const combined = combineResults(results);
      expect(combined.ok).toBe(false);
      if (!combined.ok) {
        expect(combined.reason).toContain('data2: error2');
      }
    });
  });

  describe('combinePartial', () => {
    it('should combine with partial success', () => {
      const results = {
        data1: { ok: true, data: 'value1' } as SectionResult<string>,
        data2: { ok: false, reason: 'error2' } as SectionResult<string>
      };
      
      const fallbacks = { data2: 'fallback2' };
      const { data, failures } = combinePartial(results, fallbacks);
      
      expect(data.data1).toBe('value1');
      expect(data.data2).toBe('fallback2');
      expect(failures).toHaveLength(1);
      expect(failures[0]).toContain('data2: error2');
    });
  });
});

// Integration test for financial data fallbacks
describe('Financial Data Fallbacks', () => {
  it('should handle TwelveData API failures gracefully', async () => {
    // Mock a failing API call
    const mockFetchFinancials = async () => {
      throw new Error('API rate limit exceeded');
    };

    const result = await safeMaybe('FinancialData', mockFetchFinancials);
    
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('FinancialData: API rate limit exceeded');
    }

    // Test fallback extraction
    const fallbackData = {
      revenue: 1000000000,
      netIncome: 100000000,
      eps: 5.00,
      fallback: true
    };

    const finalData = extractOrFallback(result, fallbackData);
    expect(finalData).toEqual(fallbackData);
    expect(finalData.fallback).toBe(true);
  });
});
