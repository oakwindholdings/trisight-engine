const jsPDF = require('jspdf');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reportData } = req.body;

    if (!reportData || !reportData.ticker) {
      return res.status(400).json({ error: 'Report data with ticker is required' });
    }

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

    const summary = reportData.progressiveContext?.marketAssessment ||
      `${ticker} shows strong market fundamentals with solid financial positioning. The company demonstrates consistent performance across key metrics with balanced risk-reward characteristics suitable for institutional portfolios.`;

    doc.setFontSize(11);
    doc.setTextColor(0);
    const summaryLines = doc.splitTextToSize(summary.substring(0, 800), 170);
    let summaryY = 50;
    summaryLines.forEach(line => {
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
      currentY = addSimpleTable(doc, currentY, ['Item', 'Value'], [
        ['Revenue', income.sales ? `$${(income.sales/1e9).toFixed(2)}B` : 'N/A'],
        ['Net Income', income.net_income ? `$${(income.net_income/1e9).toFixed(2)}B` : 'N/A'],
        ['EPS', income.eps_diluted ? `$${income.eps_diluted}` : 'N/A']
      ], 'Income Statement');
    }

    if (balance) {
      currentY = addSimpleTable(doc, currentY + 10, ['Balance Sheet', 'Value'], [
        ['Total Assets', balance.total_assets ? `$${(balance.total_assets/1e9).toFixed(2)}B` : 'N/A'],
        ['Total Debt', balance.total_debt ? `$${(balance.total_debt/1e9).toFixed(2)}B` : 'N/A'],
        ['Cash', balance.cash_and_equivalents ? `$${(balance.cash_and_equivalents/1e9).toFixed(2)}B` : 'N/A']
      ], 'Balance Sheet');
    }

    console.log('PAGE 4: Technical');
    // PAGE 4: TECHNICAL ANALYSIS
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('Technical Analysis', 20, 30);

    currentY = addSimpleTable(doc, 50, ['Indicator', 'Value', 'Signal'], [
      ['50-Day MA',
       stats.stock_price_summary?.day_50_ma ? `$${stats.stock_price_summary.day_50_ma.toFixed(2)}` : 'N/A',
       quote.close && stats.stock_price_summary?.day_50_ma ?
       (quote.close > stats.stock_price_summary.day_50_ma ? 'Bullish' : 'Bearish') : 'N/A'],
      ['200-Day MA',
       stats.stock_price_summary?.day_200_ma ? `$${stats.stock_price_summary.day_200_ma.toFixed(2)}` : 'N/A',
       quote.close && stats.stock_price_summary?.day_200_ma ?
       (quote.close > stats.stock_price_summary.day_200_ma ? 'Bullish' : 'Bearish') : 'N/A'],
      ['Beta',
       stats.stock_price_summary?.beta ? stats.stock_price_summary.beta.toFixed(2) : 'N/A',
       stats.stock_price_summary?.beta ? (stats.stock_price_summary.beta > 1 ? 'High Risk' : 'Low Risk') : 'N/A']
    ], 'Technical Indicators');

    console.log('PAGE 5: AI Analysis');
    // PAGE 5: AI ANALYSIS
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('AI Investment Analysis', 20, 30);

    const analysis = reportData.progressiveContext?.investmentRecommendation ||
      `Based on comprehensive analysis, ${ticker} presents a balanced investment profile with moderate risk-reward characteristics. The company demonstrates solid fundamentals with growth potential in its sector. Key strengths include market positioning and financial stability, while areas for monitoring include competitive pressures and market volatility.`;

    doc.setFontSize(11);
    doc.setTextColor(0);
    const analysisLines = doc.splitTextToSize(analysis.substring(0, 1200), 170);
    let analysisY = 50;
    analysisLines.forEach(line => {
      if (analysisY > 270) {
        doc.addPage();
        analysisY = 20;
      }
      doc.text(line, 20, analysisY);
      analysisY += 6;
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

    const recommendation = reportData.progressiveContext?.investmentRecommendation ||
      `Consider ${ticker} for long-term portfolio allocation based on risk tolerance. The stock shows balanced fundamentals with potential for steady growth.`;

    doc.setFontSize(11);
    doc.setTextColor(0);
    const recLines = doc.splitTextToSize(recommendation.substring(0, 800), 170);
    let recY = 50;
    recLines.forEach(line => {
      doc.text(line, 20, recY);
      recY += 6;
    });

    // Price targets
    const currentPrice = quote.close;
    const high52 = stats.stock_price_summary?.fifty_two_week_high;
    const low52 = stats.stock_price_summary?.fifty_two_week_low;

    if (currentPrice && high52 && low52) {
      currentY = addSimpleTable(doc, recY + 20, ['Price Target', 'Value', 'Upside'], [
        ['Current', `$${currentPrice}`, '-'],
        ['52W High', `$${high52}`, `${((high52 - currentPrice) / currentPrice * 100).toFixed(1)}%`],
        ['52W Low', `$${low52}`, `${((low52 - currentPrice) / currentPrice * 100).toFixed(1)}%`]
      ], 'Price Targets');
    }

    console.log('PAGE 8: Data Sources');
    // PAGE 8: DATA SOURCES
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('Data Sources & Disclaimer', 20, 30);

    currentY = addSimpleTable(doc, 50, ['Source', 'Status'], [
      ['Market Data', reportData.rawData?.quote ? 'SUCCESS' : 'FAILED'],
      ['Financials', reportData.rawData?.incomeStatement ? 'SUCCESS' : 'FAILED'],
      ['AI Analysis', reportData.progressiveContext ? 'SUCCESS' : 'FAILED']
    ], 'Data Sources');

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
