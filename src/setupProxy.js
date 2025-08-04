// src/setupProxy.js
// Proxy configuration for development
// Routes /api/* calls to local Express server during development

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Always proxy /api calls to the Express server during development
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ 
          error: 'API proxy error',
          message: 'Express server not running. Please run "npm run server:dev" in a separate terminal'
        });
      }
    })
  );
};