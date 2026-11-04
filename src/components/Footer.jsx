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
          </div>

          <div>
            <h4>Explore</h4>
            <a href="/#experience" onClick={handleExperienceClick}>
              Experience &amp; features
            </a>
            <Link to="/pricing">Pricing</Link>
            <a href={EVENTS_URL}>Discover events</a>
            <Link to="/contact-sales">Contact sales</Link>
          </div>

          <div>
            <h4>Solutions</h4>
            {proposalSolutions.map(([routeKey, label]) => (
              <Link key={routeKey} to={routePaths[routeKey]}>
                {label}
              </Link>
            ))}
          </div>

          <div>
            <h4>Trust &amp; support</h4>
            <Link to="/support">Customer Support</Link>
            <Link to="/trust">Trust &amp; controls</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
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
