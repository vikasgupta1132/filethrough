import { useEffect } from 'react';

function FAQ() {
  useEffect(() => {
    const tabs = document.querySelectorAll<HTMLButtonElement>('.category-tab');
    const items = document.querySelectorAll<HTMLElement>('.faq-item');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const category = tab.dataset.category;

        items.forEach(item => {
          if (category === 'all' || item.dataset.category === category) {
            item.hidden = false;
          } else {
            item.hidden = true;
          }
        });
      });
    });
  }, []);

  return (
    <>
      <header className="page-hero">
        <div className="container">
          <h1>Frequently Asked Questions</h1>
          <p className="page-description">
            Everything you need to know about FileThrough
          </p>
        </div>
      </header>

      <section className="faq-section">
        <div className="container">
          <div className="faq-categories">
            <div className="category-tabs">
              <button className="category-tab active" data-category="all">All</button>
              <button className="category-tab" data-category="getting-started">Getting Started</button>
              <button className="category-tab" data-category="privacy">Privacy & Security</button>
              <button className="category-tab" data-category="features">Features</button>
              <button className="category-tab" data-category="troubleshooting">Troubleshooting</button>
              <button className="category-tab" data-category="billing">Billing & Account</button>
            </div>

            <div className="faq-grid" id="faq-grid">
              {/* Getting Started */}
              <details className="faq-item" data-category="getting-started">
                <summary>How do I install FileThrough?</summary>
                <p>
                  Click the <strong>Add to Chrome</strong> button on our homepage or visit the
                  <a href="https://chromewebstore.google.com/detail/filethrough" target="_blank" rel="noopener noreferrer">Chrome Web Store</a>
                  directly. Click "Add to Chrome" and confirm the installation.
                </p>
              </details>

              <details className="faq-item" data-category="getting-started">
                <summary>Does FileThrough work on all websites?</summary>
                <p>
                  FileThrough works on any website with file upload inputs. It automatically detects
                  file input fields and analyzes platform constraints. Some sites with custom upload
                  components may require a page refresh to detect properly.
                </p>
              </details>

              <details className="faq-item" data-category="getting-started">
                <summary>Which browsers are supported?</summary>
                <p>
                  FileThrough works on Chrome, Edge, Brave, Vivaldi, and other Chromium-based browsers.
                  Firefox support is planned for a future release.
                </p>
              </details>

              <details className="faq-item" data-category="getting-started">
                <summary>Do I need to create an account?</summary>
                <p>
                  No account required! FileThrough works immediately after installation with no
                  registration, login, or email needed.
                </p>
              </details>

              {/* Privacy & Security */}
              <details className="faq-item" data-category="privacy">
                <summary>Does FileThrough upload my files to your servers?</summary>
                <p>
                  <strong>Absolutely not.</strong> All file processing happens locally in your browser
                  using WebAssembly. Your files never leave your device, and we have no way to access them.
                </p>
              </details>

              <details className="faq-item" data-category="privacy">
                <summary>What data does FileThrough collect?</summary>
                <p>
                  We collect zero personal data. No analytics, no tracking, no usage statistics.
                  The extension doesn't even have network permissions. See our
                  <a href="/privacy">Privacy Policy</a> for full details.
                </p>
              </details>

              <details className="faq-item" data-category="privacy">
                <summary>Is FileThrough open source?</summary>
                <p>
                  Yes! FileThrough is open source under the MIT license. You can audit the code,
                  verify our privacy claims, and contribute improvements at
                  <a href="https://github.com/filethrough/filethrough" target="_blank" rel="noopener noreferrer">GitHub</a>.
                </p>
              </details>

              <details className="faq-item" data-category="privacy">
                <summary>Can I use FileThrough for sensitive documents?</summary>
                <p>
                  Yes. Since all processing is local, FileThrough is suitable for confidential documents,
                  medical records, financial data, and other sensitive files. However, always verify
                  the output meets your requirements before uploading elsewhere.
                </p>
              </details>

              {/* Features */}
              <details className="faq-item" data-category="features">
                <summary>What file formats does FileThrough support?</summary>
                <p>
                  Images: JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF, HEIC<br />
                  Documents: PDF (conversion to/from images)<br />
                  Video: MP4, WebM (compression only, no format conversion)
                </p>
              </details>

              <details className="faq-item" data-category="features">
                <summary>Can I customize compression settings?</summary>
                <p>
                  Yes! FileThrough offers both automatic mode (detects platform requirements) and
                  manual mode where you can set exact dimensions, quality, format, and file size targets.
                </p>
              </details>

              <details className="faq-item" data-category="features">
                <summary>Does FileThrough work with drag-and-drop uploads?</summary>
                <p>
                  Yes. FileThrough intercepts both click-to-browse and drag-and-drop file selections,
                  processing files before they reach the website's upload handler.
                </p>
              </details>

              <details className="faq-item" data-category="features">
                <summary>Can I create custom rules for specific sites?</summary>
                <p>
                  Yes. In the extension popup, you can define custom transformation rules for specific
                  domains — like always converting to WebP for your blog, or resizing to 1920px for
                  your portfolio site.
                </p>
              </details>

              <details className="faq-item" data-category="features">
                <summary>Is there a file size limit?</summary>
                <p>
                  FileThrough can process files up to your browser's memory limit (typically 2GB+).
                  For very large files, processing may take longer but will complete locally.
                </p>
              </details>

              {/* Troubleshooting */}
              <details className="faq-item" data-category="troubleshooting">
                <summary>FileThrough isn't detecting the upload field</summary>
                <p>
                  Try refreshing the page. If it still doesn't work, the site may use a custom upload
                  component. You can also right-click the extension icon and select "Scan for inputs"
                  to force detection.
                </p>
              </details>

              <details className="faq-item" data-category="troubleshooting">
                <summary>My processed file looks different than expected</summary>
                <p>
                  Check the extension popup for the applied transformation. You can adjust quality,
                  format, or dimensions in manual mode. Some platforms re-compress files after upload,
                  which may cause additional quality loss.
                </p>
              </details>

              <details className="faq-item" data-category="troubleshooting">
                <summary>The extension stopped working after a browser update</summary>
                <p>
                  Try disabling and re-enabling the extension. If issues persist, uninstall and
                  reinstall from the Chrome Web Store. Your settings are synced to your Google account.
                </p>
              </details>

              <details className="faq-item" data-category="troubleshooting">
                <summary>FileThrough conflicts with another extension</summary>
                <p>
                  Some ad blockers or privacy extensions may interfere. Try disabling other extensions
                  temporarily to identify conflicts. Report persistent issues on
                  <a href="https://github.com/filethrough/filethrough/issues" target="_blank" rel="noopener noreferrer">GitHub</a>.
                </p>
              </details>

              {/* Billing & Account */}
              <details className="faq-item" data-category="billing">
                <summary>Is FileThrough really free?</summary>
                <p>
                  Yes! FileThrough is completely free with no limits, no watermarks, no premium tiers,
                  and no hidden costs. We may offer optional paid features in the future, but core
                  functionality will always remain free.
                </p>
              </details>

              <details className="faq-item" data-category="billing">
                <summary>Will you sell my data or show ads?</summary>
                <p>
                  Never. No ads, no data selling, no tracking. FileThrough is funded by optional
                  donations and sponsorships. See our <a href="/about">About page</a> for more.
                </p>
              </details>

              <details className="faq-item" data-category="billing">
                <summary>Can I use FileThrough commercially?</summary>
                <p>
                  Yes! FileThrough is free for both personal and commercial use. The MIT license
                  permits unrestricted use, modification, and distribution.
                </p>
              </details>

              <details className="faq-item" data-category="billing">
                <summary>How can I support FileThrough?</summary>
                <p>
                  Star us on <a href="https://github.com/filethrough/filethrough" target="_blank" rel="noopener noreferrer">GitHub</a>,
                  leave a review on the Chrome Web Store, share with colleagues, or contribute code/
                  translations. Financial support via GitHub Sponsors is also appreciated.
                </p>
              </details>
            </div>
          </div>

          <div className="faq-cta">
            <h2>Still have questions?</h2>
            <p>Can't find what you're looking for? We're here to help.</p>
            <div className="faq-cta-actions">
              <a href="/contact" className="btn btn-primary">Contact Support</a>
              <a href="https://github.com/filethrough/filethrough/issues" className="btn btn-secondary" target="_blank" rel="noopener noreferrer">
                Search GitHub Issues
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default FAQ;