// api/reports/download.ts
// Vercel serverless function for downloading reports
// In serverless, we'll fetch from Supabase Storage or regenerate on-demand

// Runs under Express now; the old serverless types were plain req/res shapes.
type VercelRequest = any;
type VercelResponse = any;
const { createClient } = require('../_lib/dbclient');

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

    console.log('[Vercel API] Download request for report:', id);

    // Query report metadata from Supabase
    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
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

    // Report bytes live in Postgres (reports.file_bytes) — durable, no bucket, no volume
    if (report.file_bytes) {
      const buffer = Buffer.isBuffer(report.file_bytes) ? report.file_bytes : Buffer.from(report.file_bytes);

      // Set appropriate headers for file download
      res.setHeader('Content-Type', report.mime_type || 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      res.setHeader('Content-Disposition', `attachment; filename="${report.filename || `report_${id}.pptx`}"`);
      res.setHeader('Content-Length', buffer.length.toString());

      return res.status(200).send(buffer);
    } else if (report.data && report.data.slides) {
      // We have report data but no stored file - generate PDF on demand
      try {
        console.log('[Vercel API] Generating PDF on-demand for report:', id);
        
        // For now, return the report data and let the frontend handle PDF generation
        // In the future, we could add server-side PDF generation here
        return res.status(200).json({
          success: true,
          reportId: id,
          reportData: report.data,
          slides: report.slides || report.data.slides || [],
          companyData: report.company_data || report.data.companyData || {},
          metadata: report.metadata || {},
          title: report.title,
          ticker: report.ticker,
          template: report.template,
          author: report.author,
          format: report.format || 'pdf',
          filename: report.filename || `${report.ticker}_report_${report.created_at}.${report.format || 'pdf'}`,
          message: 'Report data retrieved for client-side generation'
        });
      } catch (genError) {
        console.error('[Vercel API] Failed to prepare report data:', genError);
        throw new Error('Failed to prepare report for download');
      }
    } else {
      // No data available
      return res.status(404).json({
        success: false,
        error: 'Report data not found',
        reportId: id
      });
    }

  } catch (error: any) {
    console.error('[Vercel API] Failed to download report:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to download report',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
}