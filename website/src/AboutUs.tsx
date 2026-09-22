function AboutUs() {
  return (
    <>
      <header className="page-hero">
        <div className="container">
          <h1>About FileThrough</h1>
          <p className="page-description">
            Making file uploads effortless for everyone, everywhere.
          </p>
        </div>
      </header>

      <section className="about-section">
        <div className="container">
          <div className="about-grid">
            <div className="about-content">
              <h2>Our Mission</h2>
              <p>
                FileThrough was born from a simple frustration: uploading files to different platforms
                shouldn't require a degree in file formats and compression settings.
              </p>
              <p>
                Whether you're a developer pushing to GitHub, a designer sharing mockups on Figma,
                a marketer uploading assets to LinkedIn, or just someone trying to attach a photo
                to an email — you've probably hit file size limits, format restrictions, or dimension
                requirements that force you to open a separate tool, resize, convert, compress,
                and try again.
              </p>
              <p>
                We built FileThrough to eliminate that friction entirely. It runs locally in your
                browser, detects upload constraints automatically, and prepares your files to meet
                them — all before you hit "Submit."
              </p>

              <h2>Privacy First, Always</h2>
              <p>
                Your files never leave your device. FileThrough processes everything locally using
                WebAssembly and modern browser APIs. No uploads, no cloud processing, no data
                collection. What you upload stays yours.
              </p>

              <h2>Open Source</h2>
              <p>
                We believe in transparency. FileThrough is open source under the MIT license.
                You can audit the code, contribute improvements, or self-host if you prefer.
              </p>
              <p>
                <a href="https://github.com/filethrough/filethrough" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  View on GitHub
                </a>
              </p>
            </div>
            <div className="about-stats">
              <div className="stat-card">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Active Users</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">4.8★</span>
                <span className="stat-label">Chrome Store Rating</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">50+</span>
                <span className="stat-label">Platforms Supported</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">0</span>
                <span className="stat-label">Servers Touching Your Files</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="values-section">
        <div className="container">
          <header className="section-header">
            <h2>Our Values</h2>
          </header>
          <div className="values-grid">
            <article className="value-card">
              <div className="value-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3>Privacy by Design</h3>
              <p>Local-first architecture means your data never leaves your browser.</p>
            </article>
            <article className="value-card">
              <div className="value-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <h3>Zero Configuration</h3>
              <p>Works automatically — no settings to tweak, no rules to write.</p>
            </article>
            <article className="value-card">
              <div className="value-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <h3>Performance</h3>
              <p>WebAssembly-powered processing completes in milliseconds.</p>
            </article>
            <article className="value-card">
              <div className="value-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>Community Driven</h3>
              <p>Open source development shaped by real user feedback.</p>
            </article>
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
    </>
  );
}

export default AboutUs;