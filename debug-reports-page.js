const { chromium } = require('playwright');

async function debugReportsPage() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to Reports page...');
    await page.goto('http://localhost:3000/reports');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-screenshots/debug-01-reports-page.png' });

    console.log('Page title:', await page.title());
    
    console.log('Looking for buttons...');
    const buttons = await page.locator('button').all();
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      console.log(`Button ${i}: "${text}"`);
    }

    console.log('Looking for clickable elements with "New" text...');
    const newElements = await page.locator('text=New').all();
    for (let i = 0; i < newElements.length; i++) {
      const text = await newElements[i].textContent();
      const tagName = await newElements[i].evaluate(el => el.tagName);
      console.log(`Element with "New": ${tagName} - "${text}"`);
    }

    console.log('Looking for any clickable elements...');
    const clickables = await page.locator('button, a, [role="button"], .clickable').all();
    for (let i = 0; i < Math.min(clickables.length, 10); i++) {
      const text = await clickables[i].textContent();
      const tagName = await clickables[i].evaluate(el => el.tagName);
      console.log(`Clickable ${i}: ${tagName} - "${text?.trim()}"`);
    }

    // Wait a bit to see the page
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugReportsPage();