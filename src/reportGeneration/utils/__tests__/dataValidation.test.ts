// src/reportGeneration/utils/__tests__/dataValidation.test.ts
// Unit tests for data validation utilities
// Context: Tests input validation and sanitization

import {
  validateTicker,
  validateReportConfig,
  validateCompanyData,
  sanitizeInput,
  validateDateRange,
  validateNumericValue,
  validateEmail,
  validateReportName
} from '../dataValidation';
import { ReportConfig, CompanyData } from '../../models/reportTypes';

describe('dataValidation', () => {
  describe('validateTicker', () => {
    it('should validate valid tickers', () => {
      expect(validateTicker('AAPL')).toBe(true);
      expect(validateTicker('NVDA')).toBe(true);
      expect(validateTicker('BRK.B')).toBe(true);
      expect(validateTicker('TSM')).toBe(true);
    });

    it('should reject invalid tickers', () => {
      expect(validateTicker('')).toBe(false);
      expect(validateTicker('12345')).toBe(false);
      expect(validateTicker('TOOLONG')).toBe(false);
      expect(validateTicker('A B')).toBe(false);
      expect(validateTicker('$AAPL')).toBe(false);
      expect(validateTicker(null as any)).toBe(false);
      expect(validateTicker(undefined as any)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateTicker('A')).toBe(true); // Single letter
      expect(validateTicker('AB.CD')).toBe(true); // With dot
      expect(validateTicker('ABC-D')).toBe(true); // With hyphen
    });
  });

  describe('validateReportConfig', () => {
    it('should validate valid config', () => {
      const config: ReportConfig = {
        reportType: 'comprehensive',
        includeCharts: true,
        timeframe: '1Y',
        metrics: ['revenue', 'profit']
      };

      const result = validateReportConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid report type', () => {
      const config = {
        reportType: 'invalid' as any,
        includeCharts: true
      };

      const result = validateReportConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid report type');
    });

    it('should validate timeframe', () => {
      const config: ReportConfig = {
        reportType: 'quick',
        timeframe: 'INVALID'
      };

      const result = validateReportConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid timeframe');
    });

    it('should validate numeric parameters', () => {
      const config = {
        reportType: 'detailed',
        slideCount: -5,
        dataPoints: 'not a number' as any
      };

      const result = validateReportConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle missing optional fields', () => {
      const config: ReportConfig = {
        reportType: 'quick'
      };

      const result = validateReportConfig(config);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCompanyData', () => {
    it('should validate complete company data', () => {
      const data: CompanyData = {
        ticker: 'AAPL',
        companyName: 'Apple Inc.',
        sector: 'Technology',
        financials: {
          revenue: 1000000,
          marketCap: 3000000000000,
          peRatio: 25
        }
      };

      const result = validateCompanyData(data);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should reject missing required fields', () => {
      const data = {
        companyName: 'Test Co'
      } as CompanyData;

      const result = validateCompanyData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing ticker');
    });

    it('should warn about negative financial values', () => {
      const data: CompanyData = {
        ticker: 'TEST',
        companyName: 'Test Company',
        financials: {
          revenue: -1000000,
          peRatio: -5
        }
      };

      const result = validateCompanyData(data);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Negative revenue');
      expect(result.warnings).toContain('Negative P/E ratio');
    });

    it('should validate data ranges', () => {
      const data: CompanyData = {
        ticker: 'TEST',
        companyName: 'Test',
        financials: {
          currentRatio: 1000, // Unusually high
          debtToEquity: 100, // Very high
          roe: 500 // Extremely high
        }
      };

      const result = validateCompanyData(data);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('');
      expect(sanitizeInput('Hello <b>World</b>')).toBe('Hello World');
      expect(sanitizeInput('<img src=x onerror=alert(1)>')).toBe('');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
      expect(sanitizeInput('\n\ttest\n\t')).toBe('test');
    });

    it('should handle special characters', () => {
      expect(sanitizeInput('AT&T')).toBe('AT&T');
      expect(sanitizeInput('Price: $100')).toBe('Price: $100');
      expect(sanitizeInput('50% growth')).toBe('50% growth');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
    });

    it('should limit length', () => {
      const longString = 'a'.repeat(10000);
      const result = sanitizeInput(longString, 100);
      expect(result.length).toBe(100);
    });
  });

  describe('validateDateRange', () => {
    it('should validate valid date ranges', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      
      expect(validateDateRange(start, end)).toBe(true);
    });

    it('should reject invalid date ranges', () => {
      const start = new Date('2024-12-31');
      const end = new Date('2024-01-01');
      
      expect(validateDateRange(start, end)).toBe(false);
    });

    it('should handle same dates', () => {
      const date = new Date('2024-06-15');
      expect(validateDateRange(date, date)).toBe(true);
    });

    it('should reject future dates', () => {
      const start = new Date();
      const end = new Date();
      end.setFullYear(end.getFullYear() + 2);
      
      expect(validateDateRange(start, end, { maxDate: new Date() })).toBe(false);
    });

    it('should enforce minimum range', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-05');
      
      expect(validateDateRange(start, end, { minDays: 7 })).toBe(false);
      expect(validateDateRange(start, end, { minDays: 3 })).toBe(true);
    });

    it('should enforce maximum range', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2025-01-01');
      
      expect(validateDateRange(start, end, { maxDays: 180 })).toBe(false);
      expect(validateDateRange(start, end, { maxDays: 400 })).toBe(true);
    });
  });

  describe('validateNumericValue', () => {
    it('should validate numbers within range', () => {
      expect(validateNumericValue(50, { min: 0, max: 100 })).toBe(true);
      expect(validateNumericValue(0, { min: 0, max: 100 })).toBe(true);
      expect(validateNumericValue(100, { min: 0, max: 100 })).toBe(true);
    });

    it('should reject numbers outside range', () => {
      expect(validateNumericValue(-1, { min: 0, max: 100 })).toBe(false);
      expect(validateNumericValue(101, { min: 0, max: 100 })).toBe(false);
    });

    it('should validate integers only', () => {
      expect(validateNumericValue(5, { integerOnly: true })).toBe(true);
      expect(validateNumericValue(5.5, { integerOnly: true })).toBe(false);
    });

    it('should handle NaN and infinity', () => {
      expect(validateNumericValue(NaN, {})).toBe(false);
      expect(validateNumericValue(Infinity, {})).toBe(false);
      expect(validateNumericValue(-Infinity, {})).toBe(false);
    });

    it('should validate positive only', () => {
      expect(validateNumericValue(5, { positiveOnly: true })).toBe(true);
      expect(validateNumericValue(0, { positiveOnly: true })).toBe(false);
      expect(validateNumericValue(-5, { positiveOnly: true })).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should validate valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user@company.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('notanemail')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user @example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validateReportName', () => {
    it('should validate valid report names', () => {
      expect(validateReportName('Q4 2024 Earnings Report')).toBe(true);
      expect(validateReportName('AAPL Analysis')).toBe(true);
      expect(validateReportName('Tech Sector Review 2024')).toBe(true);
    });

    it('should reject invalid report names', () => {
      expect(validateReportName('')).toBe(false);
      expect(validateReportName('a')).toBe(false); // Too short
      expect(validateReportName('a'.repeat(300))).toBe(false); // Too long
      expect(validateReportName('Report<script>')).toBe(false); // Invalid chars
      expect(validateReportName('../../../etc/passwd')).toBe(false); // Path traversal
    });

    it('should allow special characters in names', () => {
      expect(validateReportName('Report (Draft)')).toBe(true);
      expect(validateReportName('Q1-Q2 Comparison')).toBe(true);
      expect(validateReportName('Sales & Marketing')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle non-string inputs', () => {
      expect(validateTicker(123 as any)).toBe(false);
      expect(sanitizeInput(123 as any)).toBe('123');
      expect(validateEmail(true as any)).toBe(false);
    });

    it('should handle empty objects', () => {
      const result = validateReportConfig({} as any);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle circular references', () => {
      const data: any = { ticker: 'TEST' };
      data.circular = data;
      
      const result = validateCompanyData(data);
      expect(result.isValid).toBe(true); // Should not crash
    });
  });
});