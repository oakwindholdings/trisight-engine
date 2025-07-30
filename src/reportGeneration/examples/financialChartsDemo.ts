// src/reportGeneration/examples/financialChartsDemo.ts
// Demonstrates specialized financial chart capabilities
// Context: Shows advanced financial visualizations for investment analysis

import { createFinancialCharts } from '../visualization/financialCharts';
import { ChartTheme } from '../visualization/visualizationEngine';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Demonstrates financial-specific chart types
 */
async function demonstrateFinancialCharts() {
  console.log('🏦 Financial Charts Demo\n');
  console.log('=' .repeat(50));
  
  const finCharts = createFinancialCharts({
    theme: ChartTheme.INSTITUTIONAL
  });
  
  const outputDir = path.join(__dirname, 'output', 'financial-charts');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 1. Correlation Matrix
  console.log('\n1. CORRELATION MATRIX');
  console.log('─'.repeat(50));
  
  const assets = ['SPY', 'AGG', 'GLD', 'VNQ', 'DBC', 'VIX'];
  const correlations = [
    [1.00, -0.15, 0.10, 0.65, 0.40, -0.85],
    [-0.15, 1.00, 0.25, -0.10, -0.20, 0.30],
    [0.10, 0.25, 1.00, 0.30, 0.55, -0.20],
    [0.65, -0.10, 0.30, 1.00, 0.45, -0.60],
    [0.40, -0.20, 0.55, 0.45, 1.00, -0.35],
    [-0.85, 0.30, -0.20, -0.60, -0.35, 1.00]
  ];
  
  try {
    const correlationChart = await finCharts.createCorrelationMatrix(
      assets,
      correlations,
      {
        title: 'Asset Class Correlation Matrix',
        subtitle: '5-Year Rolling Correlation'
      }
    );
    
    console.log('✅ Generated correlation matrix');
    console.log(`Assets: ${assets.join(', ')}`);
    console.log(`Highest correlation: SPY-VNQ (0.65)`);
    console.log(`Lowest correlation: SPY-VIX (-0.85)`);
    
    saveChart(correlationChart.svg, 'correlation-matrix.svg');
    
  } catch (error) {
    console.error('❌ Correlation matrix failed:', error);
  }
  
  // 2. Risk/Return Scatter Plot
  console.log('\n2. RISK/RETURN ANALYSIS');
  console.log('─'.repeat(50));
  
  const portfolioAssets = [
    { name: 'US Equities', return: 0.12, risk: 0.16, marketCap: 40000e9, category: 'Equity' },
    { name: 'Int\'l Equities', return: 0.10, risk: 0.18, marketCap: 20000e9, category: 'Equity' },
    { name: 'EM Equities', return: 0.14, risk: 0.22, marketCap: 10000e9, category: 'Equity' },
    { name: 'Investment Grade Bonds', return: 0.04, risk: 0.05, marketCap: 50000e9, category: 'Fixed Income' },
    { name: 'High Yield Bonds', return: 0.07, risk: 0.10, marketCap: 5000e9, category: 'Fixed Income' },
    { name: 'Real Estate', return: 0.09, risk: 0.14, marketCap: 3000e9, category: 'Alternative' },
    { name: 'Commodities', return: 0.06, risk: 0.20, marketCap: 2000e9, category: 'Alternative' },
    { name: 'Gold', return: 0.05, risk: 0.15, marketCap: 10000e9, category: 'Alternative' },
    { name: 'Target Portfolio', return: 0.10, risk: 0.12, marketCap: 100e9, category: 'Portfolio' }
  ];
  
  try {
    const riskReturnChart = await finCharts.createRiskReturnScatter(
      portfolioAssets,
      {
        title: 'Risk/Return Profile by Asset Class',
        subtitle: 'Expected Annual Returns vs Volatility'
      }
    );
    
    console.log('✅ Generated risk/return scatter plot');
    console.log(`Asset classes analyzed: ${new Set(portfolioAssets.map(a => a.category)).size}`);
    console.log(`Highest Sharpe: Investment Grade Bonds (${(0.04/0.05).toFixed(2)})`);
    
    saveChart(riskReturnChart.svg, 'risk-return-scatter.svg');
    
  } catch (error) {
    console.error('❌ Risk/return chart failed:', error);
  }
  
  // 3. Efficient Frontier
  console.log('\n3. EFFICIENT FRONTIER');
  console.log('─'.repeat(50));
  
  const efficientPortfolios = [
    { risk: 0.05, return: 0.04, weights: { bonds: 1.0, stocks: 0.0 } },
    { risk: 0.06, return: 0.05, weights: { bonds: 0.9, stocks: 0.1 } },
    { risk: 0.07, return: 0.06, weights: { bonds: 0.8, stocks: 0.2 } },
    { risk: 0.08, return: 0.07, weights: { bonds: 0.7, stocks: 0.3 } },
    { risk: 0.09, return: 0.08, weights: { bonds: 0.6, stocks: 0.4 } },
    { risk: 0.11, return: 0.09, weights: { bonds: 0.5, stocks: 0.5 } },
    { risk: 0.13, return: 0.10, weights: { bonds: 0.4, stocks: 0.6 } },
    { risk: 0.15, return: 0.11, weights: { bonds: 0.3, stocks: 0.7 } },
    { risk: 0.17, return: 0.115, weights: { bonds: 0.2, stocks: 0.8 } },
    { risk: 0.19, return: 0.12, weights: { bonds: 0.1, stocks: 0.9 } },
    { risk: 0.20, return: 0.125, weights: { bonds: 0.0, stocks: 1.0 } }
  ];
  
  const currentPortfolio = { risk: 0.12, return: 0.085 };
  
  try {
    const frontierChart = await finCharts.createEfficientFrontier(
      efficientPortfolios,
      currentPortfolio,
      {
        title: 'Portfolio Efficient Frontier',
        subtitle: 'Optimal Risk/Return Combinations'
      }
    );
    
    console.log('✅ Generated efficient frontier');
    console.log(`Portfolios on frontier: ${efficientPortfolios.length}`);
    console.log(`Current portfolio efficiency: ${((currentPortfolio.return/currentPortfolio.risk) * 100).toFixed(0)}%`);
    console.log(`Optimal portfolio suggestion: 50/50 stocks/bonds`);
    
    saveChart(frontierChart.svg, 'efficient-frontier.svg');
    
  } catch (error) {
    console.error('❌ Efficient frontier failed:', error);
  }
  
  // 4. Performance Attribution Waterfall
  console.log('\n4. PERFORMANCE ATTRIBUTION');
  console.log('─'.repeat(50));
  
  const attributionFactors = [
    { name: 'Market Beta', value: 0.08, category: 'market' },
    { name: 'Sector Allocation', value: 0.025, category: 'allocation' },
    { name: 'Security Selection', value: 0.035, category: 'selection' },
    { name: 'Currency Impact', value: -0.01, category: 'currency' },
    { name: 'Timing', value: 0.015, category: 'timing' },
    { name: 'Trading Costs', value: -0.005, category: 'costs' },
    { name: 'Management Fees', value: -0.01, category: 'costs' }
  ];
  
  try {
    const waterfallChart = await finCharts.createAttributionWaterfall(
      attributionFactors,
      {
        title: 'Performance Attribution Analysis',
        subtitle: 'Contributors to Total Return'
      }
    );
    
    const totalReturn = attributionFactors.reduce((sum, f) => sum + f.value, 0);
    const positiveContribution = attributionFactors
      .filter(f => f.value > 0)
      .reduce((sum, f) => sum + f.value, 0);
    
    console.log('✅ Generated attribution waterfall');
    console.log(`Total return: ${(totalReturn * 100).toFixed(1)}%`);
    console.log(`Positive contributions: ${(positiveContribution * 100).toFixed(1)}%`);
    console.log(`Largest contributor: ${attributionFactors.find(f => f.value === Math.max(...attributionFactors.map(f => f.value)))?.name}`);
    
    saveChart(waterfallChart.svg, 'performance-attribution.svg');
    
  } catch (error) {
    console.error('❌ Attribution waterfall failed:', error);
  }
  
  // 5. Dividend History Chart
  console.log('\n5. DIVIDEND ANALYSIS');
  console.log('─'.repeat(50));
  
  const dividends = [
    { date: '2022-03-15', amount: 0.50, type: 'regular' as const },
    { date: '2022-06-15', amount: 0.50, type: 'regular' as const },
    { date: '2022-09-15', amount: 0.52, type: 'regular' as const },
    { date: '2022-12-15', amount: 0.52, type: 'regular' as const },
    { date: '2023-03-15', amount: 0.55, type: 'regular' as const },
    { date: '2023-06-15', amount: 0.55, type: 'regular' as const },
    { date: '2023-09-15', amount: 0.58, type: 'regular' as const },
    { date: '2023-12-15', amount: 1.00, type: 'special' as const },
    { date: '2024-03-15', amount: 0.60, type: 'regular' as const }
  ];
  
  const stockPrices = generateStockPrices('2022-01-01', '2024-03-31', 100);
  
  try {
    const dividendChart = await finCharts.createDividendChart(
      dividends,
      stockPrices,
      {
        title: 'Dividend History & Stock Performance',
        subtitle: 'Quarterly Dividends with Price Trend'
      }
    );
    
    const totalDividends = dividends.reduce((sum, d) => sum + d.amount, 0);
    const regularDividends = dividends.filter(d => d.type === 'regular');
    const dividendGrowth = ((regularDividends[regularDividends.length - 1].amount / regularDividends[0].amount - 1) * 100);
    
    console.log('✅ Generated dividend chart');
    console.log(`Total dividends paid: $${totalDividends.toFixed(2)}`);
    console.log(`Dividend growth: ${dividendGrowth.toFixed(1)}%`);
    console.log(`Special dividends: ${dividends.filter(d => d.type === 'special').length}`);
    
    saveChart(dividendChart.svg, 'dividend-history.svg');
    
  } catch (error) {
    console.error('❌ Dividend chart failed:', error);
  }
  
  // 6. Sector Allocation Donut
  console.log('\n6. SECTOR ALLOCATION');
  console.log('─'.repeat(50));
  
  const sectors = [
    { name: 'Technology', value: 28.5, benchmark: 27.0 },
    { name: 'Healthcare', value: 13.2, benchmark: 13.5 },
    { name: 'Financials', value: 12.8, benchmark: 13.0 },
    { name: 'Consumer Disc.', value: 10.5, benchmark: 11.0 },
    { name: 'Industrials', value: 8.7, benchmark: 8.5 },
    { name: 'Consumer Staples', value: 7.1, benchmark: 7.0 },
    { name: 'Energy', value: 4.8, benchmark: 4.5 },
    { name: 'Real Estate', value: 3.2, benchmark: 2.5 },
    { name: 'Materials', value: 2.9, benchmark: 2.8 },
    { name: 'Utilities', value: 2.8, benchmark: 3.0 },
    { name: 'Telecom', value: 2.5, benchmark: 2.2 },
    { name: 'Cash', value: 3.0, benchmark: 5.0 }
  ];
  
  try {
    const sectorChart = await finCharts.createSectorAllocation(
      sectors,
      {
        title: 'Portfolio Sector Allocation',
        subtitle: 'Current Holdings by Sector'
      }
    );
    
    const totalAllocation = sectors.reduce((sum, s) => sum + s.value, 0);
    const largestOverweight = sectors.reduce((max, s) => {
      const diff = s.value - (s.benchmark || 0);
      return diff > max.diff ? { sector: s.name, diff } : max;
    }, { sector: '', diff: -Infinity });
    
    console.log('✅ Generated sector allocation chart');
    console.log(`Total allocation: ${totalAllocation.toFixed(1)}%`);
    console.log(`Number of sectors: ${sectors.length}`);
    console.log(`Largest overweight: ${largestOverweight.sector} (+${largestOverweight.diff.toFixed(1)}%)`);
    
    saveChart(sectorChart.svg, 'sector-allocation.svg');
    
  } catch (error) {
    console.error('❌ Sector allocation failed:', error);
  }
  
  // 7. Earnings Calendar
  console.log('\n7. EARNINGS CALENDAR');
  console.log('─'.repeat(50));
  
  const earnings = [
    { date: '2023-01-25', quarter: 'Q4 2022', actual: 3.52, estimate: 3.45, surprise: 0.07 },
    { date: '2023-04-26', quarter: 'Q1 2023', actual: 3.75, estimate: 3.70, surprise: 0.05 },
    { date: '2023-07-25', quarter: 'Q2 2023', actual: 3.85, estimate: 3.80, surprise: 0.05 },
    { date: '2023-10-24', quarter: 'Q3 2023', actual: 4.02, estimate: 3.95, surprise: 0.07 },
    { date: '2024-01-24', quarter: 'Q4 2023', estimate: 4.15 },
    { date: '2024-04-25', quarter: 'Q1 2024', estimate: 4.25 },
    { date: '2024-07-24', quarter: 'Q2 2024', estimate: 4.40 },
    { date: '2024-10-23', quarter: 'Q3 2024', estimate: 4.55 }
  ];
  
  try {
    const earningsChart = await finCharts.createEarningsCalendar(
      earnings,
      {
        title: 'Earnings History & Estimates',
        subtitle: 'Quarterly EPS Performance'
      }
    );
    
    const actualEarnings = earnings.filter(e => e.actual);
    const avgBeat = actualEarnings.reduce((sum, e) => sum + (e.surprise || 0), 0) / actualEarnings.length;
    const growthRate = actualEarnings.length > 1 ? 
      ((actualEarnings[actualEarnings.length - 1].actual! / actualEarnings[0].actual! - 1) * 100) : 0;
    
    console.log('✅ Generated earnings calendar');
    console.log(`Quarters reported: ${actualEarnings.length}`);
    console.log(`Average beat: $${avgBeat.toFixed(3)}`);
    console.log(`EPS growth rate: ${growthRate.toFixed(1)}%`);
    
    saveChart(earningsChart.svg, 'earnings-calendar.svg');
    
  } catch (error) {
    console.error('❌ Earnings calendar failed:', error);
  }
  
  // 8. Technical Indicator Dashboard
  console.log('\n8. TECHNICAL ANALYSIS DASHBOARD');
  console.log('─'.repeat(50));
  
  const priceData = generatePriceData(50);
  const indicators = calculateTechnicalIndicators(priceData);
  
  try {
    const techDashboard = await finCharts.createTechnicalDashboard(
      priceData,
      indicators,
      {
        title: 'Technical Analysis Dashboard'
      }
    );
    
    console.log('✅ Generated technical dashboard');
    console.log(`Charts created: ${techDashboard.charts.length}`);
    console.log(`Latest RSI: ${indicators.rsi[indicators.rsi.length - 1].toFixed(1)}`);
    console.log(`Price trend: ${priceData[priceData.length - 1].close > priceData[0].close ? 'Upward' : 'Downward'}`);
    
    techDashboard.charts.forEach((chart, i) => {
      saveChart(chart.svg, `technical-dashboard-${i + 1}.svg`);
    });
    
  } catch (error) {
    console.error('❌ Technical dashboard failed:', error);
  }
  
  console.log('\n✨ Financial charts demonstration complete!');
  console.log(`📁 Charts saved to: ${outputDir}`);
}

