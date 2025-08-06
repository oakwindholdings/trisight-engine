// api/reports/generate-simple.ts
// Simplified Vercel serverless function for report generation

import type { VercelRequest, VercelResponse } from '@vercel/node';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
};

// Simple mock report generator for serverless environment
function createMockReport(config: any) {
  const { ticker = 'UNKNOWN', title = 'Report', template = 'equity-research', includeCharts = false } = config;
  
  const slides = [
    {
      slideNumber: 1,
      type: 'title',
      title: title || `${ticker} Analysis Report`,
      content: {
        title: title || `${ticker} Analysis Report`,
        subtitle: `Generated on ${new Date().toLocaleDateString()}`,
        ticker: ticker.toUpperCase(),
        template: template
      }
    },
    {
      slideNumber: 2,
      type: 'executive_summary',
      title: 'Executive Summary',
      content: {
        text: `This is a functional report for ${ticker}. The Vercel serverless deployment is working correctly and can generate reports.`,
        keyPoints: [
          '✅ Serverless function operational',
          '✅ API endpoint responding correctly', 
          '✅ Report generation pipeline active',
          '✅ CORS headers configured',
          '✅ Error handling implemented'
        ]
      }
    },
    {
      slideNumber: 3,
      type: 'financial_performance',
      title: 'Financial Performance',
      content: {
        text: `Financial analysis for ${ticker} - serverless environment confirmed working.`,
        metrics: {
          revenue: 'API functional',
          netIncome: 'Deployment successful',
          eps: 'Charts available',
          marketCap: 'Environment ready'
        }
      }
    },
    {
      slideNumber: 4,
      type: 'technical_analysis',
      title: 'Technical Analysis',
      content: {
        text: 'Technical indicators and chart analysis capabilities confirmed.',
        indicators: {
          rsi: 'Operational',
          movingAverages: 'Available',
          support: 'Configured',
          resistance: 'Ready'
        }
      }
    },
    {
      slideNumber: 5,
      type: 'investment_thesis',
      title: 'Investment Thesis',
      content: {
        thesis: `The TriSight application is successfully deployed on Vercel with full report generation capabilities for ${ticker}.`,
        bullishFactors: [
          'Successful serverless deployment',
          'API endpoints functional',
          'Report generation working',
          'Error handling implemented'
        ],
        bearishFactors: [
          'Still in testing phase',
          'Mock data being used',
          'Full integration pending'
        ]
      }
    }
  ];

  // Add chart slide if requested
  if (includeCharts) {
    slides.push({
      slideNumber: 6,
      type: 'charts',
      title: 'Charts & Visualizations',
      content: {
        text: 'Chart generation capabilities are available and functional.',
        charts: [
          {
            type: 'price_chart',
            title: `${ticker} Price Chart`,
            data: 'Chart data would be generated here'
          },
          {
            type: 'volume_chart', 
            title: `${ticker} Volume Chart`,
            data: 'Volume data would be generated here'
          }
        ]
      }
    });
  }

  return {
    success: true,
    reportId: `vercel-${ticker}-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    config,
    slides,
    metadata: {
      template,
      ticker: ticker.toUpperCase(),
      generatedBy: 'TriSight Vercel API',
      environment: 'serverless',
      slideCount: slides.length,
      chartsIncluded: includeCharts,
      deploymentStatus: 'operational'
    }
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
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
        allowedMethods: ['POST'],
        message: 'This endpoint only accepts POST requests'
      });
    }

    // Validate request body
    if (!req.body) {
      return res.status(400).json({
        error: 'Request body required',
        message: 'Please provide report configuration in request body'
      });
    }

    const config = req.body;
    
    // Validate required fields
    if (!config.ticker) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'ticker field is required',
        example: { ticker: 'AAPL', title: 'Apple Analysis' }
      });
    }

    console.log('[Vercel API] Generating report for:', config.ticker);
    console.log('[Vercel API] Config:', JSON.stringify(config, null, 2));

    // Generate the mock report
    const report = createMockReport(config);

    console.log('[Vercel API] Report generated successfully');
    console.log('[Vercel API] Slide count:', report.slides.length);

    // Return the generated report
    return res.status(200).json(report);

  } catch (error) {
    console.error('[Vercel API] Error generating report:', error);
    
    return res.status(500).json({
      error: 'Report generation failed',
      message: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      service: 'TriSight Vercel API'
    });
  }
}
