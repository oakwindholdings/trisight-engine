// tests/generate-pdf.spec.ts
// Playwright smoke for Generate PDF from chart toolbar
import { test, expect } from '@playwright/test';

const BASE = process.env.PREVIEW_URL || process.env.VERCEL_URL || 'http://localhost:3000';

async function runFlow(page, symbol: string) {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  // Navigate to Chart tab if not default
  await page.getByRole('button', { name: 'Chart' }).click();
  // Set symbol via SymbolSearch input
  const search = page.locator('input[placeholder="Search for a symbol..."]');
  await search.fill(symbol);
  await page.waitForTimeout(300);
  // pick exact match in dropdown
  await page.getByText(symbol).first().click();

  // Ensure timeframe Daily via ChartControlBar select if present
  const timeframeSelect = page.locator('select');
  if (await timeframeSelect.count()) {
    await timeframeSelect.first().selectOption('1day');
  }

  // Capture console logs
  const logs: string[] = [];
  page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));

  // Click Generate PDF in TopNav
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 180000 }),
    page.getByRole('button', { name: 'Generate PDF' }).click(),
  ]);

  const path = await download.path();
  expect(path).toBeTruthy();
  const size = (await download.createReadStream())?.readableLength ?? 0;
  expect(size).toBeGreaterThan(100 * 1024);

  return logs;
}

(test as any).describe.configure({ mode: 'serial' });

test('Generate PDF NVDA and AAPL', async ({ page }) => {
  const nvdaLogs = await runFlow(page, 'NVDA');
  expect(nvdaLogs.join('\n')).toContain('Generating PDF with');

  const aaplLogs = await runFlow(page, 'AAPL');
  expect(aaplLogs.join('\n')).toContain('Generating PDF with');
});

