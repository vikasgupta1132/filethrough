import { test, expect } from '@playwright/test';

test.describe('Edge Cases and Advanced Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank');
  });

  test('handles hidden file inputs triggered by buttons', async ({ page }) => {
    await page.setContent(`
      <div class="custom-upload">
        <p>Upload your profile picture (Max 5 MB, JPG or PNG)</p>
        <input type="file" id="hidden-input" style="display: none;" accept="image/jpeg,image/png" />
        <button onclick="document.getElementById('hidden-input').click()">Choose File</button>
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('#hidden-input') as HTMLInputElement;
      return {
        detected: !!input,
        isHidden: input?.style.display === 'none',
        accept: input?.getAttribute('accept'),
      };
    });

    expect(result.detected).toBe(true);
    expect(result.isHidden).toBe(true);
  });

  test('handles inputs with aria-label', async ({ page }) => {
    await page.setContent(`
      <div>
        <input 
          type="file" 
          aria-label="Upload document (PDF only, max 10 MB)" 
          accept=".pdf"
        />
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      return {
        ariaLabel: input?.getAttribute('aria-label'),
        accept: input?.getAttribute('accept'),
      };
    });

    expect(result.ariaLabel).toContain('10 MB');
    expect(result.accept).toBe('.pdf');
  });

  test('handles inputs inside complex grid layouts', async ({ page }) => {
    await page.setContent(`
      <div class="grid grid-cols-2 gap-4">
        <div class="upload-cell">
          <div class="cell-header">Avatar</div>
          <div class="cell-content">
            <span class="hint">200x200px, max 1MB</span>
            <input type="file" name="avatar" accept="image/*" />
          </div>
        </div>
        <div class="upload-cell">
          <div class="cell-header">Banner</div>
          <div class="cell-content">
            <span class="hint">1200x400px, max 3MB</span>
            <input type="file" name="banner" accept="image/*" />
          </div>
        </div>
      </div>
    `);

    const results = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
      return inputs.map(input => {
        const htmlInput = input as HTMLInputElement;
        const cell = htmlInput.closest('.upload-cell');
        return {
          name: htmlInput.name,
          nearbyText: cell?.innerText?.replace(/\s+/g, ' ').trim() || '',
        };
      });
    });

    expect(results[0].nearbyText).toContain('200x200px');
    expect(results[0].nearbyText).toContain('1MB');
    expect(results[1].nearbyText).toContain('1200x400px');
    expect(results[1].nearbyText).toContain('3MB');
  });

  test('handles inputs added via JavaScript after page load', async ({ page }) => {
    await page.setContent('<div id="container"></div>');

    await page.evaluate(() => {
      setTimeout(() => {
        const container = document.getElementById('container');
        const div = document.createElement('div');
        div.innerHTML = `
          <label>Upload Resume (PDF, max 5 MB)</label>
          <input type="file" id="late-input" accept=".pdf" />
        `;
        container?.appendChild(div);
      }, 100);
    });

    await page.waitForSelector('#late-input', { timeout: 1000 });

    const result = await page.evaluate(() => {
      const input = document.querySelector('#late-input') as HTMLInputElement;
      return {
        detected: !!input,
        accept: input?.getAttribute('accept'),
      };
    });

    expect(result.detected).toBe(true);
  });

  test('handles multiple accept formats', async ({ page }) => {
    await page.setContent(`
      <div>
        <p>Upload image or document</p>
        <input type="file" accept="image/png,image/jpeg,application/pdf,.docx" />
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      return {
        accept: input?.getAttribute('accept'),
        acceptArray: input?.getAttribute('accept')?.split(','),
      };
    });

    expect(result.acceptArray).toHaveLength(4);
    expect(result.accept).toContain('image/png');
    expect(result.accept).toContain('.docx');
  });

  test('handles inputs with data attributes containing constraints', async ({ page }) => {
    await page.setContent(`
      <div>
        <input 
          type="file" 
          data-max-size="5242880"
          data-accepted-types="jpg,png"
          data-max-width="1920"
          data-max-height="1080"
        />
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      return {
        maxSize: input?.getAttribute('data-max-size'),
        types: input?.getAttribute('data-accepted-types'),
        maxWidth: input?.getAttribute('data-max-width'),
        maxHeight: input?.getAttribute('data-max-height'),
      };
    });

    expect(result.maxSize).toBe('5242880');
    expect(result.types).toBe('jpg,png');
  });

  test('handles inputs with placeholder text in sibling elements', async ({ page }) => {
    await page.setContent(`
      <div class="file-upload-wrapper">
        <div class="placeholder">
          <svg></svg>
          <p>Drag and drop or click to upload</p>
          <small>PNG, JPG, GIF up to 10MB</small>
        </div>
        <input type="file" style="position: absolute; opacity: 0;" />
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const wrapper = input?.closest('.file-upload-wrapper');
      return {
        detected: !!input,
        wrapperText: wrapper?.innerText?.replace(/\s+/g, ' ').trim() || '',
      };
    });

    expect(result.detected).toBe(true);
    expect(result.wrapperText).toContain('10MB');
  });

  test('handles inputs with constraints in tooltip or title attributes', async ({ page }) => {
    await page.setContent(`
      <div>
        <input 
          type="file" 
          title="Maximum file size: 2 MB. Accepted formats: JPG, PNG"
          accept="image/jpeg,image/png"
        />
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      return {
        title: input?.getAttribute('title'),
        accept: input?.getAttribute('accept'),
      };
    });

    expect(result.title).toContain('2 MB');
    expect(result.title).toContain('JPG, PNG');
  });

  test('handles responsive layouts with media queries', async ({ page }) => {
    await page.setContent(`
      <div class="responsive-upload">
        <style>
          @media (max-width: 768px) {
            .mobile-only { display: block; }
            .desktop-only { display: none; }
          }
        </style>
        <div class="mobile-only">Mobile: Max 2MB</div>
        <div class="desktop-only">Desktop: Max 10MB</div>
        <input type="file" />
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      return {
        detected: !!input,
      };
    });

    expect(result.detected).toBe(true);
  });

  test('handles inputs inside forms with validation messages', async ({ page }) => {
    await page.setContent(`
      <form>
        <div class="form-group">
          <label>Upload Certificate</label>
          <input type="file" class="form-control" accept=".pdf" />
          <div class="form-text">PDF only, maximum 20 MB</div>
          <div class="invalid-feedback" style="display: none;">File too large</div>
        </div>
      </form>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const formGroup = input?.closest('.form-group');
      return {
        detected: !!input,
        nearbyText: formGroup?.innerText?.replace(/\s+/g, ' ').trim() || '',
      };
    });

    expect(result.detected).toBe(true);
    expect(result.nearbyText).toContain('20 MB');
  });

  test('handles inputs with internationalized text (non-English)', async ({ page }) => {
    await page.setContent(`
      <div>
        <label>Télécharger un fichier</label>
        <p>Taille maximale: 5 Mo</p>
        <input type="file" />
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const parent = input?.parentElement;
      return {
        detected: !!input,
        nearbyText: parent?.innerText?.replace(/\s+/g, ' ').trim() || '',
      };
    });

    expect(result.detected).toBe(true);
  });

  test('handles inputs with emoji in instructions', async ({ page }) => {
    await page.setContent(`
      <div>
        <p>📸 Upload your photo (Max 3 MB) 🎉</p>
        <input type="file" accept="image/*" />
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const parent = input?.parentElement;
      return {
        detected: !!input,
        nearbyText: parent?.innerText?.replace(/\s+/g, ' ').trim() || '',
      };
    });

    expect(result.detected).toBe(true);
    expect(result.nearbyText).toContain('3 MB');
  });

  test('handles drag-and-drop zones without visible inputs', async ({ page }) => {
    await page.setContent(`
      <div 
        class="dropzone"
        ondrop="handleDrop(event)"
        ondragover="handleDragOver(event)"
      >
        <p>Drop files here</p>
        <p class="constraints">Max 10 MB per file, JPG or PNG only</p>
        <input type="file" multiple hidden id="file-input" />
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('#file-input') as HTMLInputElement;
      return {
        detected: !!input,
        hidden: input?.hasAttribute('hidden'),
        multiple: input?.multiple,
      };
    });

    expect(result.detected).toBe(true);
    expect(result.hidden).toBe(true);
  });

  test('handles inputs with unusual size units', async ({ page }) => {
    await page.setContent(`
      <div>
        <p>Max file size: 1.5 GB</p>
        <input type="file" />
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const parent = input?.parentElement;
      return {
        nearbyText: parent?.innerText?.replace(/\s+/g, ' ').trim() || '',
      };
    });

    expect(result.nearbyText).toContain('1.5 GB');
  });

  test('handles inputs with decimal dimensions', async ({ page }) => {
    await page.setContent(`
      <div>
        <p>Recommended size: 16:9 aspect ratio, 1920x1080 pixels</p>
        <input type="file" accept="image/*" />
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const parent = input?.parentElement;
      return {
        nearbyText: parent?.innerText?.replace(/\s+/g, ' ').trim() || '',
      };
    });

    expect(result.nearbyText).toContain('1920x1080');
  });

  test('handles inputs in card components', async ({ page }) => {
    await page.setContent(`
      <div class="card">
        <div class="card-header">
          <h3>Document Upload</h3>
        </div>
        <div class="card-body">
          <p class="card-text">Upload your identification document</p>
          <ul class="requirements">
            <li>Accepted formats: PDF, JPG, PNG</li>
            <li>Maximum file size: 15 MB</li>
            <li>Document must be clear and readable</li>
          </ul>
          <input type="file" class="form-control-file" />
        </div>
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const card = input?.closest('.card');
      return {
        detected: !!input,
        cardText: card?.innerText?.replace(/\s+/g, ' ').trim() || '',
      };
    });

    expect(result.detected).toBe(true);
    expect(result.cardText).toContain('15 MB');
    expect(result.cardText).toContain('PDF, JPG, PNG');
  });

  test('handles inputs with constraints in CSS content', async ({ page }) => {
    await page.setContent(`
      <style>
        .file-hint::before {
          content: "Max 5 MB";
        }
      </style>
      <div>
        <input type="file" />
        <span class="file-hint"></span>
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      return {
        detected: !!input,
      };
    });

    expect(result.detected).toBe(true);
  });

  test('handles file inputs that get replaced/recreated', async ({ page }) => {
    await page.setContent(`
      <div id="upload-container">
        <input type="file" id="original" />
      </div>
    `);

    await page.evaluate(() => {
      const container = document.getElementById('upload-container');
      const newInput = document.createElement('input');
      newInput.type = 'file';
      newInput.id = 'replaced';
      newInput.accept = 'image/jpeg,image/png';
      
      const oldInput = document.getElementById('original');
      container?.replaceChild(newInput, oldInput!);
    });

    await page.waitForTimeout(100);

    const result = await page.evaluate(() => {
      const input = document.querySelector('#replaced') as HTMLInputElement;
      return {
        detected: !!input,
        accept: input?.getAttribute('accept'),
      };
    });

    expect(result.detected).toBe(true);
  });

  test('handles inputs in modals/dialogs', async ({ page }) => {
    await page.setContent(`
      <div class="modal" style="display: block;">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5>Upload File</h5>
            </div>
            <div class="modal-body">
              <p>Please select a file to upload (max 10 MB)</p>
              <input type="file" />
            </div>
          </div>
        </div>
      </div>
    `);

    const result = await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const modalBody = input?.closest('.modal-body');
      return {
        detected: !!input,
        nearbyText: modalBody?.innerText?.replace(/\s+/g, ' ').trim() || '',
      };
    });

    expect(result.detected).toBe(true);
    expect(result.nearbyText).toContain('10 MB');
  });
});
