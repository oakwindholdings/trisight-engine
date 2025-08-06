// api/health.ts
// Health check endpoint for Vercel deployment

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({
        error: 'Method not allowed',
        allowedMethods: ['GET']
      });
    }

    // Check environment variables
    const envCheck = {
      hasApiKey: !!(process.env.REACT_APP_TWELVE_DATA_API_KEY || process.env.TWELVE_DATA_API_KEY),
      hasSupabaseUrl: !!(process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL),
      hasSupabaseKey: !!(process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY),
      nodeEnv: process.env.NODE_ENV || 'production'
    };

    // Return health status with environment check
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'TriSight API',
      version: '1.0.0',
      environment: envCheck.nodeEnv,
      environmentCheck: envCheck,
      serverless: true,
      vercel: true,
      endpoints: {
        health: '/api/health',
        reportGeneration: '/api/reports/generate',
        reportGenerationSimple: '/api/reports/generate-simple',
        reportsList: '/api/reports/list'
      },
      deployment: {
        platform: 'Vercel',
        status: 'operational',
        lastDeployed: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Health check error:', error);
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error?.message || 'Unknown error',
      service: 'TriSight API'
    });
  }
}
