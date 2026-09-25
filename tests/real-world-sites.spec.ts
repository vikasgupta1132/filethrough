import { test, expect } from '@playwright/test';

test.describe('Real-World Website Patterns', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank');
  });

  test('GitHub issue attachment pattern', async ({ page }) => {
    await page.setContent(`
      <div class="upload-enabled">
        <div class="comment-form-textarea">
          <textarea></textarea>
        </div>
        <div class="write-content">
          <p class="upload-instructions">
            Attach files by dragging & dropping, selecting or pasting them.
          </p>
          <input type="file" accept="image/png,image/gif,image/jpeg,image/webp,.csv,.txt,.zip" multiple />
        </div>
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (!input) return null;
      
      const parent = input.parentElement;
      return {
        accept: input.getAttribute('accept'),
        nearbyText: parent?.innerText?.replace(/\s+/g, ' ').trim() || '',
        detected: !!input,
      };
    });

    expect(result?.detected).toBe(true);
    expect(result?.accept).toContain('image/png');
  });

  test('LinkedIn profile picture pattern', async ({ page }) => {
    await page.setContent(`
      <div class="profile-photo-edit">
        <div class="photo-upload-container">
          <h2>Edit photo</h2>
          <p class="subtitle">Recommended: Square photo, at least 400 x 400 pixels. Max file size 8 MB.</p>
          <input type="file" accept="image/jpeg,image/png" aria-label="Upload photo" />
        </div>
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (!input) return null;
      
      const container = input.closest('.profile-photo-edit');
      return {
        accept: input.getAttribute('accept'),
        nearbyText: container?.innerText?.replace(/\s+/g, ' ').trim() || '',
        detected: !!input,
      };
    });

    expect(result?.detected).toBe(true);
    expect(result?.nearbyText).toContain('400 x 400');
    expect(result?.nearbyText).toContain('8 MB');
  });

  test('Twitter/X media upload pattern', async ({ page }) => {
    await page.setContent(`
      <div class="media-upload">
        <div class="DraftEditor-root">
          <div class="public-DraftEditor-content"></div>
        </div>
        <div class="media-controls">
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime" multiple style="display: none;" />
        </div>
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      return {
        accept: input?.getAttribute('accept') || null,
        detected: !!input,
        isHidden: input?.style.display === 'none',
      };
    });

    expect(result?.detected).toBe(true);
    expect(result?.isHidden).toBe(true);
  });

  test('Facebook cover photo pattern', async ({ page }) => {
    await page.setContent(`
      <div class="cover-photo-editor">
        <div class="editor-content">
          <span>Upload Cover Photo</span>
          <div class="upload-hints">Recommended size: 820 x 312 pixels</div>
          <input type="file" accept="image/*" />
        </div>
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (!input) return null;
      
      const parent = input.parentElement;
      return {
        accept: input.getAttribute('accept'),
        nearbyText: parent?.innerText?.replace(/\s+/g, ' ').trim() || '',
        detected: !!input,
      };
    });

    expect(result?.detected).toBe(true);
    expect(result?.nearbyText).toContain('820 x 312');
  });

  test('Chrome Web Store Developer Console pattern', async ({ page }) => {
    await page.setContent(`
      <div class="store-listing-section">
        <div class="field-group">
          <label class="field-label">Store Icon *</label>
          <div class="field-description">
            A 128x128 icon to display in the store
          </div>
          <div class="upload-area">
            <input type="file" name="icon_file" class="file-input" />
          </div>
        </div>
        <div class="field-group">
          <label class="field-label">Promotional Images</label>
          <div class="field-description">
            440x280 pixels. PNG or JPEG. Maximum 1 MB per image.
          </div>
          <div class="upload-area">
            <input type="file" name="promo_images" class="file-input" accept="image/png,image/jpeg" multiple />
          </div>
        </div>
        <div class="field-group">
          <label class="field-label">Screenshot</label>
          <div class="field-description">
            1280x800 or 640x400 pixels. File size should not exceed 5 MB.
          </div>
          <div class="upload-area">
            <input type="file" name="screenshot" class="file-input" />
          </div>
        </div>
      </div>
    `);

    const results = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
      return inputs.map(input => {
        const htmlInput = input as HTMLInputElement;
        const fieldGroup = htmlInput.closest('.field-group');
        const label = fieldGroup?.querySelector('.field-label')?.textContent?.trim() || '';
        const description = fieldGroup?.querySelector('.field-description')?.textContent?.trim() || '';
        
        return {
          name: htmlInput.name,
          label,
          description,
          accept: htmlInput.getAttribute('accept'),
          detected: true,
        };
      });
    });

    expect(results).toHaveLength(3);
    expect(results[0].description).toContain('128x128');
    expect(results[1].description).toContain('440x280');
    expect(results[1].description).toContain('1 MB');
    expect(results[2].description).toContain('5 MB');
  });

  test('Material-UI file upload pattern', async ({ page }) => {
    await page.setContent(`
      <div class="MuiBox-root">
        <div class="MuiFormControl-root">
          <label class="MuiFormLabel-root">Upload Document</label>
          <div class="MuiInputBase-root">
            <input type="file" class="MuiInputBase-input" accept=".pdf,.doc,.docx" />
          </div>
          <p class="MuiFormHelperText-root">Max size: 25 MB. Formats: PDF, DOC, DOCX</p>
        </div>
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (!input) return null;
      
      const formControl = input.closest('.MuiFormControl-root');
      return {
        accept: input.getAttribute('accept'),
        nearbyText: formControl?.innerText?.replace(/\s+/g, ' ').trim() || '',
        detected: !!input,
      };
    });

    expect(result?.detected).toBe(true);
    expect(result?.nearbyText).toContain('25 MB');
  });

  test('Dropzone.js pattern', async ({ page }) => {
    await page.setContent(`
      <div class="dropzone" id="my-dropzone">
        <div class="dz-message">
          <h3>Drop files here or click to upload</h3>
          <span class="note">Maximum file size: 10 MB. Accepted formats: JPG, PNG, PDF</span>
        </div>
        <input type="file" multiple style="display: none;" />
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (!input) return null;
      
      const dropzone = input.closest('.dropzone');
      return {
        nearbyText: dropzone?.innerText?.replace(/\s+/g, ' ').trim() || '',
        detected: !!input,
        isHidden: input.style.display === 'none',
      };
    });

    expect(result?.detected).toBe(true);
    expect(result?.nearbyText).toContain('10 MB');
  });

  test('React-Dropzone pattern', async ({ page }) => {
    await page.setContent(`
      <div class="upload-wrapper">
        <div role="presentation" tabindex="0">
          <input type="file" accept="image/*" multiple style="display: none;" />
          <p>Drag and drop images here, or click to select files</p>
          <em>(Only images will be accepted, max 5MB each)</em>
        </div>
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (!input) return null;
      
      const wrapper = input.closest('[role="presentation"]');
      return {
        accept: input.getAttribute('accept'),
        nearbyText: wrapper?.innerText?.replace(/\s+/g, ' ').trim() || '',
        detected: !!input,
      };
    });

    expect(result?.detected).toBe(true);
    expect(result?.nearbyText).toContain('5MB');
  });

  test('Tailwind CSS styled upload', async ({ page }) => {
    await page.setContent(`
      <div class="max-w-md mx-auto">
        <label class="block text-sm font-medium text-gray-700">
          Profile Photo
        </label>
        <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div class="space-y-1 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <div class="flex text-sm text-gray-600">
              <label class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600">
                <span>Upload a file</span>
                <input type="file" class="sr-only" accept="image/png,image/jpeg,image/jpg" />
              </label>
              <p class="pl-1">or drag and drop</p>
            </div>
            <p class="text-xs text-gray-500">PNG, JPG up to 2MB</p>
          </div>
        </div>
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (!input) return null;
      
      const container = document.querySelector('.max-w-md');
      return {
        accept: input.getAttribute('accept'),
        nearbyText: container?.innerText?.replace(/\s+/g, ' ').trim() || '',
        detected: !!input,
      };
    });

    expect(result?.detected).toBe(true);
    expect(result?.nearbyText).toContain('2MB');
  });

  test('Bootstrap file input pattern', async ({ page }) => {
    await page.setContent(`
      <div class="mb-3">
        <label for="formFile" class="form-label">Document Upload</label>
        <input class="form-control" type="file" id="formFile" accept=".pdf">
        <div class="form-text">Please upload PDF files only. Maximum size: 20 MB</div>
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('#formFile') as HTMLInputElement;
      if (!input) return null;
      
      const parent = input.parentElement;
      return {
        accept: input.getAttribute('accept'),
        nearbyText: parent?.innerText?.replace(/\s+/g, ' ').trim() || '',
        detected: !!input,
      };
    });

    expect(result?.detected).toBe(true);
    expect(result?.nearbyText).toContain('20 MB');
  });

  test('Shadow DOM file input pattern', async ({ page }) => {
    await page.setContent(`
      <div id="host"></div>
      <script>
        const host = document.getElementById('host');
        const shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = \`
          <div>
            <p>Upload avatar (max 500 KB)</p>
            <input type="file" accept="image/*" />
          </div>
        \`;
      </script>
    `);

    await page.waitForTimeout(100);

    const result = await page.evaluate(() => {
      const host = document.getElementById('host') as any;
      const shadow = host?.shadowRoot;
      if (!shadow) return null;
      
      const input = shadow.querySelector('input[type="file"]') as HTMLInputElement;
      if (!input) return null;
      
      const parent = input.parentElement;
      return {
        accept: input.getAttribute('accept'),
        nearbyText: parent?.innerText?.replace(/\s+/g, ' ').trim() || '',
        detected: !!input,
        inShadowDOM: true,
      };
    });

    expect(result?.inShadowDOM).toBe(true);
  });

  test('iframe file input pattern', async ({ page }) => {
    await page.setContent(`
      <iframe id="upload-frame" srcdoc="
        <div>
          <label>Upload File (Max 3 MB)</label>
          <input type='file' id='iframe-input' />
        </div>
      "></iframe>
    `);

    await page.waitForTimeout(200);

    const frameDetected = await page.evaluate(() => {
      const frame = document.getElementById('upload-frame') as HTMLIFrameElement;
      const frameDoc = frame?.contentDocument || frame?.contentWindow?.document;
      const input = frameDoc?.querySelector('#iframe-input');
      return !!input;
    });

    expect(frameDetected).toBe(true);
  });

  test('Vue.js file upload component pattern', async ({ page }) => {
    await page.setContent(`
      <div id="app">
        <div class="file-upload-component">
          <div class="upload-label">Image Upload</div>
          <div class="upload-constraints">
            <span>Formats: JPG, PNG, WebP</span>
            <span>Max size: 4MB</span>
            <span>Dimensions: 1200x630px</span>
          </div>
          <input type="file" ref="fileInput" accept="image/jpeg,image/png,image/webp" style="display: none;" />
          <button @click="triggerUpload">Choose File</button>
        </div>
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (!input) return null;
      
      const component = document.querySelector('.file-upload-component');
      return {
        accept: input.getAttribute('accept'),
        nearbyText: component?.innerText?.replace(/\s+/g, ' ').trim() || '',
        detected: !!input,
      };
    });

    expect(result?.detected).toBe(true);
    expect(result?.nearbyText).toContain('4MB');
    expect(result?.nearbyText).toContain('1200x630px');
  });

  test('Angular Material file upload pattern', async ({ page }) => {
    await page.setContent(`
      <mat-form-field class="full-width">
        <mat-label>Upload Certificate</mat-label>
        <div class="file-input-wrapper">
          <input type="file" #fileInput accept=".pdf,.jpg,.png" style="display: none;" />
          <input matInput readonly placeholder="No file chosen" />
          <button mat-icon-button matSuffix>
            <mat-icon>attach_file</mat-icon>
          </button>
        </div>
        <mat-hint>Accepted: PDF, JPG, PNG. Max size: 15 MB</mat-hint>
      </mat-form-field>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (!input) return null;
      
      const formField = document.querySelector('mat-form-field');
      return {
        accept: input.getAttribute('accept'),
        nearbyText: formField?.innerText?.replace(/\s+/g, ' ').trim() || '',
        detected: !!input,
      };
    });

    expect(result?.detected).toBe(true);
    expect(result?.nearbyText).toContain('15 MB');
  });

  test('Multiple file inputs on same page', async ({ page }) => {
    await page.setContent(`
      <div>
        <div class="avatar-upload">
          <label>Avatar (Max 1 MB, 200x200px)</label>
          <input type="file" name="avatar" accept="image/jpeg,image/png" />
        </div>
        <div class="cover-upload">
          <label>Cover Photo (Max 5 MB, 1200x400px)</label>
          <input type="file" name="cover" accept="image/jpeg,image/png" />
        </div>
        <div class="document-upload">
          <label>Resume (PDF only, max 10 MB)</label>
          <input type="file" name="resume" accept=".pdf" />
        </div>
      </div>
    `);

    const results = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
      return inputs.map(input => {
        const htmlInput = input as HTMLInputElement;
        const parent = htmlInput.parentElement;
        return {
          name: htmlInput.name,
          accept: htmlInput.getAttribute('accept'),
          nearbyText: parent?.innerText?.replace(/\s+/g, ' ').trim() || '',
        };
      });
    });

    expect(results).toHaveLength(3);
    expect(results[0].nearbyText).toContain('1 MB');
    expect(results[1].nearbyText).toContain('5 MB');
    expect(results[2].nearbyText).toContain('10 MB');
  });
});
