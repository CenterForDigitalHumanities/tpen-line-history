import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  timeout: 30_000,
  retries: globalThis.process?.env?.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 400, height: 768 }
  },
  webServer: {
    command: 'node scripts/start-test-server.js',
    url: 'http://127.0.0.1:4173/health',
    reuseExistingServer: !globalThis.process?.env?.CI,
    timeout: 30_000
  }
})
