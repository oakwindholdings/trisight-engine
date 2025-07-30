// src/reportGeneration/utils/reportExporter.ts
// Utility functions for exporting reports to various formats
// Context: Enables saving and distributing generated reports

import { GeneratedReport, GeneratedSection } from '../templates/reportTemplateEngine';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Saves a generated report to a file
 * Automatically determines format based on file extension
 */
export async function saveReportToFile(
  report: GeneratedReport,
  filepath: string
): Promise<void> {
  const ext = path.extname(filepath).toLowerCase();
  
  switch (ext) {
    case '.md':
    case '.markdown':
      await saveAsMarkdown(report, filepath);
      break;
      
    case '.html':
    case '.htm':
      await saveAsHTML(report, filepath);
      break;
      
    case '.json':
      await saveAsJSON(report, filepath);
      break;
      
    default:
      throw new Error(`Unsupported file format: ${ext}`);
  }
}

/**
 * Converts report to Markdown format
 */
export function convertReportToMarkdown(report: GeneratedReport): string {
  let markdown = `# ${report.title}\n\n`;
  markdown += `## ${report.subtitle}\n\n`;
  markdown += `*Generated on ${new Date(report.date).toLocaleString()}*\n\n`;
  
  // Add metadata summary
  if (report.metadata.confidence < 1.0 || report.metadata.warnings.length > 0) {
    markdown += '> **Note:** ';
    if (report.metadata.confidence < 1.0) {
      markdown += `Report confidence: ${(report.metadata.confidence * 100).toFixed(0)}%. `;
    }
    if (report.metadata.warnings.length > 0) {
      markdown += `${report.metadata.warnings.length} warning(s) present.`;
    }
    markdown += '\n\n';
  }
  
  // Add table of contents for longer reports
  if (report.sections.length > 3) {
    markdown += '## Table of Contents\n\n';
    report.sections.forEach((section, idx) => {
      const anchor = section.id.toLowerCase().replace(/_/g, '-');
      markdown += `${idx + 1}. [${section.title}](#${anchor})\n`;
    });
    markdown += '\n---\n\n';
  }
  
  // Add sections
  report.sections.forEach(section => {
    // Add section content
    markdown += section.content;
    markdown += '\n\n';
    
    // Add charts as placeholders or data tables
    if (section.charts && section.charts.length > 0) {
      markdown += '\n### Charts\n\n';
      section.charts.forEach((chart, idx) => {
        markdown += `**Chart ${idx + 1}: ${chart.config.title}**\n\n`;
        
        if (chart.type === 'table' || chart.data.simple) {
          // For simple data, create a markdown table
          markdown += convertChartToMarkdownTable(chart);
        } else {
          // For complex charts, add a placeholder
          markdown += `> 📊 *[${chart.type.toUpperCase()} CHART]*\n`;
          if (chart.caption) {
            markdown += `> *${chart.caption}*\n`;
          }
        }
        markdown += '\n';
      });
    }
    
    // Add tables
    if (section.tables && section.tables.length > 0) {
      markdown += '\n### Data Tables\n\n';
      section.tables.forEach((table, idx) => {
        if (table.caption) {
          markdown += `**${table.caption}**\n\n`;
        }
        
        // Create markdown table
        markdown += '| ' + table.headers.join(' | ') + ' |\n';
        markdown += '|' + table.headers.map(() => '---').join('|') + '|\n';
        table.rows.forEach(row => {
          markdown += '| ' + row.join(' | ') + ' |\n';
        });
        markdown += '\n';
      });
    }
    
    // Add section separator
    if (report.sections.indexOf(section) < report.sections.length - 1) {
      markdown += '\n---\n\n';
    }
  });
  
  // Add report metadata footer
  markdown += '\n---\n\n';
  markdown += '## Report Information\n\n';
  markdown += `- **Generated**: ${new Date(report.date).toLocaleString()}\n`;
  markdown += `- **Data Freshness**: ${report.metadata.dataFreshness}\n`;
  markdown += `- **Confidence Level**: ${(report.metadata.confidence * 100).toFixed(0)}%\n`;
  markdown += `- **Data Sources**: ${report.metadata.sources.join(', ')}\n`;
  
  if (report.metadata.warnings.length > 0) {
    markdown += '\n### Data Warnings\n\n';
    report.metadata.warnings.forEach(warning => {
      markdown += `- ⚠️ ${warning}\n`;
    });
  }
  
  return markdown;
}

/**
 * Converts report to HTML format
 */
export function convertReportToHTML(report: GeneratedReport): string {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(report.title)}</title>
    ${generateHTMLStyles()}
</head>
<body>
    <div class="container">
        <header>
            <h1>${escapeHtml(report.title)}</h1>
            <p class="subtitle">${escapeHtml(report.subtitle)}</p>
            <p class="date">Generated on ${new Date(report.date).toLocaleString()}</p>
        </header>
        
        ${generateMetadataHTML(report.metadata)}
        
        ${report.sections.length > 3 ? generateTableOfContentsHTML(report.sections) : ''}
        
        <main>
            ${report.sections.map(section => generateSectionHTML(section)).join('\n')}
        </main>
        
        <footer>
            ${generateFooterHTML(report)}
        </footer>
    </div>
    
    ${generateHTMLScripts()}
