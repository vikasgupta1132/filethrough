function NotFound() {
  return (
    <>
      <div className="error-page">
        <div className="container">
          <div className="error-content">
            <span className="error-code">404</span>
            <h1>Page Not Found</h1>
            <p>
              Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved
              or doesn&apos;t exist.
            </p>
            <div className="error-actions">
              <a href="/" className="btn btn-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to Home
              </a>
              <a href="/contact" className="btn btn-secondary">Contact Support</a>
            </div>
            <div className="error-links">
              <p>Or explore these pages:</p>
              <nav>
                <a href="/about">About Us</a>
                <a href="/contact">Contact</a>
                <a href="/privacy">Privacy Policy</a>
                <a href="/terms">Terms of Service</a>
              </nav>
            </div>
          </div>
          <div className="error-illustration">
            <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="90" stroke="#e2e8f0" strokeWidth="4" />
              <circle cx="100" cy="100" r="60" stroke="#2563eb" strokeWidth="4" strokeDasharray="188.5 377" />
              <path d="M70 100L95 125L130 70" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}

export default NotFound;