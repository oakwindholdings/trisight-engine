// mcp-server.js
// MCP (Model Context Protocol) server implementation for TriSight
// Provides tools for Claude Code to interact with the report generation system

const axios = require('axios');
const { Server } = require('@modelcontextprotocol/sdk');

class TriSightMCPServer {
  constructor(config = {}) {
    this.apiEndpoint = config.api_endpoint || process.env.TRISIGHT_API_URL || 'http://localhost:3000/api';
    this.apiKey = config.api_key || process.env.TRISIGHT_API_KEY;
    this.server = new Server({
      name: 'trisight-mcp',
      version: '1.0.0'
    });
    
    this.setupTools();
  }

  setupTools() {
    // Generate Report Tool
    this.server.setTool('generate_report', async (params) => {
      try {
        console.log('[MCP] Generating report:', params);
        
        const response = await axios.post(`${this.apiEndpoint}/reports/generate`, {
          ticker: params.ticker,
          template: params.template,
          title: params.title,
          author: params.author || 'TriSight AI',
          outputFormat: params.outputFormat || 'pptx',
          reportType: this.mapTemplateToReportType(params.template),
          dataSources: this.getDataSourcesForTemplate(params.template)
        }, {
          headers: this.getHeaders()
        });

        return {
          success: true,
          reportId: response.data.generationId || response.data.reportId,
          message: `Report generation started for ${params.ticker}`,
          data: response.data
        };
      } catch (error) {
        console.error('[MCP] Report generation error:', error);
        return {
          success: false,
          error: error.response?.data?.error?.message || error.message
        };
      }
    });

    // List Reports Tool
    this.server.setTool('list_reports', async (params) => {
      try {
        console.log('[MCP] Listing reports:', params);
        
        const response = await axios.get(`${this.apiEndpoint}/reports/list`, {
          params: {
            limit: params.limit || 10,
            ticker: params.ticker
          },
          headers: this.getHeaders()
        });

        const reports = response.data.reports || [];
        const filteredReports = params.ticker 
          ? reports.filter(r => r.ticker === params.ticker)
          : reports;

        return {
          success: true,
          reports: filteredReports.slice(0, params.limit || 10),
          total: filteredReports.length
        };
      } catch (error) {
        console.error('[MCP] List reports error:', error);
        return {
          success: false,
          error: error.response?.data?.error?.message || error.message
        };
      }
    });

    // Get Market Data Tool
    this.server.setTool('get_market_data', async (params) => {
      try {
        console.log('[MCP] Fetching market data:', params);
        
        // This would typically call TwelveData API through your backend
        const response = await axios.get(`${this.apiEndpoint}/market/data`, {
          params: {
            symbol: params.ticker,
            interval: params.interval || '1day',
            outputsize: params.outputSize || 30
          },
          headers: this.getHeaders()
        });

        return {
          success: true,
          ticker: params.ticker,
          interval: params.interval,
          data: response.data.values || response.data
        };
      } catch (error) {
        console.error('[MCP] Market data error:', error);
        return {
          success: false,
          error: error.response?.data?.error?.message || error.message
        };
      }
    });

    // Analyze Pattern Tool
    this.server.setTool('analyze_pattern', async (params) => {
      try {
        console.log('[MCP] Analyzing patterns:', params);
        
        const response = await axios.post(`${this.apiEndpoint}/patterns/analyze`, {
          ticker: params.ticker,
          patterns: params.patterns || ['goldmine-channel', 'goldmine-shaft', 'pivot', 'rocketman', 'escalator', 'blackjack'],
          timeframe: params.timeframe || '1month'
        }, {
          headers: this.getHeaders()
        });

        return {
          success: true,
          ticker: params.ticker,
          patterns: response.data.patterns || [],
          summary: response.data.summary || 'Pattern analysis complete'
        };
      } catch (error) {
        console.error('[MCP] Pattern analysis error:', error);
        return {
          success: false,
          error: error.response?.data?.error?.message || error.message
        };
      }
    });

    // Get Report Status Tool
    this.server.setTool('get_report_status', async (params) => {
      try {
        console.log('[MCP] Checking report status:', params);
        
        const response = await axios.get(`${this.apiEndpoint}/reports/status`, {
          params: {
            id: params.reportId
          },
          headers: this.getHeaders()
        });

        return {
          success: true,
          reportId: params.reportId,
          status: response.data.status || 'unknown',
          progress: response.data.progress || 0,
          error: response.data.error,
          metadata: response.data.metadata
        };
      } catch (error) {
        console.error('[MCP] Status check error:', error);
        return {
          success: false,
          error: error.response?.data?.error?.message || error.message
        };
      }
    });
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    return headers;
  }

  mapTemplateToReportType(template) {
    const mapping = {
      'technical-analysis': 'technical-analysis',
      'fundamental-analysis': 'comprehensive-analysis',
      'market-overview': 'market-overview',
      'earnings-analysis': 'earnings-report'
    };
    return mapping[template] || 'technical-analysis';
  }

  getDataSourcesForTemplate(template) {
    const dataSources = {
      'technical-analysis': ['market-data', 'patterns'],
      'fundamental-analysis': ['market-data', 'company-info', 'financials'],
      'market-overview': ['market-data', 'news'],
      'earnings-analysis': ['market-data', 'financials', 'earnings']
    };
    return dataSources[template] || ['market-data'];
  }

  async start() {
    console.log('[MCP] Starting TriSight MCP server...');
    await this.server.start();
    console.log('[MCP] Server started successfully');
  }
}

// Start the server if run directly
if (require.main === module) {
  const server = new TriSightMCPServer({
    api_endpoint: process.env.TRISIGHT_API_URL,
    api_key: process.env.TRISIGHT_API_KEY
  });
  
  server.start().catch(error => {
    console.error('[MCP] Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = { TriSightMCPServer };