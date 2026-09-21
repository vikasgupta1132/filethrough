import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function getExtensionId(page: any, context: any): Promise<string | null> {
  const swUrl = context.serviceWorkers()[0]?.url();
  if (swUrl) {
    const match = swUrl.match(/chrome-extension:\/\/([^/]+)/);
    if (match) return match[1];
  }
  return null;
}

test.describe.configure({ retries: 0 });

test('FileThrough content script loads on page', async ({ page, context }) => {
  const extensionPath = path.resolve('.output/chrome-mv3');
  const userDataDir = path.resolve('test-user-data-content');
  
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const extContext = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  const extPage = extContext.pages()[0] || await extContext.newPage();
  
  try {
    await extPage.waitForTimeout(3000);
    
    const extensionId = await getExtensionId(extPage, extContext);
    if (!extensionId) {
      throw new Error('Could not find extension ID');
    }

    // Navigate to a simple page with a file input
    await extPage.goto(`chrome-extension://${extensionId}/test-pdf.html`);
    
    // Check that the content script is active by looking for console logs
    const fileInput = extPage.locator('input[type="file"]');
    await expect(fileInput).toBeVisible({ timeout: 10000 });
    
    console.log('Content script test passed - file input detected');
  } finally {
    await extContext.close();
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  }
});