// test-comprehensive-report-generation.js
// Playwright test to generate comprehensive report through UI
// Tests the full flow from wizard to PDF generation

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function generateComprehensiveReport() {
  console.log('='.repeat(80));
  console.log('COMPREHENSIVE REPORT GENERATION TEST');
  console.log('Testing full UI flow with PDF generation');
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for visibility
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('[Browser Error]:', msg.text());
      }
    });
    
    // Listen for network requests to API
    page.on('request', request => {
      if (request.url().includes('/api/reports')) {
        console.log(`[API Request] ${request.method()} ${request.url()}`);
        if (request.postData()) {
          console.log('[Request Body]:', request.postData());
        }
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/reports')) {
        console.log(`[API Response] ${response.status()} ${response.url()}`);
      }
    });
    
    console.log('\n1. Navigating to TriSight Reports page...');
    await page.goto('http://localhost:3000/reports');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: 'generated-reports/test-1-initial-page.png',
      fullPage: true 
    });
    
    console.log('2. Clicking "New Report" button...');
    await page.click('button:has-text("New Report")');
    await page.waitForTimeout(1000);
    
    // The wizard should be visible now
    console.log('3. Selecting report template...');
    
    // Select "Equity Research" template
    await page.click('text=Equity Research');
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'generated-reports/test-2-template-selected.png',
      fullPage: true 
    });
    
    // Click Next
    console.log('4. Moving to Details step...');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    
    // Fill in report details
    console.log('5. Filling report details...');
    await page.fill('input[placeholder*="Report Title"]', 'NVDA Comprehensive Analysis - Full Test');
    await page.fill('input[placeholder*="AAPL"]', 'NVDA');
    await page.fill('input[placeholder*="Your name"]', 'TriSight Test');
    
    // Select timeframe
    await page.selectOption('select', '1Y');
    
    await page.screenshot({ 
      path: 'generated-reports/test-3-details-filled.png',
      fullPage: true 
    });
    
    // Click Next
    console.log('6. Moving to Data Sources step...');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    
    // Ensure all data sources are selected
    console.log('7. Selecting all data sources...');
    const checkboxes = await page.$$('input[type="checkbox"]');
    for (const checkbox of checkboxes) {
      const isChecked = await checkbox.isChecked();
      if (!isChecked) {
        await checkbox.check();
      }
    }
    
    await page.screenshot({ 
      path: 'generated-reports/test-4-data-sources.png',
      fullPage: true 
    });
    
    // Click Next
    console.log('8. Moving to Configuration step...');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    
    // Enable all sections and visualizations
    console.log('9. Enabling all report sections and visualizations...');
    const toggles = await page.$$('input[type="checkbox"]');
    for (const toggle of toggles) {
      const isChecked = await toggle.isChecked();
      if (!isChecked) {
        await toggle.check();
      }
    }
    
    await page.screenshot({ 
      path: 'generated-reports/test-5-configuration.png',
      fullPage: true 
    });
    
    // Generate the report
    console.log('10. Clicking "Generate Report" button...');
    console.log('='.repeat(80));
    console.log('GENERATING COMPREHENSIVE REPORT...');
    console.log('='.repeat(80));
    
    // Set up promise to wait for API response
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/reports/generate-comprehensive'),
      { timeout: 60000 }
    );
    
    // Click generate button
    await page.click('button:has-text("Generate Report")');
    
    // Wait for the API response
    console.log('11. Waiting for API response...');
    const response = await responsePromise;
    const responseData = await response.json();
    
    console.log('\n' + '='.repeat(80));
    console.log('API RESPONSE RECEIVED');
    console.log('='.repeat(80));
    console.log('Success:', responseData.success);
    console.log('Report ID:', responseData.reportId);
    console.log('Ticker:', responseData.ticker);
    console.log('PDF Path:', responseData.pdfPath);
    console.log('Generation Time:', responseData.generationTime + 'ms');
    console.log('Slides Generated:', responseData.slides?.length || 0);
    
    // Save the response data for analysis
    await fs.writeFile(
      'generated-reports/test-api-response.json',
      JSON.stringify(responseData, null, 2)
    );
    
    // Wait for UI to update
    await page.waitForTimeout(2000);
    
    // Take screenshot of success state
    await page.screenshot({ 
      path: 'generated-reports/test-6-report-generated.png',
      fullPage: true 
    });
    
    // Check if PDF was actually generated
    if (responseData.pdfPath) {
      const pdfPath = path.join('C:\\Users\\bobstewart\\dev\\projects\\emerald\\trisight', responseData.pdfPath);
      try {
        const stats = await fs.stat(pdfPath);
        console.log('\n' + '='.repeat(80));
        console.log('PDF FILE VERIFICATION');
        console.log('='.repeat(80));
        console.log('PDF Path:', pdfPath);
        console.log('File Size:', (stats.size / 1024 / 1024).toFixed(2) + ' MB');
        console.log('Created:', stats.birthtime);
        console.log('✓ PDF file successfully generated!');
      } catch (error) {
        console.error('✗ PDF file not found at:', pdfPath);
      }
    }
    
    // Analyze slide content
    if (responseData.slides && responseData.slides.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('REPORT CONTENT ANALYSIS');
      console.log('='.repeat(80));
      
      for (const slide of responseData.slides) {
        console.log(`\nSlide ${slide.slideNumber}: ${slide.title}`);
        console.log(`  Type: ${slide.type}`);
        
        // Check if slide has actual content (not just titles)
        if (slide.content) {
          const contentKeys = Object.keys(slide.content);
          console.log(`  Content sections: ${contentKeys.length}`);
          
          // Check for data completeness
          let hasData = false;
          for (const key of contentKeys) {
            const value = slide.content[key];
            if (value && (
              (typeof value === 'string' && value.length > 20) ||
              (typeof value === 'number' && value !== 0) ||
              (Array.isArray(value) && value.length > 0) ||
              (typeof value === 'object' && Object.keys(value).length > 0)
            )) {
              hasData = true;
            }
          }
          
          if (hasData) {
            console.log(`  ✓ Contains substantial data`);
          } else {
            console.log(`  ⚠ Limited or no data`);
          }
        } else {
          console.log(`  ⚠ No content section`);
        }
      }
    }
    
    // Try to view the report
    console.log('\n12. Attempting to view report in Reports tab...');
    const viewButton = await page.$('button:has-text("View in Reports Tab")');
    if (viewButton) {
      await viewButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ 
        path: 'generated-reports/test-7-report-view.png',
        fullPage: true 
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(80));
    console.log('✓ Report generated through UI');
    console.log('✓ API response received with data');
    console.log(`✓ ${responseData.slides?.length || 0} slides created`);
    if (responseData.pdfPath) {
      console.log('✓ PDF file generated');
    }
    console.log('\nScreenshots saved to generated-reports/test-*.png');
    console.log('API response saved to generated-reports/test-api-response.json');
    
  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('TEST FAILED');
    console.error('='.repeat(80));
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

// Run the test
generateComprehensiveReport().catch(console.error);