// @ts-check
const { test, expect } = require('@playwright/test');

const URL = 'http://localhost:8080';

// ─── 1. Page loads with core UI elements ─────────────────────────────────────
test('page loads with nav, hero, and search panel', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('.nav-logo-text')).toHaveText('MarketTicker');
  await expect(page.locator('.hero h1')).toBeVisible();
  await expect(page.locator('#searchInput')).toBeVisible();
  await expect(page.locator('#panelSearch')).toBeVisible();
});

// ─── 2. Ticker bar displays live price data ───────────────────────────────────
test('ticker bar populates with symbol and price data', async ({ page }) => {
  await page.goto(URL);
  // Wait up to 10s for at least one real ticker item to appear
  const tickerItem = page.locator('.ticker-item').first();
  await expect(tickerItem).toBeVisible({ timeout: 10000 });
  const text = await tickerItem.innerText();
  // Should contain a $ price
  expect(text).toMatch(/\$[\d,]+\.\d{2}/);
});

// ─── 3. Symbol search returns a result card ───────────────────────────────────
test('searching for AAPL displays a result card with price', async ({ page }) => {
  await page.goto(URL);
  await page.fill('#searchInput', 'AAPL');
  await page.click('#searchBtn');
  // Result card should appear with the symbol heading
  const resultArea = page.locator('#resultArea');
  await expect(resultArea).toContainText('AAPL', { timeout: 10000 });
  // Should show a dollar price
  const priceText = await resultArea.innerText();
  expect(priceText).toMatch(/\$[\d,]+\.\d{2}/);
});

// ─── 4. My Stocks tab switches the search panel ───────────────────────────────
test('My Stocks tab shows the portfolio panel and hides the search panel', async ({ page }) => {
  await page.goto(URL);
  // Initially search panel is visible, portfolio hidden
  await expect(page.locator('#panelSearch')).toBeVisible();
  await expect(page.locator('#panelPortfolio')).toBeHidden();

  await page.click('#tabPortfolio');

  await expect(page.locator('#panelPortfolio')).toBeVisible();
  await expect(page.locator('#panelSearch')).toBeHidden();
});

// ─── 5. Portfolio persists across page reloads ────────────────────────────────
test('portfolio saved in localStorage renders after page reload', async ({ page }) => {
  await page.goto(URL);

  // Seed localStorage directly so this test is independent of live API calls
  await page.evaluate(() => {
    localStorage.setItem('marketticker_portfolio', JSON.stringify(['MSFT', 'GOOGL']));
  });

  // Reload — the page should read localStorage on init and render the rows
  await page.reload();
  await page.click('#tabPortfolio');

  const list = page.locator('#portfolioList');
  await expect(list).toContainText('MSFT', { timeout: 5000 });
  await expect(list).toContainText('GOOGL', { timeout: 5000 });

  // Cleanup
  await page.evaluate(() => localStorage.removeItem('marketticker_portfolio'));
});
