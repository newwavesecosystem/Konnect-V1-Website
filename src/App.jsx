import React, { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Hero from './components/Hero'
import Footer from './components/Footer'
import {
  BenefitsSection,
  BrandLine,
  CapabilitiesSection,
  CTASection,
  DemoSection,
  DeploymentSection,
  FAQSection,
  PricingSection,
  ProofSection,
  ScopeOverviewSection,
  SegmentStrip,
  TrustSection,
  WorkflowSection,
} from './components/Sections'
import {
  LOGIN_URL,
  proposalSolutions,
  REGISTER_URL,
  routePaths,
  sectorProposals,
} from './data/metadata'
import ContactSales from './pages/ContactSales'
import { captureUtmParameters } from './services/leadService'
import { trackPageView } from './analytics/events'

const HOME_BENEFITS = [
  [
    '01',
    'Bring your people in',
    'Create a meeting or use the approved joining route. Make the first step clear.',
  ],
  [
    '02',
    'Make room for contribution',
    'Use audio, video, chat and file sharing to work through the task together.',
  ],
  [
    '03',
    'Keep what matters',
    'Record authorised sessions and share material through the approved access workflow.',
  ],
]

const HOME_WORKFLOW_STEPS = [
  ['01', 'Start or join', 'Create an account, start a meeting or follow your meeting link.'],
  ['02', 'Check and connect', 'Choose your audio and video settings on a supported device.'],
  ['03', 'Participate and follow through', 'Use the approved tools, then share only authorised material.'],
]

const HOME_SIX_FREEDOMS = [
  ['Connect', 'Bring people together through a clear joining path.'],
  ['Participate', 'Speak, listen, share and contribute to the conversation.'],
  ['Gather', 'Choose the right session format for your people.'],
  ['Communicate your way', 'Use supported audio, video and text tools.'],
  ['Control', 'Understand access, host and recording responsibilities.'],
  ['Create value', 'Turn a useful conversation into learning and action.'],
]

const HOME_FEATURES = [
  {
    key: 'meeting-summary',
    title: 'Meeting Summary',
    tagline: 'AI-assisted recaps & clear next steps',
    description:
      'Capture the key discussion points, decisions, and action items from your session so every participant leaves aligned without manual note-taking.',
    highlights: [
      'Structured session highlights and key takeaways',
      'Clear follow-up action items for teams and committees',
      'Easy sharing with authorised meeting participants',
    ],
    previewItems: [
      ['Session overview', 'Structured recap generated after the call'],
      ['Decisions captured', 'Key outcomes highlighted for review'],
      ['Action follow-through', 'Next steps organised by topic'],
    ],
  },
  {
    key: 'scheduling',
    title: 'Scheduling',
    tagline: 'Plan sessions with clarity and control',
    description:
      'Set up one-off or recurring meetings, configure access codes and host permissions in advance, and give invitees a straightforward joining route.',
    highlights: [
      'Customizable meeting rooms and recurring schedules',
      'Access code and waiting-room preparation',
      'Clear invitation links for guests and members',
    ],
    previewItems: [
      ['Session date & time', 'Scheduled with automatic reminders'],
      ['Room & access setup', 'Access code and host roles configured'],
      ['Participant invite link', 'Ready to share across channels'],
    ],
  },
  {
    key: 'reactions',
    title: 'Reactions',
    tagline: 'Real-time non-verbal participation',
    description:
      'Let participants express agreement, celebrate milestones, or raise their hand to speak without interrupting the flow of the speaker.',
    highlights: [
      'Live emoji reactions during presentations and town halls',
      'Ordered hand-raising queue for structured Q&A',
      'Keeps large sessions interactive and orderly',
    ],
    previewItems: [
      ['Raise hand queue', 'Speakers called in clear order'],
      ['Live audience pulse', 'Instant visual feedback for hosts'],
      ['Uninterrupted audio', 'Engage without talking over presenters'],
    ],
  },
  {
    key: 'polls',
    title: 'Polls',
    tagline: 'Instant group decisions & pulse checks',
    description:
      'Launch live polls during your meeting to gather votes, test understanding in training sessions, or capture immediate feedback from your audience.',
    highlights: [
      'Quick single-choice and multiple-choice questions',
      'Live response tally visible to the host and room',
      'Ideal for AGMs, classrooms, and interactive webinars',
    ],
    previewItems: [
      ['Launch live question', 'Prepared before or during the session'],
      ['Real-time participation', 'Instant responses from attendees'],
      ['Publish results', 'Share outcomes with the room on the spot'],
    ],
  },
  {
    key: 'dashboard',
    title: 'Dashboard',
    tagline: 'Unified room, host & attendance management',
    description:
      'Manage your persistent meeting rooms, review auto-attendance logs, and oversee your organisation’s scheduled sessions from one clean workspace.',
    highlights: [
      'Centralised view of active and upcoming sessions',
      'Automatic attendance tracking for meetings and classes',
      'Host seat and room configuration in one place',
    ],
    previewItems: [
      ['Persistent rooms', 'Launch or configure custom rooms'],
      ['Auto attendance', 'Downloadable participant attendance records'],
      ['Account overview', 'Plan entitlements and host seats'],
    ],
  },
  {
    key: 'doc',
    title: 'Doc',
    tagline: 'Shared notes & session documentation',
    description:
      'Keep agendas, briefing papers, and collaborative meeting notes right alongside the live conversation so everyone works from the same page.',
    highlights: [
      'In-session shared documentation and agenda view',
      'Supporting file sharing for presenters and attendees',
      'Structured material ready for post-meeting review',
    ],
    previewItems: [
      ['Meeting agenda', 'Visible to participants during the call'],
      ['Shared reference docs', 'Distribute handouts and briefing files'],
      ['Collaborative notes', 'Document outcomes in real time'],
    ],
  },
  {
    key: 'audio-boost',
    title: 'Audio Boost',
    tagline: 'Clear voice across everyday environments',
    description:
      'Enhance speech clarity and reduce distracting background noise so every voice comes through clearly, even in busy environments or on variable networks.',
    highlights: [
      'Voice clarity enhancement for speakers and panels',
      'Background noise reduction for clearer listening',
      'Reliable audio prioritisation on low-bandwidth links',
    ],
    previewItems: [
      ['Voice isolation', 'Balances speaker volume automatically'],
      ['Noise suppression', 'Filters ambient room distractions'],
      ['Low-bandwidth resilience', 'Keeps speech clear when networks dip'],
    ],
  },
  {
    key: 'playback',
    title: 'Playback',
    tagline: 'On-demand recordings & authorised replay',
    description:
      'Record authorised sessions and make replays available to your team, students, or event attendees—including support for paid replay on eligible plans.',
    highlights: [
      'Cloud recording with host-controlled access permissions',
      'On-demand playback for members who missed the live call',
      'Paid replay support for workshops, courses, and events',
    ],
    previewItems: [
      ['Authorised recording', 'Captured with clear session indicators'],
      ['On-demand replay', 'Stream or download with permission'],
      ['Paid replay option', 'Monetise premium workshops and events'],
    ],
  },
]

function FeatureCardIcon({ featureKey }) {
  switch (featureKey) {
    case 'meeting-summary':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="3" width="16" height="18" rx="2.5" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      )
    case 'scheduling':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 7l2 2 3.5-3.5" />
          <path d="M12 7h8" />
          <path d="M4 14l2 2 3.5-3.5" />
          <path d="M12 14h8" />
          <path d="M12 19h8" />
        </svg>
      )
    case 'reactions':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 14.5c1 1.4 2.2 2 3.5 2s2.5-.6 3.5-2" />
          <circle cx="9" cy="9.5" r="0.8" fill="currentColor" />
          <circle cx="15" cy="9.5" r="0.8" fill="currentColor" />
        </svg>
      )
    case 'polls':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="3" width="16" height="18" rx="2.5" />
          <path d="M8 8h8" />
          <path d="M8 12l1.8 1.8L13 10.5" />
          <path d="M8 16.5l1.8 1.8L13 15" />
        </svg>
      )
    case 'dashboard':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4.5 16.5a8.5 8.5 0 1 1 15 0" />
          <path d="M12 13l3.5-3.5" />
          <circle cx="12" cy="13.5" r="1.4" />
          <path d="M6 19h12" />
        </svg>
      )
    case 'doc':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <path d="M14 3v6h6" />
          <path d="M8 13h8M8 17h5" />
        </svg>
      )
    case 'audio-boost':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 10v4M7.5 7v10M11 4v16M14.5 8v8M18 6v12M21 10v4" />
        </svg>
      )
    case 'playback':
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 5v14" />
          <polygon points="18 5 9 12 18 19 18 5" />
        </svg>
      )
  }
}

