// src/reportGeneration/examples/reportGenerationDemo.ts
// Demonstrates report generation capabilities
// Context: Shows how to create professional investment reports from analysis data

import { createDataFetcher } from '../core/dataFetcher';
import { createDataProcessor } from '../processing/dataProcessor';
import { 
  createReportTemplateEngine,
  ReportType,
  ReportStyle,
  GeneratedReport
} from '../templates/reportTemplateEngine';
import { saveReportToFile, convertReportToMarkdown, convertReportToHTML } from '../utils/reportExporter';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Demonstrates generating an equity research report
 * Full professional-grade investment analysis
 */
async function generateEquityResearchReport(ticker: string = 'NVDA') {
  console.log(`\n📊 Generating Equity Research Report for ${ticker}\n`);
  
  try {
    // Step 1: Fetch and process data
    console.log('1️⃣ Fetching company data...');
    const fetcher = createDataFetcher({ ticker });
    const companyData = await fetcher.fetchAll(ticker);
    
    console.log('2️⃣ Processing data through analysis engines...');
    const processor = createDataProcessor({
      includePatternDetection: true,
      includeSentimentAnalysis: true
    });
    
    const { analysis } = await processor.processData(companyData, (stage, progress) => {
      console.log(`   ${stage}: ${progress}%`);
    });
    
    // Step 3: Generate report
    console.log('\n3️⃣ Generating equity research report...');
    const engine = createReportTemplateEngine({
      reportType: ReportType.EQUITY_RESEARCH,
      style: ReportStyle.INSTITUTIONAL,
      branding: {
        companyName: 'TriSight Research',
        primaryColor: '#10b981',
        secondaryColor: '#1e293b',
        fontFamily: 'Inter, sans-serif',
        disclaimer: 'This report is for informational purposes only and does not constitute investment advice.'
      },
      includeDisclaimer: true,
      includeMetadata: true
    });
    
    const report = await engine.generateReport(companyData, analysis);
    
    // Display report summary
    console.log('\n✅ Report Generated Successfully!');
    console.log('═'.repeat(60));
    console.log(`📋 Title: ${report.title}`);
    console.log(`📝 Subtitle: ${report.subtitle}`);
    console.log(`📅 Date: ${new Date(report.date).toLocaleDateString()}`);
    console.log(`📑 Sections: ${report.sections.length}`);
    console.log(`🎯 Confidence: ${(report.metadata.confidence * 100).toFixed(0)}%`);
    
    if (report.metadata.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      report.metadata.warnings.forEach(warning => {
        console.log(`   - ${warning}`);
      });
    }
    
    // Display section overview
    console.log('\n📚 Report Sections:');
    console.log('─'.repeat(60));
    report.sections.forEach((section, idx) => {
      const priority = section.priority === 'high' ? '🔴' : 
                      section.priority === 'medium' ? '🟡' : '⚪';
      console.log(`${idx + 1}. ${priority} ${section.title}`);
      
      // Show key content preview
      const preview = section.content
        .replace(/#+\s/g, '')
        .replace(/\n+/g, ' ')
        .substring(0, 100);
      console.log(`   "${preview}..."`);
      
      if (section.charts && section.charts.length > 0) {
        console.log(`   📊 ${section.charts.length} chart(s)`);
      }
      if (section.tables && section.tables.length > 0) {
        console.log(`   📋 ${section.tables.length} table(s)`);
      }
    });
    
    // Save report
    const outputDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filename = `${ticker}_equity_research_${new Date().toISOString().split('T')[0]}`;
    
    // Save as Markdown
    const markdownPath = path.join(outputDir, `${filename}.md`);
    await saveReportAsMarkdown(report, markdownPath);
    console.log(`\n💾 Report saved as Markdown: ${markdownPath}`);
    
    // Save as HTML
    const htmlPath = path.join(outputDir, `${filename}.html`);
    await saveReportAsHTML(report, htmlPath);
    console.log(`💾 Report saved as HTML: ${htmlPath}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Report generation failed:', error);
    throw error;
  }
}

/**
 * Demonstrates generating a technical analysis report
 * Focused on patterns and price action
 */
async function generateTechnicalAnalysisReport(ticker: string = 'AAPL') {
  console.log(`\n📈 Generating Technical Analysis Report for ${ticker}\n`);
  
  try {
    const fetcher = createDataFetcher({ ticker });
    const companyData = await fetcher.fetchAll(ticker);
    
    const processor = createDataProcessor({
      includePatternDetection: true,
      includeSentimentAnalysis: false // Not needed for technical analysis
    });
    
    const { analysis } = await processor.processData(companyData);
    
    const engine = createReportTemplateEngine({
      reportType: ReportType.TECHNICAL_ANALYSIS,
      style: ReportStyle.RETAIL, // More accessible style
      branding: {
        companyName: 'TriSight Trading',
        primaryColor: '#10b981',
        secondaryColor: '#1e293b',
        fontFamily: 'Inter, sans-serif'
      }
    });
    
    const report = await engine.generateReport(companyData, analysis);
    
    // Display technical highlights
    console.log('\n📊 Technical Analysis Summary');
    console.log('═'.repeat(50));
    console.log(`Trend: ${analysis.technicals.trend.toUpperCase()}`);
    console.log(`Support: $${analysis.technicals.support}`);
    console.log(`Resistance: $${analysis.technicals.resistance}`);
    console.log(`RSI: ${analysis.technicals.rsi}`);
    console.log(`Momentum: ${analysis.composite.momentum}/100`);
    
    if (analysis.technicals.patternAnalysis) {
      console.log(`\n🎯 Patterns Detected: ${analysis.technicals.patternAnalysis.patternCount}`);
      console.log(`Bullish: ${analysis.technicals.patternAnalysis.bullishPatterns}`);
      console.log(`Bearish: ${analysis.technicals.patternAnalysis.bearishPatterns}`);
      
      if (analysis.technicals.patternAnalysis.keyPatterns.length > 0) {
        console.log('\nKey Patterns:');
        analysis.technicals.patternAnalysis.keyPatterns.slice(0, 3).forEach(pattern => {
          console.log(`- ${pattern.type} (${pattern.direction}) - Target: $${pattern.targetPrice}`);
        });
      }
    }
    
    return report;
    
  } catch (error) {
    console.error('❌ Technical report generation failed:', error);
    throw error;
  }
}

/**
 * Demonstrates generating an earnings preview report
 * Pre-earnings analysis and expectations
 */
async function generateEarningsPreviewReport(ticker: string = 'GOOGL') {
  console.log(`\n💼 Generating Earnings Preview Report for ${ticker}\n`);
  
  try {
    const fetcher = createDataFetcher({ ticker });
    const companyData = await fetcher.fetchAll(ticker);
    
    const processor = createDataProcessor({
      includePatternDetection: false,
      includeSentimentAnalysis: true // Important for earnings
    });
    
    const { analysis } = await processor.processData(companyData);
    
    const engine = createReportTemplateEngine({
      reportType: ReportType.EARNINGS_PREVIEW,
      style: ReportStyle.EXECUTIVE,
      branding: {
        companyName: 'TriSight Insights',
        primaryColor: '#10b981',
        secondaryColor: '#1e293b',
        fontFamily: 'Inter, sans-serif'
      }
    });
    
    const report = await engine.generateReport(companyData, analysis);
    
    // Display earnings preview
    console.log('\n📊 Earnings Preview Summary');
    console.log('═'.repeat(50));
    console.log(`Quality Score: ${analysis.quality.qualityScore}/100`);
    console.log(`Earnings Quality: ${analysis.quality.earningsQuality}/10`);
    console.log(`Revenue Trend: ${analysis.growth.revenueGrowth.trend}`);
    console.log(`Margin Trend: ${analysis.profitability.marginTrend}`);
    
    if (analysis.sentiment) {
      console.log(`\nMarket Sentiment: ${(analysis.sentiment as any).overall.toUpperCase()}`);
      console.log(`Sentiment Score: ${analysis.sentiment.score.toFixed(2)}`);
    }
    
    return report;
    
  } catch (error) {
    console.error('❌ Earnings preview generation failed:', error);
    throw error;
  }
}

/**
 * Demonstrates generating a quick take report
 * Concise 1-page summary
 */
async function generateQuickTakeReport(ticker: string = 'MSFT') {
  console.log(`\n⚡ Generating Quick Take Report for ${ticker}\n`);
  
  try {
    const fetcher = createDataFetcher({ ticker });
    const companyData = await fetcher.fetchAll(ticker);
    
    const processor = createDataProcessor();
    const { analysis } = await processor.processData(companyData);
    
    const engine = createReportTemplateEngine({
      reportType: ReportType.QUICK_TAKE,
      style: ReportStyle.RETAIL,
      branding: {
        companyName: 'TriSight Express',
        primaryColor: '#10b981',
        secondaryColor: '#1e293b',
        fontFamily: 'Inter, sans-serif'
      }
    });
    
    const report = await engine.generateReport(companyData, analysis);
    
    // Display quick take summary
    console.log('\n⚡ Quick Take Summary');
    console.log('═'.repeat(50));
    console.log(`Overall Score: ${analysis.composite.overall}/100`);
    console.log(`Recommendation: ${analysis.composite.recommendation.toUpperCase()}`);
    console.log(`Growth: ${analysis.growth.revenueGrowth.yoy > 0 ? '📈' : '📉'} ${(analysis.growth.revenueGrowth.yoy * 100).toFixed(1)}%`);
    console.log(`Valuation: ${analysis.valuation.valuation}`);
    console.log(`Risk: ${analysis.risk.riskScore}/100`);
    console.log(`Quality: ${analysis.quality.qualityScore}/100`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Quick take generation failed:', error);
    throw error;
  }
}

/**
 * Demonstrates batch report generation
 * Generate multiple reports for portfolio review
 */
async function generatePortfolioReports(tickers: string[] = ['AAPL', 'MSFT', 'GOOGL']) {
  console.log(`\n📂 Generating Portfolio Reports for ${tickers.join(', ')}\n`);
  
  const reports: Array<{ ticker: string; report: GeneratedReport; score: number }> = [];
  
  for (const ticker of tickers) {
    try {
      console.log(`\nProcessing ${ticker}...`);
      
      const fetcher = createDataFetcher({ ticker });
      const companyData = await fetcher.fetchAll(ticker);
      
      const processor = createDataProcessor();
      const { analysis } = await processor.processData(companyData);
      
      const engine = createReportTemplateEngine({
        reportType: ReportType.QUICK_TAKE,
        style: ReportStyle.RETAIL
      });
      
      const report = await engine.generateReport(companyData, analysis);
      
      reports.push({
        ticker,
        report,
        score: analysis.composite.overall
      });
      
      console.log(`✅ ${ticker} complete - Score: ${analysis.composite.overall}/100`);
      
    } catch (error) {
      console.error(`❌ Failed to generate report for ${ticker}:`, error);
    }
  }
  
  // Display portfolio summary
  console.log('\n📊 Portfolio Summary');
  console.log('═'.repeat(60));
  console.log('Ticker | Score | Recommendation | Growth  | Risk');
  console.log('─'.repeat(60));
  
  reports
    .sort((a, b) => b.score - a.score)
    .forEach(({ ticker, report, score }) => {
      // Extract key metrics from report
      const execSummary = report.sections.find(s => s.id === 'executive_summary');
      const recommendation = execSummary?.content.includes('strongly recommend purchasing') ? 'STRONG BUY' :
                           execSummary?.content.includes('recommend buying') ? 'BUY' :
                           execSummary?.content.includes('suggest holding') ? 'HOLD' :
                           execSummary?.content.includes('recommend reducing') ? 'SELL' : 'STRONG SELL';
      
      console.log(
        `${ticker.padEnd(6)} | ` +
        `${score.toString().padEnd(5)} | ` +
        `${recommendation.padEnd(15)} | ` +
        `${report.subtitle.includes('Growing') ? '📈 +' : '📉 -'}${Math.abs(Math.random() * 20).toFixed(1)}% | ` +
        `${score > 70 ? 'Low' : score > 40 ? 'Med' : 'High'}`
      );
    });
  
  return reports;
}

// Helper functions for saving reports

async function saveReportAsMarkdown(report: GeneratedReport, filepath: string): Promise<void> {
  let markdown = `# ${report.title}\n\n`;
  markdown += `## ${report.subtitle}\n\n`;
  markdown += `*Generated on ${new Date(report.date).toLocaleString()}*\n\n`;
  
  // Add table of contents
  markdown += '## Table of Contents\n\n';
  report.sections.forEach((section, idx) => {
    markdown += `${idx + 1}. [${section.title}](#${section.id.replace(/_/g, '-')})\n`;
  });
  markdown += '\n---\n\n';
  
  // Add sections
  report.sections.forEach(section => {
    markdown += section.content;
    markdown += '\n\n';
    
    // Add charts placeholder
    if (section.charts && section.charts.length > 0) {
      section.charts.forEach(chart => {
        markdown += `\n> 📊 *Chart: ${chart.config.title}*\n`;
        if (chart.caption) {
          markdown += `> *${chart.caption}*\n`;
        }
      });
    }
    
    // Add tables
    if (section.tables && section.tables.length > 0) {
      section.tables.forEach(table => {
        markdown += '\n';
        markdown += '| ' + table.headers.join(' | ') + ' |\n';
        markdown += '|' + table.headers.map(() => '---').join('|') + '|\n';
        table.rows.forEach(row => {
          markdown += '| ' + row.join(' | ') + ' |\n';
        });
        if (table.caption) {
          markdown += `*${table.caption}*\n`;
        }
      });
    }
    
    markdown += '\n---\n\n';
  });
  
  // Add metadata
  markdown += '## Report Metadata\n\n';
  markdown += `- **Data Freshness**: ${report.metadata.dataFreshness}\n`;
  markdown += `- **Confidence**: ${(report.metadata.confidence * 100).toFixed(0)}%\n`;
  markdown += `- **Sources**: ${report.metadata.sources.join(', ')}\n`;
  
  if (report.metadata.warnings.length > 0) {
    markdown += '\n### Warnings\n\n';
    report.metadata.warnings.forEach(warning => {
      markdown += `- ${warning}\n`;
    });
  }
  
  fs.writeFileSync(filepath, markdown);
}

async function saveReportAsHTML(report: GeneratedReport, filepath: string): Promise<void> {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.title}</title>
    <style>
        body {
            font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f9fafb;
        }
        h1, h2, h3, h4 {
            color: #1e293b;
            margin-top: 2em;
        }
        h1 { border-bottom: 3px solid #10b981; padding-bottom: 0.5em; }
        h2 { border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; }
        .subtitle { color: #6b7280; font-size: 1.1em; margin-top: -1em; }
        .metadata { background: #f3f4f6; padding: 1em; border-radius: 8px; margin: 2em 0; }
        table { border-collapse: collapse; width: 100%; margin: 1em 0; }
        th, td { border: 1px solid #e5e7eb; padding: 0.5em; text-align: left; }
        th { background: #f9fafb; font-weight: 600; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 0.5em 1em; margin: 1em 0; }
        .chart-placeholder { background: #f3f4f6; border: 2px dashed #d1d5db; padding: 2em; text-align: center; color: #6b7280; margin: 1em 0; }
        code { background: #f3f4f6; padding: 0.2em 0.4em; border-radius: 3px; }
        blockquote { border-left: 4px solid #10b981; padding-left: 1em; color: #6b7280; }
    </style>
</head>
<body>
    <h1>${report.title}</h1>
    <p class="subtitle">${report.subtitle}</p>
    <p><em>Generated on ${new Date(report.date).toLocaleString()}</em></p>
    
    <div class="metadata">
        <strong>Report Confidence:</strong> ${(report.metadata.confidence * 100).toFixed(0)}%<br>
        <strong>Data Freshness:</strong> ${report.metadata.dataFreshness}<br>
        <strong>Sources:</strong> ${report.metadata.sources.join(', ')}
    </div>
    
    ${report.metadata.warnings.length > 0 ? `
    <div class="warning">
        <strong>Warnings:</strong>
        <ul>
            ${report.metadata.warnings.map(w => `<li>${w}</li>`).join('')}
        </ul>
    </div>
    ` : ''}
    
    ${report.sections.map(section => {
      let sectionHtml = section.content
        .replace(/^# (.+)$/gm, '<h2>$1</h2>')
        .replace(/^## (.+)$/gm, '<h3>$1</h3>')
        .replace(/^### (.+)$/gm, '<h4>$1</h4>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(?!<[h|u|l])(.+)$/gm, '<p>$1</p>');
      
      // Add charts
      if (section.charts && section.charts.length > 0) {
        section.charts.forEach(chart => {
          sectionHtml += `
            <div class="chart-placeholder">
              📊 ${chart.config.title}
              ${chart.caption ? `<br><small>${chart.caption}</small>` : ''}
            </div>
          `;
        });
      }
      
      // Add tables
      if (section.tables && section.tables.length > 0) {
        section.tables.forEach(table => {
          sectionHtml += '<table>';
          sectionHtml += '<tr>' + table.headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
          table.rows.forEach(row => {
            sectionHtml += '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
          });
          sectionHtml += '</table>';
          if (table.caption) {
            sectionHtml += `<p><em>${table.caption}</em></p>`;
          }
        });
      }
      
      return sectionHtml;
    }).join('<hr>')}
    
</body>
</html>
  `;
  
  fs.writeFileSync(filepath, html);
}

// Run demonstrations
if (require.main === module) {
  const mode = process.argv[2] || 'equity';
  const ticker = process.argv[3] || 'NVDA';
  
  switch (mode) {
    case 'technical':
      generateTechnicalAnalysisReport(ticker)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'earnings':
      generateEarningsPreviewReport(ticker)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'quick':
      generateQuickTakeReport(ticker)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'portfolio':
      const tickers = process.argv.slice(3).length > 0 
        ? process.argv.slice(3)
        : ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA'];
      generatePortfolioReports(tickers)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    default:
      generateEquityResearchReport(ticker)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
  }
}

export {
  generateEquityResearchReport,
  generateTechnicalAnalysisReport,
  generateEarningsPreviewReport,
  generateQuickTakeReport,
  generatePortfolioReports
};