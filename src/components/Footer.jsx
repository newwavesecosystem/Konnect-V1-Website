import React from 'react'
import { Link } from 'react-router-dom'
import konn3ctLogo from '../assets/konn3ct-logo.png'
import { proposalSolutions, routePaths } from '../data/metadata'

const policies = ['Privacy', 'Terms', 'Recording & sharing', 'Help & joining guidance']

export default function Footer({ onAction }) {
  const handlePolicyClick = (e, item) => {
    e.preventDefault()
    if (onAction) {
      onAction(`policy:${item}`)
    }
  }

  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Link to="/" aria-label="Go to Konn3ct home">
              <img src={konn3ctLogo} alt="Konn3ct" />
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
            {proposalSolutions.slice(0, 3).map(([routeKey, label]) => (
              <Link key={routeKey} to={routePaths[routeKey]}>
                {label}
              </Link>
            ))}
          </div>

          <div>
            <h4>Connect your way</h4>
            {proposalSolutions.slice(3).map(([routeKey, label]) => (
              <Link key={routeKey} to={routePaths[routeKey]}>
                {label}
              </Link>
            ))}
            <Link to="/contact-sales">Contact sales</Link>
          </div>

          <div>
            <h4>Trust &amp; support</h4>
            {policies.map((item) =>
              item === 'Privacy' ? (
                <a key={item} href="/Konn3ct-Privacy-Policy.pdf">
                  {item}
                </a>
              ) : (
                <a
                  key={item}
                  href={`#policy-${item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  onClick={(e) => handlePolicyClick(e, item)}
                >
                  {item}
                </a>
              )
            )}
          </div>
        </div>

        <div className="copyright">
          <span>© 2026 Konn3ct · Newwaves Ecosystem Limited</span>
          <span className="foot-note">CONNECTION FREEDOM BY DESIGN</span>
        </div>
      </div>
    </footer>
  )
}
