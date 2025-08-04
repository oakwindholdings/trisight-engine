// api/reports/list.ts
// Vercel serverless function for listing reports
// In serverless architecture, we'll integrate with Supabase for storage

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
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

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowedMethods: ['GET']
    });
  }

  try {
    console.log('[Vercel API] Fetching reports list from Supabase');

    // Query reports from Supabase
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    // Transform reports to match the expected format
    const transformedReports = (reports || []).map(report => ({
      id: report.id,
      filename: report.filename || `${report.ticker}_report_${report.created_at}.${report.format || 'pptx'}`,
      created: report.created_at,
      size: report.file_size || 0,
      downloadUrl: report.download_url || `/api/reports/download?id=${report.id}`,
      ticker: report.ticker,
      title: report.title,
      template: report.template,
      author: report.author,
      status: report.status || 'completed',
      metadata: report.metadata || {}
    }));

    console.log(`[Vercel API] Found ${transformedReports.length} reports`);

    return res.status(200).json({
      success: true,
      reports: transformedReports,
      total: transformedReports.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Vercel API] Failed to list reports:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to list reports',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
}