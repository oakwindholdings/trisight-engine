// api/reports/status.ts
// Vercel serverless function for checking report generation status
// This endpoint would typically check a status store (Redis, DB, etc.)

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
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid report ID',
        required: 'id query parameter'
      });
    }

    console.log('[Vercel API] Checking status for report:', id);

    // Query report status from Supabase
    const { data: report, error } = await supabase
      .from('reports')
      .select('id, status, progress, error, created_at, updated_at, metadata')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Report not found',
          reportId: id
        });
      }
      throw error;
    }

    // Return status information
    return res.status(200).json({
      success: true,
      reportId: id,
      status: report.status || 'pending',
      progress: report.progress || 0,
      error: report.error,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      metadata: report.metadata || {},
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Vercel API] Failed to check report status:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to check report status',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
}