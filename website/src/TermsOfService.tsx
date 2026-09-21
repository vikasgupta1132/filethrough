function TermsOfService() {
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
          <h1>Terms of Service</h1>
          <p className="last-updated">Last updated: January 2024</p>
        </div>
      </header>

      <main className="container" style={{ maxWidth: '800px', padding: '60px 24px' }}>
        <section>
          <h2>Acceptance of Terms</h2>
          <p>By installing and using FileThrough ("the Extension"), you agree to these Terms of Service. If you do not agree, please do not use the Extension.</p>
        </section>

        <section>
          <h2>Description of Service</h2>
          <p>FileThrough is a browser extension that automatically optimizes files (images, PDFs) for upload requirements by compressing, converting formats, and resizing them locally in your browser.</p>
        </section>

        <section>
          <h2>License</h2>
          <p>FileThrough is provided under the MIT License. You are free to use, modify, and distribute the software subject to the license terms.</p>
          <p>The Extension is provided "as is" without warranty of any kind, express or implied.</p>
        </section>

        <section>
          <h2>User Responsibilities</h2>
          <p>You agree to:</p>
          <ul>
            <li>Use the Extension only for lawful purposes</li>
            <li>Not attempt to reverse engineer, decompile, or disassemble the Extension (except as permitted by open source license)</li>
            <li>Not use the Extension to violate any website's terms of service</li>
            <li>Understand that file processing results may vary and are not guaranteed</li>
          </ul>
        </section>

        <section>
          <h2>Privacy</h2>
          <p>Your privacy is important to us. Please review our <a href="/privacy">Privacy Policy</a> to understand how we handle information.</p>
        </section>

        <section>
          <h2>Disclaimer of Warranties</h2>
          <p>THE EXTENSION IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</p>
          <p>We do not warrant that the Extension will be uninterrupted, error-free, or free of harmful components.</p>
        </section>

        <section>
          <h2>Limitation of Liability</h2>
          <p>IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE EXTENSION OR THE USE OR OTHER DEALINGS IN THE EXTENSION.</p>
        </section>

        <section>
          <h2>Modifications</h2>
          <p>We may modify or discontinue the Extension at any time without notice. We shall not be liable for any modification, suspension, or discontinuance.</p>
        </section>

        <section>
          <h2>Governing Law</h2>
          <p>These Terms shall be governed by the laws of the jurisdiction where the developer resides, without regard to conflict of law principles.</p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>Questions about these Terms? Contact us at:</p>
          <ul>
            <li>Email: legal@filethrough.io</li>
            <li>GitHub: <a href="https://github.com/yourusername/filethrough" target="_blank" rel="noopener noreferrer">github.com/yourusername/filethrough</a></li>
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

export default TermsOfService;