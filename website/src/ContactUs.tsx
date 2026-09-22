import { useState } from 'react';

function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'submitting' || status === 'success') return;
    setStatus('submitting');

    try {
      const response = await fetch('https://api.formspree.io/f/your-form-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      <header className="page-hero">
        <div className="container">
          <h1>Contact Us</h1>
          <p className="page-description">
            Have questions, feedback, or need help? We'd love to hear from you.
          </p>
        </div>
      </header>

      <section className="contact-section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <h2>Get in Touch</h2>
              <p>
                Whether you're reporting a bug, requesting a feature, or just want to say hello —
                we read every message.
              </p>

              <div className="contact-methods">
                <div className="contact-method">
                  <div className="method-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div>
                    <h3>Email</h3>
                    <a href="mailto:hello@filethrough.com">hello@filethrough.com</a>
                    <p className="method-note">Best for support & partnerships</p>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="method-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <div>
                    <h3>GitHub Issues</h3>
                    <a href="https://github.com/filethrough/filethrough/issues" target="_blank" rel="noopener noreferrer">
                      Report bugs & request features
                    </a>
                    <p className="method-note">Public tracking & discussion</p>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="method-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <h3>Security</h3>
                    <a href="mailto:security@filethrough.com">security@filethrough.com</a>
                    <p className="method-note">Responsible disclosure only</p>
                  </div>
                </div>
              </div>

              <div className="contact-links">
                <h3>Other Ways to Connect</h3>
                <div className="social-links">
                  <a href="https://github.com/filethrough" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                  </a>
                  <a href="https://twitter.com/filethrough" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 9.24-3.308.83-7.546-8.26L2.16 22.64h3.255l7.025-7.75-7.55 7.75H.351l8.277-9.13L.361 2.25h3.34l7.247 8.25-8.014 8.65h3.354l7.455-8.11-7.2-8.34z"/></svg>
                  </a>
                  <a href="mailto:hello@filethrough.com" aria-label="Email">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="contact-form-container">
              <h2>Send a Message</h2>
              {status === 'success' && (
                <div className="form-success">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <p>Thanks for reaching out! We'll get back to you within 24 hours.</p>
                </div>
              )}
              {status === 'error' && (
                <div className="form-error">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <p>Something went wrong. Please try emailing us directly at hello@filethrough.com</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Your name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Subject *</label>
                  <select id="subject" name="subject" value={formData.subject} onChange={handleChange} required>
                    <option value="">Select a topic</option>
                    <option value="support">Support / Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="partnership">Partnership / Business</option>
                    <option value="press">Press / Media</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Describe your issue, idea, or question..."
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-lg" disabled={status === 'submitting' || status === 'success'}>
                  {status === 'submitting' ? 'Sending...' : 'Send Message'}
                </button>
                <p className="form-note">By submitting, you agree to our <a href="/privacy">Privacy Policy</a>.</p>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="container">
          <header className="section-header">
            <h2>Quick Answers</h2>
            <p>Common questions answered instantly</p>
          </header>
          <div className="faq-grid">
            <details className="faq-item">
              <summary>Is FileThrough really free?</summary>
              <p>Yes! FileThrough is completely free with no limits, no watermarks, and no account required.</p>
            </details>
            <details className="faq-item">
              <summary>Does FileThrough upload my files anywhere?</summary>
              <p>No. All processing happens locally in your browser using WebAssembly. Your files never leave your device.</p>
            </details>
            <details className="faq-item">
              <summary>Which browsers are supported?</summary>
              <p>Chrome, Edge, Brave, and other Chromium-based browsers. Firefox support is on our roadmap.</p>
            </details>
            <details className="faq-item">
              <summary>Can I use FileThrough for my team/organization?</summary>
              <p>Absolutely. FileThrough works great for teams. For enterprise features like centralized settings, contact us.</p>
            </details>
            <details className="faq-item">
              <summary>How do I report a bug?</summary>
              <p>Open an issue on <a href="https://github.com/filethrough/filethrough/issues" target="_blank" rel="noopener noreferrer">GitHub</a> or email hello@filethrough.com with steps to reproduce.</p>
            </details>
            <details className="faq-item">
              <summary>Can I contribute to FileThrough?</summary>
              <p>Yes! We welcome contributions. Check out our <a href="https://github.com/filethrough/filethrough" target="_blank" rel="noopener noreferrer">GitHub repo</a> for the contributing guide.</p>
            </details>
          </div>
        </div>
      </section>
    </>
  );
}

export default ContactUs;