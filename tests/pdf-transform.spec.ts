import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe.configure({ retries: 0 });

async function getExtensionId(page: any, context: any): Promise<string | null> {
  const swUrl = context.serviceWorkers()[0]?.url();
  console.log('Service worker URL:', swUrl);
  if (swUrl) {
    const match = swUrl.match(/chrome-extension:\/\/([^/]+)/);
    if (match) return match[1];
  }
  
  await page.goto('chrome://extensions');
  await page.waitForTimeout(3000);
  
  const extensionId = await page.evaluate(() => {
    const items = document.querySelectorAll('extensions-item');
    for (const item of items) {
      const shadow = item.shadowRoot;
      if (!shadow) continue;
      
      const nameEl = shadow.querySelector('#name');
      if (nameEl?.textContent?.includes('FileThrough')) {
        const idEl = shadow.querySelector('#extension-id');
        if (idEl) {
          const match = idEl.textContent?.match(/ID: ([a-z]+)/);
          if (match) return match[1];
        }
      }
    }
    return null;
  });
  
  return extensionId;
}

async function createTestPdf(): Promise<Buffer> {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([200, 230]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText('Test PDF', {
    x: 50,
    y: 100,
    size: 24,
    font,
    color: rgb(0, 0, 0),
  });
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

async function runPdfTest(format: 'jpeg' | 'png') {
  const userDataDir = path.resolve(`test-user-data-${format}`);
  const extensionPath = path.resolve('.output/chrome-mv3');
  
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  const page = context.pages()[0] || await context.newPage();
  
  try {
    await page.waitForTimeout(3000);
    
    const extensionId = await getExtensionId(page, context);
    console.log('Extension ID:', extensionId);

    if (!extensionId) {
      throw new Error('Could not find extension ID');
    }

    await page.goto(`chrome-extension://${extensionId}/test-pdf.html?format=${format}`);

    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible({ timeout: 10000 });

    const pdfBuffer = await createTestPdf();

    await fileInput.setInputFiles({
      name: 'test.pdf',
      mimeType: 'application/pdf',
      buffer: pdfBuffer,
    });

    await page.waitForTimeout(15000);

    const resultDiv = page.locator('#result');
    await expect(resultDiv).toBeVisible({ timeout: 15000 });

    const resultInfo = page.locator('#result-info');
    const text = await resultInfo.textContent();
    console.log(`${format.toUpperCase()} Result:`, text);

    // Verify the result text contains the correct MIME type
    expect(text).toContain(`image/${format}`);

    // Verify the image was created (blob URL)
    const resultImage = page.locator('#result-image');
    await expect(resultImage).toBeVisible();
    
    const imgSrc = await resultImage.getAttribute('src');
    expect(imgSrc).toContain('blob:');
  } finally {
    await context.close();
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  }
}

test('PDF to JPEG transformation', async ({ page, context }) => {
  await runPdfTest('jpeg');
});

test('PDF to PNG transformation', async ({ page, context }) => {
  await runPdfTest('png');
});