'use client';

import { useState, useEffect } from 'react';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsHidden(localStorage.getItem('dwc_subscribed') === 'true');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setStatus('error');
      setErrorMessage('Please enter a valid email');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website_url: '' }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setEmail('');
        localStorage.setItem('dwc_subscribed', 'true');
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
        setErrorMessage(data.error || data.message || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please try again.');
    }
  };

  if (isHidden) return null;

  return (
    <section className="skills-newsletter">
      <div className="skills-newsletter-inner">
        {status === 'success' ? (
          <div className="skills-newsletter-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
            <span>You&apos;re in! Check your inbox for a welcome email.</span>
          </div>
        ) : (
          <>
            <div className="skills-newsletter-text">
              <h3>Stay in the loop</h3>
              <p>
                Get notified when we add new design skills.
                You&apos;ll also receive a daily AI UX newsletter
                from <a href="https://aiuxdesign.guide" target="_blank" rel="noopener noreferrer">aiuxdesign.guide</a>. Patterns, news, and product teardowns.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="skills-newsletter-form">
              {/* Honeypot */}
              <input
                type="text"
                name="website_url"
                value=""
                onChange={() => {}}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }}
              />
              <div className="skills-newsletter-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={status === 'loading'}
                  className="skills-newsletter-input"
                  required
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="skills-newsletter-btn"
                >
                  {status === 'loading' ? (
                    <span className="skills-newsletter-loading">
                      <svg className="skills-newsletter-spinner" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                        <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Subscribing...
                    </span>
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </div>
              {status === 'error' && errorMessage && (
                <p className="skills-newsletter-error">{errorMessage}</p>
              )}
              <p className="skills-newsletter-disclaimer">
                Daily AI UX news. Unsubscribe anytime.
              </p>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
