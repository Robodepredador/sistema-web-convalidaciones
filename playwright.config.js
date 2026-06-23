import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:5500',
    headless: true,
    viewport: { width: 1366, height: 768 }
  },
  webServer: {
    command: 'python -m http.server 5500',
    url: 'http://127.0.0.1:5500',
    reuseExistingServer: true,
    timeout: 120000
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        channel: 'chrome'
      }
    }
  ]
});
