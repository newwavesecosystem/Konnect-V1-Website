import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import konn3ctLogo from '../assets/konn3ct-logo.png'
import { EVENTS_URL, proposalSolutions, routePaths } from '../data/metadata'

export default function Footer() {
  const location = useLocation()
  const navigate = useNavigate()

  const handleExperienceClick = (e) => {
    e.preventDefault()
    if (location.pathname !== '/') {
      navigate('/', { state: { anchor: 'experience' } })
      return
    }
    requestAnimationFrame(() =>
      document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    )
  }

  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Link to="/" aria-label="Go to Konn3ct home">
              <img src={konn3ctLogo} alt="Konn3ct" width="142" height="39" />
            </Link>
            <p>Connection Freedom for people, teams, organisations and communities.</p>
            <p>
              Connection. Intelligence. Trust.
              <br />
              Every Connection Must Count.
            </p>
            <div className="footer-store-wrap">
              <a
                href="https://play.google.com/store/apps/details?id=com.konn3ct&hl=en"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get Konn3ct on Google Play"
                className="footer-playstore-btn"
              >
                <svg
                  className="footer-playstore-icon"
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  aria-hidden="true"
                >
                  <path
                    fill="#00d2ff"
                    d="M3.6 2.2c-.3.3-.5.8-.5 1.4v16.8c0 .6.2 1.1.5 1.4l.1.1L13.1 12v-.2L3.7 2.1l-.1.1z"
                  />
                  <path
                    fill="#ffbc00"
                    d="M16.2 15.2l-3.1-3.1v-.2l3.1-3.1.1.1 3.7 2.1c1.1.6 1.1 1.6 0 2.2l-3.7 2.1-.1-.1z"
                  />
                  <path
                    fill="#ff3a44"
                    d="M16.3 15.1L13.1 12 3.6 21.5c.4.4.9.4 1.6 0l11.1-6.4z"
                  />
                  <path
                    fill="#00f076"
                    d="M16.3 8.9L5.2 2.5c-.7-.4-1.2-.4-1.6 0L13.1 12l3.2-3.1z"
                  />
                </svg>
                <span className="footer-playstore-text">
                  <small>GET IT ON</small>
                  <strong>Google Play</strong>
                </span>
              </a>
            </div>
          </div>

          <div>
            <h3>Explore</h3>
            <a href="/#experience" onClick={handleExperienceClick}>
              Experience &amp; features
            </a>
            <Link to="/pricing">Pricing</Link>
            <a href={EVENTS_URL}>Discover events</a>
            <Link to="/contact-sales">Contact sales</Link>
          </div>

          <div>
            <h3>Solutions</h3>
            {proposalSolutions.map(([routeKey, label]) => (
              <Link key={routeKey} to={routePaths[routeKey]}>
                {label}
              </Link>
            ))}
          </div>

          <div>
            <h3>Trust &amp; support</h3>
            <Link to="/support">Customer Support</Link>
            <Link to="/trust">Trust &amp; controls</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <div className="footer-socials" aria-label="Konn3ct social media links">
              <a
                href="https://www.facebook.com/konn3ctapp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Konn3ct on Facebook"
                className="footer-social-link"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.3v3.2h2.8V22h3.4z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/konn3ct_app/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Konn3ct on Instagram"
                className="footer-social-link"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
                  <circle cx="12" cy="12" r="4.2" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                href="https://x.com/konn3ctapp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Konn3ct on X (Twitter)"
                className="footer-social-link"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/konn3ct-app/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Konn3ct on LinkedIn"
                className="footer-social-link"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d="M6.94 8.5H3.56V20h3.38V8.5zM5.25 3.5a1.96 1.96 0 100 3.92 1.96 1.96 0 000-3.92zM20.44 13.4c0-3.47-1.85-5.08-4.32-5.08-1.99 0-2.88 1.1-3.38 1.87V8.5H9.36c.04 1.08 0 11.5 0 11.5h3.38v-6.42c0-.34.02-.68.13-.93.27-.68.89-1.39 1.93-1.39 1.36 0 1.9 1.04 1.9 2.56V20h3.38v-6.6h.36z" />
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@konn3ctapp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Konn3ct on TikTok"
                className="footer-social-link"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/@Konn3ctapp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Konn3ct on YouTube"
                className="footer-social-link"
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
                  <path d="M21.58 7.19a2.75 2.75 0 00-1.94-1.94C17.92 4.8 12 4.8 12 4.8s-5.92 0-7.64.45a2.75 2.75 0 00-1.94 1.94C2 8.91 2 12 2 12s0 3.09.42 4.81a2.75 2.75 0 001.94 1.94c1.72.45 7.64.45 7.64.45s5.92 0 7.64-.45a2.75 2.75 0 001.94-1.94C22 15.09 22 12 22 12s0-3.09-.42-4.81zM10 15.15V8.85L15.5 12 10 15.15z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="copyright">
          <span>© 2026 Konn3ct · Newwaves Ecosystem Limited</span>
          <span>CONNECTION FREEDOM BY DESIGN</span>
        </div>
      </div>
    </footer>
  )
}
