const { test, expect } = require('@playwright/test');

test.describe('Views & Navigation', () => {
  // Login once before all tests in this suite
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page.getByText('Project Roadmap')).toBeVisible();
  });

  test('should verify Timeline View components', async ({ page }) => {
    // 1. Navigate to Timeline
    await page.getByRole('button', { name: 'Timeline' }).click();
    await expect(page.getByText('PROJECT TIMELINE')).toBeVisible();

    // 2. Verify Timeline Sidebar and Grid
    await expect(page.locator('.timeline-sidebar')).toBeVisible();
    await expect(page.locator('.timeline-grid-container')).toBeVisible();
    
    // 3. Verify Today Marker visibility
    await expect(page.getByText('TODAY')).toBeVisible();
    
    // 4. Verify presence of grid cells
    await expect(page.locator('.timeline-grid-cell').first()).toBeVisible();
  });

  test('should verify Insights (Analytics) View dashboard', async ({ page }) => {
    // 1. Navigate to Insights
    await page.getByRole('button', { name: 'Insights' }).click();
    await expect(page.getByText('PROJECT INSIGHTS')).toBeVisible();

    // 2. Verify Stats Cards
    // Using explicit regex matching to avoid ambiguity with surrounding text
    await expect(page.getByText(/^Total Tasks$/)).toBeVisible();
    await expect(page.getByText(/^In Progress$/)).toBeVisible();
    await expect(page.getByText(/^Completed$/)).toBeVisible();

    // 3. Verify Chart SVG presence
    const chart = page.locator('.chart-container svg');
    await expect(chart).toBeVisible();
    
    // 4. Verify Performance Insight points
    await expect(page.getByText('Performance Insights')).toBeVisible();
    await expect(page.locator('.productivity-meter')).toBeVisible();
  });

  test('should toggle views smoothly without data loss', async ({ page }) => {
    // Switch to Insights
    await page.getByRole('button', { name: 'Insights' }).click();
    await expect(page.getByText('Performance Insights')).toBeVisible();

    // Switch back to Workspace Board
    await page.getByRole('button', { name: 'Workspace' }).click();
    await expect(page.getByText('Project Roadmap')).toBeVisible();
    
    // Switch to Timeline
    await page.getByRole('button', { name: 'Timeline' }).click();
    await expect(page.locator('.timeline-body')).toBeVisible();
  });
});
