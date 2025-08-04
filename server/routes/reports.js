// server/routes/reports.js
// API routes for report generation
// Context: Handles report generation requests from the React frontend

const express = require('express');
const router = express.Router();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ReportService = require('../services/reportService');

// Create report service instance
const reportService = new ReportService();

// Store active report generation processes
const activeGenerations = new Map();

/**
 * POST /api/reports/generate
 * Generates a new report based on the provided configuration
 */
router.post('/generate', async (req, res) => {
  const generationId = uuidv4();
  
  try {
    console.log('[Report API] Received generation request:', {
      ticker: req.body.ticker,
      reportType: req.body.reportType,
      outputFormat: req.body.outputFormat
    });

    const config = req.body;
    
    // Store the generation ID for tracking
    activeGenerations.set(generationId, {
      config,
      startTime: Date.now(),
      status: 'processing'
    });
    
    try {
      // Generate the report using the service
      const report = await reportService.generateReport(config);
      
      activeGenerations.delete(generationId);
      
      // Add server-side metadata
      report.metadata = {
        ...report.metadata,
        generationId,
        serverTimestamp: new Date().toISOString(),
        apiVersion: '1.0'
      };
      
      console.log('[Report API] Report generated successfully:', {
        ticker: config.ticker,
        generationTime: report.metadata.generationTime,
        outputPath: report.outputPath
      });
      
      res.json(report);
      
    } catch (error) {
      activeGenerations.delete(generationId);
      throw error;
    }
    
  } catch (error) {
    console.error('[Report API] Generation failed:', error);
    
    res.status(500).json({
      error: {
        message: 'Report generation failed',
        details: error.message,
        generationId,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * POST /api/reports/cancel
 * Cancels an active report generation
 */
router.post('/cancel', (req, res) => {
  const { generationId } = req.body;
  
  if (!generationId) {
    return res.status(400).json({
      error: {
        message: 'Generation ID is required',
        code: 'MISSING_GENERATION_ID'
      }
    });
  }
  
  const generation = activeGenerations.get(generationId);
  
  if (!generation) {
    return res.status(404).json({
      error: {
        message: 'No active generation found',
        code: 'GENERATION_NOT_FOUND'
      }
    });
  }
  
  try {
    reportService.cancel(generationId);
    activeGenerations.delete(generationId);
    
    res.json({
      success: true,
      message: 'Report generation cancelled',
      generationId
    });
    
  } catch (error) {
    console.error('[Report API] Cancel failed:', error);
    res.status(500).json({
      error: {
        message: 'Failed to cancel generation',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/reports/status/:generationId
 * Gets the status of an active report generation
 */
router.get('/status/:generationId', (req, res) => {
  const { generationId } = req.params;
  const generation = activeGenerations.get(generationId);
  
  if (!generation) {
    return res.status(404).json({
      error: {
        message: 'Generation not found',
        code: 'GENERATION_NOT_FOUND'
      }
    });
  }
  
  const status = reportService.getStatus(generationId);
  res.json(status);
});

/**
 * GET /api/reports/list
 * Lists recently generated reports
 */
router.get('/list', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const reportsDir = path.join(__dirname, '../../generated-reports');
    
    const files = await fs.readdir(reportsDir);
    const reports = [];
    
    for (const file of files) {
      if (file.endsWith('.pdf') || file.endsWith('.pptx')) {
        const stats = await fs.stat(path.join(reportsDir, file));
        reports.push({
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          downloadUrl: `/generated-reports/${file}`
        });
      }
    }
    
    // Sort by creation date, newest first
    reports.sort((a, b) => b.created - a.created);
    
    res.json({ reports });
    
  } catch (error) {
    console.error('[Report API] List failed:', error);
    res.status(500).json({
      error: {
        message: 'Failed to list reports',
        details: error.message
      }
    });
  }
});

module.exports = router;