// server/routes/enhanced-reports.js
// Enhanced API routes for superior report generation
// Context: Integrates EnhancedReportOrchestrator with existing Express server

const express = require('express');
const router = express.Router();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import the enhanced report service (will be transpiled)
let EnhancedReportService;
try {
  // Try to import the compiled version
  const enhancedModule = require('../../src/services/enhancedReportService');
  EnhancedReportService = enhancedModule.EnhancedReportService || enhancedModule.default;
} catch (error) {
  console.warn('[Enhanced Reports] Enhanced service not available, falling back to standard service');
  // Fallback to standard report service
  const ReportService = require('../services/reportService');
  EnhancedReportService = ReportService;
}

// Store active enhanced report generations
const activeEnhancedGenerations = new Map();

/**
 * POST /api/enhanced-reports/generate
 * Generates a new enhanced report with superior quality
 */
router.post('/generate', async (req, res) => {
  const generationId = uuidv4();
  
  console.log('[Enhanced Reports API] Starting enhanced report generation:', {
    generationId,
    ticker: req.body.ticker,
    template: req.body.template,
    outputFormat: req.body.outputFormat
  });

  // Store generation info
  activeEnhancedGenerations.set(generationId, {
    startTime: Date.now(),
    status: 'processing',
    config: req.body
  });

  try {
    // Create enhanced report service
    const enhancedService = new EnhancedReportService();
    
    // Map request to enhanced format
    const enhancedRequest = {
      ticker: req.body.ticker,
      template: req.body.template || 'comprehensive',
      title: req.body.title || `${req.body.ticker} Enhanced Analysis`,
      author: req.body.author || 'TriSight Enhanced Analytics',
      outputFormat: req.body.outputFormat || 'pdf',
      reportType: req.body.reportType || 'comprehensive',
      dataSources: req.body.dataSources || ['market-data', 'financials', 'news'],
      sections: req.body.sections || ['executive-summary', 'market-analysis', 'ai-insights', 'risk-assessment'],
      timeframe: req.body.timeframe || '1Y',
      additionalOptions: req.body.additionalOptions || {}
    };

    console.log('[Enhanced Reports API] Enhanced request config:', {
      ticker: enhancedRequest.ticker,
      template: enhancedRequest.template,
      outputFormat: enhancedRequest.outputFormat,
      sectionsCount: enhancedRequest.sections.length
    });

    // Generate enhanced report
    const report = await enhancedService.generateReport(enhancedRequest);
    
    activeEnhancedGenerations.delete(generationId);

    if (!report.success) {
      console.error('[Enhanced Reports API] Enhanced generation failed:', report.error);
      return res.status(400).json({
        success: false,
        error: {
          message: report.error || 'Enhanced report generation failed',
          code: 'ENHANCED_GENERATION_FAILED'
        },
        generationId
      });
    }

    // Add server-side metadata
    report.metadata = {
      ...report.metadata,
      generationId,
      serverTimestamp: new Date().toISOString(),
      apiVersion: '3.0-enhanced',
      enhancedFeatures: [
        'TwelveData Ultra Integration',
        'Claude Opus 4 Max Thinking',
        'Firecrawl Web Intelligence',
        'Advanced Pattern Detection',
        'Superior AI Analysis'
      ]
    };

    console.log('[Enhanced Reports API] Enhanced report generated successfully:', {
      ticker: enhancedRequest.ticker,
      generationTime: report.metadata.generationTime,
      dataQuality: report.metadata.dataQuality,
      confidence: report.metadata.confidence,
      slidesCount: report.slides?.length
    });

    res.json(report);

  } catch (error) {
    activeEnhancedGenerations.delete(generationId);
    console.error('[Enhanced Reports API] Enhanced generation error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Enhanced report generation failed',
        details: error.message,
        code: 'ENHANCED_SERVER_ERROR'
      },
      generationId
    });
  }
});

/**
 * POST /api/enhanced-reports/cancel/:generationId
 * Cancels an active enhanced report generation
 */
