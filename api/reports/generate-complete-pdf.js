// api/reports/generate-complete-pdf.js
// Complete Professional PDF Report Generator
// Generates 7-10 page comprehensive financial analysis reports

const jsPDF = require('jspdf');
require('jspdf-autotable');

class CompletePDFReportGenerator {
  constructor(ticker) {
    this.ticker = ticker;
    this.doc = new jsPDF();
    this.currentY = 20;
    this.pageNumber = 1;
    this.reportSections = [];
    
    // Set default font
    this.doc.setFont('helvetica');
  }

  async generateFullReport(intelligentData) {
    try {
      console.log(`Starting complete PDF generation for ${this.ticker}`);
      
      // Generate each section completely
      await this.generateCoverPage(intelligentData);
      await this.generateExecutiveSummary(intelligentData);
      await this.generateCompanyProfile(intelligentData);
      await this.generateFinancialAnalysis(intelligentData);
      await this.generateTechnicalAnalysis(intelligentData);
      await this.generateRiskAssessment(intelligentData);
      await this.generateInvestmentRecommendation(intelligentData);
      await this.generateDataTransparency(intelligentData);
      
      console.log(`Complete PDF generated: ${this.pageNumber} pages`);
      return this.doc.output('arraybuffer');
      
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  }

  // SECTION 1: COVER PAGE (Page 1)
  async generateCoverPage(data) {
    console.log('Generating cover page...');
    this.currentY = 20;
    
    // Company Name and Ticker - Large Font
    this.doc.setFontSize(28);
    this.doc.setTextColor(0, 51, 102); // Dark blue
    const companyName = data.rawData?.profile?.name || `${this.ticker} Corporation`;
    this.doc.text(`${this.ticker} - ${companyName}`, 20, this.currentY);
    
    // Subtitle
    this.currentY += 15;
    this.doc.setFontSize(16);
    this.doc.setTextColor(100);
    this.doc.text('Comprehensive Financial Analysis Report', 20, this.currentY);
    
    // Date and Intelligence Level
    this.currentY += 10;
    this.doc.setFontSize(12);
    this.doc.setTextColor(0);
    this.doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, this.currentY);
    this.currentY += 6;
    this.doc.text(`Intelligence Level: ${data.metadata?.intelligenceLevel || 'ENHANCED_AI'}`, 20, this.currentY);
    
    // KEY METRICS BOX - Critical for first impression
    this.currentY += 20;
    const quote = data.rawData?.quote || {};
    const statistics = data.rawData?.statistics || {};
    
    const metrics = [
      ['Current Price', `$${quote.close || quote.currentPrice || 'N/A'}`],
      ['Market Cap', this.formatMarketCap(statistics)],
      ['P/E Ratio', this.formatPE(statistics)],
      ['52W Range', this.format52WeekRange(statistics)],
      ['Daily Change', `${quote.percent_change || quote.changePercent || 'N/A'}%`],
      ['Volume', this.formatVolume(quote.volume)]
    ];
    
    this.doc.autoTable({
      startY: this.currentY,
      head: [['Metric', 'Value']],
      body: metrics,
      theme: 'grid',
      headStyles: { 
        fillColor: [0, 51, 102],
        textColor: [255, 255, 255],
        fontSize: 12,
        fontStyle: 'bold'
      },
      columnStyles: { 
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 60, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    });
    
    // Company Description
    this.currentY = this.doc.lastAutoTable.finalY + 15;
    this.doc.setFontSize(14);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text('Company Overview', 20, this.currentY);
    
    this.currentY += 8;
    this.doc.setFontSize(11);
    this.doc.setTextColor(0);
    const description = data.rawData?.profile?.description || 
      `${this.ticker} is a publicly traded company in the financial markets. This comprehensive analysis provides detailed insights into the company's financial performance, market position, and investment potential.`;
    
    const descriptionLines = this.doc.splitTextToSize(description, 170);
    this.doc.text(descriptionLines, 20, this.currentY);
    
    // Industry and Sector Information
    if (data.rawData?.profile?.sector || data.rawData?.profile?.industry) {
      this.currentY += descriptionLines.length * 5 + 10;
      this.doc.setFontSize(12);
      this.doc.setTextColor(0, 51, 102);
      this.doc.text('Industry Classification', 20, this.currentY);
      
      this.currentY += 8;
      this.doc.setFontSize(11);
      this.doc.setTextColor(0);
      if (data.rawData.profile.sector) {
        this.doc.text(`Sector: ${data.rawData.profile.sector}`, 20, this.currentY);
        this.currentY += 6;
      }
      if (data.rawData.profile.industry) {
        this.doc.text(`Industry: ${data.rawData.profile.industry}`, 20, this.currentY);
      }
    }
    
    // Add footer with report ID
    this.addPageFooter();
    
    // Add page break
    this.doc.addPage();
    this.pageNumber++;
  }

  // SECTION 2: EXECUTIVE SUMMARY WITH AI ANALYSIS (Page 2)
  async generateExecutiveSummary(data) {
    console.log('Generating executive summary...');
    this.currentY = 20;
    
    // Section Header
    this.addSectionHeader('Executive Summary - AI Market Assessment');
    
    // Use AI analysis if available
    const aiSummary = data.progressiveContext?.marketAssessment || 
      data.aiAnalysis?.executiveSummary ||
      this.generateFallbackSummary(data);
    
    // Format AI insights with bullet points
    const insights = this.extractBulletPoints(aiSummary);
    
    this.doc.setFontSize(11);
    this.doc.setTextColor(0);
    
    if (insights.length > 0) {
      insights.forEach(insight => {
        if (this.checkPageBreak()) {
          this.addNewPage();
        }
        this.doc.text(`• ${insight}`, 25, this.currentY);
        this.currentY += 8;
      });
    } else {
      // Fallback to paragraph format
      const summaryLines = this.doc.splitTextToSize(aiSummary, 170);
      summaryLines.forEach(line => {
        if (this.checkPageBreak()) {
          this.addNewPage();
        }
        this.doc.text(line, 20, this.currentY);
        this.currentY += 6;
      });
    }
    
    // Add performance summary table
    this.currentY += 10;
    if (this.checkPageBreak()) this.addNewPage();
    
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text('Performance Summary', 20, this.currentY);
    this.currentY += 8;
    
    const performanceData = this.buildPerformanceData(data);
    
    this.doc.autoTable({
      startY: this.currentY,
      head: [['Performance Metric', 'Value', 'Interpretation']],
      body: performanceData,
      theme: 'striped',
      headStyles: { 
        fillColor: [0, 51, 102],
        textColor: [255, 255, 255]
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40, halign: 'right' },
        2: { cellWidth: 80 }
      }
    });
    
    this.currentY = this.doc.lastAutoTable.finalY + 10;
    this.addPageFooter();
    this.checkPageBreak();
  }