function FeaturesCarouselSection() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % HOME_FEATURES.length)
    }, 3500)
    return () => window.clearInterval(timer)
  }, [])

  const activeFeature = HOME_FEATURES[activeIndex] || HOME_FEATURES[0]
  const infiniteItems = [...HOME_FEATURES, ...HOME_FEATURES]

  return (
    <section
      className="section soft features-carousel-section"
      id="features"
    >
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow">Features</div>
            <h2>
              Every feature your team
              <br />
              needs to work faster.
            </h2>
          </div>
        </div>

        <div className="features-marquee-viewport">
          <div
            className="features-marquee-track"
            role="tablist"
            aria-label="Konn3ct features"
          >
            {infiniteItems.map((item, idx) => {
              const realIndex = idx % HOME_FEATURES.length
              const isClone = idx >= HOME_FEATURES.length
              const isSelected = realIndex === activeIndex
              return (
                <button
                  key={`${item.key}-${idx}`}
                  type="button"
                  role={isClone ? undefined : 'tab'}
                  aria-hidden={isClone ? 'true' : undefined}
                  tabIndex={isClone ? -1 : 0}
                  id={isClone ? undefined : `feature-tab-${item.key}`}
                  aria-selected={isClone ? undefined : isSelected}
                  aria-controls={isClone ? undefined : 'feature-spotlight-panel'}
                  className={`feature-tile ${isSelected ? 'is-active' : ''}`}
                  onClick={() => setActiveIndex(realIndex)}
                >
                  <span className="feature-tile-icon">
                    <FeatureCardIcon featureKey={item.key} />
                  </span>
                  <span className="feature-tile-title">{item.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div
          className="tab-panel feature-spotlight"
          id="feature-spotlight-panel"
          role="tabpanel"
          aria-labelledby={`feature-tab-${activeFeature.key}`}
        >
          <div>
            <div className="board-label" style={{ color: '#227451', marginBottom: '8px' }}>
              0{activeIndex + 1} · {activeFeature.tagline.toUpperCase()}
            </div>
            <h3>{activeFeature.title}</h3>
            <p>{activeFeature.description}</p>
            <ul className="check-list">
              {activeFeature.highlights.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
          <div className="feature-card">
            <div className="board-label">IN-SESSION WORKFLOW</div>
            <h4>{activeFeature.title}</h4>
            {activeFeature.previewItems.map(([rowTitle, rowSub], j) => (
              <div className="mini-row" key={rowTitle}>
                <div>
                  <strong style={{ display: 'block', color: '#0c1f3f' }}>{rowTitle}</strong>
                  <small style={{ color: '#566174', fontSize: '12.5px' }}>{rowSub}</small>
                </div>
                <span>0{j + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function HomePage({ onAction }) {
  const location = useLocation()

  useEffect(() => {
    document.title = 'Connect on your terms · Konn3ct'
    captureUtmParameters(location.search)
    trackPageView({ route: 'home', page_path: location.pathname || '/' })
    if (location.state?.anchor) {
      const anchor = location.state.anchor
      setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    } else if (location.hash) {
      const hashId = location.hash.replace('#', '')
      setTimeout(() => document.getElementById(hashId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    } else {
      window.scrollTo({ top: 0 })
    }
  }, [location.state, location.search, location.pathname, location.hash])

  return (
    <>
      <main id="main">
        <Hero route="home" onAction={onAction} />
        <BrandLine />
        <SegmentStrip />

        <section className="section" id="experience">
          <div className="wrap">
            <div className="section-head">
              <div>
                <div className="eyebrow">Connection, made useful</div>
                <h2>
                  Less distance.
                  <br />
                  More meaningful participation.
                </h2>
              </div>
              <p>
                Start with a conversation. Make it easy for people to join, contribute and follow
                through.
              </p>
            </div>
            <div className="grid3">
              {HOME_BENEFITS.map(([num, title, body]) => (
                <article className="benefit" key={num}>
                  <span className="num">{num}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <FeaturesCarouselSection />

        <section className="section navy">
          <div className="wrap workflow">
            <div className="workflow-copy">
              <div className="eyebrow">Your first successful meeting</div>
              <h2>
                From “Can you hear me?”
                <br />
                to a useful next step.
              </h2>
              <p>A simple first-use journey, with clear guidance when you need help.</p>
              <div className="steps">
                {HOME_WORKFLOW_STEPS.map(([num, title, body]) => (
                  <div className="step" key={num}>
                    <span>{num}</span>
                    <div>
                      <b>{title}</b>
                      <p>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <a className="button light" href={REGISTER_URL}>
                Preview the first-meeting journey <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div>
              <div className="workboard">
                <div className="board-label">PROPOSED FIRST-SESSION GUIDE</div>
                <h3>
                  Ready for your
                  <br />
                  first conversation?
                </h3>
                {[
                  ['Choose your joining route', 'Account or approved guest access'],
                  ['Check your device', 'Audio, video and supported browser'],
                  ['Know your controls', 'Host, chat, files and recording'],
                  ['Keep help close', 'Joining and recovery guidance'],
                ].map(([title, subtitle], i) => (
                  <div className="board-row" key={title}>
                    <div>
                      <strong>{title}</strong>
                      <small>{subtitle}</small>
                    </div>
                    <span className="check-dot">{i + 1}</span>
                  </div>
                ))}
              </div>
              <span className="concept-label" style={{ color: '#a4b4cd' }}>
                Illustrative onboarding concept
              </span>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <div>
                <div className="eyebrow">The Konn3ct difference</div>
                <h2>
                  Six freedoms.
                  <br />
                  One human promise.
                </h2>
              </div>
              <p>
                The freedom to connect your way, with appropriate privacy, trust and control.
              </p>
            </div>
            <div className="freedoms">
              {HOME_SIX_FREEDOMS.map(([label, desc], i) => (
                <article className="freedom" key={label}>
                  <span>0{i + 1} /</span>
                  <h3>Freedom to {label.toLowerCase()}</h3>
                  <p>{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section soft" id="solutions">
          <div className="wrap">
            <div className="section-head">
              <div>
                <div className="eyebrow">Different people. Shared possibilities.</div>
                <h2>
                  Your purpose.
                  <br />
                  Your way to connect.
                </h2>
              </div>
              <p>Explore a path designed around what your people need to achieve.</p>
            </div>
            <div className="solution-cards">
              {proposalSolutions.map(([key, title, desc, sym]) => (
                <Link key={key} className="solution-card" to={routePaths[key] || `/${key}`}>
                  <span className="symbol">{sym}</span>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                  <span className="arrow">↗</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <ScopeOverviewSection />
        <TrustSection onAction={onAction} />
        <PricingSection onAction={onAction} />
        <FAQSection />
        <CTASection route="home" onAction={onAction} />
      </main>

      <Footer onAction={onAction} />
    </>
  )
}

function SectorPage({ route, onAction, onToast }) {
  const location = useLocation()
  const sector = sectorProposals[route]

  useEffect(() => {
    document.title = `${sector?.name || 'Solutions'} · Konn3ct`
    captureUtmParameters(location.search)
    trackPageView({ route, page_path: location.pathname })
    if (location.state?.anchor) {
      const anchor = location.state.anchor
      setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    } else if (location.hash) {
      const hashId = location.hash.replace('#', '')
      setTimeout(() => document.getElementById(hashId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    } else {
      window.scrollTo({ top: 0 })
    }
  }, [route, sector, location.state, location.search, location.pathname, location.hash])

  if (!sector) {
    return <Navigate to="/" replace />
  }

  return (
    <>
      <main id="main">
        <Hero route={route} onAction={onAction} />
        <BrandLine />
        <BenefitsSection data={sector} />
        <WorkflowSection route={route} data={sector} />
        <CapabilitiesSection route={route} data={sector} />
        {route === 'government' && <DeploymentSection />}
        <TrustSection onAction={onAction} />
        <ProofSection data={sector} />
        <DemoSection route={route} onToast={onToast} onAction={onAction} />
        <CTASection route={route} />
      </main>

      <Footer onAction={onAction} />
    </>
  )
}

const PRICING_PLANS_MODAL = [
  {
    key: 'free',
    name: 'Free',
    kicker: 'For individuals',
    priceMain: 'NGN 0/yr',
    priceSub: '₦0/mo · ₦0/yr',
    ctaLabel: 'Start free',
    ctaHref: REGISTER_URL,
    highlight: false,
    features: [
      'Recording: No',
      'Duration: 60 minutes',
      'Participants: 150',
      'Breakout Rooms: No',
      'Auto Attendance for Meetings: Yes',
      'Access Code: Yes',
    ],
  },
  {
    key: 'starter',
    name: 'Starter',
    kicker: 'For individuals',
    priceMain: 'NGN 2,500/mo',
    priceSub: 'NGN 27,500/yr',
    ctaLabel: 'Choose Starter',
    ctaHref: REGISTER_URL,
    highlight: false,
    features: [
      'Recording: Yes',
      'Duration: 180 minutes/Meeting',
      'Participants: 200',
      'Rooms: 1 customizable meeting rooms',
      'Event Ticketing: 1 event/Month',
      'AI summaries',
      'Breakout Rooms: Yes',
      'Auto Attendance for Meetings: Yes',
      'Access Code: Yes',
    ],
  },
  {
    key: 'professional',
    name: 'Professional',
    kicker: 'For individuals · Popular',
    priceMain: 'NGN 10,000/mo',
    priceSub: 'NGN 100,000/yr',
    ctaLabel: 'Choose Professional',
    ctaHref: REGISTER_URL,
    highlight: true,
    features: [
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
  },
  {
    key: 'business',
    name: 'Business',
    kicker: 'For teams and growing organisations',
    priceMain: 'NGN 200,000/yr',
    priceSub: '₦20,000/mo* · 4 host seats included',
    ctaLabel: 'Choose Business',
    ctaHref: REGISTER_URL,
    highlight: false,
    features: [
      'Recording: Yes',
      'Duration: 1440 minutes/Meeting',
      'Participants: 1000',
      'Rooms: 15 customizable meeting rooms',
      'Streaming: 15 events/Month',
      'Event Ticketing: 10 events/Month',
      'AI summaries, paid replay',
      'Accept Donations',
      '4 licensed hosts included (1 Professional & 3 Starter Account)',
      'Breakout Rooms: Yes',
      'Auto Attendance for Meetings: Yes',
      'Access Code: Yes',
      'TrustLock™ controls',
    ],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    kicker: 'For large organisations, government & regulated institutions',
    priceMain: 'Custom Pricing',
    priceSub: 'Contract · 20 host seats included',
    ctaLabel: 'Contact sales',
    ctaRoute: '/contact-sales',
    highlight: false,
    features: [
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
  },
]

const EVENTPRO_ADDONS = [
  ['500 Participants', '₦5,000/Monthly'],
  ['1,000 Participants', '₦10,000/Monthly'],
  ['2,000 Participants', '₦35,000/Monthly'],
  ['5,000 Participants', '₦500,000/Monthly'],
  ['10,000 Participants', '₦1,000,000/Monthly'],
]

const PRICING_COMPARISON_ROWS = [
  ['Price', '₦0', '₦2,500/mo', '₦10,000/mo', '₦20,000/mo*', 'Custom'],
  ['Annual', '₦0', '₦27,500*', '₦100,000', '₦200,000', 'Contract'],
  ['Participants', '150', '200', '500', '1,000', '1,000 interactive + EventPro'],
  ['Meeting duration', '60 min', '3 hrs', '24 hrs', '24 hrs', '24 hrs'],
  ['Recording', '—', '✓', '✓', '✓', '✓'],
  ['AI summaries', '—', '✓', '✓', '✓', '✓'],
  ['Persistent rooms', '—', '1', '5', '15', '50/custom'],
  ['Streaming/month', '—', '—', '5', '15', '50/custom'],
  ['Paid Ticketed events/month', '—', '—', '3', '10', '50/custom'],
  ['Paid replay', '—', '—', '✓', '✓', '✓'],
  ['Donations', '—', '—', '✓', '✓', '✓/optional'],
  ['Host seats', '1', '1', '1', '4', '20/custom'],
  ['Breakout rooms', '—', '✓', '✓', '✓', '✓'],
  ['Auto attendance', '✓', '✓', '✓', '✓', '✓'],
  ['TrustLock™', '—', '—', 'Core', 'Organisation', 'Advanced'],
  ['White label', '—', '—', '—', '—', 'Available'],
  ['Dial-in', '—', '—', '—', '—', 'Available'],
  ['EventPro', 'Add-on', 'Add-on', 'Add-on', 'Add-on', 'Contract/add-on'],
]

function Konn3ctModal({ action, onClose, onAction }) {
  useEffect(() => {
    if (!action) return undefined
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [action, onClose])

  if (!action) return null

  if (action === 'purchase') {
    return (
      <div
        className="k3-modal-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="k3-modal pricing-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <button className="modal-close" type="button" aria-label="Close dialog" onClick={onClose}>
            ×
          </button>

          <div className="pricing-modal-head">
            <div className="eyebrow" style={{ marginBottom: '12px' }}>
              Konn3ct Pricing
            </div>
            <h2 id="modal-title" style={{ marginTop: 0 }}>
              Choose the plan that fits how you connect.
            </h2>
            <p>
              Start with a free or individual plan, scale up for your team, or talk to sales for
              enterprise and sovereign deployments.
            </p>
          </div>

          <div className="pricing-modal-grid">
            {PRICING_PLANS_MODAL.map((tier) => (
              <article
                key={tier.key}
                className={`plan pricing-tier-card ${tier.highlight ? 'highlight' : ''}`}
              >
                <span className="kicker">{tier.kicker}</span>
                <h3>{tier.name}</h3>
                <div className="price">{tier.priceMain}</div>
                <small className="pricing-tier-sub">{tier.priceSub}</small>

                <ul className="check-list pricing-tier-list">
                  {tier.features.map((feat) => (
                    <li
                      key={feat}
                      className={feat.endsWith(': No') ? 'is-excluded' : ''}
                    >
                      {feat}
                    </li>
                  ))}
                </ul>

                {tier.ctaRoute ? (
                  <Link
                    to={tier.ctaRoute}
                    className="button outline"
                    onClick={onClose}
                  >
                    {tier.ctaLabel} <span aria-hidden="true">↗</span>
                  </Link>
                ) : (
                  <a
                    href={tier.ctaHref}
                    className={`button ${tier.highlight ? 'light' : 'outline'}`}
                  >
                    {tier.ctaLabel} <span aria-hidden="true">↗</span>
                  </a>
                )}
              </article>
            ))}
          </div>

          <div className="pricing-addons-box">
            <div>
              <div className="eyebrow" style={{ marginBottom: '8px' }}>
                EventPro Addons
              </div>
              <h3>Monthly One-off Meetings / Webinar</h3>
              <p>
                Expand your session capacity whenever you host large town halls, conferences, or
                webinars.
              </p>
            </div>
            <div className="pricing-addons-grid">
              {EVENTPRO_ADDONS.map(([capacity, price]) => (
                <div className="pricing-addon-pill" key={capacity}>
                  <strong>{capacity}</strong>
                  <span>{price}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pricing-matrix-section">
            <div className="eyebrow" style={{ marginBottom: '8px' }}>
              Commercial Architecture
            </div>
            <h3>Full Plan Comparison</h3>
            <div className="pricing-table-wrap">
              <table className="pricing-matrix-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Free</th>
                    <th>Starter</th>
                    <th className="is-popular">Professional</th>
                    <th>Business</th>
                    <th>Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {PRICING_COMPARISON_ROWS.map(([feature, free, starter, pro, biz, ent]) => (
                    <tr key={feature}>
                      <th>{feature}</th>
                      <td>{free}</td>
                      <td>{starter}</td>
                      <td className="is-popular">{pro}</td>
                      <td>{biz}</td>
                      <td>{ent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  let title = 'Information'
  let body = null

  if (action === 'trial') {
    title = 'Start your 7-day free trial'
    body = (
      <>
        <p>No credit card required. Choose the path that matches how you want to begin.</p>
        <div className="modal-progress">
          <span />
          <span />
          <span />
        </div>
        <div className="dialog-options">
          <a href={REGISTER_URL}>
            <strong>Host my first meeting →</strong>
            <small>Account → device check → create a meeting</small>
          </a>
          <button type="button" onClick={() => onAction('join')}>
            <strong>Join an existing meeting →</strong>
            <small>Follow the approved meeting access route</small>
          </button>
        </div>
      </>
    )
  } else if (action === 'trial-host') {
    title = 'Your first-meeting path'
    body = (
      <>
        <ul className="check-list">
          <li>Create your account</li>
          <li>Check your audio and video</li>
          <li>Create a meeting and invite your people</li>
        </ul>
        <div className="callout">
          Ready to begin? Continue to the Konn3ct registration page to start your 7-day free trial.
        </div>
        <a className="button outline" href={REGISTER_URL} style={{ marginTop: '16px' }}>
          Continue to registration <span aria-hidden="true">↗</span>
        </a>
      </>
    )
  } else if (action === 'checkout') {
    title = 'A clear, verified purchase'
    body = (
      <>
        <ul className="check-list">
          <li>Review the approved plan and full price</li>
          <li>Complete payment through the authorised checkout</li>
          <li>Activate access after verified payment</li>
          <li>Receive confirmation and support guidance</li>
        </ul>
        <div className="callout">
          Checkout design flow only. No live Paystack connection or financial transaction.
        </div>
      </>
    )
  } else if (action === 'join') {
    title = 'Join a meeting'
    body = (
      <>
        <p>
          Use your meeting link and the approved joining guidance. Anonymous access and host-control
          behavior must match the ratified scope.
        </p>
        <div className="callout">Joining-flow concept only. No live meeting is opened.</div>
      </>
    )
  } else if (action === 'trust') {
    title = 'Control you can understand'
    body = (
      <>
        <p>TrustLock content will explain the actual released controls in plain language.</p>
        <ul className="check-list">
          <li>Who may join and how</li>
          <li>Who holds host responsibilities</li>
          <li>How recording and sharing are controlled</li>
          <li>How to find help</li>
        </ul>
        <p className="fine">
          No certification, encryption specification or sovereign-hosting guarantee is implied by
          this concept.
        </p>
      </>
    )
  } else if (action.startsWith('policy:')) {
    title = action.split(':').slice(1).join(':') || 'Information'
    body = (
      <>
        <p>
          This destination is included in the proposed navigation so people can find{' '}
          {title.toLowerCase()} information.
        </p>
        <div className="callout">
          Content placement only. The approved policy or support guidance must replace this panel
          before launch. No legal terms have been invented.
        </div>
      </>
    )
  }

  return (
    <div
      className="k3-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="k3-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className="modal-close" type="button" aria-label="Close dialog" onClick={onClose}>
          ×
        </button>
        <span className="modal-label">Interactive design preview</span>
        <h2 id="modal-title">{title}</h2>
        {body}
      </div>
    </div>
  )
}

function SiteShell() {
  const [toast, setToast] = useState('')
  const [modalAction, setModalAction] = useState(null)

  useEffect(() => {
    const clearButtonFocus = (e) => {
      const interactive = e.target?.closest?.('button, a, summary')
      if (interactive && typeof interactive.blur === 'function') {
        requestAnimationFrame(() => interactive.blur())
      }
    }
    window.addEventListener('mouseup', clearButtonFocus, true)
    window.addEventListener('click', clearButtonFocus, true)
    return () => {
      window.removeEventListener('mouseup', clearButtonFocus, true)
      window.removeEventListener('click', clearButtonFocus, true)
    }
  }, [])

  const showToast = (message) => {
    setToast(message)
    window.clearTimeout(window.__k3Toast)
    window.__k3Toast = window.setTimeout(() => setToast(''), 2200)
  }

  const handleAction = (action) => {
    if (!action) return
    if (action === 'trial') {
      window.location.href = REGISTER_URL
      return
    }
    if (action === 'login') {
      window.location.href = LOGIN_URL
      return
    }
    setModalAction(action)
  }

  return (
    <div className="min-h-screen bg-white text-brand-ink">
      <Header onToast={showToast} onAction={handleAction} />
      <Routes>
        <Route path="/" element={<HomePage onAction={handleAction} onToast={showToast} />} />
        <Route
          path="/government"
          element={<SectorPage route="government" onAction={handleAction} onToast={showToast} />}
        />
        <Route
          path="/associations"
          element={<SectorPage route="associations" onAction={handleAction} onToast={showToast} />}
        />
        <Route
          path="/education"
          element={<SectorPage route="education" onAction={handleAction} onToast={showToast} />}
        />
        <Route
          path="/faith"
          element={<SectorPage route="faith" onAction={handleAction} onToast={showToast} />}
        />
        <Route
          path="/corporates"
          element={<SectorPage route="corporates" onAction={handleAction} onToast={showToast} />}
        />
        <Route
          path="/events-community"
          element={
            <SectorPage route="events-community" onAction={handleAction} onToast={showToast} />
          }
        />
        <Route
          path="/contact-sales"
          element={<ContactSales onToast={showToast} onAction={handleAction} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Konn3ctModal
        action={modalAction}
        onClose={() => setModalAction(null)}
        onAction={handleAction}
      />

      <div
        className={`fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-brand-navy px-4 py-3 text-xs font-extrabold text-white shadow-float transition-all ${
          toast ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        {toast}
      </div>
    </div>
  )
}

export default function App() {
  return <SiteShell />
}