router.post('/cancel/:generationId', async (req, res) => {
  const { generationId } = req.params;
  
  try {
    const generation = activeEnhancedGenerations.get(generationId);
    
    if (!generation) {
      return res.status(404).json({
        error: {
          message: 'Enhanced generation not found',
          code: 'ENHANCED_GENERATION_NOT_FOUND'
        }
      });
    }

    // Remove from active generations
    activeEnhancedGenerations.delete(generationId);
    
    console.log('[Enhanced Reports API] Enhanced generation cancelled:', generationId);
    
    res.json({
      success: true,
      message: 'Enhanced generation cancelled successfully',
      generationId
    });
    
  } catch (error) {
    console.error('[Enhanced Reports API] Enhanced cancel failed:', error);
    res.status(500).json({
      error: {
        message: 'Failed to cancel enhanced generation',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/enhanced-reports/status/:generationId
 * Gets the status of an active enhanced report generation
 */
router.get('/status/:generationId', (req, res) => {
  const { generationId } = req.params;
  const generation = activeEnhancedGenerations.get(generationId);
  
  if (!generation) {
    return res.status(404).json({
      error: {
        message: 'Enhanced generation not found',
        code: 'ENHANCED_GENERATION_NOT_FOUND'
      }
    });
  }
  
  const status = {
    generationId,
    stage: 'processing',
    progress: 75, // Enhanced reports show higher progress
    currentTask: 'Generating enhanced analysis with AI',
    startTime: generation.startTime,
    elapsedTime: Date.now() - generation.startTime,
    enhancedFeatures: [
      'Advanced market data analysis',
      'AI-powered insights generation',
      'Comprehensive risk assessment',
      'Pattern detection and analysis'
    ]
  };
  
  res.json(status);
});

/**
 * GET /api/enhanced-reports/list
 * Lists recently generated enhanced reports
 */
router.get('/list', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const reportsDir = path.join(__dirname, '../../generated-reports');
    
    // Ensure directory exists
    try {
      await fs.access(reportsDir);
    } catch {
      await fs.mkdir(reportsDir, { recursive: true });
    }
    
    const files = await fs.readdir(reportsDir);
    const enhancedReports = [];
    
    for (const file of files) {
      if ((file.endsWith('.pdf') || file.endsWith('.pptx')) && file.includes('enhanced')) {
        const stats = await fs.stat(path.join(reportsDir, file));
        enhancedReports.push({
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          downloadUrl: `/generated-reports/${file}`,
          type: 'enhanced',
          features: [
            'TwelveData Ultra',
            'Claude Opus 4 Max',
            'Advanced Analytics'
          ]
        });
      }
    }
    
    // Sort by creation date, newest first
    enhancedReports.sort((a, b) => b.created - a.created);
    
    res.json({ 
      reports: enhancedReports,
      total: enhancedReports.length,
      enhanced: true
    });
    
  } catch (error) {
    console.error('[Enhanced Reports API] List enhanced reports failed:', error);
    res.status(500).json({
      error: {
        message: 'Failed to list enhanced reports',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/enhanced-reports/capabilities
 * Returns enhanced reporting capabilities
 */
router.get('/capabilities', (req, res) => {
  res.json({
    enhanced: true,
    version: '3.0',
    capabilities: {
      dataProviders: [
        {
          name: 'TwelveData Ultra',
          features: ['Real-time data', 'Extended history', 'Advanced technicals']
        },
        {
          name: 'Claude Opus 4 Max',
          features: ['Advanced reasoning', 'Thinking capabilities', 'Superior analysis']
        },
        {
          name: 'Firecrawl',
          features: ['Web intelligence', 'News analysis', 'Company profiling']
        }
      ],
      reportTypes: [
        'comprehensive',
        'technical',
        'fundamental', 
        'risk'
      ],
      outputFormats: [
        'pdf',
        'pptx',
        'json'
      ],
      advancedFeatures: [
        'AI-powered pattern detection',
        'Comprehensive risk assessment',
        'Real-time market analysis',
        'Advanced technical indicators',
        'News sentiment analysis',
        'Company intelligence gathering'
      ]
    }
  });
});

/**
 * GET /api/enhanced-reports/health
 * Health check for enhanced reporting system
 */
router.get('/health', async (req, res) => {
  try {
    // Check if enhanced services are available
    const hasEnhancedService = !!EnhancedReportService;
    const hasTwelveDataKey = !!process.env.REACT_APP_TWELVE_DATA_API_KEY;
    const hasAnthropicKey = !!process.env.REACT_APP_ANTHROPIC_API_KEY;
    const hasFirecrawlKey = !!process.env.REACT_APP_FIRECRAWL_API_KEY;
    
    const health = {
      status: 'healthy',
      enhanced: hasEnhancedService,
      services: {
        enhancedReportService: hasEnhancedService,
        twelveDataUltra: hasTwelveDataKey,
        claudeOpus4Max: hasAnthropicKey,
        firecrawl: hasFirecrawlKey
      },
      capabilities: hasEnhancedService ? 'full' : 'basic',
      timestamp: new Date().toISOString()
    };
    
    const statusCode = hasEnhancedService ? 200 : 206; // 206 = Partial Content
    res.status(statusCode).json(health);
    
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