// Helper functions

function saveChart(svg: string, filename: string): void {
  const outputDir = path.join(__dirname, 'output', 'financial-charts');
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, svg);
  console.log(`💾 Saved: ${filename}`);
}

function generateStockPrices(startDate: string, endDate: string, startPrice: number): Array<{ date: string; price: number }> {
  const prices = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  let currentPrice = startPrice;
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
    // Random walk with slight upward bias
    const change = (Math.random() - 0.48) * 2;
    currentPrice = Math.max(currentPrice * (1 + change / 100), startPrice * 0.8);
    
    prices.push({
      date: d.toISOString().split('T')[0],
      price: parseFloat(currentPrice.toFixed(2))
    });
  }
  
  return prices;
}

function generatePriceData(days: number): Array<{ date: string; close: number }> {
  const data = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  let price = 100;
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Trending market with volatility
    price = price * (1 + (Math.random() - 0.48) * 0.02);
    
    data.push({
      date: date.toISOString().split('T')[0],
      close: parseFloat(price.toFixed(2))
    });
  }
  
  return data;
}

function calculateTechnicalIndicators(priceData: Array<{ date: string; close: number }>) {
  const closes = priceData.map(p => p.close);
  
  // Simple RSI calculation
  const rsi = calculateRSI(closes, 14);
  
  // Bollinger Bands
  const bollingerBands = calculateBollingerBands(closes, 20);
  
  return {
    rsi,
    bollingerBands,
    macd: {
      macd: closes.map((_, i) => i > 26 ? closes[i] - closes[i - 12] : 0),
      signal: closes.map((_, i) => i > 26 ? closes[i] - closes[i - 9] : 0),
      histogram: closes.map((_, i) => i > 26 ? (closes[i] - closes[i - 12]) - (closes[i] - closes[i - 9]) : 0)
    }
  };
}

function calculateRSI(prices: number[], period: number): number[] {
  const rsi = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      rsi.push(50); // Default neutral
    } else {
      let gains = 0;
      let losses = 0;
      
      for (let j = i - period + 1; j <= i; j++) {
        const change = prices[j] - prices[j - 1];
        if (change > 0) gains += change;
        else losses += Math.abs(change);
      }
      
      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsiValue = 100 - (100 / (1 + rs));
      
      rsi.push(rsiValue);
    }
  }
  
  return rsi;
}

function calculateBollingerBands(prices: number[], period: number) {
  const upper = [];
  const middle = [];
  const lower = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(prices[i]);
      middle.push(prices[i]);
      lower.push(prices[i]);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      const avg = slice.reduce((a, b) => a + b) / period;
      const stdDev = Math.sqrt(slice.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / period);
      
      middle.push(avg);
      upper.push(avg + 2 * stdDev);
      lower.push(avg - 2 * stdDev);
    }
  }
  
  return { upper, middle, lower };
}

// Run the demo
if (require.main === module) {
  demonstrateFinancialCharts()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
}

export { demonstrateFinancialCharts };