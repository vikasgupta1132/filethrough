function App() {
  return (
    <>
      <header className="hero">
        <nav className="nav container">
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#2563eb" />
              <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>FileThrough</span>
          </div>
          <a href="https://chromewebstore.google.com/detail/filethrough" className="btn btn-primary" target="_blank" rel="noopener noreferrer">
            Install from Chrome Web Store
          </a>
        </nav>
        <div className="hero-content container">
          <div className="hero-text">
            <h1>Smart File Upload Preparation</h1>
            <p>Automatically compress images, convert formats, and resize files to meet any platform's upload requirements. Save time and avoid upload errors.</p>
            <div className="hero-buttons">
              <a href="https://chromewebstore.google.com/detail/filethrough" className="btn btn-primary btn-lg" target="_blank" rel="noopener noreferrer">
                Add to Chrome — Free
              </a>
              <a href="#features" className="btn btn-secondary btn-lg">Learn More</a>
            </div>
            <p className="hero-stats">
              <span>10,000+ users</span>
              <span>★ 4.8/5 rating</span>
              <span>Open source</span>
            </p>
          </div>
          <div className="hero-visual">
            <div className="mockup">
              <div className="mockup-header">
                <div className="mockup-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
              <div className="mockup-content">
                <div className="upload-zone">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p>Drag & drop files here</p>
                  <span>or click to browse</span>
                </div>
                <div className="processing">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '75%' }}></div>
                  </div>
                  <p className="processing-text">Optimizing: image.png → 842 KB (was 2.3 MB)</p>
                </div>
                <div className="result">
                  <span className="badge success">✓ Ready for upload</span>
                  <div className="result-details">
                    <span>JPEG • 1920×1080 • 842 KB</span>
                    <span>Meets: GitHub, LinkedIn, Twitter</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="features" className="features">
        <div className="container">
          <header className="section-header">
            <h2>How It Works</h2>
            <p>FileThrough detects file uploads and automatically prepares them</p>
          </header>
          <div className="features-grid">
            <article className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M4 8h16" />
                  <path d="M8 17h8" />
                  <path d="M12 17v4" />
                </svg>
              </div>
              <h3>Smart Detection</h3>
              <p>Automatically detects file input fields on any website and analyzes upload constraints</p>
            </article>
            <article className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <h3>Auto Optimization</h3>
              <p>Compresses images, converts formats (JPEG, PNG, WebP, AVIF), and resizes to fit requirements</p>
            </article>
            <article className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </div>
              <h3>Format Conversion</h3>
              <p>Converts between image formats and PDFs to match platform specifications</p>
            </article>
            <article className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3>Privacy First</h3>
              <p>All processing happens locally in your browser. No files are uploaded to any server</p>
            </article>
            <article className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <h3>Custom Rules</h3>
              <p>Create custom transformation rules for specific sites or file types</p>
            </article>
            <article className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3>Works Everywhere</h3>
              <p>Compatible with GitHub, LinkedIn, Twitter, Facebook, and any site with file uploads</p>
            </article>
          </div>
        </div>
      </section>

      <section className="platforms">
        <div className="container">
          <header className="section-header">
            <h2>Supported Platforms</h2>
            <p>FileThrough knows the requirements for popular platforms</p>
          </header>
          <div className="platforms-grid">
            {['GitHub', 'LinkedIn', 'Twitter', 'Facebook', 'Instagram', 'Slack', 'Discord', 'Notion', 'Custom'].map((platform) => (
              <div key={platform} className="platform-badge">{platform}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <h2>Ready to Simplify File Uploads?</h2>
          <p>Join thousands of users who never worry about file size limits again</p>
          <a href="https://chromewebstore.google.com/detail/filethrough" className="btn btn-primary btn-lg" target="_blank" rel="noopener noreferrer">
            Install FileThrough Free
          </a>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="logo">
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="32" height="32" rx="8" fill="#2563eb" />
                  <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>FileThrough</span>
              </div>
              <p>Smart file upload preparation for everyone</p>
            </div>
            <nav className="footer-links">
              <div>
                <h4>Product</h4>
                <ul>
                  <li><a href="#features">Features</a></li>
                  <li><a href="#">Pricing</a></li>
                  <li><a href="#">Changelog</a></li>
                  <li><a href="#">Roadmap</a></li>
                </ul>
              </div>
              <div>
                <h4>Resources</h4>
                <ul>
                  <li><a href="#">Documentation</a></li>
                  <li><a href="#">FAQ</a></li>
                  <li><a href="#">Blog</a></li>
                  <li><a href="#">Community</a></li>
                </ul>
              </div>
              <div>
                <h4>Legal</h4>
                <ul>
                  <li><a href="/privacy">Privacy Policy</a></li>
                  <li><a href="/terms">Terms of Service</a></li>
                </ul>
              </div>
            </nav>
          </div>
          <div className="footer-bottom">
            <p>© 2024 FileThrough. Built with privacy in mind.</p>
            <div className="footer-social">
              <a href="#" aria-label="GitHub"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg></a>
              <a href="#" aria-label="Twitter"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 9.24-3.308.83-7.546-8.26L2.16 22.64h3.255l7.025-7.75-7.55 7.75H.351l8.277-9.13L.361 2.25h3.34l7.247 8.25-8.014 8.65h3.354l7.455-8.11-7.2-8.34z"/></svg></a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;