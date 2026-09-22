function ServerError() {
  return (
    <>
      <div className="error-page">
        <div className="container">
          <div className="error-content">
            <span className="error-code">500</span>
            <h1>Server Error</h1>
            <p>
              Something went wrong on our end. Our team has been notified and we&apos;re working
              to fix it.
            </p>
            <div className="error-actions">
              <button onClick={() => window.location.reload()} className="btn btn-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6" />
                  <path d="M1 20v-6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
                  <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
                </svg>
                Refresh Page
              </button>
              <a href="/contact" className="btn btn-secondary">Report Issue</a>
            </div>
            <div className="error-links">
              <p>While we fix this, you can:</p>
              <nav>
                <a href="/">Home</a>
                <a href="/about">About Us</a>
                <a href="https://github.com/filethrough/filethrough/issues" target="_blank" rel="noopener noreferrer">Check GitHub Status</a>
              </nav>
            </div>
          </div>
          <div className="error-illustration">
            <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="90" stroke="#e2e8f0" strokeWidth="4" />
              <circle cx="100" cy="100" r="60" stroke="#dc2626" strokeWidth="4" strokeDasharray="188.5 377" />
              <path d="M100 60V100M100 100V140" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />
              <circle cx="100" cy="100" r="4" fill="#dc2626" />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}

export default ServerError;