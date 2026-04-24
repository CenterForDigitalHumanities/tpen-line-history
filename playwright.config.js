import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  timeout: 30_000,
  retries: globalThis.process?.env?.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    // Portrait third-width desktop: ~400px wide (1/3 of typical 1200px desktop)
    // Reflects embedded component context in split-screen interfaces
    viewport: { width: 400, height: 768 }
  },
  webServer: {
    command: 'node test/scripts/start-test-server.js',
    url: 'http://127.0.0.1:4173/health',
    reuseExistingServer: !globalThis.process?.env?.CI,
    timeout: 30_000
  }
})