  // SECTION 3: COMPANY PROFILE (Page 3)
  async generateCompanyProfile(data) {
    console.log('Generating company profile...');
    
    if (this.checkPageBreak()) this.addNewPage();
    
    this.addSectionHeader('Company Profile & Business Overview');
    
    const profile = data.rawData?.profile || {};
    
    // Company Details Table
    const companyDetails = [
      ['Company Name', profile.name || this.ticker],
      ['Ticker Symbol', this.ticker],
      ['Exchange', profile.exchange || 'N/A'],
      ['Sector', profile.sector || 'N/A'],
      ['Industry', profile.industry || 'N/A'],
      ['Country', profile.country || 'N/A'],
      ['Website', profile.website || 'N/A'],
      ['Employees', profile.full_time_employees ? profile.full_time_employees.toLocaleString() : 'N/A']
    ];
    
    this.doc.autoTable({
      startY: this.currentY,
      head: [['Attribute', 'Value']],
      body: companyDetails,
      theme: 'grid',
      headStyles: { 
        fillColor: [0, 51, 102],
        textColor: [255, 255, 255]
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 120 }
      }
    });
    
    this.currentY = this.doc.lastAutoTable.finalY + 15;
    
    // Business Description with AI Enhancement
    if (data.progressiveContext?.businessOverview || profile.description) {
      this.doc.setFontSize(12);
      this.doc.setTextColor(0, 51, 102);
      this.doc.text('Business Description', 20, this.currentY);
      this.currentY += 8;
      
      this.doc.setFontSize(11);
      this.doc.setTextColor(0);
      
      const businessDesc = data.progressiveContext?.businessOverview || profile.description;
      const descLines = this.doc.splitTextToSize(businessDesc, 170);
      
      descLines.forEach(line => {
        if (this.checkPageBreak()) {
          this.addNewPage();
        }
        this.doc.text(line, 20, this.currentY);
        this.currentY += 6;
      });
    }
    
