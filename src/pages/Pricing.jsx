import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Footer from '../components/Footer'
import { CurrencyToggleButton } from '../components/Sections'
import { REGISTER_URL } from '../data/metadata'
import { trackPageView } from '../analytics/events'

export const PLAN_DATA = [
  {
    n: 'Free',
    m: 0,
    y: 0,
    mUsd: 0,
    yUsd: 0,
    who: 'A simple introduction',
    people: '150',
    duration: '60 minutes',
    f: [
      'Recording: No',
      'Duration: 60 minutes',
      'Participants: 150',
      'Breakout Rooms: No',
      'Auto Attendance for Meetings: Yes',
      'Access Code: Yes',
    ],
    extra: 'Start hosting introductory sessions with core audio and video controls.',
  },
  {
    n: 'Starter',
    m: 2500,
    y: 27500,
    mUsd: 2,
    yUsd: 20,
    who: 'For individual hosts',
    people: '200',
    duration: '3 hours',
    f: [
      'Recording: Yes',
      'Duration: 180 minutes/Meeting',
      'Participants: 200',
      'Rooms: 1 customizable meeting room',
      'Event Ticketing: 1 event/Month',
      'AI summaries',
      'Breakout Rooms: Yes',
      'Auto Attendance for Meetings: Yes',
      'Access Code: Yes',
    ],
    extra: 'Built for personal meetings, extended sessions and individual hosts.',
  },
  {
    n: 'Professional',
    m: 10000,
    y: 100000,
    mUsd: 7,
    yUsd: 70,
    who: 'For regular collaboration',
    people: '500',
    duration: '24 hours',
    f: [
      'Recording: Yes',
      'Duration: 1440 minutes/Meeting',
      'Participants: 500',
      'Rooms: 5 customizable meeting rooms',
      'Streaming: 5 events/Month',
      'Event Ticketing: 3 events/Month',
      'AI summaries, paid replay',
      'Accept Donations',
      'Breakout Rooms: Yes',
      'Auto Attendance for Meetings: Yes',
      'Access Code: Yes',
    ],
    extra: 'Designed for regular collaboration, workshops and full-day rooms.',
  },
  {
    n: 'Business',
    m: 20000,
    y: 200000,
    mUsd: 14,
    yUsd: 135,
    who: 'For teams & growing organisations',
    people: '1,000',
    duration: '24 hours',
    f: [
      'Recording: Yes',
      'Duration: 1440 minutes/Meeting',
      'Participants: 1,000',
      'Rooms: 15 customizable meeting rooms',
      'Streaming: 15 events/Month',
      'Event Ticketing: 10 events/Month',
      'AI summaries, paid replay',
      'Accept Donations',
      '4 licensed hosts included (1 Professional & 3 Starter Accounts)',
      'Breakout Rooms: Yes',
      'Auto Attendance for Meetings: Yes',
      'Access Code: Yes',
      'TrustLock™ controls',
    ],
    extra: 'Shared rooms and multi-host capacity for teams and growing organisations.',
  },
  {
    n: 'Enterprise',
    m: null,
    y: null,
    mUsd: null,
    yUsd: null,
    who: 'For complex organisation needs',
    people: 'By agreement',
    duration: 'By agreement',
    f: [
      '1,000 interactive participants included',
      'EventPro large-event capacity available up to 10,000+',
      'Up to 24-hour meetings',
      '50 persistent/customisable meeting rooms included',
      '50 streaming events/month included',
      '50 ticketed events/month included',
      '20 host seats included',
      'Recording and replay',
      'AI summaries',
      'Paid replay',
      'Donations/commerce capabilities',
      'Advanced TrustLock™ controls',
      'Enterprise administration',
      'Audit and governance controls',
      'Dial-in capability',
      'Priority support / contracted SLA',
      'Private/cloud/on-premise deployment options',
      'White-label deployment available',
    ],
    extra: 'Capacity, security controls and deployment terms are agreed in writing.',
  },
]

function formatMoney(amount, isUsd) {
  if (isUsd) {
    return `$${amount.toLocaleString('en-US')}`
  }
  return `₦${amount.toLocaleString('en-NG')}`
}

