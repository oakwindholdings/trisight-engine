// api/reports/generate.ts
// Vercel serverless function for report generation
// This replaces the Express /api/reports/generate endpoint

import type { VercelRequest, VercelResponse } from '@vercel/node';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
);

// Dynamic import to handle ES modules
let createReportGenerator: any;

// Initialize the report generator module
async function initReportGenerator() {
  if (!createReportGenerator) {
    const reportGenModule = await import('../../dist/reportGeneration/index.js');
    createReportGenerator = reportGenModule.createReportGenerator;
  }
  return createReportGenerator;
}

// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowedMethods: ['POST']
    });
  }

  const startTime = Date.now();
  const generationId = uuidv4();

  try {
    console.log('[Vercel API] Report generation request received:', {
      generationId,
      ticker: req.body.ticker,
      template: req.body.template,
      reportType: req.body.reportType,
      outputFormat: req.body.outputFormat,
      timestamp: new Date().toISOString()
    });

    // Validate required fields
    if (!req.body.ticker || !req.body.template) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['ticker', 'template'],
        received: Object.keys(req.body)
      });
    }

    // Initialize report generator
    const createReportGeneratorFn = await initReportGenerator();

    // Prepare configuration
    const config = {
      ...req.body,
      reportId: generationId,
      currentDate: new Date().toISOString().split('T')[0],
      reportDate: new Date().toISOString().split('T')[0],
      apiKey: process.env.REACT_APP_TWELVE_DATA_API_KEY || process.env.TWELVE_DATA_API_KEY,
      anthropicApiKey: process.env.REACT_APP_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
      firecrawlApiKey: process.env.REACT_APP_FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY
    };

    console.log('[Vercel API] Creating report generator with config:', {
      ticker: config.ticker,
      template: config.template,
      reportId: config.reportId,
      hasApiKey: !!config.apiKey,
      hasAnthropicKey: !!config.anthropicApiKey,
      hasFirecrawlKey: !!config.firecrawlApiKey
    });

    // Create and run report generator
    const generator = createReportGeneratorFn(config);
    const report = await generator.generateReport();

    const generationTime = Date.now() - startTime;

    console.log('[Vercel API] Report generated successfully:', {
      reportId: generationId,
      companyName: report.companyData?.companyName,
      slidesCount: report.slides?.length,
      generationTime,
      outputPath: report.outputPath
    });

    // Save report to Supabase database for persistence
    const reportData = {
      id: generationId,
      ticker: config.ticker,
      title: config.title,
      template: config.template,
      author: config.author,
      format: config.outputFormat || 'pdf',
      status: 'completed',
      file_size: report.fileSize || 0,
      filename: `${config.ticker}_report_${new Date().toISOString().replace(/[:.]/g, '-')}.${config.outputFormat || 'pdf'}`,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      data: report,
      slides: report.slides || [],
      company_data: report.companyData || {},
      metadata: {
        ...report.metadata,
        generationId,
        serverType: 'vercel-serverless',
        serverTimestamp: new Date().toISOString(),
        generationTime,
        apiVersion: '2.0',
        reportType: config.template,
        dataSources: config.dataSources,
        sections: config.sections,
        visualizations: config.visualizations
      }
    };

    try {
      const { data: savedReport, error: saveError } = await supabase
        .from('reports')
        .insert([reportData])
        .select()
        .single();

      if (saveError) {
        console.error('[Vercel API] Failed to save report to Supabase:', saveError);
        // Continue anyway, but log the error
      } else {
        console.log('[Vercel API] Report saved to Supabase successfully:', savedReport.id);
      }
    } catch (saveError) {
      console.error('[Vercel API] Error saving to Supabase:', saveError);
      // Continue anyway
    }

    // Return the report data for immediate display
    const response = {
      success: true,
      generationId,
      ...report,
      metadata: reportData.metadata,
      downloadInfo: {
        filename: reportData.filename,
        format: config.outputFormat || 'pdf',
        generatedAt: new Date().toISOString()
      }
    };

    return res.status(200).json(response);

  } catch (error: any) {
    console.error('[Vercel API] Report generation failed:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        message: 'Report generation failed',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        generationId,
        timestamp: new Date().toISOString(),
        serverType: 'vercel-serverless'
      }
    });
  }
}