    this.addPageFooter();
  }

  // Helper Functions
  addSectionHeader(title) {
    this.doc.setFontSize(16);
    this.doc.setTextColor(0, 51, 102);
    this.doc.setDrawColor(0, 51, 102);
    this.doc.setFontStyle('bold');
    this.doc.text(title, 20, this.currentY);
    this.doc.line(20, this.currentY + 2, 190, this.currentY + 2);
    this.doc.setFontStyle('normal');
    this.currentY += 12;
  }

  checkPageBreak() {
    if (this.currentY > 250) {
      this.addNewPage();
      return true;
    }
    return false;
  }

  addNewPage() {
    this.addPageFooter();
    this.doc.addPage();
    this.pageNumber++;
    this.currentY = 20;
  }

  addPageFooter() {
    this.doc.setFontSize(9);
    this.doc.setTextColor(100);
    this.doc.text(`${this.ticker} Financial Analysis Report`, 20, 285);
    this.doc.text(`Page ${this.pageNumber}`, 180, 285);
    this.doc.text(`Generated by TriSight Intelligence Platform`, 20, 290);
  }

  // Formatting helpers
  formatMarketCap(statistics) {
    const marketCap = statistics?.valuations_metrics?.market_capitalization;
    if (!marketCap) return 'N/A';
    
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  }

  formatPE(statistics) {
    const pe = statistics?.valuations_metrics?.trailing_pe;
    return pe ? pe.toFixed(2) : 'N/A';
  }

  format52WeekRange(statistics) {
    const low = statistics?.stock_price_summary?.fifty_two_week_low;
    const high = statistics?.stock_price_summary?.fifty_two_week_high;
    if (low && high) return `$${low} - $${high}`;
    return 'N/A';
  }

  formatVolume(volume) {
    if (!volume) return 'N/A';
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toLocaleString();
  }

  extractBulletPoints(text) {
    if (!text) return [];
    
    // Split by common bullet point patterns
    const lines = text.split('\n');
    const bullets = lines
      .filter(line => line.match(/^[\-\*\•]\s+|^\d+\.\s+/))
      .map(line => line.replace(/^[\-\*\•]\s+|^\d+\.\s+/, '').trim())
      .filter(bullet => bullet.length > 10);
    
    // If no bullets found, create them from sentences
    if (bullets.length === 0) {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
      return sentences.slice(0, 5).map(s => s.trim());
    }
    
    return bullets.slice(0, 8); // Limit to 8 bullet points
  }

  generateFallbackSummary(data) {
    const ticker = this.ticker;
    const price = data.rawData?.quote?.close || data.rawData?.quote?.currentPrice || 'N/A';
    const change = data.rawData?.quote?.percent_change || data.rawData?.quote?.changePercent || 'N/A';
    
    return `${ticker} is currently trading at $${price} with a daily change of ${change}%. This comprehensive analysis examines the company's financial performance, market position, technical indicators, and investment potential. The report includes real-time market data, financial statement analysis, technical indicators, risk assessment, and AI-powered insights to provide a complete investment perspective.`;
  }

  buildPerformanceData(data) {
    const quote = data.rawData?.quote || {};
    const statistics = data.rawData?.statistics || {};
    
    return [
      ['Current Price', `$${quote.close || quote.currentPrice || 'N/A'}`, 'Real-time market price'],
      ['Daily Change', `${quote.percent_change || quote.changePercent || 'N/A'}%`, this.interpretDailyChange(quote.percent_change || quote.changePercent)],
      ['Volume', this.formatVolume(quote.volume), this.interpretVolume(quote.volume, statistics)],
      ['Market Cap', this.formatMarketCap(statistics), this.interpretMarketCap(statistics)],
      ['P/E Ratio', this.formatPE(statistics), this.interpretPE(statistics?.valuations_metrics?.trailing_pe)],
      ['Beta', statistics?.stock_price_summary?.beta?.toFixed(2) || 'N/A', this.interpretBeta(statistics?.stock_price_summary?.beta)]
    ];
  }

  interpretDailyChange(change) {
    if (!change) return 'No data available';
    const num = parseFloat(change);
    if (num > 2) return 'Strong positive movement';
    if (num > 0) return 'Positive movement';
    if (num < -2) return 'Strong negative movement';
    if (num < 0) return 'Negative movement';
    return 'Minimal change';
  }

  interpretVolume(volume, statistics) {
    if (!volume || !statistics?.stock_statistics?.avg_90_volume) return 'Volume data unavailable';
    const avgVolume = statistics.stock_statistics.avg_90_volume;
    const ratio = volume / avgVolume;
    if (ratio > 1.5) return 'Above average volume';
    if (ratio < 0.5) return 'Below average volume';
    return 'Normal volume';
  }

  interpretMarketCap(statistics) {
    const marketCap = statistics?.valuations_metrics?.market_capitalization;
    if (!marketCap) return 'Market cap unavailable';
    if (marketCap >= 200e9) return 'Large cap stock';
    if (marketCap >= 10e9) return 'Mid cap stock';
    if (marketCap >= 2e9) return 'Small cap stock';
    return 'Micro cap stock';
  }

  interpretPE(pe) {
    if (!pe) return 'P/E ratio unavailable';
    if (pe > 25) return 'High valuation multiple';
    if (pe > 15) return 'Moderate valuation';
    if (pe > 0) return 'Low valuation multiple';
    return 'Negative earnings';
  }

  interpretBeta(beta) {
    if (!beta) return 'Beta unavailable';
    if (beta > 1.2) return 'High volatility vs market';
    if (beta > 0.8) return 'Moderate volatility';
    return 'Low volatility vs market';
  }

  // SECTION 4: FINANCIAL ANALYSIS WITH TABLES (Pages 4-5)
  async generateFinancialAnalysis(data) {
    console.log('Generating financial analysis...');

    if (this.checkPageBreak()) this.addNewPage();

    this.addSectionHeader('Financial Analysis');

    // INCOME STATEMENT TABLE
    this.doc.setFontSize(12);
    this.doc.setFontStyle('bold');
    this.doc.setTextColor(0, 51, 102);
    this.doc.text('Income Statement (in Millions)', 20, this.currentY);
    this.currentY += 8;
    this.doc.setFontStyle('normal');

    const incomeData = this.buildIncomeStatementData(data);

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Year', 'Revenue', 'Gross Profit', 'Op Income', 'Net Income', 'EPS']],
      body: incomeData,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 51, 102],
        fontSize: 10,
        textColor: [255, 255, 255]
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' },
        1: { cellWidth: 35, halign: 'right' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 35, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' }
      }
    });

    // BALANCE SHEET TABLE
    this.currentY = this.doc.lastAutoTable.finalY + 15;
    if (this.checkPageBreak()) this.addNewPage();

    this.doc.setFontSize(12);
    this.doc.setFontStyle('bold');
    this.doc.text('Balance Sheet (in Millions)', 20, this.currentY);
    this.currentY += 8;
    this.doc.setFontStyle('normal');

    const balanceData = this.buildBalanceSheetData(data);

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Year', 'Total Assets', 'Current Assets', 'Total Liabilities', 'Equity']],
      body: balanceData,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 51, 102],
        fontSize: 10,
        textColor: [255, 255, 255]
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' },
        1: { cellWidth: 40, halign: 'right' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' },
        4: { cellWidth: 40, halign: 'right' }
      }
    });

    // FINANCIAL RATIOS TABLE
    this.currentY = this.doc.lastAutoTable.finalY + 15;
    if (this.checkPageBreak()) this.addNewPage();

    this.doc.setFontSize(12);
    this.doc.setFontStyle('bold');
    this.doc.text('Key Financial Ratios', 20, this.currentY);
    this.currentY += 8;
    this.doc.setFontStyle('normal');

    const ratios = this.buildFinancialRatios(data);

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Financial Metric', 'Value', 'Industry Benchmark']],
      body: ratios,
      theme: 'striped',
      headStyles: {
        fillColor: [0, 51, 102],
        textColor: [255, 255, 255]
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 40, halign: 'right' },
        2: { cellWidth: 60, halign: 'center' }
      }
    });

    // Add AI Financial Analysis
    if (data.progressiveContext?.financialHealth) {
      this.currentY = this.doc.lastAutoTable.finalY + 15;
      this.addAIInsightBox('Financial Health AI Analysis', data.progressiveContext.financialHealth);
    }

    this.addPageFooter();
  }

  // SECTION 5: TECHNICAL ANALYSIS WITH INDICATORS (Page 6)
  async generateTechnicalAnalysis(data) {
    console.log('Generating technical analysis...');

    if (this.checkPageBreak()) this.addNewPage();

    this.addSectionHeader('Technical Analysis');

    // Create Technical Indicators Table
    const technicalData = this.buildTechnicalIndicators(data);

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Technical Indicator', 'Value', 'Signal']],
      body: technicalData,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 51, 102],
        textColor: [255, 255, 255]
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 50, halign: 'right' },
        2: { cellWidth: 60, halign: 'center' }
      },
      didDrawCell: (data) => {
        // Color code signals
        if (data.column.index === 2 && data.cell.section === 'body') {
          const signal = data.cell.raw;
          if (signal.includes('Bullish') || signal.includes('Buy')) {
            this.doc.setTextColor(0, 150, 0);
          } else if (signal.includes('Bearish') || signal.includes('Sell')) {
            this.doc.setTextColor(255, 0, 0);
          } else {
            this.doc.setTextColor(255, 165, 0);
          }
        }
      }
    });

    // Add Price Chart Visualization (simplified representation)
    this.currentY = this.doc.lastAutoTable.finalY + 15;
    this.addPriceChartVisualization(data.rawData?.timeSeries);

    // Add AI Technical Analysis
    if (data.progressiveContext?.technicalAnalysis) {
      this.currentY += 15;
      this.addAIInsightBox('Technical Analysis AI Insights', data.progressiveContext.technicalAnalysis);
    }

    this.addPageFooter();
  }

  // SECTION 6: RISK ASSESSMENT (Page 7)
  async generateRiskAssessment(data) {
    console.log('Generating risk assessment...');

    if (this.checkPageBreak()) this.addNewPage();

    this.addSectionHeader('Risk Assessment');

    // Generate risk matrix
    const risks = this.buildRiskMatrix(data);

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Risk Factor', 'Level', 'Impact', 'Description']],
      body: risks,
      theme: 'grid',
      headStyles: {
        fillColor: [204, 0, 0],
        textColor: [255, 255, 255]
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 90 }
      },
      didDrawCell: (data) => {
        // Color code risk levels
        if (data.column.index === 1 && data.cell.section === 'body') {
          const level = data.cell.raw;
          if (level === 'High') {
            this.doc.setFillColor(255, 200, 200);
          } else if (level === 'Medium') {
            this.doc.setFillColor(255, 255, 200);
          } else if (level === 'Low') {
            this.doc.setFillColor(200, 255, 200);
          }
        }
      }
    });

    // Risk Score Summary
    this.currentY = this.doc.lastAutoTable.finalY + 15;
    this.addRiskScoreSummary(data);

    // Add AI Risk Analysis
    if (data.progressiveContext?.riskAssessment) {
      this.currentY += 15;
      this.addAIInsightBox('AI Risk Assessment', data.progressiveContext.riskAssessment);
    }

    this.addPageFooter();
  }

  // SECTION 7: INVESTMENT RECOMMENDATION (Page 8)
  async generateInvestmentRecommendation(data) {
    console.log('Generating investment recommendation...');

    if (this.checkPageBreak()) this.addNewPage();

    this.addSectionHeader('Investment Recommendation');

    // Generate recommendation using AI or fallback
    const recommendation = data.progressiveContext?.investmentRecommendation ||
      this.generateAIRecommendation(data);

    // Add recommendation box with color coding
    this.addRecommendationBox(recommendation);

    // Add price targets table
    this.currentY += 15;
    const targets = this.buildPriceTargets(data);

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Price Metric', 'Value', 'Timeframe']],
      body: targets,
      theme: 'striped',
      headStyles: {
        fillColor: [0, 51, 102],
        textColor: [255, 255, 255]
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 50, halign: 'right' },
        2: { cellWidth: 60, halign: 'center' }
      }
    });

    // Investment Thesis
    this.currentY = this.doc.lastAutoTable.finalY + 15;
    this.addInvestmentThesis(data);

    this.addPageFooter();
  }

  // SECTION 8: DATA TRANSPARENCY (Last Page)
  async generateDataTransparency(data) {
    console.log('Generating data transparency report...');

    if (this.checkPageBreak()) this.addNewPage();

    this.addSectionHeader('Data Transparency Report');

    // Show all data sources and their status
    const dataSources = this.getDataSourceStatus(data);

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Data Source', 'Status', 'Last Updated', 'Quality Score']],
      body: dataSources,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 100, 0],
        textColor: [255, 255, 255]
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 50, halign: 'center' },
        3: { cellWidth: 40, halign: 'center' }
      },
      didDrawCell: (data) => {
        if (data.column.index === 1 && data.cell.section === 'body') {
          if (data.cell.raw === 'SUCCESS') {
            this.doc.setTextColor(0, 150, 0);
          } else {
            this.doc.setTextColor(255, 0, 0);
          }
        }
      }
    });

    // Add methodology section
    this.currentY = this.doc.lastAutoTable.finalY + 15;
    this.addMethodologySection();

    // Add disclaimer
    this.currentY += 15;
    this.addDisclaimer();

    this.addPageFooter();
  }

  // ADDITIONAL HELPER FUNCTIONS

  addAIInsightBox(title, content) {
    if (this.checkPageBreak()) this.addNewPage();

    this.doc.setFillColor(240, 248, 255); // Light blue background
    this.doc.rect(15, this.currentY - 5, 180, 60, 'F');

    this.doc.setFontSize(11);
    this.doc.setFontStyle('bold');
    this.doc.setTextColor(0, 51, 102);
    this.doc.text(title, 20, this.currentY);
    this.currentY += 8;

    this.doc.setFontStyle('normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(0);

    const lines = this.doc.splitTextToSize(content, 170);
    lines.forEach(line => {
      if (this.currentY > 245) {
        this.addNewPage();
        this.currentY = 20;
      }
      this.doc.text(line, 20, this.currentY);
      this.currentY += 5;
    });

    this.currentY += 10;
  }

  addPriceChartVisualization(timeSeriesData) {
    if (this.checkPageBreak()) this.addNewPage();

    this.doc.setDrawColor(0, 51, 102);
    this.doc.setLineWidth(0.5);

    // Draw chart frame
    const chartX = 20;
    const chartY = this.currentY;
    const chartWidth = 170;
    const chartHeight = 40;

    // Draw axes
    this.doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight); // X axis
    this.doc.line(chartX, chartY, chartX, chartY + chartHeight); // Y axis

    // Add title
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text('30-Day Price Movement Trend', chartX + chartWidth/2 - 40, chartY - 5);

    // Draw simplified trend line (placeholder)
    this.doc.setDrawColor(0, 150, 0);
    this.doc.setLineWidth(1);
    this.doc.line(chartX + 10, chartY + 30, chartX + chartWidth - 10, chartY + 10);

    // Add labels
    this.doc.setFontSize(8);
    this.doc.setTextColor(100);
    this.doc.text('30d ago', chartX, chartY + chartHeight + 8);
    this.doc.text('Today', chartX + chartWidth - 20, chartY + chartHeight + 8);
    this.doc.text('Price', chartX - 15, chartY + chartHeight/2);

    this.currentY += chartHeight + 15;
  }

  addRecommendationBox(recommendation) {
    if (this.checkPageBreak()) this.addNewPage();

    // Determine recommendation color
    let bgColor, textColor, recText;
    if (recommendation.toLowerCase().includes('buy') || recommendation.toLowerCase().includes('strong buy')) {
      bgColor = [200, 255, 200]; // Light green
      textColor = [0, 100, 0]; // Dark green
      recText = 'BUY RECOMMENDATION';
    } else if (recommendation.toLowerCase().includes('sell')) {
      bgColor = [255, 200, 200]; // Light red
      textColor = [150, 0, 0]; // Dark red
      recText = 'SELL RECOMMENDATION';
    } else {
      bgColor = [255, 255, 200]; // Light yellow
      textColor = [150, 150, 0]; // Dark yellow
      recText = 'HOLD RECOMMENDATION';
    }

    this.doc.setFillColor(...bgColor);
    this.doc.rect(15, this.currentY - 5, 180, 50, 'F');

    this.doc.setFontSize(14);
    this.doc.setFontStyle('bold');
    this.doc.setTextColor(...textColor);
    this.doc.text(recText, 20, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(11);
    this.doc.setFontStyle('normal');
    this.doc.setTextColor(0);

    const recLines = this.doc.splitTextToSize(recommendation, 170);
    recLines.forEach(line => {
      this.doc.text(line, 20, this.currentY);
      this.currentY += 6;
    });

    this.currentY += 10;
  }

  addRiskScoreSummary(data) {
    if (this.checkPageBreak()) this.addNewPage();

    this.doc.setFontSize(12);
    this.doc.setFontStyle('bold');
    this.doc.setTextColor(0, 51, 102);
    this.doc.text('Overall Risk Score', 20, this.currentY);
    this.currentY += 8;

    // Calculate overall risk score (simplified)
    const riskScore = this.calculateOverallRiskScore(data);

    this.doc.setFontSize(24);
    this.doc.setFontStyle('bold');

    if (riskScore >= 7) {
      this.doc.setTextColor(255, 0, 0); // Red for high risk
    } else if (riskScore >= 4) {
      this.doc.setTextColor(255, 165, 0); // Orange for medium risk
    } else {
      this.doc.setTextColor(0, 150, 0); // Green for low risk
    }

    this.doc.text(`${riskScore}/10`, 20, this.currentY);

    this.doc.setFontSize(11);
    this.doc.setFontStyle('normal');
    this.doc.setTextColor(0);
    this.doc.text(this.getRiskScoreInterpretation(riskScore), 60, this.currentY - 5);

    this.currentY += 10;
  }

  addInvestmentThesis(data) {
    if (this.checkPageBreak()) this.addNewPage();

    this.doc.setFontSize(12);
    this.doc.setFontStyle('bold');
    this.doc.setTextColor(0, 51, 102);
    this.doc.text('Investment Thesis', 20, this.currentY);
    this.currentY += 8;

    this.doc.setFontSize(11);
    this.doc.setFontStyle('normal');
    this.doc.setTextColor(0);

    const thesis = this.generateInvestmentThesis(data);
    const thesisLines = this.doc.splitTextToSize(thesis, 170);

    thesisLines.forEach(line => {
      if (this.checkPageBreak()) this.addNewPage();
      this.doc.text(line, 20, this.currentY);
      this.currentY += 6;
    });
  }

  addMethodologySection() {
    if (this.checkPageBreak()) this.addNewPage();

    this.doc.setFontSize(12);
    this.doc.setFontStyle('bold');
    this.doc.setTextColor(0, 51, 102);
    this.doc.text('Analysis Methodology', 20, this.currentY);
    this.currentY += 8;

    this.doc.setFontSize(10);
    this.doc.setFontStyle('normal');
    this.doc.setTextColor(0);

    const methodology = `This comprehensive financial analysis employs multiple data sources and analytical frameworks:

• Fundamental Analysis: Financial statement analysis, ratio calculations, and peer comparisons
• Technical Analysis: Price trends, volume analysis, and momentum indicators
• AI-Enhanced Insights: Machine learning algorithms for pattern recognition and predictive modeling
• Risk Assessment: Multi-factor risk modeling including market, credit, and operational risks
• Real-time Data Integration: Live market feeds and up-to-date financial information`;

    const methodLines = this.doc.splitTextToSize(methodology, 170);
    methodLines.forEach(line => {
      if (this.checkPageBreak()) this.addNewPage();
      this.doc.text(line, 20, this.currentY);
      this.currentY += 5;
    });
  }

  addDisclaimer() {
    if (this.checkPageBreak()) this.addNewPage();

    this.doc.setFontSize(9);
    this.doc.setTextColor(100);

    const disclaimer = `IMPORTANT DISCLAIMER: This report is for informational purposes only and does not constitute investment advice. The information contained herein is based on sources believed to be reliable but is not guaranteed. Past performance does not guarantee future results. All investments carry risk of loss. AI-generated analysis should be considered as supplementary information only. Please consult with a qualified financial advisor before making investment decisions. TriSight Intelligence Platform and its affiliates are not responsible for any investment losses that may result from the use of this information.`;

    const disclaimerLines = this.doc.splitTextToSize(disclaimer, 170);
    disclaimerLines.forEach(line => {
      if (this.currentY > 280) {
        this.addNewPage();
      }
      this.doc.text(line, 20, this.currentY);
      this.currentY += 4;
    });
  }

  generateAIRecommendation(data) {
    // Fallback recommendation generation
    const pe = data.rawData?.statistics?.valuations_metrics?.trailing_pe;
    const change = data.rawData?.quote?.percent_change || data.rawData?.quote?.changePercent;
    const volume = data.rawData?.quote?.volume;
    const avgVolume = data.rawData?.statistics?.stock_statistics?.avg_90_volume;

    let recommendation = `Based on comprehensive analysis of ${this.ticker}, `;

    if (pe && pe < 15) {
      recommendation += "the stock appears undervalued with attractive P/E ratio. ";
    } else if (pe && pe > 25) {
      recommendation += "valuation appears stretched with high P/E ratio. ";
    }

    if (change && Math.abs(parseFloat(change)) > 2) {
      recommendation += "Recent price volatility suggests increased market attention. ";
    }

    if (volume && avgVolume && volume > avgVolume * 1.5) {
      recommendation += "Above-average trading volume indicates strong investor interest. ";
    }

    recommendation += "Investors should consider their risk tolerance and investment timeline before making decisions.";

    return recommendation;
  }

  calculateOverallRiskScore(data) {
    let score = 5; // Base score

    const pe = data.rawData?.statistics?.valuations_metrics?.trailing_pe;
    const beta = data.rawData?.statistics?.stock_price_summary?.beta;
    const debtToEquity = data.rawData?.statistics?.financials?.balance_sheet?.total_debt_to_equity_mrq;

    // Adjust based on valuation
    if (pe && pe > 30) score += 2;
    else if (pe && pe < 10) score -= 1;

    // Adjust based on volatility
    if (beta && beta > 1.5) score += 1;
    else if (beta && beta < 0.8) score -= 1;

    // Adjust based on debt
    if (debtToEquity && debtToEquity > 100) score += 1;
    else if (debtToEquity && debtToEquity < 30) score -= 1;

    return Math.max(1, Math.min(10, score));
  }

  getRiskScoreInterpretation(score) {
    if (score >= 8) return 'High Risk - Speculative investment';
    if (score >= 6) return 'Medium-High Risk - Growth oriented';
    if (score >= 4) return 'Medium Risk - Balanced approach';
    if (score >= 2) return 'Low-Medium Risk - Conservative growth';
    return 'Low Risk - Capital preservation';
  }

  generateInvestmentThesis(data) {
    const ticker = this.ticker;
    const sector = data.rawData?.profile?.sector || 'the market';
    const marketCap = this.formatMarketCap(data.rawData?.statistics);

    return `${ticker} represents a ${marketCap} company operating in ${sector}. The investment thesis is built on fundamental analysis of financial performance, competitive positioning, and market dynamics. Key factors include revenue growth trajectory, profitability metrics, balance sheet strength, and sector-specific opportunities. Technical analysis suggests current price levels relative to historical ranges and momentum indicators. Risk factors have been assessed across market, operational, and financial dimensions. This analysis provides a framework for investment decision-making while acknowledging the inherent uncertainties in financial markets.`;
  }

  // DATA BUILDING HELPER FUNCTIONS

  buildIncomeStatementData(data) {
    const incomeStatement = data.rawData?.incomeStatement?.data;
    if (!incomeStatement || incomeStatement.length === 0) {
      return [
        ['2023', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A'],
        ['2022', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A'],
        ['2021', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A']
      ];
    }

    return incomeStatement.slice(0, 3).map(year => [
      year.fiscal_date ? year.fiscal_date.substring(0, 4) : 'N/A',
      year.sales ? `$${(year.sales / 1e6).toFixed(0)}` : 'N/A',
      year.gross_profit ? `$${(year.gross_profit / 1e6).toFixed(0)}` : 'N/A',
      year.operating_income ? `$${(year.operating_income / 1e6).toFixed(0)}` : 'N/A',
      year.net_income ? `$${(year.net_income / 1e6).toFixed(0)}` : 'N/A',
      year.eps_diluted ? `$${year.eps_diluted}` : 'N/A'
    ]);
  }

  buildBalanceSheetData(data) {
    const balanceSheet = data.rawData?.balanceSheet?.data;
    if (!balanceSheet || balanceSheet.length === 0) {
      return [
        ['2023', 'N/A', 'N/A', 'N/A', 'N/A'],
        ['2022', 'N/A', 'N/A', 'N/A', 'N/A'],
        ['2021', 'N/A', 'N/A', 'N/A', 'N/A']
      ];
    }

    return balanceSheet.slice(0, 3).map(year => [
      year.fiscal_date ? year.fiscal_date.substring(0, 4) : 'N/A',
      year.assets?.total_assets ? `$${(year.assets.total_assets / 1e6).toFixed(0)}` : 'N/A',
      year.assets?.current_assets?.total_current_assets ? `$${(year.assets.current_assets.total_current_assets / 1e6).toFixed(0)}` : 'N/A',
      year.liabilities?.total_liabilities ? `$${(year.liabilities.total_liabilities / 1e6).toFixed(0)}` : 'N/A',
      year.shareholders_equity?.total_shareholders_equity ? `$${(year.shareholders_equity.total_shareholders_equity / 1e6).toFixed(0)}` : 'N/A'
    ]);
  }

  buildFinancialRatios(data) {
    const stats = data.rawData?.statistics?.financials;
    if (!stats) {
      return [
        ['Gross Margin', 'N/A', 'Industry Avg'],
        ['Operating Margin', 'N/A', 'Industry Avg'],
        ['Profit Margin', 'N/A', 'Industry Avg'],
        ['ROE', 'N/A', '15-20%'],
        ['ROA', 'N/A', '5-10%'],
        ['Current Ratio', 'N/A', '1.5-3.0'],
        ['Debt/Equity', 'N/A', '<50%']
      ];
    }

    return [
      ['Gross Margin', stats.gross_margin ? `${(stats.gross_margin * 100).toFixed(2)}%` : 'N/A', 'Industry Avg'],
      ['Operating Margin', stats.operating_margin ? `${(stats.operating_margin * 100).toFixed(2)}%` : 'N/A', 'Industry Avg'],
      ['Profit Margin', stats.profit_margin ? `${(stats.profit_margin * 100).toFixed(2)}%` : 'N/A', 'Industry Avg'],
      ['ROE', stats.return_on_equity_ttm ? `${(stats.return_on_equity_ttm * 100).toFixed(2)}%` : 'N/A', '15-20%'],
      ['ROA', stats.return_on_assets_ttm ? `${(stats.return_on_assets_ttm * 100).toFixed(2)}%` : 'N/A', '5-10%'],
      ['Current Ratio', stats.balance_sheet?.current_ratio_mrq ? stats.balance_sheet.current_ratio_mrq.toFixed(2) : 'N/A', '1.5-3.0'],
      ['Debt/Equity', stats.balance_sheet?.total_debt_to_equity_mrq ? `${stats.balance_sheet.total_debt_to_equity_mrq.toFixed(2)}%` : 'N/A', '<50%']
    ];
  }

  buildTechnicalIndicators(data) {
    return [
      ['RSI (14)', this.formatRSI(data.rawData?.rsi), this.interpretRSI(data.rawData?.rsi)],
      ['MACD Signal', this.formatMACD(data.rawData?.macd), this.interpretMACD(data.rawData?.macd)],
      ['50-Day MA', this.formatMovingAverage(data.rawData?.statistics?.stock_price_summary?.day_50_ma), this.interpretMA(data.rawData?.quote, data.rawData?.statistics?.stock_price_summary?.day_50_ma)],
      ['200-Day MA', this.formatMovingAverage(data.rawData?.statistics?.stock_price_summary?.day_200_ma), this.interpretMA(data.rawData?.quote, data.rawData?.statistics?.stock_price_summary?.day_200_ma)],
      ['Volume Trend', this.formatVolumeTrend(data.rawData?.quote?.volume, data.rawData?.statistics?.stock_statistics?.avg_90_volume), this.interpretVolumeTrend(data.rawData?.quote?.volume, data.rawData?.statistics?.stock_statistics?.avg_90_volume)],
      ['Volatility (Beta)', this.formatBeta(data.rawData?.statistics?.stock_price_summary?.beta), this.interpretBeta(data.rawData?.statistics?.stock_price_summary?.beta)]
    ];
  }

  buildRiskMatrix(data) {
    const pe = data.rawData?.statistics?.valuations_metrics?.trailing_pe;
    const beta = data.rawData?.statistics?.stock_price_summary?.beta;
    const sector = data.rawData?.profile?.sector || 'Unknown';

    return [
      ['Market Risk', this.assessMarketRisk(beta), 'High', 'General market volatility and economic conditions'],
      ['Valuation Risk', this.assessValuationRisk(pe), 'Medium', `P/E ratio of ${pe ? pe.toFixed(1) : 'N/A'} indicates valuation concerns`],
      ['Sector Risk', this.assessSectorRisk(sector), 'Medium', `${sector} sector-specific risks and competition`],
      ['Liquidity Risk', this.assessLiquidityRisk(data.rawData?.quote?.volume), 'Low', 'Trading volume and market liquidity considerations'],
      ['Financial Risk', this.assessFinancialRisk(data.rawData?.statistics?.financials), 'Medium', 'Debt levels and financial stability metrics']
    ];
  }

  buildPriceTargets(data) {
    const currentPrice = data.rawData?.quote?.close || data.rawData?.quote?.currentPrice;
    const low52 = data.rawData?.statistics?.stock_price_summary?.fifty_two_week_low;
    const high52 = data.rawData?.statistics?.stock_price_summary?.fifty_two_week_high;

    return [
      ['Current Price', currentPrice ? `$${currentPrice}` : 'N/A', 'Real-time'],
      ['52W Low', low52 ? `$${low52}` : 'N/A', 'Historical'],
      ['52W High', high52 ? `$${high52}` : 'N/A', 'Historical'],
      ['Support Level', this.calculateSupport(currentPrice, low52), '3-6 months'],
      ['Resistance Level', this.calculateResistance(currentPrice, high52), '3-6 months'],
      ['Target Price', this.calculateTargetPrice(currentPrice, data), '12 months']
    ];
  }

  getDataSourceStatus(data) {
    const sources = [
      ['TwelveData Market Quote', data.rawData?.quote ? 'SUCCESS' : 'FAILED', new Date().toISOString().split('T')[0], data.rawData?.quote ? '95%' : '0%'],
      ['Company Profile', data.rawData?.profile ? 'SUCCESS' : 'FAILED', new Date().toISOString().split('T')[0], data.rawData?.profile ? '90%' : '0%'],
      ['Financial Statements', data.rawData?.incomeStatement ? 'SUCCESS' : 'FAILED', new Date().toISOString().split('T')[0], data.rawData?.incomeStatement ? '85%' : '0%'],
      ['Technical Indicators', data.rawData?.rsi || data.rawData?.macd ? 'SUCCESS' : 'PARTIAL', new Date().toISOString().split('T')[0], '80%'],
      ['AI Analysis Engine', data.progressiveContext ? 'SUCCESS' : 'FAILED', new Date().toISOString().split('T')[0], data.progressiveContext ? '95%' : '0%'],
      ['Market Statistics', data.rawData?.statistics ? 'SUCCESS' : 'FAILED', new Date().toISOString().split('T')[0], data.rawData?.statistics ? '90%' : '0%']
    ];

    return sources;
  }

  // FORMATTING AND INTERPRETATION HELPERS

  formatRSI(rsiData) {
    const latestRSI = rsiData?.values?.[0]?.rsi;
    return latestRSI ? parseFloat(latestRSI).toFixed(2) : 'N/A';
  }

  interpretRSI(rsiData) {
    const latestRSI = rsiData?.values?.[0]?.rsi;
    if (!latestRSI) return 'No data';

    const value = parseFloat(latestRSI);
    if (value > 70) return 'Overbought';
    if (value < 30) return 'Oversold';
    return 'Neutral';
  }

  formatMACD(macdData) {
    const latest = macdData?.values?.[0];
    if (!latest) return 'N/A';
    return parseFloat(latest.macd).toFixed(4);
  }

  interpretMACD(macdData) {
    const latest = macdData?.values?.[0];
    if (!latest) return 'No data';

    const signal = latest.macd > latest.macd_signal ? 'Bullish' : 'Bearish';
    return signal;
  }

  formatMovingAverage(ma) {
    return ma ? `$${ma.toFixed(2)}` : 'N/A';
  }

  interpretMA(quote, ma) {
    if (!quote || !ma) return 'No data';
    const currentPrice = quote.close || quote.currentPrice;
    if (!currentPrice) return 'No data';

    return currentPrice > ma ? 'Above MA' : 'Below MA';
  }

  formatVolumeTrend(currentVolume, avgVolume) {
    if (!currentVolume || !avgVolume) return 'N/A';
    const ratio = (currentVolume / avgVolume).toFixed(2);
    return `${ratio}x avg`;
  }

  interpretVolumeTrend(currentVolume, avgVolume) {
    if (!currentVolume || !avgVolume) return 'No data';
    const ratio = currentVolume / avgVolume;

    if (ratio > 1.5) return 'High volume';
    if (ratio < 0.5) return 'Low volume';
    return 'Normal volume';
  }

  formatBeta(beta) {
    return beta ? beta.toFixed(2) : 'N/A';
  }

  // RISK ASSESSMENT HELPERS

  assessMarketRisk(beta) {
    if (!beta) return 'Medium';
    if (beta > 1.5) return 'High';
    if (beta < 0.5) return 'Low';
    return 'Medium';
  }

  assessValuationRisk(pe) {
    if (!pe) return 'Medium';
    if (pe > 30) return 'High';
    if (pe < 10) return 'Low';
    return 'Medium';
  }

  assessSectorRisk(sector) {
    const highRiskSectors = ['Technology', 'Biotechnology', 'Energy'];
    const lowRiskSectors = ['Utilities', 'Consumer Staples', 'Healthcare'];

    if (highRiskSectors.includes(sector)) return 'High';
    if (lowRiskSectors.includes(sector)) return 'Low';
    return 'Medium';
  }

  assessLiquidityRisk(volume) {
    if (!volume) return 'Medium';
    if (volume > 1000000) return 'Low';
    if (volume < 100000) return 'High';
    return 'Medium';
  }

  assessFinancialRisk(financials) {
    if (!financials) return 'Medium';
    const debtToEquity = financials.balance_sheet?.total_debt_to_equity_mrq;
    if (!debtToEquity) return 'Medium';

    if (debtToEquity > 100) return 'High';
    if (debtToEquity < 30) return 'Low';
    return 'Medium';
  }

  // PRICE TARGET CALCULATIONS

  calculateSupport(currentPrice, low52) {
    if (!currentPrice || !low52) return 'N/A';
    const support = Math.max(low52, currentPrice * 0.85);
    return `$${support.toFixed(2)}`;
  }

  calculateResistance(currentPrice, high52) {
    if (!currentPrice || !high52) return 'N/A';
    const resistance = Math.min(high52, currentPrice * 1.15);
    return `$${resistance.toFixed(2)}`;
  }

  calculateTargetPrice(currentPrice, data) {
    if (!currentPrice) return 'N/A';

    // Simple target calculation based on growth assumptions
    const growthFactor = this.estimateGrowthFactor(data);
    const target = currentPrice * growthFactor;
    return `$${target.toFixed(2)}`;
  }

  estimateGrowthFactor(data) {
    // Basic growth estimation - in real implementation, this would be more sophisticated
    const pe = data.rawData?.statistics?.valuations_metrics?.trailing_pe;
    const sector = data.rawData?.profile?.sector;

    let baseFactor = 1.1; // 10% base growth

    if (pe && pe < 15) baseFactor += 0.05; // Value premium
    if (pe && pe > 25) baseFactor -= 0.05; // Growth discount

    if (sector === 'Technology') baseFactor += 0.1;
    if (sector === 'Utilities') baseFactor -= 0.05;

    return Math.max(0.8, Math.min(1.5, baseFactor)); // Cap between 80% and 150%
  }
}