export default function Pricing({
  currency: propCurrency,
  onCurrencyChange,
  onAction,
}) {
  const location = useLocation()
  const [localCurrency, setLocalCurrency] = useState('NGN')
  const [billing, setBilling] = useState('monthly')

  const currency = propCurrency || localCurrency
  const isUsd = currency === 'USD'

  const handleCurrencyToggle = (next) => {
    setLocalCurrency(next)
    onCurrencyChange?.(next)
  }

  useEffect(() => {
    document.title = 'Pricing · Konn3ct'
    window.scrollTo({ top: 0 })
    trackPageView({ route: 'pricing', page_path: '/pricing' })
  }, [location.pathname])

  const comparisonRows = [
    [
      'Monthly display',
      ...PLAN_DATA.map((p) =>
        p.m === null ? 'Custom' : formatMoney(isUsd ? p.mUsd : p.m, isUsd)
      ),
    ],
    [
      'Annual display',
      ...PLAN_DATA.map((p) =>
        p.y === null ? 'Contract' : formatMoney(isUsd ? p.yUsd : p.y, isUsd)
      ),
    ],
    ['Participants', '150', '200', '500', '1,000', '1,000 interactive + EventPro'],
    ['Meeting duration', '60 minutes', '3 hours', '24 hours', '24 hours', '24 hours'],
    ['Recording', 'Not included', 'Included', 'Included', 'Included', 'Included'],
    ['AI summaries', '—', 'Included', 'Included', 'Included', 'Included'],
    ['Rooms', '—', '1', '5', '15', '50 / custom'],
    ['Streaming / month', '—', '—', '5', '15', '50 / custom'],
    ['Event ticketing / month', '—', '1', '3', '10', '50 / custom'],
    ['Paid replay', '—', '—', 'Included', 'Included', 'Included'],
    ['Donations', '—', '—', 'Included', 'Included', 'Included / optional'],
    ['Host seats', '1', '1', '1', '4', '20 / custom'],
    ['Breakout rooms', '—', 'Included', 'Included', 'Included', 'Included'],
    ['Auto attendance', 'Included', 'Included', 'Included', 'Included', 'Included'],
    ['Access code', 'Included', 'Included', 'Included', 'Included', 'Included'],
    ['TrustLock™', '—', '—', 'Core', 'Organisation', 'Advanced'],
    ['White label', '—', '—', '—', '—', 'Available'],
    ['Dial-in', '—', '—', '—', '—', 'Available'],
    ['EventPro', 'Add-on', 'Add-on', 'Add-on', 'Add-on', 'Contract / add-on'],
  ]

  return (
    <>
      <main id="main">
        <section className="inner-head">
          <div className="wrap">
            <div className="eyebrow">A clear way to begin</div>
            <h1>
              Your people.
              <br />
              <em>Your plan.</em>
            </h1>
            <p>
              Compare options for individual conversations, growing teams and organisation-wide
              collaboration.
            </p>
          </div>
        </section>

        <section className="section pricing-section">
          <div className="wrap">
            <div className="pricing-toolbar">
              <div className="pricing-currency-display">
                <span>Display prices in {currency}</span>
                <CurrencyToggleButton currency={currency} onToggle={handleCurrencyToggle} />
              </div>
              <div className="billing" role="group" aria-label="Billing period">
                <button
                  type="button"
                  data-billing="monthly"
                  aria-pressed={billing === 'monthly'}
                  onClick={() => setBilling('monthly')}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  data-billing="annual"
                  aria-pressed={billing === 'annual'}
                  onClick={() => setBilling('annual')}
                >
                  Annual
                </button>
              </div>
            </div>

            <div className="pricing-grid" id="pricing-cards">
              {PLAN_DATA.map((p) => {
                const isRecommended = p.n === 'Professional'
                const isCustom = p.m === null
                const activeAmount =
                  billing === 'annual'
                    ? isUsd
                      ? p.yUsd
                      : p.y
                    : isUsd
                      ? p.mUsd
                      : p.m

                return (
                  <article
                    key={p.n}
                    className={`price-card ${isRecommended ? 'recommended' : ''}`}
                  >
                    {isRecommended && <span className="price-label">For regular hosts</span>}
                    <p className="tiny">{p.who}</p>
                    <h2>{p.n}</h2>
                    <div className="price-number">
                      {isCustom ? 'Let’s talk' : formatMoney(activeAmount, isUsd)}
                      <small>
                        {isCustom
                          ? 'Custom agreement'
                          : billing === 'annual'
                            ? '/ year'
                            : '/ month'}
                      </small>
                    </div>
                    <p>
                      {p.people} participants · {p.duration}
                    </p>
                    <ul className="check-list">
                      {p.f.map((feat) => (
                        <li key={feat}>{feat}</li>
                      ))}
                    </ul>
                    <p className="price-note">{p.extra}</p>
                    {isCustom ? (
                      <Link className="button outline" to="/contact-sales">
                        Discuss Enterprise <span aria-hidden="true">↗</span>
                      </Link>
                    ) : (
                      <a
                        className={`button ${isRecommended ? '' : 'outline'}`}
                        href={REGISTER_URL}
                      >
                        Get {p.n} <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </article>
                )
              })}
            </div>

            <section className="compare-section">
              <div className="eyebrow">Side by side</div>
              <h2>A clearer comparison.</h2>
              <p className="fine">Swipe the table horizontally on smaller screens.</p>
              <div
                className="table-scroll"
                tabIndex={0}
                role="region"
                aria-label="Scrollable plan comparison"
              >
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Plan detail</th>
                      {PLAN_DATA.map((p) => (
                        <th key={p.n} scope="col">
                          {p.n}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row[0]}>
                        <th scope="row">{row[0]}</th>
                        {row.slice(1).map((val, idx) => (
                          <td key={`${row[0]}-${PLAN_DATA[idx].n}`}>{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="enterprise-panel">
              <div>
                <div className="eyebrow">A bigger gathering?</div>
                <h2>
                  Plan your event
                  <br />
                  with the right support.
                </h2>
                <p>
                  Discuss the audience, format, rehearsal and EventPro requirements before capacity
                  and price are confirmed.
                </p>
              </div>
              <Link className="button" to="/contact-sales">
                Discuss event requirements <span aria-hidden="true">↗</span>
              </Link>
            </div>

            <div className="grid3">
              <article className="benefit">
                <h3>Before you pay</h3>
                <p>
                  Review the full charge, billing period, entitlements, taxes and applicable
                  cancellation or refund terms.
                </p>
              </article>
              <article className="benefit">
                <h3>Verified activation</h3>
                <p>
                  Your paid entitlement should begin only after the payment is verified by the
                  platform.
                </p>
              </article>
              <article className="benefit">
                <h3>Your renewal choice</h3>
                <p>
                  Any saved-card auto-debit requires an explicit choice and clear renewal terms.
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <Footer onAction={onAction} />
    </>
  )
}
