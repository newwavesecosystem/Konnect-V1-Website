import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import konn3ctLogo from '../assets/konn3ct-logo.png'
import { LOGIN_URL, REGISTER_URL, proposalSolutions, routePaths } from '../data/metadata'

function navToAnchor(navigate, location, anchor) {
  if (location.pathname !== '/') {
    navigate('/', { state: { anchor } })
    return
  }
  requestAnimationFrame(() =>
    document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  )
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const handleAnchorClick = (e, anchor) => {
    e.preventDefault()
    setMobileOpen(false)
    navToAnchor(navigate, location, anchor)
  }

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="nav">
        <div className="wrap nav-inner">
          <Link className="logo" to="/" aria-label="Konn3ct home">
            <img src={konn3ctLogo} alt="Konn3ct" width="142" height="39" />
          </Link>

          <nav className="nav-links" aria-label="Main navigation">
            <a href="/#experience" onClick={(e) => handleAnchorClick(e, 'experience')}>
              Experience
            </a>
            <a href="/#solutions" onClick={(e) => handleAnchorClick(e, 'solutions')}>
              Solutions
            </a>
            <a href="/#plans" onClick={(e) => handleAnchorClick(e, 'plans')}>
              Plans
            </a>
            <a href="/#trust" onClick={(e) => handleAnchorClick(e, 'trust')}>
              Trust
            </a>
          </nav>

          <div className="nav-actions">
            <a className="login" href={LOGIN_URL}>
              Log in
            </a>
            <a className="button small" href={REGISTER_URL}>
              Start 7-day trial <span aria-hidden="true">↗</span>
            </a>
            <button
              type="button"
              className="menu-toggle"
              aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? '×' : '☰'}
            </button>
          </div>
        </div>

        <nav
          className={`mobile-nav ${mobileOpen ? 'open' : ''}`}
          aria-label="Mobile navigation"
        >
          {proposalSolutions.map(([routeKey, label]) => (
            <Link key={routeKey} to={routePaths[routeKey]} onClick={() => setMobileOpen(false)}>
              {label}
            </Link>
          ))}
          <Link to="/contact-sales" onClick={() => setMobileOpen(false)}>
            Contact sales
          </Link>
          <a href={LOGIN_URL}>Log in</a>
          <a href={REGISTER_URL}>Start 7-day trial</a>
        </nav>
      </header>
    </>
  )
}
