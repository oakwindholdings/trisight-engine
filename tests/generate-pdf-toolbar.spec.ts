// tests/generate-pdf-toolbar.spec.ts
// Playwright smoke: Chart Toolbar → One‑Click Full Report
import { test, expect } from '@playwright/test';

const BASE = process.env.PREVIEW_URL || process.env.VERCEL_URL || 'http://localhost:3000';

async function generateFor(page, symbol: string) {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const search = page.locator('input[placeholder="Search for a symbol..."]');
  await search.fill(symbol);
  await page.waitForTimeout(350);
  await page.getByText(symbol).first().click();

  // Select Daily timeframe if present
  const select = page.locator('select');
  if (await select.count()) await select.first().selectOption('1day');

  const logs: string[] = [];
  page.on('console', m => logs.push(m.text()));

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 180000 }),
    page.getByTestId('generate-pdf').click()
  ]);

  const path = await download.path();
  expect(path).toBeTruthy();
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream as any) chunks.push(chunk);
  const size = Buffer.concat(chunks).length;
  expect(size).toBeGreaterThan(100 * 1024);

  return { logs, size };
}

test('toolbar generate → NVDA daily', async ({ page }) => {
  const { logs, size } = await generateFor(page, 'NVDA');
  expect(logs.join('\n')).toContain('🚀 Generate PDF: {symbol:"NVDA"');
  expect(logs.join('\n')).toContain('📄 Generating PDF with');
  console.log(`Downloaded size: ${Math.round(size/1024)} KB`);
});

