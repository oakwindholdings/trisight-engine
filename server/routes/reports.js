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
    // Validate request
    if (!req.body || !req.body.ticker) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: ticker'
      });
    }

    const { ticker, title, template, author, outputFormat = 'json' } = req.body;
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[API] Comprehensive Report Request`);
    console.log(`  Ticker: ${ticker}`);
    console.log(`  Output Format: ${outputFormat}`);
    console.log(`${'='.repeat(80)}\n`);

    // Generate comprehensive report with ALL data
    const report = await reportService.generateComprehensiveReport(ticker, {
      title,
      template,
      author,
      outputFormat
    });

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
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const reportsDir = path.join(__dirname, '../../generated-reports');
    
    const files = await fs.readdir(reportsDir);
    const reports = [];
    
    for (const file of files) {
      if (file.endsWith('.pdf') || file.endsWith('.json')) {
        const stats = await fs.stat(path.join(reportsDir, file));
        reports.push({
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          downloadUrl: `/generated-reports/${file}`,
          type: file.includes('comprehensive') ? 'comprehensive' : 'standard'
        });
      }
    }
    
    // Sort by creation date, newest first
    reports.sort((a, b) => b.created - a.created);
    
    res.json({ 
      reports,
      total: reports.length
    });
    
  } catch (error) {
    console.error('[API] List reports failed:', error);
    res.status(500).json({
      error: 'Failed to list reports',
      message: error.message
    });
  }
});

module.exports = router;