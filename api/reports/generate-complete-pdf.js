// Fix for jsPDF v3.x in CommonJS environment
const jsPDFModule = require('jspdf');
const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default || jsPDFModule;
require('jspdf-autotable');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reportData } = req.body;

    if (!reportData || !reportData.ticker) {
      return res.status(400).json({ error: 'Report data with ticker is required' });
    }

    // LOG what we're receiving
    console.log('=== RECEIVED DATA CHECK ===');
    console.log('Has aiAnalysis?', !!reportData.aiAnalysis);
    console.log('AI sections:', Object.keys(reportData.aiAnalysis || {}));
    console.log('Has rawData?', !!reportData.rawData);
    console.log('Raw data keys:', Object.keys(reportData.rawData || {}));
    console.log('Has slides?', !!reportData.slides);
    console.log('Slides count:', reportData.slides?.length || 0);

    console.log(`=== PDF START: ${reportData.ticker} ===`);

    const doc = new jsPDF();
    const ticker = reportData.ticker;
    const quote = reportData.rawData?.quote || {};
    const stats = reportData.rawData?.statistics || {};
    const income = reportData.rawData?.incomeStatement?.data?.[0];
    const balance = reportData.rawData?.balanceSheet?.data?.[0];

    // Helper function to create simple tables without autotable
    const addSimpleTable = (doc, startY, headers, rows, title = '') => {
      let y = startY;

      if (title) {
        doc.setFontSize(14);
        doc.setTextColor(0, 51, 102);
        doc.text(title, 20, y);
        y += 10;
      }

      // Headers
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.setFont(undefined, 'bold');
      headers.forEach((header, i) => {
        doc.text(header, 20 + (i * 60), y);
      });
      y += 8;

      // Rows
      doc.setFont(undefined, 'normal');
      rows.forEach(row => {
        row.forEach((cell, i) => {
          doc.text(String(cell), 20 + (i * 60), y);
        });
        y += 6;
      });

      return y + 5;
    };

    console.log('PAGE 1: Cover');
    // PAGE 1: COVER
    doc.setFontSize(24);
    doc.setTextColor(0, 51, 102);
    doc.text(`${ticker} Financial Report`, 20, 30);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 50);

    // Key metrics table
    let currentY = addSimpleTable(doc, 70, ['Metric', 'Value'], [
      ['Price', quote.close ? `$${quote.close}` : 'N/A'],
      ['Change', quote.percent_change ? `${quote.percent_change}%` : 'N/A'],
      ['Volume', quote.volume ? `${(quote.volume/1e6).toFixed(1)}M` : 'N/A']
    ], 'Key Metrics');

    console.log('PAGE 2: Summary');
    // PAGE 2: EXECUTIVE SUMMARY
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('Executive Summary', 20, 30);

    // USE THE REAL AI ANALYSIS from marketAssessment
    const summary = reportData.aiAnalysis?.marketAssessment ||
                   reportData.slides?.find(s => s.id === 'market-overview')?.content ||
                   `${ticker} shows strong market fundamentals with solid financial positioning. The company demonstrates consistent performance across key metrics with balanced risk-reward characteristics suitable for institutional portfolios.`;

    console.log('Using AI summary:', summary.substring(0, 100) + '...');

    doc.setFontSize(11);
    doc.setTextColor(0);
    const summaryLines = doc.splitTextToSize(summary.substring(0, 1200), 170);
    let summaryY = 50;
    summaryLines.forEach(line => {
      if (summaryY > 270) {
        doc.addPage();
        summaryY = 20;
      }
      doc.text(line, 20, summaryY);
      summaryY += 6;
    });

    console.log('PAGE 3: Financials');
    // PAGE 3: FINANCIAL ANALYSIS
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('Financial Analysis', 20, 30);

    currentY = 50;
    if (income) {
      // Convert financial values to numbers safely
      const revenue = parseFloat(income.sales) || 0;
      const netIncome = parseFloat(income.net_income) || 0;
      const eps = parseFloat(income.eps_diluted) || 0;

      currentY = addSimpleTable(doc, currentY, ['Item', 'Value'], [
        ['Revenue', revenue > 0 ? `$${(revenue/1e9).toFixed(2)}B` : 'N/A'],
        ['Net Income', netIncome !== 0 ? `$${(netIncome/1e9).toFixed(2)}B` : 'N/A'],
        ['EPS', eps !== 0 ? `$${eps.toFixed(2)}` : 'N/A']
      ], 'Income Statement');
    }

    if (balance) {
      // Convert balance sheet values to numbers safely
      const totalAssets = parseFloat(balance.total_assets) || 0;
      const totalDebt = parseFloat(balance.total_debt) || 0;
      const cash = parseFloat(balance.cash_and_equivalents) || 0;

      currentY = addSimpleTable(doc, currentY + 10, ['Balance Sheet', 'Value'], [
        ['Total Assets', totalAssets > 0 ? `$${(totalAssets/1e9).toFixed(2)}B` : 'N/A'],
        ['Total Debt', totalDebt > 0 ? `$${(totalDebt/1e9).toFixed(2)}B` : 'N/A'],
        ['Cash', cash > 0 ? `$${(cash/1e9).toFixed(2)}B` : 'N/A']
      ], 'Balance Sheet');
    }

    // ADD AI FINANCIAL ANALYSIS
    const financialAnalysis = reportData.aiAnalysis?.financialHealth ||
                             reportData.slides?.find(s => s.id === 'financial-analysis')?.content;

    if (financialAnalysis) {
      console.log('Adding AI financial analysis:', financialAnalysis.substring(0, 100) + '...');

      doc.setFontSize(14);
      doc.setTextColor(0, 51, 102);
      doc.text('AI Financial Analysis', 20, currentY + 20);

      doc.setFontSize(10);
      doc.setTextColor(0);
      const analysisLines = doc.splitTextToSize(financialAnalysis.substring(0, 800), 170);
      let analysisY = currentY + 35;
      analysisLines.forEach(line => {
        if (analysisY > 270) {
          doc.addPage();
          analysisY = 20;
        }
        doc.text(line, 20, analysisY);
        analysisY += 5;
      });
    }

    console.log('PAGE 4: Technical');
    // PAGE 4: TECHNICAL ANALYSIS
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('Technical Analysis', 20, 30);

    // USE ACTUAL TECHNICAL DATA if available
    const technicalRows = [];

    // RSI data - convert string to number
    if (reportData.rawData?.rsi?.values?.[0]) {
      const rsiRaw = reportData.rawData.rsi.values[0].rsi;
      const rsiValue = parseFloat(rsiRaw);

      if (!isNaN(rsiValue)) {
        console.log('Adding RSI data:', rsiValue);
        technicalRows.push(['RSI', rsiValue.toFixed(2), rsiValue > 70 ? 'Overbought' : rsiValue < 30 ? 'Oversold' : 'Neutral']);
      }
    }

    // MACD data - convert strings to numbers
    if (reportData.rawData?.macd?.values?.[0]) {
      const macdData = reportData.rawData.macd.values[0];
      const macdValue = parseFloat(macdData.macd);
      const macdSignal = parseFloat(macdData.macd_signal);

      if (!isNaN(macdValue) && !isNaN(macdSignal)) {
        console.log('Adding MACD data:', macdValue, macdSignal);
        technicalRows.push(['MACD', macdValue.toFixed(2), macdValue > macdSignal ? 'Bullish' : 'Bearish']);
      }
    }

    // Fallback to basic indicators - convert strings to numbers safely
    if (technicalRows.length === 0) {
      const ma50 = parseFloat(stats.stock_price_summary?.day_50_ma);
      const ma200 = parseFloat(stats.stock_price_summary?.day_200_ma);
      const beta = parseFloat(stats.stock_price_summary?.beta);
      const currentPrice = parseFloat(quote.close);

      technicalRows.push(
        ['50-Day MA',
         !isNaN(ma50) ? `$${ma50.toFixed(2)}` : 'N/A',
         !isNaN(currentPrice) && !isNaN(ma50) ?
         (currentPrice > ma50 ? 'Bullish' : 'Bearish') : 'N/A'],
        ['200-Day MA',
         !isNaN(ma200) ? `$${ma200.toFixed(2)}` : 'N/A',
         !isNaN(currentPrice) && !isNaN(ma200) ?
         (currentPrice > ma200 ? 'Bullish' : 'Bearish') : 'N/A'],
        ['Beta',
         !isNaN(beta) ? beta.toFixed(2) : 'N/A',
         !isNaN(beta) ? (beta > 1 ? 'High Risk' : 'Low Risk') : 'N/A']
      );
    }

    currentY = addSimpleTable(doc, 50, ['Indicator', 'Value', 'Signal'], technicalRows, 'Technical Indicators');

    // ADD AI TECHNICAL ANALYSIS if available
    const technicalAnalysis = reportData.aiAnalysis?.technicalAnalysis ||
                             reportData.slides?.find(s => s.id === 'technical-analysis')?.content;

    if (technicalAnalysis) {
      console.log('Adding AI technical analysis:', technicalAnalysis.substring(0, 100) + '...');

      doc.setFontSize(14);
      doc.setTextColor(0, 51, 102);
      doc.text('AI Technical Analysis', 20, currentY + 15);

      doc.setFontSize(10);
      doc.setTextColor(0);
      const techLines = doc.splitTextToSize(technicalAnalysis.substring(0, 600), 170);
      let techY = currentY + 30;
      techLines.forEach(line => {
        if (techY > 270) {
          doc.addPage();
          techY = 20;
        }
        doc.text(line, 20, techY);
        techY += 5;
      });
    }

    console.log('PAGE 5: AI Analysis');
    // PAGE 5: AI ANALYSIS
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('AI Investment Analysis', 20, 30);

    // USE ACTUAL AI ANALYSIS - combine all available AI insights
    const allAiAnalysis = [];

    if (reportData.aiAnalysis?.marketAssessment) {
      allAiAnalysis.push('MARKET ASSESSMENT:\n' + reportData.aiAnalysis.marketAssessment);
    }

    if (reportData.aiAnalysis?.financialHealth) {
      allAiAnalysis.push('FINANCIAL HEALTH:\n' + reportData.aiAnalysis.financialHealth);
    }

    if (reportData.aiAnalysis?.technicalAnalysis) {
      allAiAnalysis.push('TECHNICAL ANALYSIS:\n' + reportData.aiAnalysis.technicalAnalysis);
    }

    if (reportData.aiAnalysis?.investmentRecommendation) {
      allAiAnalysis.push('INVESTMENT RECOMMENDATION:\n' + reportData.aiAnalysis.investmentRecommendation);
    }

    const analysis = allAiAnalysis.length > 0 ?
      allAiAnalysis.join('\n\n').substring(0, 2000) :
      `Based on comprehensive analysis, ${ticker} presents a balanced investment profile with moderate risk-reward characteristics. The company demonstrates solid fundamentals with growth potential in its sector. Key strengths include market positioning and financial stability, while areas for monitoring include competitive pressures and market volatility.`;

    console.log('Using combined AI analysis:', analysis.substring(0, 150) + '...');

    doc.setFontSize(10);
    doc.setTextColor(0);
    const analysisLines = doc.splitTextToSize(analysis, 170);
    let analysisY = 50;
    analysisLines.forEach(line => {
      if (analysisY > 270) {
        doc.addPage();
        analysisY = 20;
      }
      doc.text(line, 20, analysisY);
      analysisY += 5;
    });

    console.log('PAGE 6: Risk');
    // PAGE 6: RISK ASSESSMENT
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('Risk Assessment', 20, 30);

    const pe = stats.valuations_metrics?.trailing_pe;
    const beta = stats.stock_price_summary?.beta;

    currentY = addSimpleTable(doc, 50, ['Risk Factor', 'Level', 'Description'], [
      ['Market Risk', 'Medium', 'General market volatility'],
      ['Valuation Risk', pe && pe > 25 ? 'High' : 'Medium', `P/E: ${pe ? pe.toFixed(2) : 'N/A'}`],
      ['Volatility Risk', beta && beta > 1.5 ? 'High' : 'Medium', `Beta: ${beta ? beta.toFixed(2) : 'N/A'}`],
      ['Liquidity Risk', 'Low', 'High trading volume']
    ], 'Risk Analysis');

    console.log('PAGE 7: Recommendation');
    // PAGE 7: INVESTMENT RECOMMENDATION
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('Investment Recommendation', 20, 30);

    // USE ACTUAL AI RECOMMENDATION
    const recommendation = reportData.aiAnalysis?.investmentRecommendation ||
                          reportData.slides?.find(s => s.id === 'investment-recommendation')?.content ||
                          reportData.aiAnalysis?.riskProfile ||
                          `Consider ${ticker} for long-term portfolio allocation based on risk tolerance. The stock shows balanced fundamentals with potential for steady growth.`;

    console.log('Using AI recommendation:', recommendation.substring(0, 100) + '...');

    doc.setFontSize(10);
    doc.setTextColor(0);
    const recLines = doc.splitTextToSize(recommendation.substring(0, 1000), 170);
    let recY = 50;
    recLines.forEach(line => {
      if (recY > 200) {
        // Leave space for price targets
        return;
      }
      doc.text(line, 20, recY);
      recY += 5;
    });

    // Price targets - convert strings to numbers safely
    const currentPrice = parseFloat(quote.close);
    const high52 = parseFloat(stats.stock_price_summary?.fifty_two_week_high);
    const low52 = parseFloat(stats.stock_price_summary?.fifty_two_week_low);

    if (!isNaN(currentPrice) && !isNaN(high52) && !isNaN(low52)) {
      console.log('Adding price targets:', currentPrice, high52, low52);
      const highUpside = ((high52 - currentPrice) / currentPrice * 100);
      const lowDownside = ((low52 - currentPrice) / currentPrice * 100);

      currentY = addSimpleTable(doc, recY + 20, ['Price Target', 'Value', 'Upside'], [
        ['Current', `$${currentPrice.toFixed(2)}`, '-'],
        ['52W High', `$${high52.toFixed(2)}`, `${highUpside.toFixed(1)}%`],
        ['52W Low', `$${low52.toFixed(2)}`, `${lowDownside.toFixed(1)}%`]
      ], 'Price Targets');
    }

    console.log('PAGE 8: Data Sources');
    // PAGE 8: DATA SOURCES
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('Data Sources & Disclaimer', 20, 30);

    const dataSourceRows = [
      ['Market Data', reportData.rawData?.quote ? 'SUCCESS' : 'FAILED'],
      ['Financials', reportData.rawData?.incomeStatement ? 'SUCCESS' : 'FAILED'],
      ['AI Analysis', reportData.aiAnalysis && Object.keys(reportData.aiAnalysis).length > 0 ? 'SUCCESS' : 'FAILED'],
      ['Sections', `${reportData.slides?.length || 0} sections loaded`],
      ['Data Status', Object.keys(reportData.dataStatus || {}).length > 0 ? 'TRACKED' : 'UNKNOWN']
    ];

    currentY = addSimpleTable(doc, 50, ['Source', 'Status'], dataSourceRows, 'Data Sources');

    // Add AI analysis summary
    if (reportData.aiAnalysis) {
      doc.setFontSize(12);
      doc.setTextColor(0, 51, 102);
      doc.text('AI Analysis Components:', 20, currentY + 10);

      doc.setFontSize(9);
      doc.setTextColor(0);
      const aiComponents = Object.keys(reportData.aiAnalysis).map(key => `• ${key}`).join('\n');
      const aiLines = doc.splitTextToSize(aiComponents, 170);
      let aiY = currentY + 20;
      aiLines.forEach(line => {
        doc.text(line, 25, aiY);
        aiY += 4;
      });
      currentY = aiY + 5;
    }

    // Disclaimer
    doc.setFontSize(9);
    doc.setTextColor(100);
    const disclaimer = 'This report is for informational purposes only. Not investment advice. Past performance does not guarantee future results.';
    const disclaimerLines = doc.splitTextToSize(disclaimer, 170);
    disclaimerLines.forEach(line => {
      doc.text(line, 20, currentY + 20);
      currentY += 6;
    });
    
    const pdfBuffer = doc.output('arraybuffer');
    console.log(`=== PDF COMPLETE: ${doc.getNumberOfPages()} pages ===`);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${ticker}-report.pdf"`);
    res.send(Buffer.from(pdfBuffer));
    
  } catch (error) {
    console.error('PDF ERROR:', error);
    res.status(500).json({ error: error.message });
  }
}
