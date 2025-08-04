// api/reports/cancel.ts
// Vercel serverless function for cancelling report generation
// In serverless architecture, this updates the status in database

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
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
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

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        error: 'Missing report ID',
        required: ['id']
      });
    }

    console.log('[Vercel API] Cancel request for report:', id);

    // Update report status to cancelled
    const { data: report, error } = await supabase
      .from('reports')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        metadata: {
          cancelledAt: new Date().toISOString(),
          cancelledBy: req.headers['x-user-id'] || 'anonymous'
        }
      })
      .eq('id', id)
      .select()
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

    // Return success response
    return res.status(200).json({
      success: true,
      reportId: id,
      status: 'cancelled',
      message: 'Report generation cancelled successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Vercel API] Failed to cancel report:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to cancel report',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
}