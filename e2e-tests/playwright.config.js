const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config();

console.log('--- CI Environment Check ---');
console.log('TEST_USER_EMAIL:', process.env.TEST_USER_EMAIL ? 'PRESENT' : 'MISSING ❌');
console.log('VITE_API_URL:', process.env.VITE_API_URL ? 'PRESENT' : 'MISSING ❌');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'PRESENT' : 'MISSING ❌');
console.log('SUPABASE_KEY (Backend):', process.env.SUPABASE_KEY ? 'PRESENT' : 'MISSING ❌');
console.log('---------------------------');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Automatic Server Management for E2E Tests
  webServer: [
    {
      // API Backend
      command: 'cd ../api && uvicorn main:app --host 127.0.0.1 --port 8000',
      url: 'http://127.0.0.1:8000/',
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      timeout: 120 * 1000,
    },
    {
      // Frontend UI
      command: 'cd ../ui && npm run dev -- --host 127.0.0.1',
      url: 'http://127.0.0.1:5173/',
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      timeout: 120 * 1000,
    }
  ],
});
