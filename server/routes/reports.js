// server/routes/reports.js
// CONSOLIDATED API routes for comprehensive report generation
// ONE interface, MAXIMAL data from ALL sources

const express = require('express');
const router = express.Router();
const ComprehensiveReportService = require('../services/comprehensiveReportService');

// Create service instances
const reportService = new ComprehensiveReportService();
const IntelligentReportOrchestrator = require('../services/intelligentReportOrchestrator');
const intelligentOrchestrator = new IntelligentReportOrchestrator();
const MaximalReportOrchestrator = require('../services/maximalReportOrchestrator');
const maximalOrchestrator = new MaximalReportOrchestrator();

/**
 * POST /api/reports/generate-maximal
 * MAXIMUM data extraction using intelligent orchestration
 * Leverages ALL APIs and MCPs with unlimited licenses
 */
router.post('/generate-maximal', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { ticker } = req.body;
    
    if (!ticker) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: ticker'
      });
    }
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[MAXIMAL REPORT] Generating with UNLIMITED data extraction`);
    console.log(`  Ticker: ${ticker}`);
    console.log(`  Custom Prompts: ${req.body.prompts ? 'Yes' : 'No'}`);
    console.log(`${'='.repeat(80)}\n`);
    
    // Use maximal orchestrator for section-by-section generation
    const result = await maximalOrchestrator.generateMaximalReport(ticker, {
      prompts: req.body.prompts,
      options: req.body.options
    });
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('[MAXIMAL] Generation failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/reports/generate-comprehensive
 * THE ONLY endpoint for comprehensive report generation
 * Uses ALL data sources: TwelveData, Firecrawl, Anthropic Claude
 */
router.post('/generate-comprehensive', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Rule: LockTicker — strict symbol validation
    if (!req.body || !req.body.ticker) {
      return res.status(422).json({ success: false, code: 'SYM-MISSING', message: 'Ticker is required' });
    }
    const requested = String(req.body.ticker).toUpperCase().trim();
    if (!/^[A-Z.:-]{1,10}$/.test(requested)) {
      return res.status(422).json({ success: false, code: 'SYM-INVALID', message: 'Ticker format invalid' });
    }

    const { title, template, author, outputFormat = 'json' } = req.body;

    console.log(`\n${'='.repeat(80)}`);
    console.log(`[SymbolPath] requested=${requested}`); // Rule: LockTicker
    console.log(`[API] Comprehensive Report Request`);
    console.log(`  Output Format: ${outputFormat}`);
    console.log(`${'='.repeat(80)}\n`);

    // Generate comprehensive report with ALL data
    const report = await reportService.generateComprehensiveReport(requested, {
      title,
      template,
      author,
      outputFormat
    });

    // Guardrail: ensure downstream preserved symbol
    const actual = (report?.ticker || report?.symbol || '').toUpperCase();
    if (actual && actual !== requested) {
      return res.status(422).json({ success: false, code: 'SYM-MISMATCH', message: `Requested ${requested} but got ${actual}` });
    }

    // Send successful response
    return res.status(200).json(report);

  } catch (error) {
    const generationTime = Date.now() - startTime;
    console.error('[API] Comprehensive report generation failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Comprehensive report generation failed',
      message: error.message,
      generationTime
    });
  }
});

/**
 * POST /api/reports/generate
 * Redirect to comprehensive endpoint
 */
router.post('/generate', async (req, res) => {
  // Redirect ALL report requests to comprehensive endpoint
  req.url = '/generate-comprehensive';
  router.handle(req, res);
});

/**
 * GET /api/reports/health
 * Health check for report service
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ComprehensiveReportService',
    timestamp: new Date().toISOString(),
    capabilities: [
      'TwelveData Integration',
      'Firecrawl Web Intelligence',
      'Anthropic Claude AI Analysis',
      'PDF Generation',
      'Real-time Market Data',
      'Financial Statements',
      'Technical Indicators',
      'News & Sentiment',
      'Comprehensive Slides'
    ]
  });
});

/**
 * GET /api/reports/list
 * List generated reports
 */
router.get('/list', async (req, res) => {
  // Rule: StableList
  function mapFile(fileEntry) {
    const { f, s } = fileEntry;
    return {
      id: f,
      symbol: f.split('_')[0],
      createdAt: new Date(s.mtimeMs).toISOString(),
      path: `/generated-reports/${f}`,
      size: s.size,
      // Back-compat fields
      filename: f,
      created: new Date(s.birthtimeMs || s.mtimeMs).toISOString(),
      downloadUrl: `/generated-reports/${f}`,
      ticker: f.split('_')[0],
      title: f,
      template: f.includes('comprehensive') ? 'comprehensive' : 'standard',
      status: 'completed',
      metadata: {}
    };
  }

  try {
    const fs = require('fs').promises;
    const path = require('path');
    const reportsDir = path.join(__dirname, '../../generated-reports');

    await fs.mkdir(reportsDir, { recursive: true });
    const files = await fs.readdir(reportsDir);
    const stats = await Promise.all(files.map(async (f) => ({ f, s: await fs.stat(path.join(reportsDir, f)) })));
    const sorted = stats.sort((a, b) => b.s.mtimeMs - a.s.mtimeMs).slice(0, 50);
    const mapped = sorted.map(mapFile);

    console.log(`[ListReports] { code:"OK", env:"fs", count:${mapped.length} }`); // Rule: StableList
    return res.status(200).json({ success: true, reports: mapped, total: mapped.length, timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('[ListReports] { code:"LFS-001", env:"fs", err:"'+ (e && e.message) +'" }'); // Rule: StableList
    return res.status(200).json({ success: true, reports: [], total: 0, errorCode: 'LFS-001', timestamp: new Date().toISOString() });
  }
});

module.exports = router;