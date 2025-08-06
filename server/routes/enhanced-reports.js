// server/routes/enhanced-reports.js
// Enhanced reports route - redirects to comprehensive service
// ALL report generation goes through ONE service

const express = require('express');
const router = express.Router();

/**
 * ALL enhanced report endpoints redirect to the comprehensive service
 */
router.post('/generate', (req, res) => {
  // Redirect to comprehensive endpoint
  res.redirect(307, '/api/reports/generate-comprehensive');
});

router.post('/generate-comprehensive', (req, res) => {
  // Redirect to main comprehensive endpoint
  res.redirect(307, '/api/reports/generate-comprehensive');
});

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Enhanced reports are handled by ComprehensiveReportService',
    redirect: '/api/reports/health'
  });
});

module.exports = router;