</body>
</html>
  `;
  
  return html;
}

/**
 * Saves report as Markdown file
 */
async function saveAsMarkdown(report: GeneratedReport, filepath: string): Promise<void> {
  const markdown = convertReportToMarkdown(report);
  
  // Ensure directory exists
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filepath, markdown, 'utf8');
}

/**
 * Saves report as HTML file
 */
async function saveAsHTML(report: GeneratedReport, filepath: string): Promise<void> {
  const html = convertReportToHTML(report);
  
  // Ensure directory exists
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filepath, html, 'utf8');
}

/**
 * Saves report as JSON file
 */
async function saveAsJSON(report: GeneratedReport, filepath: string): Promise<void> {
  // Ensure directory exists
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2), 'utf8');
}

/**
 * Helper function to convert chart data to markdown table
 */
function convertChartToMarkdownTable(chart: any): string {
  let markdown = '';
  
  if (chart.type === 'bar' && chart.data.labels && chart.data.datasets) {
    // Convert bar chart data to table
    markdown += '| Label |';
    chart.data.datasets.forEach((dataset: any) => {
      markdown += ` ${dataset.label} |`;
    });
    markdown += '\n|---|';
    chart.data.datasets.forEach(() => {
      markdown += '---|';
    });
    markdown += '\n';
    
    chart.data.labels.forEach((label: string, idx: number) => {
      markdown += `| ${label} |`;
      chart.data.datasets.forEach((dataset: any) => {
        markdown += ` ${dataset.data[idx]} |`;
      });
      markdown += '\n';
    });
  } else {
    // Generic data representation
    markdown += '> *Chart data available in JSON format*\n';
  }
  
  return markdown;
}

/**
 * Generates HTML styles for reports
 */
function generateHTMLStyles(): string {
  return `
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background: #f8fafc;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            background: white;
            min-height: 100vh;
            box-shadow: 0 0 50px rgba(0,0,0,0.05);
        }
        
        header {
            text-align: center;
            margin-bottom: 3rem;
            padding-bottom: 2rem;
            border-bottom: 3px solid #10b981;
        }
        
        h1 {
            font-size: 2.5rem;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 0.5rem;
        }
        
        .subtitle {
            font-size: 1.25rem;
            color: #64748b;
            margin-bottom: 0.5rem;
        }
        
        .date {
            font-size: 0.9rem;
            color: #94a3b8;
        }
        
        h2 {
            font-size: 2rem;
            font-weight: 600;
            color: #1e293b;
            margin: 2rem 0 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e2e8f0;
        }
        
        h3 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #334155;
            margin: 1.5rem 0 0.75rem;
        }
        
        h4 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #475569;
            margin: 1rem 0 0.5rem;
        }
        
        p {
            margin-bottom: 1rem;
            color: #334155;
        }
        
        ul, ol {
            margin: 1rem 0 1rem 2rem;
        }
        
        li {
            margin-bottom: 0.5rem;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5rem 0;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        th, td {
            padding: 0.75rem 1rem;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        
        th {
            background: #f8fafc;
            font-weight: 600;
            color: #1e293b;
            border-bottom: 2px solid #e2e8f0;
        }
        
        tr:hover {
            background: #f8fafc;
        }
        
        .metadata {
            background: #f0fdf4;
            border: 1px solid #86efac;
            border-radius: 8px;
            padding: 1.5rem;
            margin: 2rem 0;
        }
        
        .metadata h3 {
            color: #15803d;
            margin-top: 0;
        }
        
        .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 1rem 1.5rem;
            margin: 1rem 0;
            border-radius: 0 4px 4px 0;
        }
        
        .warning-icon {
            color: #f59e0b;
            font-weight: bold;
        }
        
        .toc {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1.5rem;
            margin: 2rem 0;
        }
        
        .toc h3 {
            margin-top: 0;
            color: #1e293b;
        }
        
        .toc ol {
            margin: 0.5rem 0 0 1.5rem;
        }
        
        .toc a {
            color: #10b981;
            text-decoration: none;
        }
        
        .toc a:hover {
            text-decoration: underline;
        }
        
        .section {
            margin: 3rem 0;
            padding: 2rem 0;
            border-top: 1px solid #e2e8f0;
        }
        
        .section:first-child {
            border-top: none;
        }
        
        .chart-container {
            background: #f8fafc;
            border: 2px dashed #cbd5e1;
            border-radius: 8px;
            padding: 2rem;
            margin: 1.5rem 0;
            text-align: center;
            color: #64748b;
        }
        
        .chart-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        
        blockquote {
            border-left: 4px solid #10b981;
            padding-left: 1rem;
            margin: 1rem 0;
            color: #64748b;
            font-style: italic;
        }
        
        code {
            background: #f1f5f9;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 0.9em;
        }
        
        pre {
            background: #1e293b;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
            margin: 1rem 0;
        }
        
        pre code {
            background: none;
            padding: 0;
            color: inherit;
        }
        
        footer {
            margin-top: 4rem;
            padding-top: 2rem;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 0.9rem;
        }
        
        .priority-high {
            color: #dc2626;
            font-weight: 600;
        }
        
        .priority-medium {
            color: #f59e0b;
            font-weight: 600;
        }
        
        .priority-low {
            color: #10b981;
            font-weight: 600;
        }
        
        @media print {
            body {
                background: white;
            }
            
            .container {
                box-shadow: none;
                max-width: 100%;
            }
            
            .toc {
                page-break-after: always;
            }
            
            .section {
                page-break-inside: avoid;
            }
            
            h2, h3 {
                page-break-after: avoid;
            }
        }
    </style>
  `;
}

/**
 * Generates HTML for metadata section
 */
function generateMetadataHTML(metadata: any): string {
  if (metadata.confidence === 1 && metadata.warnings.length === 0) {
    return '';
  }
  
  let html = '<div class="metadata">\n';
  html += '<h3>Report Quality</h3>\n';
  html += `<p><strong>Confidence Level:</strong> ${(metadata.confidence * 100).toFixed(0)}%</p>\n`;
  html += `<p><strong>Data Freshness:</strong> ${metadata.dataFreshness}</p>\n`;
  
  if (metadata.warnings.length > 0) {
    html += '<div class="warnings">\n';
    metadata.warnings.forEach((warning: string) => {
      html += `<div class="warning"><span class="warning-icon">⚠️</span> ${escapeHtml(warning)}</div>\n`;
    });
    html += '</div>\n';
  }
  
  html += '</div>\n';
  return html;
}

/**
 * Generates HTML for table of contents
 */
function generateTableOfContentsHTML(sections: GeneratedSection[]): string {
  let html = '<nav class="toc">\n';
  html += '<h3>Table of Contents</h3>\n';
  html += '<ol>\n';
  
  sections.forEach((section, idx) => {
    const anchor = section.id.toLowerCase().replace(/_/g, '-');
    html += `<li><a href="#${anchor}">${escapeHtml(section.title)}</a></li>\n`;
  });
  
  html += '</ol>\n';
  html += '</nav>\n';
  
  return html;
}

/**
 * Generates HTML for a single section
 */
function generateSectionHTML(section: GeneratedSection): string {
  const anchor = section.id.toLowerCase().replace(/_/g, '-');
  const priorityClass = `priority-${section.priority}`;
  
  let html = `<section id="${anchor}" class="section">\n`;
  
  // Convert markdown-style content to HTML
  let content = section.content
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\s*)+/g, '<ul>$&</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\s*)+/g, match => {
      if (match.includes('<ul>')) return match;
      return '<ol>' + match + '</ol>';
    })
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<)(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
  
  html += content;
  
  // Add charts
  if (section.charts && section.charts.length > 0) {
    html += '<div class="charts">\n';
    section.charts.forEach(chart => {
      html += '<div class="chart-container">\n';
      html += '<div class="chart-icon">📊</div>\n';
      html += `<h4>${escapeHtml(chart.config.title)}</h4>\n`;
      if (chart.caption) {
        html += `<p>${escapeHtml(chart.caption)}</p>\n`;
      }
      html += `<p><em>[${chart.type.toUpperCase()} CHART]</em></p>\n`;
      html += '</div>\n';
    });
    html += '</div>\n';
  }
  
  // Add tables
  if (section.tables && section.tables.length > 0) {
    section.tables.forEach(table => {
      if (table.caption) {
        html += `<h4>${escapeHtml(table.caption)}</h4>\n`;
      }
      
      html += '<table>\n';
      html += '<thead><tr>\n';
      table.headers.forEach(header => {
        html += `<th>${escapeHtml(header)}</th>\n`;
      });
      html += '</tr></thead>\n';
      
      html += '<tbody>\n';
      table.rows.forEach(row => {
        html += '<tr>\n';
        row.forEach(cell => {
          html += `<td>${escapeHtml(String(cell))}</td>\n`;
        });
        html += '</tr>\n';
      });
      html += '</tbody>\n';
      html += '</table>\n';
    });
  }
  
  html += '</section>\n';
  
  return html;
}

/**
 * Generates HTML footer
 */
function generateFooterHTML(report: GeneratedReport): string {
  let html = '<p>';
  html += `Report generated by TriSight on ${new Date(report.date).toLocaleString()}<br>`;
  html += `Data sources: ${report.metadata.sources.join(', ')}<br>`;
  html += 'This report is for informational purposes only and does not constitute investment advice.';
  html += '</p>';
  
  return html;
}

/**
 * Generates HTML scripts
 */
function generateHTMLScripts(): string {
  return `
    <script>
        // Smooth scrolling for table of contents links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
        
        // Add print functionality
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                window.print();
            }
        });
    </script>
  `;
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, m => map[m]);
}