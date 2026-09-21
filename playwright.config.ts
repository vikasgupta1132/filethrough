import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './tests',
  use: {
    browserName: 'chromium',
    headless: false,
  },
  projects: [
    {
      name: 'chromium-with-extension',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            `--disable-extensions-except=${path.resolve('.output/chrome-mv3')}`,
            `--load-extension=${path.resolve('.output/chrome-mv3')}`,
          ],
        },
      },
    },
  ],
  // Use persistent context to access chrome://extensions
  workers: 1,
});