// server/index.js
// Express server for handling report generation and other server-side operations
// Context: Provides API endpoints for operations that require Node.js capabilities

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const reportRoutes = require('./routes/reports');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
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
app.use('/api/reports', reportRoutes);

// Static file serving for generated reports
app.use('/generated-reports', express.static(path.join(__dirname, '../generated-reports')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
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
  
  app.listen(PORT, () => {
    console.log(`\n🚀 TriSight API Server running on http://localhost:${PORT}`);
    console.log(`📊 Report generation endpoint: http://localhost:${PORT}/api/reports/generate`);
    console.log(`📁 Generated reports served at: http://localhost:${PORT}/generated-reports/`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔑 TwelveData API Key: ${process.env.REACT_APP_TWELVE_DATA_API_KEY ? 'Loaded ✓' : 'Missing ✗'}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

startServer().catch(console.error);

module.exports = app;