// server/index.js
// Express server for handling report generation and other server-side operations
// Context: Provides API endpoints for operations that require Node.js capabilities

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const reportRoutes = require('./routes/reports');
const enhancedReportRoutes = require('./routes/enhanced-reports');
const promptRoutes = require('./routes/prompts');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Also load from .env if it exists
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure required directories exist
async function ensureDirectories() {
  const dirs = [
    path.join(__dirname, '../generated-reports'),
    path.join(__dirname, '../temp'),
    path.join(__dirname, '../cache')
  ];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Failed to create directory ${dir}:`, error);
    }
  }
}

// Routes
const marketRoutes = require('./routes/market');
const dataRoutes = require('./routes/data');
const { applySchema, dbHealth } = require('./db');

app.use('/api/market', marketRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/enhanced-reports', enhancedReportRoutes);
app.use('/api/prompts', promptRoutes);

// Vercel-era serverless handlers mounted as Express routes (their (req,res) signatures are
// compatible; the platform is gone, the handlers live on behind the same paths)
const legacyHandlers = [
  ['all', '/api/reports/generate', '../api/reports/generate.ts'],
  ['all', '/api/reports/status', '../api/reports/status.ts'],
  ['all', '/api/reports/cancel', '../api/reports/cancel.ts'],
  ['all', '/api/reports/download', '../api/reports/download.ts'],
  ['all', '/api/reports/list', '../api/reports/list.js'],
  ['all', '/api/reports/generate-comprehensive', '../api/reports/generate-comprehensive.js'],
  ['all', '/api/admin/prompts', '../api/admin/prompts.js'],
  ['all', '/api/admin/report-templates', '../api/admin/report-templates.js'],
  ['all', '/api/admin/report-templates-sections', '../api/admin/report-templates-sections.js'],
  ['all', '/api/admin/variables', '../api/admin/variables.js'],
];
for (const [method, route, mod] of legacyHandlers) {
  try {
    const handler = require(mod);
    const fn = handler.default ?? handler;
    app[method](route, (req, res) => Promise.resolve(fn(req, res)).catch((e) => {
      console.error(`handler ${route} failed:`, e);
      if (!res.headersSent) res.status(500).json({ error: String(e.message ?? e) });
    }));
  } catch (e) {
    console.error(`could not mount ${route}:`, e.message);
  }
}

// Static file serving for generated reports
app.use('/generated-reports', express.static(path.join(__dirname, '../generated-reports')));

// Health check endpoint — reports real dependency state, never a bare "healthy"
app.get('/api/health', async (req, res) => {
  const db = await dbHealth();
  res.json({
    status: db.ok ? 'healthy' : 'degraded',
    db: db.ok ? 'ok' : `unavailable: ${db.reason ?? 'unknown'}`,
    market_credential: process.env.MASSIVE_API_KEY ? 'configured' : 'missing',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Production frontend: serve the CRA build + SPA fallback (replaces the Vercel rewrites)
const buildDir = path.join(__dirname, '../build');
app.use(express.static(buildDir));
app.get(/^\/(?!api\/|generated-reports\/).*/, (req, res, next) => {
  res.sendFile(path.join(buildDir, 'index.html'), (err) => { if (err) next(); });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      code: err.code || 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
});

// Start server
async function startServer() {
  await ensureDirectories();

  // self-provision the schema — the Railway Postgres is internal-only; the server is the migrator
  try {
    const applied = await applySchema();
    console.log(applied.ok ? '🗄️  Schema applied (idempotent)' : `🗄️  Schema NOT applied: ${applied.reason}`);
  } catch (e) {
    console.error('🗄️  Schema apply failed:', e.message); // surfaces in /api/health as db state
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 TriSight engine on port ${PORT}`);
    console.log(`🏥 Health: /api/health`);
    console.log(`📈 Market data: /api/market/* (Massive, server-held credential: ${process.env.MASSIVE_API_KEY ? 'configured ✓' : 'MISSING ✗'})`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

startServer().catch(console.error);

module.exports = app;