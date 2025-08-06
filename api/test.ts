// api/test.ts
// Ultra-simple test endpoint for Vercel

export default function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Return simple response
  return res.status(200).json({
    status: 'working',
    message: 'Vercel serverless function is operational',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    environment: 'vercel-serverless'
  });
}
