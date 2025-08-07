// test-pdf-playwright.js
// Playwright test to debug PDF generation issue

const { chromium } = require('playwright');

async function testPDFGeneration() {
  console.log('🎭 Starting Playwright PDF generation test...');
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser for debugging
    slowMo: 1000 // Slow down for observation
  });
  
  const page = await browser.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    console.log(`🌐 BROWSER: ${msg.type()}: ${msg.text()}`);
  });
  
  // Listen to errors
  page.on('pageerror', error => {
    console.error(`🚨 PAGE ERROR: ${error.message}`);
  });
  
  try {
    console.log('📍 Navigating to TriSight...');
    await page.goto('https://trisight-hbs21w78n-apex-2b9a18e9.vercel.app', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(5000);
    
    // Look for the Generate PDF button
    console.log('🔍 Looking for Generate PDF button...');
    const pdfButton = await page.locator('button:has-text("Generate PDF")').first();
    
    if (await pdfButton.isVisible()) {
      console.log('✅ Found Generate PDF button');
      
      // Click the button
      console.log('🖱️ Clicking Generate PDF button...');
      await pdfButton.click();
      
      console.log('⏳ Waiting 70 seconds for PDF generation...');
      
      // Wait and monitor console for 70 seconds
      let errorOccurred = false;
      let successOccurred = false;
      
      const startTime = Date.now();
      while (Date.now() - startTime < 70000) {
        await page.waitForTimeout(1000);
        
        // Check if new tab opened (success)
        const contexts = await browser.contexts();
        const allPages = [];
        for (const context of contexts) {
          const contextPages = context.pages();
          allPages.push(...contextPages);
        }

        if (allPages.length > 1) {
          console.log('🎉 SUCCESS: New tab opened - PDF generated!');
          successOccurred = true;
          break;
        }
        
        // Check for error dialog
        const errorDialog = await page.locator('text=PDF generation failed').first();
        if (await errorDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log('❌ ERROR: Error dialog appeared');
          errorOccurred = true;
          break;
        }
      }
      
      if (successOccurred) {
        console.log('✅ PDF GENERATION SUCCESSFUL!');
        const contexts = await browser.contexts();
        const allPages = [];
        for (const context of contexts) {
          const contextPages = context.pages();
          allPages.push(...contextPages);
        }
        console.log(`📄 Total pages open: ${allPages.length}`);

        // Check if the new page has PDF content
        if (allPages.length > 1) {
          const pdfPage = allPages[1];
          const url = pdfPage.url();
          console.log(`📄 PDF URL: ${url}`);

          if (url.startsWith('blob:')) {
            console.log('✅ PDF blob URL detected - PDF generation working!');
          }
        }
      } else if (errorOccurred) {
        console.log('❌ PDF GENERATION FAILED');
        
        // Try to get more error details
        const errorText = await page.locator('text*=PDF generation failed').first().textContent().catch(() => 'No error text');
        console.log(`❌ Error message: ${errorText}`);
        
      } else {
        console.log('⏰ TIMEOUT: No result after 70 seconds');
      }
      
    } else {
      console.log('❌ Generate PDF button not found');
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'debug-no-button.png' });
      console.log('📸 Screenshot saved as debug-no-button.png');
    }
    
  } catch (error) {
    console.error('🚨 Test failed:', error.message);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'debug-error.png' });
    console.log('📸 Error screenshot saved as debug-error.png');
  }
  
  console.log('🔚 Test completed. Keeping browser open for 10 seconds...');
  await page.waitForTimeout(10000);
  
  await browser.close();
}

// Run the test
testPDFGeneration().catch(console.error);
