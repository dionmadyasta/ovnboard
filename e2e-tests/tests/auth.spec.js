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
    // 1. Diagnostics: Ensure env variables are present in the test process
    if (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD) {
        throw new Error("E2E Error: Missing TEST_USER_EMAIL or TEST_USER_PASSWORD in environment.");
    }

    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD);
    
    // 2. Track network responses to see if API returns 403 or 401
    const loginResponsePromise = page.waitForResponse(response => 
      response.url().includes('supabase.co/auth/v1/token') || response.url().includes('/tasks')
    ).catch(() => null);

    await page.click('button[type="submit"]');
    
    // 3. Check if we reached the dashboard
    try {
        await expect(page.getByText('Project Roadmap')).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('button', { name: 'Workspace' })).toBeVisible();
    } catch (e) {
        console.error("Login Failure Diagnostic:");
        console.error("- Current URL:", page.url());
        const errorText = await page.locator('form div[style*="color: var(--error)"]').textContent().catch(() => "No UI error shown");
        console.error("- UI Error Message:", errorText);
        throw e;
    }
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
