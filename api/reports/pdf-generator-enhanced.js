// api/reports/pdf-generator-enhanced.js
// Enhanced PDF Generator matching NVDA example format
// Professional design with teal/green theme, structured layouts, and comprehensive financial reporting

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class EnhancedPDFGenerator {
  constructor() {
    this.colors = {
      // TriSight brand colors matching NVDA example
      primaryTeal: '#1e6b7a',
      secondaryTeal: '#2d8693',
      darkTeal: '#134e5a',
      lightTeal: '#e0f7fa',
      emeraldGreen: '#10b981',
      darkGreen: '#059669',
      accentRed: '#dc2626',
      
      // Text and background colors
      darkText: '#1f2937',
      lightText: '#6b7280',
      background: '#f9fafb',
      white: '#ffffff',
      lightGray: '#f3f4f6',
      mediumGray: '#9ca3af'
    };
    
    this.fonts = {
      regular: 'Helvetica',
      bold: 'Helvetica-Bold',
      italic: 'Helvetica-Oblique'
    };
    
    // Page dimensions and margins
    this.pageWidth = 595.28; // A4 width
    this.pageHeight = 841.89; // A4 height
    this.margin = 50;
    this.contentWidth = this.pageWidth - (this.margin * 2);
  }

  async generateEnhancedPDF(reportData, options = {}) {
    try {
      const {
        ticker,
        companyName,
        outputPath = null,
        template = 'equity-research'
      } = options;

      // Create output directory if needed
      const outputDir = outputPath ? path.dirname(outputPath) : path.join(process.cwd(), 'generated-reports');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = outputPath || path.join(outputDir, `${ticker}_Enhanced_Report_${timestamp}.pdf`);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: this.margin,
          bottom: this.margin,
          left: this.margin,
          right: this.margin
        },
        info: {
          Title: `TriSight Research Report - ${companyName || ticker}`,
          Author: 'TriSight Research',
          Subject: `Enhanced investment analysis for ${ticker}`,
          Keywords: `${ticker}, investment, analysis, research, equity`,
          Creator: 'TriSight Enhanced PDF Generator'
        }
      });

      // Stream to file
      const stream = fs.createWriteStream(filename);
      doc.pipe(stream);

      // Generate report sections
      await this.generateCoverPage(doc, reportData);
      await this.generateTriSightSummary(doc, reportData);
      await this.generateCompanyProfile(doc, reportData);
      await this.generateGuidanceProfile(doc, reportData);
      await this.generatePerformanceProfile(doc, reportData);
      await this.generateCompanyNews(doc, reportData);
      await this.generateAnalystProfile(doc, reportData);
      await this.generateTrendAnalysis(doc, reportData);
      await this.generateFinancialStatements(doc, reportData);
      
      // Finalize the PDF
      doc.end();

      // Wait for completion
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      console.log(`Enhanced PDF generated: ${filename}`);
      return filename;

    } catch (error) {
      console.error('Enhanced PDF generation error:', error);
      throw error;
    }
  }

  async generateEnhancedPDFInMemory(reportData, options = {}) {
    try {
      const {
        ticker,
        companyName,
        filename,
        includeCharts = true,
        includeAppendix = true,
        institutionalGrade = true,
        modularSections = {},
        reportType = 'institutional',
        serverless = true
      } = options;

      console.log(`[EnhancedPDF] Generating enhanced PDF in memory for ${ticker}...`);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: this.margin,
          bottom: this.margin,
          left: this.margin,
          right: this.margin
        },
        info: {
          Title: `TriSight ${institutionalGrade ? 'Institutional' : 'Enhanced'} Research Report - ${companyName || ticker}`,
          Author: 'TriSight Institutional Research',
          Subject: `Comprehensive ${reportType} analysis for ${ticker}`,
          Keywords: `${ticker}, institutional, research, analysis, equity, ${reportType}`,
          Creator: 'TriSight Enhanced PDF Generator'
        }
      });

      // Generate comprehensive report sections (same as file version but in memory)
      await this.generateCoverPage(doc, reportData);
      await this.generateTriSightSummary(doc, reportData);
      await this.generateCompanyProfile(doc, reportData);
      await this.generateGuidanceProfile(doc, reportData);
      await this.generatePerformanceProfile(doc, reportData);
      await this.generateCompanyNews(doc, reportData);
      await this.generateAnalystProfile(doc, reportData);
      await this.generateTrendAnalysis(doc, reportData);
      await this.generateFinancialStatements(doc, reportData);

      // Finalize the PDF
      doc.end();

      // Collect PDF data in memory
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));

      await new Promise((resolve, reject) => {
        doc.on('end', resolve);
        doc.on('error', reject);
      });

      const pdfBuffer = Buffer.concat(chunks);

      console.log(`[EnhancedPDF] Enhanced PDF generated in memory: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

      return {
        success: true,
        buffer: pdfBuffer,
        pageCount: 8, // Estimated based on sections
        metadata: {
          ticker,
          companyName,
          filename,
          generatedAt: new Date().toISOString(),
          reportType,
          institutionalGrade,
          includeCharts,
          includeAppendix,
          serverless
        }
      };

    } catch (error) {
      console.error('[EnhancedPDF] Error generating enhanced PDF in memory:', error);
      throw error;
    }
  }

  async generateCoverPage(doc, data) {
    // Create gradient background
    const gradient = doc.linearGradient(0, 0, this.pageWidth, this.pageHeight);
    gradient.stop(0, this.colors.primaryTeal);
    gradient.stop(1, this.colors.darkTeal);
    
    doc.rect(0, 0, this.pageWidth, this.pageHeight).fill(gradient);

    // Add red accent stripe (matching NVDA example)
    doc.rect(this.pageWidth - 80, 0, 80, 200)
       .fill(this.colors.accentRed);

    // Company info in top left (white text)
    doc.fill(this.colors.white)
       .font(this.fonts.regular)
       .fontSize(14)
       .text('TriSight Research Report', this.margin, this.margin);
    
    doc.fontSize(18)
       .font(this.fonts.bold)
       .text(data.companyName || data.ticker, this.margin, this.margin + 25);
    
    doc.fontSize(16)
       .font(this.fonts.regular)
       .text(data.ticker, this.margin, this.margin + 50);
    
    doc.fontSize(12)
       .text(new Date().toLocaleDateString('en-US', { 
         year: 'numeric', 
         month: 'long', 
         day: 'numeric' 
       }), this.margin, this.margin + 75);

    // Large centered title
    const titleY = this.pageHeight / 2 - 50;
    doc.fontSize(48)
       .font(this.fonts.bold)
       .text('TriSight Research Report', 0, titleY, {
         align: 'center',
         width: this.pageWidth
       });

    // Company details in bottom right
    const bottomY = this.pageHeight - 200;
    doc.fontSize(24)
       .font(this.fonts.bold)
       .text(data.companyName || data.ticker, 0, bottomY, {
         align: 'right',
         width: this.pageWidth - this.margin - 100
       });
    
    doc.fontSize(20)
       .font(this.fonts.regular)
       .text(data.ticker, 0, bottomY + 35, {
         align: 'right',
         width: this.pageWidth - this.margin - 100
       });
    
    doc.fontSize(16)
       .text(new Date().toLocaleDateString('en-US', { 
         year: 'numeric', 
         month: 'long', 
         day: 'numeric' 
       }), 0, bottomY + 65, {
         align: 'right',
         width: this.pageWidth - this.margin - 100
       });

    this.addPageFooter(doc, 'TriSight Research Reports are Confidential & Proprietary – All rights reserved.', 1);
  }

  async generateTriSightSummary(doc, data) {
    doc.addPage();
    
    // Header with teal background
    this.addSectionHeader(doc, 'TriSight Summary');
    this.addCompanyHeader(doc, data);
    
    let yPos = 150;

    // Company Description
    doc.fill(this.colors.darkText)
       .font(this.fonts.bold)
       .fontSize(12)
       .text('Company Description', this.margin, yPos);
    
    yPos += 20;
    doc.font(this.fonts.regular)
       .fontSize(10)
       .text(data.companyDescription || 'Company description not available', 
             this.margin, yPos, {
               width: this.contentWidth * 0.65,
               align: 'justify'
             });

    // Company Details Box (right side)
    const detailsX = this.margin + (this.contentWidth * 0.7);
    const detailsY = yPos;
    const boxWidth = this.contentWidth * 0.28;
    const boxHeight = 300;

    // Details box background
    doc.rect(detailsX, detailsY, boxWidth, boxHeight)
       .fill(this.colors.lightGray)
       .stroke(this.colors.mediumGray);

    // Company Details
    this.addDetailsSection(doc, detailsX + 10, detailsY + 10, 'Company Details', data.ticker);
    
    const details = data.companyDetails || {};
    let detailY = detailsY + 35;
    
    const detailItems = [
      ['Share Price', details.sharePrice || 'N/A'],
      ['TriSight FMV', details.trisightFMV || 'N/A'],
      ['Analyst Target', details.analystTarget || 'N/A'],
      ['Avg. Daily Volume', details.avgDailyVolume || 'N/A'],
      ['Market Cap ($M)', details.marketCap || 'N/A'],
      ['Earnings Date', details.earningsDate || 'N/A'],
      ['Fiscal Year', details.fiscalYear || 'N/A'],
      ['Sector', details.sector || 'N/A'],
      ['Group', details.group || 'N/A'],
      ['Dividend Yield', details.dividendYield || 'N/A'],
      ['EPS (ttm)', details.epsttm || 'N/A'],
      ['PE (ttm)', details.pettm || 'N/A'],
      ['PE (forward)', details.peforward || 'N/A'],
      ['Website', details.website || 'N/A']
    ];

    detailItems.forEach(([label, value]) => {
      doc.fill(this.colors.darkText)
         .fontSize(8)
         .text(label, detailsX + 12, detailY, { width: boxWidth - 24 });
      
      doc.fill(this.colors.darkText)
         .font(this.fonts.bold)
         .text(value, detailsX + 12, detailY + 10, { width: boxWidth - 24 });
      
      detailY += 20;
    });

    // Financial, Performance, and Guidance Highlights
    yPos += 150;
    
    if (data.financialHighlights) {
      yPos = this.addHighlightSection(doc, this.margin, yPos, 'Financial Highlights', data.financialHighlights);
    }
    
    if (data.performanceHighlights) {
      yPos = this.addHighlightSection(doc, this.margin, yPos, 'Performance Highlights', data.performanceHighlights);
    }
    
    if (data.guidanceHighlights) {
      yPos = this.addHighlightSection(doc, this.margin, yPos, 'Guidance Highlights', data.guidanceHighlights);
    }

    // Trend Analysis Table
    if (data.trendAnalysis) {
      yPos += 30;
      this.addTrendAnalysisTable(doc, this.margin + (this.contentWidth * 0.7), yPos - 100, data.trendAnalysis);
    }

    this.addPageFooter(doc, 'TriSight Research Reports are Confidential & Proprietary – All rights reserved.', 2);
  }

  async generateCompanyProfile(doc, data) {
    doc.addPage();
    
    this.addSectionHeader(doc, 'Company Profile');
    this.addCompanyHeader(doc, data);
    
    let yPos = 150;

    // Company Description
    if (data.companyProfile?.description) {
      doc.fill(this.colors.darkText)
         .font(this.fonts.bold)
         .fontSize(12)
         .text('Company Description', this.margin, yPos);
      
      yPos += 20;
      doc.font(this.fonts.regular)
         .fontSize(10)
         .text(data.companyProfile.description, this.margin, yPos, {
           width: this.contentWidth * 0.65,
           align: 'justify'
         });
      
      yPos += 80;
    }

    // Business segments
    if (data.companyProfile?.segments) {
      yPos = this.addSegmentDescription(doc, this.margin, yPos, data.companyProfile.segments);
    }

    // Company Profile Metrics (right side box)
    const metricsX = this.margin + (this.contentWidth * 0.7);
    const metricsY = 150;
    this.addCompanyMetricsBox(doc, metricsX, metricsY, data.companyProfile?.metrics || {});

    this.addPageFooter(doc, 'TriSight Research Reports are Confidential & Proprietary – All rights reserved.', 3);
  }

  async generateGuidanceProfile(doc, data) {
    doc.addPage();
    
    this.addSectionHeader(doc, 'Guidance Profile');
    this.addCompanyHeader(doc, data);
    
    let yPos = 150;

    // Earnings guidance content
    if (data.guidanceProfile?.earningsUpdate) {
      yPos = this.addGuidanceContent(doc, this.margin, yPos, data.guidanceProfile.earningsUpdate);
    }

    // Guidance metrics box (right side)
    const guidanceX = this.margin + (this.contentWidth * 0.7);
    const guidanceY = 150;
    this.addGuidanceMetricsBox(doc, guidanceX, guidanceY, data.guidanceProfile?.metrics || {});

    // Annual trend table at bottom
    if (data.guidanceProfile?.annualTrend) {
      yPos = Math.max(yPos, 500);
      this.addAnnualTrendTable(doc, this.margin, yPos, data.guidanceProfile.annualTrend);
    }

    this.addPageFooter(doc, 'TriSight Research Reports are Confidential & Proprietary – All rights reserved.', 4);
  }

  async generatePerformanceProfile(doc, data) {
    doc.addPage();
    
    this.addSectionHeader(doc, 'Performance Profile');
    this.addCompanyHeader(doc, data);
    
    let yPos = 150;

    // Performance chart placeholder and description
    if (data.performanceProfile?.description) {
      yPos = this.addPerformanceContent(doc, this.margin, yPos, data.performanceProfile);
    }

    // Performance metrics box (right side)
    const perfX = this.margin + (this.contentWidth * 0.7);
    const perfY = 150;
    this.addPerformanceMetricsBox(doc, perfX, perfY, data.performanceProfile?.metrics || {});

    // Chart placeholder (centered)
    yPos = Math.max(yPos, 300);
    this.addChartPlaceholder(doc, this.margin, yPos, 'Price Performance Chart', data.ticker);

    this.addPageFooter(doc, 'TriSight Research Reports are Confidential & Proprietary – All rights reserved.', 6);
  }

  async generateCompanyNews(doc, data) {
    doc.addPage();
    
    this.addSectionHeader(doc, 'Company News');
    this.addCompanyHeader(doc, data);
    
    let yPos = 150;

    // Recent news links (left column)
    yPos = this.addNewsSection(doc, this.margin, yPos, 'Recent News Links', data.recentNews || []);

    // TriSight News Synopsis (right column)
    const synopsisX = this.margin + (this.contentWidth * 0.55);
    this.addNewsSynopsis(doc, synopsisX, 150, data.newsSynopsis || []);

    this.addPageFooter(doc, 'TriSight Research Reports are Confidential & Proprietary – All rights reserved.', 7);
  }

  async generateAnalystProfile(doc, data) {
    doc.addPage();
    
    this.addSectionHeader(doc, 'Analyst Profile');
    this.addCompanyHeader(doc, data);
    
    let yPos = 150;

    // Analyst strengths and summary
    yPos = this.addAnalystContent(doc, this.margin, yPos, data.analystProfile || {});

    // Pull quote box (right side)
    const quoteX = this.margin + (this.contentWidth * 0.7);
    this.addAnalystQuote(doc, quoteX, 150, data.analystProfile?.quote || '');

    this.addPageFooter(doc, 'TriSight Research Reports are Confidential & Proprietary – All rights reserved.', 8);
  }

  async generateTrendAnalysis(doc, data) {
    doc.addPage();
    
    this.addSectionHeader(doc, 'Trend Analysis');
    this.addCompanyHeader(doc, data);
    
    let yPos = 150;

    // Annual trend analysis
    if (data.trendAnalysis?.annualTrends) {
      yPos = this.addTrendAnalysisContent(doc, this.margin, yPos, data.trendAnalysis);
    }

    // Trend summary table
    if (data.trendAnalysis?.trendSummary) {
      yPos = Math.max(yPos, 400);
      this.addTrendSummaryTable(doc, this.margin, yPos, data.trendAnalysis.trendSummary);
    }

    // Highlights box
    yPos = Math.max(yPos, 650);
    this.addHighlightsBox(doc, this.margin, yPos);

    this.addPageFooter(doc, 'TriSight Research Reports are Confidential & Proprietary – All rights reserved.', 10);
  }

  async generateFinancialStatements(doc, data) {
    // Income Statement
    doc.addPage();
    this.addSectionHeader(doc, 'Company Financials');
    this.addCompanyHeader(doc, data);
    this.addFinancialSubheader(doc, 150, 'Income Statement');
    
    let yPos = 180;
    yPos = this.addIncomeStatementTable(doc, this.margin, yPos, data.incomeStatement || {});
    yPos = this.addFinancialHighlights(doc, this.margin, yPos, data.incomeStatement?.highlights);
    this.addPageFooter(doc, 'TriSight Research Reports are Confidential & Proprietary – All rights reserved.', 12);

    // Balance Sheet
    doc.addPage();
    this.addSectionHeader(doc, 'Company Financials');
    this.addCompanyHeader(doc, data);
    this.addFinancialSubheader(doc, 150, 'Balance Sheet');
    
    yPos = 180;
    yPos = this.addBalanceSheetTable(doc, this.margin, yPos, data.balanceSheet || {});
    yPos = this.addFinancialHighlights(doc, this.margin, yPos, data.balanceSheet?.highlights);
    this.addPageFooter(doc, 'TriSight Research Reports are Confidential & Proprietary – All rights reserved.', 13);

    // Cash Flows
    doc.addPage();
    this.addSectionHeader(doc, 'Company Financials');
    this.addCompanyHeader(doc, data);
    this.addFinancialSubheader(doc, 150, 'Cash Flows');
    
    yPos = 180;
    yPos = this.addCashFlowTable(doc, this.margin, yPos, data.cashFlow || {});
    yPos = this.addFinancialHighlights(doc, this.margin, yPos, data.cashFlow?.highlights);
    this.addPageFooter(doc, 'TriSight Research Reports are Confidential & Proprietary – All rights reserved.', 14);
  }

  // Helper methods for styling and layout
  addSectionHeader(doc, title) {
    // Teal header bar
    doc.rect(0, 50, this.pageWidth, 40)
       .fill(this.colors.primaryTeal);
    
    // Header text
    doc.fill(this.colors.white)
       .font(this.fonts.bold)
       .fontSize(18)
       .text(title, 0, 62, {
         align: 'right',
         width: this.pageWidth - this.margin
       });
    
    // Underline
    doc.rect(0, 90, this.pageWidth, 2)
       .fill(this.colors.darkTeal);
  }

  addCompanyHeader(doc, data) {
    const companyY = 105;
    
    doc.fill(this.colors.darkText)
       .font(this.fonts.bold)
       .fontSize(16)
       .text(data.companyName || data.ticker, 0, companyY, {
         align: 'center',
         width: this.pageWidth
       });
  }

  addFinancialSubheader(doc, yPos, subtitle) {
    doc.fill(this.colors.darkText)
       .font(this.fonts.bold)
       .fontSize(14)
       .text(subtitle, this.margin, yPos);
  }

  addDetailsSection(doc, x, y, title, ticker) {
    doc.fill(this.colors.darkText)
       .font(this.fonts.bold)
       .fontSize(10)
       .text(title, x, y);
    
    doc.fontSize(9)
       .text(ticker, x, y + 12);
  }

  addHighlightSection(doc, x, y, title, content) {
    doc.fill(this.colors.darkText)
       .font(this.fonts.bold)
       .fontSize(11)
       .text(title, x, y);
    
    doc.font(this.fonts.regular)
       .fontSize(10)
       .text(content, x, y + 15, {
         width: this.contentWidth * 0.65,
         align: 'justify'
       });
    
    return y + 50;
  }

  addTrendAnalysisTable(doc, x, y, trendData) {
    // Table header
    doc.fill(this.colors.emeraldGreen)
       .font(this.fonts.bold)
       .fontSize(10)
       .text('Trend Analysis', x, y);
    
    let tableY = y + 20;
    const rowHeight = 15;
    
    // Table rows
    Object.entries(trendData).forEach(([key, value]) => {
      doc.fill(this.colors.darkText)
         .font(this.fonts.regular)
         .fontSize(8)
         .text(key, x, tableY);
      
      doc.font(this.fonts.bold)
         .text(value, x + 100, tableY);
      
      tableY += rowHeight;
    });
  }

  addCompanyMetricsBox(doc, x, y, metrics) {
    const boxWidth = this.contentWidth * 0.28;
    const boxHeight = 200;
    
    // Background
    doc.rect(x, y, boxWidth, boxHeight)
       .fill(this.colors.lightTeal)
       .stroke(this.colors.primaryTeal);
    
    // Title
    doc.fill(this.colors.darkText)
       .font(this.fonts.bold)
       .fontSize(10)
       .text('Company Profile', x + 10, y + 10);
    
    let metricY = y + 30;
    Object.entries(metrics).forEach(([key, value]) => {
      doc.font(this.fonts.regular)
         .fontSize(8)
         .text(key, x + 12, metricY);
      
      doc.font(this.fonts.bold)
         .text(value || 'N/A', x + 12, metricY + 10);
      
      metricY += 20;
    });
  }

  addGuidanceMetricsBox(doc, x, y, metrics) {
    const boxWidth = this.contentWidth * 0.28;
    
    // Company section
    doc.fill(this.colors.darkText)
       .font(this.fonts.bold)
       .fontSize(10)
       .text('Guidance Profile', x, y);
    
    doc.font(this.fonts.regular)
       .fontSize(9)
       .text('Company', x, y + 15);
    
    let metricY = y + 35;
    const guidanceItems = [
      ['Earnings Date', metrics.earningsDate || 'N/A'],
      ['Surprise Last Quarter', metrics.surpriseLastQuarter || 'N/A'],
      ['Analyst Target Upside', metrics.analystTargetUpside || 'N/A'],
      ['TriSight FMV Upside', metrics.trisightFMVUpside || 'N/A']
    ];
    
    guidanceItems.forEach(([label, value]) => {
      doc.fontSize(8).text(label, x, metricY);
      doc.font(this.fonts.bold).text(value, x, metricY + 10);
      doc.font(this.fonts.regular);
      metricY += 25;
    });
  }

  addPerformanceMetricsBox(doc, x, y, metrics) {
    const boxWidth = this.contentWidth * 0.28;
    
    // TriSight Autopilot section
    doc.fill(this.colors.emeraldGreen)
       .font(this.fonts.bold)
       .fontSize(10)
       .text('TriSight Autopilot', x, y);
    
    doc.fill(this.colors.white)
       .rect(x, y + 15, 80, 20)
       .fill(this.colors.emeraldGreen);
    
    doc.fill(this.colors.white)
       .fontSize(9)
       .text(metrics.signal || 'Rising', x + 5, y + 20);
    
    // Performance metrics
    let metricY = y + 45;
    const perfItems = [
      ['Position Profile', metrics.positionProfile || 'Long'],
      ['Entry Trigger', metrics.entryTrigger || 'Tier 1'],
      ['Current Price', metrics.currentPrice || 'N/A'],
      ['Current Profit', metrics.currentProfit || 'N/A'],
      ['Entry Date', metrics.entryDate || 'N/A'],
      ['Entry Price', metrics.entryPrice || 'N/A']
    ];
    
    doc.fill(this.colors.darkText);
    perfItems.forEach(([label, value]) => {
      doc.font(this.fonts.regular).fontSize(8).text(label, x, metricY);
      doc.font(this.fonts.bold).text(value, x, metricY + 10);
      metricY += 20;
    });
  }

  addChartPlaceholder(doc, x, y, title, ticker) {
    const chartWidth = this.contentWidth;
    const chartHeight = 200;
    
    // Chart background
    doc.rect(x, y, chartWidth, chartHeight)
       .fill(this.colors.lightGray)
       .stroke(this.colors.mediumGray);
    
    // Chart title
    doc.fill(this.colors.darkText)
       .font(this.fonts.bold)
       .fontSize(12)
       .text(`${title} - ${ticker}`, x + 10, y + 10);
    
    // Placeholder content
    doc.font(this.fonts.regular)
       .fontSize(10)
       .text('[Chart visualization would appear here]', 0, y + chartHeight/2, {
         align: 'center',
         width: this.pageWidth
       });
  }

  addIncomeStatementTable(doc, x, y, incomeData) {
    return this.addFinancialTable(doc, x, y, 'Income Statement', [
      ['Revenues', incomeData.revenues || 'N/A'],
      ['Cost of Goods Sold', incomeData.cogs || 'N/A'],
      ['Gross Profit', incomeData.grossProfit || 'N/A'],
      ['SG&A and R&D', incomeData.sgaRnd || 'N/A'],
      ['EBITDA', incomeData.ebitda || 'N/A'],
      ['Net Income GAAP', incomeData.netIncome || 'N/A'],
      ['EPS GAAP', incomeData.eps || 'N/A']
    ]);
  }

  addBalanceSheetTable(doc, x, y, balanceData) {
    return this.addFinancialTable(doc, x, y, 'Balance Sheet', [
      ['Cash & Equivalents', balanceData.cash || 'N/A'],
      ['Total Current Assets', balanceData.currentAssets || 'N/A'],
      ['Total Assets', balanceData.totalAssets || 'N/A'],
      ['Total Current Liabilities', balanceData.currentLiabilities || 'N/A'],
      ['Total Liabilities', balanceData.totalLiabilities || 'N/A'],
      ['Shareholders Equity', balanceData.equity || 'N/A']
    ]);
  }

  addCashFlowTable(doc, x, y, cashFlowData) {
    return this.addFinancialTable(doc, x, y, 'Cash Flows', [
      ['Net Cash From Operations', cashFlowData.operatingCashFlow || 'N/A'],
      ['Capital Expenditures', cashFlowData.capex || 'N/A'],
      ['Free Cash Flow', cashFlowData.freeCashFlow || 'N/A'],
      ['Net Cash From Investing', cashFlowData.investingCashFlow || 'N/A'],
      ['Net Cash From Financing', cashFlowData.financingCashFlow || 'N/A'],
      ['Change in Cash & Equivalents', cashFlowData.netCashChange || 'N/A']
    ]);
  }

  addFinancialTable(doc, x, y, title, rows) {
    const tableWidth = this.contentWidth;
    const colWidth = tableWidth / 2;
    const rowHeight = 25;
    
    let currentY = y;
    
    // Table header
    doc.rect(x, currentY, tableWidth, 30)
       .fill(this.colors.primaryTeal);
    
    doc.fill(this.colors.white)
       .font(this.fonts.bold)
       .fontSize(12)
       .text(title, x + 10, currentY + 8);
    
    currentY += 30;
    
    // Table rows
    rows.forEach(([label, value], index) => {
      // Alternate row colors
      const bgColor = index % 2 === 0 ? this.colors.white : this.colors.lightGray;
      doc.rect(x, currentY, tableWidth, rowHeight)
         .fill(bgColor)
         .stroke(this.colors.mediumGray);
      
      // Label
      doc.fill(this.colors.darkText)
         .font(this.fonts.regular)
         .fontSize(10)
         .text(label, x + 10, currentY + 8);
      
      // Value
      doc.font(this.fonts.bold)
         .text(value, x + colWidth + 10, currentY + 8);
      
      currentY += rowHeight;
    });
    
    return currentY + 20;
  }

  addFinancialHighlights(doc, x, y, highlights) {
    if (!highlights) return y;
    
    doc.fill(this.colors.darkText)
       .font(this.fonts.bold)
       .fontSize(11)
       .text('Highlights', x, y);
    
    doc.font(this.fonts.regular)
       .fontSize(10)
       .text(highlights, x, y + 15, {
         width: this.contentWidth,
         align: 'justify'
       });
    
    return y + 60;
  }

  addAnnualTrendTable(doc, x, y, trendData) {
    const tableWidth = this.contentWidth;
    
    // Cyan header bar
    doc.rect(x, y, tableWidth, 25)
       .fill('#00bcd4'); // Cyan color matching NVDA example
    
    doc.fill(this.colors.white)
       .font(this.fonts.bold)
       .fontSize(10)
       .text('Annual Trend Detail', x + 10, y + 8);
    
    // Column headers
    const headerY = y + 25;
    const colHeaders = ['TTM', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017'];
    const colWidth = tableWidth / colHeaders.length;
    
    doc.rect(x, headerY, tableWidth, 20)
       .fill(this.colors.darkText);
    
    colHeaders.forEach((header, index) => {
      doc.fill(this.colors.white)
         .fontSize(8)
         .text(header, x + (index * colWidth) + 2, headerY + 6);
    });
    
    return headerY + 20;
  }

  addTrendAnalysisContent(doc, x, y, trendData) {
    doc.fill(this.colors.darkText)
       .font(this.fonts.bold)
       .fontSize(12)
       .text('Annual Trend Analysis', x, y);
    
    if (trendData.highlights) {
      doc.font(this.fonts.regular)
         .fontSize(10)
         .text(trendData.highlights.join(' '), x, y + 20, {
           width: this.contentWidth * 0.65,
           align: 'justify'
         });
    }
    
    return y + 100;
  }

  addTrendSummaryTable(doc, x, y, summaryData) {
    const tableWidth = this.contentWidth;
    
    // Trend Summary header
    doc.rect(x, y, tableWidth, 25)
       .fill(this.colors.primaryTeal);
    
    doc.fill(this.colors.white)
       .font(this.fonts.bold)
       .fontSize(12)
       .text('Trend Summary($M)', x + 10, y + 8);
    
    return y + 25;
  }

  addHighlightsBox(doc, x, y) {
    const boxWidth = this.contentWidth;
    const boxHeight = 60;
    
    doc.rect(x, y, boxWidth, boxHeight)
       .fill(this.colors.lightTeal)
       .stroke(this.colors.primaryTeal);
    
    doc.fill(this.colors.darkText)
       .font(this.fonts.bold)
       .fontSize(12)
       .text('Highlights', x + 10, y + 8);
    
    doc.font(this.fonts.regular)
       .fontSize(10)
       .text('Key financial and performance highlights would be displayed here.', x + 10, y + 25);
  }

  addNewsSection(doc, x, y, title, newsItems) {
    doc.fill(this.colors.darkText)
       .font(this.fonts.bold)
       .fontSize(12)
       .text(title, x, y);
    
    let newsY = y + 20;
    
    newsItems.slice(0, 8).forEach(newsItem => {
      doc.font(this.fonts.regular)
         .fontSize(9)
         .fillColor('blue')
         .text(newsItem.title || 'News Item', x, newsY, {
           width: this.contentWidth * 0.5,
           link: newsItem.url
         });
      
      newsY += 15;
    });
    
    return newsY;
  }

  addNewsSynopsis(doc, x, y, synopsis) {
    doc.fill(this.colors.darkText)
       .font(this.fonts.bold)
       .fontSize(12)
       .text('TriSight News Synopsis', x, y);
    
    if (Array.isArray(synopsis)) {
      synopsis.forEach((item, index) => {
        doc.font(this.fonts.regular)
           .fontSize(10)
           .text(item, x, y + 20 + (index * 60), {
             width: this.contentWidth * 0.4,
             align: 'justify'
           });
      });
    } else {
      doc.font(this.fonts.regular)
         .fontSize(10)
         .text(synopsis || 'News analysis would appear here.', x, y + 20, {
           width: this.contentWidth * 0.4,
           align: 'justify'
         });
    }
  }

  addAnalystContent(doc, x, y, analystData) {
    // Analyst Summary
    if (analystData.summary) {
      doc.fill(this.colors.darkText)
         .font(this.fonts.bold)
         .fontSize(12)
         .text('Analyst Summary Strengths', x, y);
      
      doc.font(this.fonts.regular)
         .fontSize(10)
         .text(analystData.summary, x, y + 20, {
           width: this.contentWidth * 0.65,
           align: 'justify'
         });
    }
    
    return y + 100;
  }

  addAnalystQuote(doc, x, y, quote) {
    const boxWidth = this.contentWidth * 0.28;
    const boxHeight = 100;
    
    // Quote box
    doc.rect(x, y, boxWidth, boxHeight)
       .fill(this.colors.lightTeal)
       .stroke(this.colors.primaryTeal);
    
    doc.fill(this.colors.darkText)
       .font(this.fonts.italic)
       .fontSize(11)
       .text(quote || 'Growth potential in ray-traced gaming, high performance computing, AI and self-driving cars are encouraging.', 
             x + 10, y + 10, {
               width: boxWidth - 20,
               align: 'center'
             });
  }

  addPageFooter(doc, text, pageNumber) {
    const footerY = this.pageHeight - 30;
    
    // Footer text
    doc.fill(this.colors.lightText)
       .font(this.fonts.regular)
       .fontSize(8)
       .text(text, this.margin, footerY, {
         width: this.contentWidth - 50,
         align: 'left'
       });
    
    // Page number in teal box
    doc.rect(this.pageWidth - 50, footerY - 5, 30, 20)
       .fill(this.colors.primaryTeal);
    
    doc.fill(this.colors.white)
       .font(this.fonts.bold)
       .fontSize(10)
       .text(pageNumber.toString(), this.pageWidth - 50, footerY, {
         width: 30,
         align: 'center'
       });
  }

  // Additional helper methods for enhanced formatting
  addSegmentDescription(doc, x, y, segments) {
    segments.forEach((segment, index) => {
      doc.fill(this.colors.darkText)
         .font(this.fonts.regular)
         .fontSize(10)
         .text(segment, x, y + (index * 40), {
           width: this.contentWidth * 0.65,
           align: 'justify'
         });
    });
    
    return y + (segments.length * 40) + 20;
  }

  addGuidanceContent(doc, x, y, content) {
    doc.fill(this.colors.darkText)
       .font(this.fonts.regular)
       .fontSize(10)
       .text(content, x, y, {
         width: this.contentWidth * 0.65,
         align: 'justify'
       });
    
    return y + 80;
  }

  addPerformanceContent(doc, x, y, perfData) {
    if (perfData.description) {
      doc.fill(this.colors.darkText)
         .font(this.fonts.regular)
         .fontSize(10)
         .text(perfData.description, x, y, {
           width: this.contentWidth * 0.65,
           align: 'justify'
         });
    }
    
    return y + 60;
  }
}

// Export the enhanced PDF generator
module.exports = { EnhancedPDFGenerator };

// Usage example:
/*
const generator = new EnhancedPDFGenerator();

const sampleData = {
  ticker: 'NVDA',
  companyName: 'NVIDIA Corporation',
  companyDescription: 'NVIDIA Corporation is the worldwide leader in visual computing technologies...',
  companyDetails: {
    sharePrice: '$173.50',
    trisightFMV: '$174.41',
    analystTarget: '$176.86',
    avgDailyVolume: '166,610,560',
    marketCap: '4,024,048',
    // ... more details
  },
  // ... rest of the data structure
};

generator.generateEnhancedPDF(sampleData, {
  ticker: 'NVDA',
  companyName: 'NVIDIA Corporation',
  template: 'equity-research'
}).then(filePath => {
  console.log('Enhanced PDF generated:', filePath);
}).catch(error => {
  console.error('Error generating PDF:', error);
});
*/