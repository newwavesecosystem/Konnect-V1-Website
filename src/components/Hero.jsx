import React from 'react'
import { Link } from 'react-router-dom'
import MediaPlaceholder from './MediaPlaceholder'
import { REGISTER_URL, sectorProposals, solutionMeta } from '../data/metadata'

export default function Hero({ route = 'home', hero, onPrimary, onSecondary, onAction }) {
  const sector = sectorProposals[route]
  const meta = solutionMeta[route] || solutionMeta.home

  if (route === 'home') {
    return (
      <section className="hero" id="home">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow">{hero?.eyebrow || 'Connection Freedom by Design'}</div>
            <h1>
              Connect on
              <br />
              <em>your terms.</em>
            </h1>
            <p>
              Bring your people together for meetings, learning and collaboration with Konn3ct.
            </p>
            <div className="hero-actions">
              <a className="button" href={REGISTER_URL}>
                Start your 7-day free trial <span aria-hidden="true">↗</span>
              </a>
              <button
                type="button"
                className="button outline"
                onClick={() => (onAction ? onAction('purchase') : onSecondary?.())}
              >
                Buy a plan <span aria-hidden="true">↗</span>
              </button>
            </div>
            <div className="reassurance">
              <span>No credit card required</span>
              <span>Buy immediately if you prefer</span>
            </div>
            <Link className="text-link" to="/contact-sales">
              Buying for an organisation? Book a demo.
            </Link>
          </div>
          <MediaPlaceholder variant="home" />
        </div>
      </section>
    )
  }

  const eyebrow = sector?.eyebrow || hero?.eyebrow || meta.eyebrow
  const titleHtml = sector?.titleHtml || hero?.title || meta.label
  const intro = sector?.intro || hero?.description || meta.description
  const ctaLabel = sector?.cta || hero?.actions?.[0] || 'Request a demo'
  const altLabel = sector?.alt || hero?.actions?.[1] || 'Explore capabilities'
  const isBusiness = route === 'corporates'
  const isEducationTrial = route === 'education' && sector?.action === 'trial'
  const altAnchor = sector?.anchor || 'request'

  const handleAltClick = (e) => {
    if (isEducationTrial) {
      return
    }
    e.preventDefault()
    if (onSecondary) {
      onSecondary()
      return
    }
    document.getElementById(altAnchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handlePrimaryClick = (e) => {
    if (isBusiness) {
      return
    }
    e.preventDefault()
    if (onPrimary) {
      onPrimary(ctaLabel)
      return
    }
    document.getElementById('request')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="hero" id="home">
      <div className="wrap hero-grid">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1 dangerouslySetInnerHTML={{ __html: titleHtml }} />
          <p>{intro}</p>
          <div className="hero-actions">
            {isBusiness ? (
              <a className="button" href={REGISTER_URL}>
                {ctaLabel} <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <a className="button" href="#request" onClick={handlePrimaryClick}>
                {ctaLabel} <span aria-hidden="true">↗</span>
              </a>
            )}

            {isEducationTrial ? (
              <a className="button outline" href={REGISTER_URL}>
                {altLabel} <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <a
                className="button outline"
                href={`#${altAnchor}`}
                onClick={handleAltClick}
              >
                {altLabel} <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
          <div className="reassurance">
            <span>People-first connection</span>
            <span>Clear host controls</span>
          </div>
          {isBusiness && (
            <button
              type="button"
              className="text-link"
              onClick={() => onAction?.('purchase')}
            >
              Ready to begin? Buy a plan
            </button>
          )}
        </div>
        <MediaPlaceholder variant={sector?.visual || route} />
      </div>
    </section>
  )
}
