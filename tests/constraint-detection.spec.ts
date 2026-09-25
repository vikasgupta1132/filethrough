import { test, expect } from '@playwright/test';
import { extractUploadContext } from '../core/detector/extractUploadContext';
import { parseConstraints } from '../core/parser/parseConstraints';

test.describe('Upload Constraint Detection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank');
  });

  test('detects constraints from accept attribute', async ({ page }) => {
    await page.setContent(`
      <div>
        <input type="file" id="test-input" accept=".jpg,.png,.pdf" />
      </div>
    `);

    const context = await page.evaluate(() => {
      const input = document.querySelector('#test-input') as HTMLInputElement;
      return {
        label: null,
        nearbyText: '',
        accept: input.getAttribute('accept'),
      };
    });

    const constraints = parseConstraints(context);
    expect(constraints.allowedFormats).toContain('jpg');
    expect(constraints.allowedFormats).toContain('png');
    expect(constraints.allowedFormats).toContain('pdf');
  });

  test('detects constraints from label text', async ({ page }) => {
    await page.setContent(`
      <div>
        <label for="test-input">Upload image (Max 2 MB, JPG or PNG)</label>
        <input type="file" id="test-input" />
      </div>
    `);

    const context = await page.evaluate(() => {
      const input = document.querySelector('#test-input') as HTMLInputElement;
      const label = document.querySelector('label[for="test-input"]');
      const parent = input.parentElement;
      return {
        label: label?.textContent?.trim() || null,
        nearbyText: parent?.innerText?.replace(/\s+/g, ' ').trim() || '',
        accept: input.getAttribute('accept'),
      };
    });

    const constraints = parseConstraints(context);
    expect(constraints.maxBytes).toBe(2 * 1024 * 1024);
    expect(constraints.allowedFormats).toContain('jpg');
    expect(constraints.allowedFormats).toContain('png');
  });

  test('detects constraints from nearby text with various patterns', async ({ page }) => {
    const testCases = [
      {
        html: '<div><p>Maximum file size: 500 KB</p><input type="file" /></div>',
        expectedMaxBytes: 500 * 1024,
      },
      {
        html: '<div><span>File size should not exceed 10 MB</span><input type="file" /></div>',
        expectedMaxBytes: 10 * 1024 * 1024,
      },
      {
        html: '<div><div>Must be under 200 KB</div><input type="file" /></div>',
        expectedMaxBytes: 200 * 1024,
      },
      {
        html: '<div><p>Between 50 KB and 500 KB</p><input type="file" /></div>',
        expectedMinBytes: 50 * 1024,
        expectedMaxBytes: 500 * 1024,
      },
      {
        html: '<div><p>20KB - 100KB</p><input type="file" /></div>',
        expectedMinBytes: 20 * 1024,
        expectedMaxBytes: 100 * 1024,
      },
    ];

    for (const testCase of testCases) {
      await page.setContent(testCase.html);

      const context = await page.evaluate(() => {
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        const parent = input.parentElement;
        return {
          label: null,
          nearbyText: parent?.innerText?.replace(/\s+/g, ' ').trim() || '',
          accept: input.getAttribute('accept'),
        };
      });

      const constraints = parseConstraints(context);
      
      if ('expectedMaxBytes' in testCase) {
        expect(constraints.maxBytes).toBe(testCase.expectedMaxBytes);
      }
      if ('expectedMinBytes' in testCase) {
        expect(constraints.minBytes).toBe(testCase.expectedMinBytes);
      }
    }
  });

  test('detects dimension constraints', async ({ page }) => {
    const testCases = [
      {
        html: '<div><p>Dimensions: 200 x 230 pixels</p><input type="file" /></div>',
        expectedWidth: 200,
        expectedHeight: 230,
      },
      {
        html: '<div><span>Image size: 1920 × 1080</span><input type="file" /></div>',
        expectedWidth: 1920,
        expectedHeight: 1080,
      },
      {
        html: '<div><p>Upload 400x300 image</p><input type="file" /></div>',
        expectedWidth: 400,
        expectedHeight: 300,
      },
    ];

    for (const testCase of testCases) {
      await page.setContent(testCase.html);

      const context = await page.evaluate(() => {
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        const parent = input.parentElement;
        return {
          label: null,
          nearbyText: parent?.innerText?.replace(/\s+/g, ' ').trim() || '',
          accept: input.getAttribute('accept'),
        };
      });

      const constraints = parseConstraints(context);
      
      expect(constraints.dimensions?.width).toBe(testCase.expectedWidth);
      expect(constraints.dimensions?.height).toBe(testCase.expectedHeight);
    }
  });

  test('handles complex nested structures', async ({ page }) => {
    await page.setContent(`
      <div class="upload-container">
        <div class="header">
          <h3>Upload Profile Picture</h3>
          <p class="requirements">
            Accepted formats: JPG, PNG, WebP<br>
            Maximum file size: 5 MB<br>
            Recommended dimensions: 400 x 400 pixels
          </p>
        </div>
        <div class="input-wrapper">
          <input type="file" id="profile-pic" accept="image/jpeg,image/png,image/webp" />
        </div>
      </div>
    `);

    const context = await page.evaluate(() => {
      const input = document.querySelector('#profile-pic') as HTMLInputElement;
      const parent = input.parentElement?.parentElement;
      return {
        label: null,
        nearbyText: parent?.innerText?.replace(/\s+/g, ' ').trim() || '',
        accept: input.getAttribute('accept'),
      };
    });

    const constraints = parseConstraints(context);
    
    expect(constraints.allowedFormats).toContain('jpg');
    expect(constraints.allowedFormats).toContain('png');
    expect(constraints.allowedFormats).toContain('webp');
    expect(constraints.maxBytes).toBe(5 * 1024 * 1024);
    expect(constraints.dimensions?.width).toBe(400);
    expect(constraints.dimensions?.height).toBe(400);
  });

  test('handles inputs with no constraints gracefully', async ({ page }) => {
    await page.setContent(`
      <div>
        <input type="file" id="test-input" />
      </div>
    `);

    const context = await page.evaluate(() => {
      const input = document.querySelector('#test-input') as HTMLInputElement;
      const parent = input.parentElement;
      return {
        label: null,
        nearbyText: parent?.innerText?.replace(/\s+/g, ' ').trim() || '',
        accept: input.getAttribute('accept'),
      };
    });

    const constraints = parseConstraints(context);
    
    expect(constraints.maxBytes).toBeUndefined();
    expect(constraints.minBytes).toBeUndefined();
    expect(constraints.allowedFormats).toBeUndefined();
    expect(constraints.dimensions).toBeUndefined();
  });

  test('handles wrapped label patterns', async ({ page }) => {
    await page.setContent(`
      <label>
        Profile Image (Max 2 MB)
        <input type="file" accept="image/*" />
      </label>
    `);

    const context = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const parentLabel = input.closest('label');
      const parent = input.parentElement;
      return {
        label: parentLabel?.textContent?.trim() || null,
        nearbyText: parent?.innerText?.replace(/\s+/g, ' ').trim() || '',
        accept: input.getAttribute('accept'),
      };
    });

    const constraints = parseConstraints(context);
    expect(constraints.maxBytes).toBe(2 * 1024 * 1024);
  });

  test('handles Chrome Web Store style inputs', async ({ page }) => {
    await page.setContent(`
      <div class="upload-section">
        <div class="field-container">
          <div class="field-label">Store Icon</div>
          <div class="field-description">Upload a 128x128 PNG or JPG image</div>
          <input type="file" name="icon" />
        </div>
      </div>
    `);

    const context = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const fieldContainer = input.closest('.field-container');
      return {
        label: fieldContainer?.querySelector('.field-label')?.textContent?.trim() || null,
        nearbyText: fieldContainer?.innerText?.replace(/\s+/g, ' ').trim() || '',
        accept: input.getAttribute('accept'),
      };
    });

    const constraints = parseConstraints(context);
    
    expect(constraints.dimensions?.width).toBe(128);
    expect(constraints.dimensions?.height).toBe(128);
    expect(constraints.allowedFormats).toContain('png');
    expect(constraints.allowedFormats).toContain('jpg');
  });

  test('detects constraints in dynamically added elements', async ({ page }) => {
    await page.setContent('<div id="container"></div>');

    await page.evaluate(() => {
      const container = document.getElementById('container');
      const div = document.createElement('div');
      div.innerHTML = `
        <p>Upload document (PDF only, max 10 MB)</p>
        <input type="file" id="dynamic-input" />
      `;
      container?.appendChild(div);
    });

    await page.waitForSelector('#dynamic-input');

    const context = await page.evaluate(() => {
      const input = document.querySelector('#dynamic-input') as HTMLInputElement;
      const parent = input.parentElement;
      return {
        label: null,
        nearbyText: parent?.innerText?.replace(/\s+/g, ' ').trim() || '',
        accept: input.getAttribute('accept'),
      };
    });

    const constraints = parseConstraints(context);
    
    expect(constraints.allowedFormats).toContain('pdf');
    expect(constraints.maxBytes).toBe(10 * 1024 * 1024);
  });
});
