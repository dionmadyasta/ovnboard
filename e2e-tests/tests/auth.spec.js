const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Verify error message visibility
    await expect(page.locator('form div[style*="color: var(--error)"]')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');

    // Verify successful redirection to Dashboard
    await expect(page.getByText('Project Roadmap')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Workspace' })).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Initial login
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page.getByText('Project Roadmap')).toBeVisible();

    // Trigger logout
    await page.locator('.logout').click();

    // Verify redirection to login page
    await expect(page.getByText('Welcome to OVN Boards')).toBeVisible();
  });
});
