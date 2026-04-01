const { test, expect } = require('@playwright/test');

test.describe('Task Management (CRUD)', () => {
  // Pre-login for every test in this suite
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page.getByText('Project Roadmap')).toBeVisible();
  });

  test('should create, edit, and delete a task with due date', async ({ page }) => {
    const testTitle = `PROD-TEST-${Date.now()}`;
    const updatedTitle = `${testTitle}-EDITED`;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0]; // Format YYYY-MM-DD

    try {
      /**
       * 1. CREATE TASK
       */
      await page.getByRole('button', { name: /new task/i }).first().click();
      
      const modalHeading = page.getByRole('heading', { name: 'New Task' });
      await expect(modalHeading).toBeVisible();

      await page.getByPlaceholder('What needs to be done?').fill(testTitle);
      await page.getByPlaceholder('Add more details...').fill('Automated production-grade test');
      await page.locator('input[type="date"]').fill(dateStr);
      
      await page.getByRole('button', { name: 'Create Task' }).click();
      
      // Wait for modal to close
      await expect(modalHeading).not.toBeVisible({ timeout: 10000 });

      // Verify task visibility in the board
      const taskCard = page.getByText(testTitle).first();
      await expect(taskCard).toBeVisible({ timeout: 10000 });

      /**
       * 2. EDIT TASK
       */
      await taskCard.click();
      await expect(page.getByRole('heading', { name: 'Edit Task' })).toBeVisible();
      
      await page.getByPlaceholder('What needs to be done?').fill(updatedTitle);
      await page.getByRole('button', { name: 'Save Changes' }).click();
      
      // Verify update persistence in UI
      await expect(page.getByText(updatedTitle)).toBeVisible();

    } finally {
      /**
       * 3. CLEANUP
       * Always ensure the test-created task is removed from the database
       */
      console.log(`Cleaning up task: ${testTitle} / ${updatedTitle}`);
      
      // Target either the original or updated title
      const cleanupTarget = page.locator('div').filter({ hasText: updatedTitle }).or(page.locator('div').filter({ hasText: testTitle })).last();
      
      if (await cleanupTarget.isVisible()) {
        await cleanupTarget.locator('.delete-task-btn').click();
        await expect(cleanupTarget).not.toBeVisible();
      }
    }
  });

  test('should survive page reload (Persistence)', async ({ page }) => {
    const persistTitle = `PERSIST-TEST-${Date.now()}`;
    const dateStr = new Date().toISOString().split('T')[0];

    try {
      // Create a persistent task
      await page.getByRole('button', { name: /new task/i }).first().click();
      const modalHeading = page.getByRole('heading', { name: 'New Task' });
      await page.getByPlaceholder('What needs to be done?').fill(persistTitle);
      await page.locator('input[type="date"]').fill(dateStr);
      await page.getByRole('button', { name: 'Create Task' }).click();
      
      await expect(modalHeading).not.toBeVisible();
      await expect(page.getByText(persistTitle)).toBeVisible({ timeout: 10000 });

      // RELOAD & WAIT for API data sync
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify task still exists after full page refresh
      await expect(page.getByText(persistTitle)).toBeVisible();
    } finally {
      // Cleanup persistent test data
      const cleanupTarget = page.locator('div').filter({ hasText: persistTitle }).last();
      if (await cleanupTarget.isVisible()) {
        await cleanupTarget.locator('.delete-task-btn').click();
      }
    }
  });
});
