function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <header className="hero">
        <nav className="nav container">
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#2563eb" />
              <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>FileThrough</span>
          </div>
          <a href="/" className="btn btn-secondary">Back to Home</a>
        </nav>
        <div className="hero-content container" style={{ textAlign: 'left', maxWidth: '800px', marginTop: '40px' }}>
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last updated: January 2024</p>
        </div>
      </header>

      <main className="container" style={{ maxWidth: '800px', padding: '60px 24px' }}>
        <section>
          <h2>Overview</h2>
          <p>FileThrough ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how our browser extension handles information when you use our service.</p>
          <p><strong>Key point: FileThrough processes all files locally in your browser. No files, images, or documents are ever uploaded to our servers or any third-party servers.</strong></p>
        </section>

        <section>
          <h2>Data We Collect</h2>
          <h3>No Personal Data Collected</h3>
          <p>FileThrough does not collect, store, or transmit any personal identifiable information, including:</p>
          <ul>
            <li>Your name, email, or contact information</li>
            <li>Your browsing history or website activity</li>
            <li>Files you process (images, PDFs, documents)</li>
            <li>Your IP address or location data</li>
          </ul>

          <h3>Local Storage Only</h3>
          <p>The extension stores your preferences locally in your browser using the <code>chrome.storage.sync</code> API:</p>
          <ul>
            <li>Enable/disable automatic processing</li>
            <li>Maximum file size limit</li>
            <li>Custom transformation rules</li>
            <li>Auto-process toggle</li>
          </ul>
          <p>This data never leaves your browser and is only used to configure the extension's behavior.</p>
        </section>

        <section>
          <h2>How FileThrough Works</h2>
          <ol>
            <li><strong>Detection:</strong> The extension detects file input elements on web pages you visit.</li>
            <li><strong>Analysis:</strong> When you select a file, it reads the file locally using the File API.</li>
            <li><strong>Processing:</strong> All transformations (compression, format conversion, resizing) happen entirely in your browser using WebAssembly and Canvas APIs.</li>
            <li><strong>Replacement:</strong> The processed file replaces the original in the file input, ready for upload.</li>
          </ol>
          <p>At no point does any file data leave your device.</p>
        </section>

        <section>
          <h2>Permissions</h2>
          <p>FileThrough requests the following permissions:</p>
          <ul>
            <li><strong>storage:</strong> To save your preferences locally</li>
            <li><strong>activeTab:</strong> To access the current tab when you interact with the extension</li>
            <li><strong>scripting:</strong> To inject content scripts for file detection</li>
            <li><strong>host_permissions ({'<all_urls>'}):</strong> To detect file inputs on any website you visit</li>
          </ul>
          <p>These permissions are used solely for the extension's core functionality.</p>
        </section>

        <section>
          <h2>Third-Party Services</h2>
          <p>FileThrough does not use any third-party analytics, tracking, or advertising services. The extension makes no network requests except for:</p>
          <ul>
            <li>Checking for extension updates (handled by Chrome)</li>
            <li>Loading the options page (local extension resource)</li>
          </ul>
        </section>

        <section>
          <h2>Open Source</h2>
          <p>FileThrough is open source. You can review the complete source code at <a href="https://github.com/yourusername/filethrough" target="_blank" rel="noopener noreferrer">our GitHub repository</a>.</p>
        </section>

        <section>
          <h2>Children's Privacy</h2>
          <p>FileThrough does not knowingly collect information from children under 13. Since we collect no personal information at all, this is inherently satisfied.</p>
        </section>

        <section>
          <h2>Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last updated" date.</p>
        </section>

        <section>
          <h2>Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us:</p>
          <ul>
            <li>Email: privacy@filethrough.io</li>
            <li>GitHub Issues: <a href="https://github.com/yourusername/filethrough/issues" target="_blank" rel="noopener noreferrer">github.com/yourusername/filethrough/issues</a></li>
          </ul>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <p>© 2024 FileThrough. Built with privacy in mind.</p>
        </div>
      </footer>
    </div>
  );
}

export default PrivacyPolicy;