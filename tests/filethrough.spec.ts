import { test, expect } from '@playwright/test';

test('FileThrough detects dynamic upload input', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/test-upload.html');

  const fileInput = page.locator('input[type="file"]');

await page.waitForTimeout(3000);

await expect(fileInput).toBeVisible({
  timeout: 5000,
});

  await expect(fileInput).toHaveAttribute(
    'accept',
    '.jpg,.jpeg'
  );
});