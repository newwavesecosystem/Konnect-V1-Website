import React, { useEffect, useRef, useState } from 'react'
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
  const dropRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  const closeDropdown = () => {
    if (dropRef.current) {
      dropRef.current.removeAttribute('open')
    }
  }

  useEffect(() => {
    setMobileOpen(false)
    closeDropdown()
  }, [location.pathname])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false)
        closeDropdown()
      }
    }
    const handleClickOutside = (e) => {
      if (dropRef.current && dropRef.current.hasAttribute('open') && !dropRef.current.contains(e.target)) {
        closeDropdown()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  const handleAnchorClick = (e, anchor) => {
    e.preventDefault()
    setMobileOpen(false)
    closeDropdown()
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
            <details className="nav-drop" ref={dropRef}>
              <summary>
                Solutions
                <svg
                  className="nav-drop-chevron"
                  viewBox="0 0 12 12"
                  width="12"
                  height="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2.5 4.5L6 8l3.5-3.5" />
                </svg>
              </summary>
              <div className="drop-panel">
                {proposalSolutions.map(([key, title, desc]) => (
                  <Link
                    key={key}
                    to={routePaths[key] || `/${key}`}
                    onClick={closeDropdown}
                  >
                    <strong>{title}</strong>
                    <small>{desc}</small>
                  </Link>
                ))}
              </div>
            </details>
            <Link to="/pricing">
              Pricing
            </Link>
            <Link to="/trust">
              Trust
            </Link>
            <Link to="/events">
              Events
            </Link>
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
          <a href="/#experience" onClick={(e) => handleAnchorClick(e, 'experience')}>
            Experience
          </a>
          <Link to="/pricing" onClick={() => setMobileOpen(false)}>
            Pricing
          </Link>
          <Link to="/trust" onClick={() => setMobileOpen(false)}>
            Trust
          </Link>
          <Link to="/events" onClick={() => setMobileOpen(false)}>
            Events
          </Link>
          <div className="menu-label">Solutions for your people</div>
          {proposalSolutions.map(([key, title]) => (
            <Link
              key={key}
              to={routePaths[key] || `/${key}`}
              onClick={() => setMobileOpen(false)}
            >
              {title} <span aria-hidden="true">↗</span>
            </Link>
          ))}
          <Link to="/contact-sales" onClick={() => setMobileOpen(false)}>
            Contact sales
          </Link>
          <a href={LOGIN_URL}>Log in</a>
        </nav>
      </header>
    </>
  )
}
