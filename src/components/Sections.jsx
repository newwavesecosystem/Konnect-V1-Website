import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CheckIcon, DeviceIcon, GlobeIcon, ShieldIcon, SparkIcon, UsersIcon, WifiIcon } from './Icons'
import MediaPlaceholder from './MediaPlaceholder'
import {
  getRouteConversionMeta,
  proposalSolutions,
  REGISTER_URL,
  routePaths,
  sectorProposals,
} from '../data/metadata'
import {
  createSubmissionAttemptId,
  submitLead,
  validateClientLeadForm,
} from '../services/leads'
import { trackConfirmedLead, trackCtaClick } from '../analytics/events'
import { getExperimentAssignment } from '../experiments/abTest'

const iconSet = [UsersIcon, ShieldIcon, GlobeIcon, WifiIcon, SparkIcon, DeviceIcon]

const solutionCardRouteMap = {
  'government & public institutions': 'government',
  government: 'government',
  'corporates & smes': 'corporates',
  business: 'corporates',
  'universities & training': 'education',
  education: 'education',
  'associations & memberships': 'associations',
  associations: 'associations',
  'churches & religious organisations': 'faith',
  'faith communities': 'faith',
  'events & communities': 'events-community',
  'events & community': 'events-community',
}

function isDarkSection(section) {
  const t = `${section.id} ${section.title}`.toLowerCase()
  return (
    t.includes('trust') ||
    t.includes('governance') ||
    t.includes('network') ||
    t.includes('bandwidth') ||
    t.includes('connectivity') ||
    t.includes('reliability')
  )
}

function SectionHeading({ section, dark = false, centered = false }) {
  return (
    <div className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      {section.eyebrow && (
        <div className={`eyebrow ${dark ? '!text-slate-300' : ''}`}>{section.eyebrow}</div>
      )}
      <h2 className={`section-title mt-3 ${dark ? '!text-white' : ''}`}>{section.title}</h2>
      {section.intro && (
        <p className={`section-copy mt-5 ${dark ? '!text-slate-300' : ''}`}>{section.intro}</p>
      )}
    </div>
  )
}

export function BrandLine() {
  return (
    <div className="wrap brand-line">
      <div>
        <strong>Konn3ct</strong> &nbsp; / KONN-THREE-CEE-TEE / &nbsp; Search Konn3ct with a 3.
      </div>
      <div className="pillars">
        <b>Connection</b>
        <b>Intelligence</b>
        <b>Trust</b>
      </div>
    </div>
  )
}

export function SegmentStrip() {
  return (
    <div className="segment-strip">
      <div className="wrap">
        {proposalSolutions.map(([routeKey, label]) => (
          <Link key={routeKey} to={routePaths[routeKey]}>
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export function BenefitsSection({ id, data, eyebrow, title, copy, benefits }) {
  const resolvedEyebrow = eyebrow || data?.tag || data?.name
  const resolvedBenefits = benefits || data?.benefits || []
  const resolvedCopy =
    copy || 'Connection Freedom means removing unnecessary barriers to meaningful participation.'

  return (
    <section className="section" id={id}>
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow">{resolvedEyebrow}</div>
            <h2>
              {title || (
                <>
                  Start with the outcome
                  <br />
                  that matters.
                </>
              )}
            </h2>
          </div>
          <p>{resolvedCopy}</p>
        </div>
        <div className="grid3">
          {resolvedBenefits.map(([itemTitle, itemCopy], i) => (
            <article className="benefit" key={itemTitle}>
              <span className="num">0{i + 1}</span>
              <h3>{itemTitle}</h3>
              <p>{itemCopy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function WorkflowSection({
  id,
  route,
  data,
  eyebrow = 'A practical first experience',
  title,
  copy,
  steps,
  actionLabel,
  onAction,
  boardLabel = 'SESSION PREPARATION CONCEPT',
  boardTitle,
}) {
  const sectionId = id || (route === 'associations' ? 'pilot' : 'journey')
  const resolvedBoardTitle =
    boardTitle ||
    (route === 'associations'
      ? 'Your member training pilot'
      : route === 'education'
      ? 'Your first learning session'
      : route === 'events-community'
      ? 'Your event readiness checklist'
      : route === 'faith'
      ? 'Your first community gathering'
      : route === 'corporates'
      ? 'Your next team meeting'
      : 'Your institutional briefing')
  const resolvedSteps = steps || data?.steps || []

  return (
    <section className="section navy" id={sectionId}>
      <div className="wrap workflow">
        <div className="workflow-copy">
          <div className="eyebrow">{eyebrow}</div>
          <h2>{title || data?.flowTitle}</h2>
          <p>{copy || data?.flowText}</p>
          <div className="steps">
            {resolvedSteps.map(([stepTitle, stepCopy], i) => (
              <div className="step" key={stepTitle}>
                <span>0{i + 1}</span>
                <div>
                  <b>{stepTitle}</b>
                  <p>{stepCopy}</p>
                </div>
              </div>
            ))}
          </div>
          {actionLabel && onAction && (
            <div style={{ marginTop: '20px' }}>
              <button type="button" className="text-link" style={{ color: '#fff' }} onClick={onAction}>
                {actionLabel}
              </button>
            </div>
          )}
        </div>
        <div>
          <div className="workboard">
            <div className="board-header">
              <div>
                <div className="board-label">{boardLabel}</div>
                <h3>{resolvedBoardTitle}</h3>
              </div>
              <span className="badge">Plan</span>
            </div>
            {[
              ['People & purpose', 'Who needs to join and why?'],
              ['Participation & control', 'Who hosts, contributes and records?'],
              ['Useful follow-through', 'What may be shared afterwards?'],
            ].map(([rowTitle, subtitle], i) => (
              <div className="board-row" key={rowTitle}>
                <div>
                  <strong>{rowTitle}</strong>
                  <small>{subtitle}</small>
                </div>
                <span className="check-dot">{i + 1}</span>
              </div>
            ))}
          </div>
          <span className="concept-label" style={{ color: '#93a7c4' }}>
            Illustrative preparation checklist
          </span>
        </div>
      </div>
    </section>
  )
}

export function CapabilitiesSection({ id = 'capabilities', route, routeKey, data, tabs: propTabs, note: propNote }) {
  const [activeTab, setActiveTab] = useState(0)
  const tabRefs = useRef([])
  const activeRoute = route || routeKey

  useEffect(() => {
    setActiveTab(0)
  }, [activeRoute])

  const tabs = propTabs || data?.tabs || []
  const current = tabs[activeTab] || tabs[0]
  const resolvedNote = propNote || data?.note

  const handleKeyDown = (e, i) => {
    const next =
      e.key === 'ArrowRight'
        ? (i + 1) % tabs.length
        : e.key === 'ArrowLeft'
        ? (i + tabs.length - 1) % tabs.length
        : null
    if (next !== null) {
      e.preventDefault()
      setActiveTab(next)
      tabRefs.current[next]?.focus()
    }
  }

  return (
    <section className="section" id={id}>
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow">Built around the task</div>
            <h2>
              Useful tools.
              <br />
              Clear expectations.
            </h2>
          </div>
          <p>Confirm the package and supported capabilities for your intended use before rollout.</p>
        </div>
        <div className="tabs" role="tablist" aria-label={`${data?.name || 'Sector'} capabilities`}>
          {tabs.map((tab, i) => (
            <button
              key={tab[0]}
              id={`tab-${i}`}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              type="button"
              role="tab"
              aria-selected={activeTab === i}
              aria-controls="tab-content"
              tabIndex={activeTab === i ? 0 : -1}
              onClick={() => setActiveTab(i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
            >
              {tab[0]}
            </button>
          ))}
        </div>
        {current && (
          <div className="tab-panel" id="tab-content" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
            <div>
              <h3>{current[1]}</h3>
              <p>{current[2]}</p>
              <ul className="check-list">
                {current[3].map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            </div>
            <div className="feature-card">
              <div className="board-label">PROPOSED SESSION CHECKLIST</div>
              <h4>{current[0]}</h4>
              {current[3].map((v, j) => (
                <div className="mini-row" key={v}>
                  {v}
                  <span>0{j + 1}</span>
                </div>
              ))}
              <p className="fine">
                Scope-approved categories. Final availability and entitlements require release
                confirmation.
              </p>
            </div>
          </div>
        )}
        <p className="fine">{resolvedNote}</p>
      </div>
    </section>
  )
}

export function DeploymentSection() {
  const items = [
    [
      'Managed service',
      'Discuss the supported package, administration needs and operating responsibilities.',
    ],
    [
      'Dedicated environment',
      'Assess separation, integration, support and institution-specific requirements.',
    ],
    [
      'Sovereign-oriented deployment',
      'Explore infrastructure, data location and governance requirements through a scoped proposal.',
    ],
  ]

  return (
    <section className="section greenwash" id="deployment">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow">Deployment conversations</div>
            <h2>
              Start with the
              <br />
              institution&apos;s requirements.
            </h2>
          </div>
          <p>Subject to technical assessment and an agreed deployment scope.</p>
        </div>
        <div className="deployment-grid">
          {items.map(([title, copy], i) => (
            <article className="deployment" key={title}>
              <div className="board-label">
                0{i + 1} · {i ? 'ASSESSMENT-LED' : 'PACKAGE REVIEW'}
              </div>
              <h3>{title}</h3>
              <p>{copy}</p>
              <a
                className="text-link"
                href="#request"
                onClick={(e) => {
                  e.preventDefault()
                  document
                    .getElementById('request')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                Discuss requirements
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function TrustSection({ onAction }) {
  return (
    <section className="section soft" id="trust">
      <div className="wrap grid2">
        <div>
          <div className="eyebrow">Freedom needs understandable controls</div>
          <h2>
            Trust is a practical
            <br />
            part of connection.
          </h2>
          <p className="subline">
            Know who can join, who hosts, what may be recorded and how authorised material is
            shared.
          </p>
          <ul className="check-list">
            <li>Clear joining and host guidance</li>
            <li>Understandable recording and sharing choices</li>
            <li>Help when a connection needs to recover</li>
          </ul>
          <button
            type="button"
            className="text-link"
            onClick={() => onAction?.('trust')}
          >
            Explore TrustLock &amp; access controls
          </button>
        </div>
        <div className="assurance">
          <div className="trust-seal">♧</div>
          <h3>
            Every Connection
            <br />
            Must Count.
          </h3>
          <p>
            Start with clear expectations. Confirm the supported device, access route and package.
            Keep help within reach.
          </p>
          <button
            type="button"
            className="text-link"
            onClick={() => onAction?.('policy:Recording & sharing')}
          >
            Recording &amp; sharing guidance
          </button>
          <br />
          <button
            type="button"
            className="text-link"
            onClick={() => onAction?.('policy:Help & joining guidance')}
          >
            Help with joining a meeting
          </button>
        </div>
      </div>
    </section>
  )
}

export function ProofSection({ data, sectorName }) {
  const name = sectorName || data?.name || 'Konn3ct'
  return (
    <section className="section">
      <div className="wrap grid2" style={{ alignItems: 'center' }}>
        <div>
          <div className="eyebrow">See the experience</div>
          <h2>
            Show the journey.
            <br />
            Make the value clear.
          </h2>
          <p className="subline">
            A guided walkthrough can help you assess the experience against the work your people
            need to do.
          </p>
          <a
            className="button outline"
            href="#request"
            onClick={(e) => {
              e.preventDefault()
              document
                .getElementById('request')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            Request a tailored walkthrough <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="proof-slot">
          <div className="evidence-title">Product proof · design placement</div>
          <h3>{name} walkthrough</h3>
          <p>
            This space is reserved for an approved V1 demonstration and a permissioned customer or
            pilot outcome.
          </p>
          <div className="fine">
            No testimonial, customer endorsement or performance figure has been invented for this
            proposal.
          </div>
        </div>
      </div>
    </section>
  )
}

export function ScopeOverviewSection() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow">Beyond the live conversation</div>
            <h2>Keep the work connected.</h2>
          </div>
          <p>Explore the package that fits your collaboration, recording and organisation needs.</p>
        </div>
        <div className="grid3">
          <article className="benefit">
            <span className="num">COLLABORATE</span>
            <h3>Talk. Message. Share.</h3>
            <p>
              In-meeting text chat, direct messaging and file sharing support the conversations
              around the meeting.
            </p>
          </article>
          <article className="benefit">
            <span className="num">RECORD &amp; REUSE</span>
            <h3>Keep authorised material.</h3>
            <p>
              Recording, sharing and download help the right people return to useful content with
              appropriate permissions.
            </p>
          </article>
          <article className="benefit">
            <span className="num">ORGANISE</span>
            <h3>Plan for the whole team.</h3>
            <p>
              Discuss organisation-wide provisioning and advanced reporting requirements as part of
              your package review.
            </p>
          </article>
        </div>
        <p className="fine">
          Design proposal based on approved V1 scope categories. Package entitlements and actual
          release availability require confirmation.
        </p>
      </div>
    </section>
  )
}

export function PricingSection({ section, route = 'home', onAction }) {
  const navigate = useNavigate()

  const handlePlanSelect = (index, label) => {
    if (index === 0 || String(label || '').toLowerCase().includes('trial') || String(label || '').toLowerCase() === 'start free') {
      trackCtaClick({
        landing_page_id: route,
        cta_label: label,
        target_destination: REGISTER_URL,
      })
      window.location.href = REGISTER_URL
      return
    }
    if (index === 1 && onAction) {
      trackCtaClick({
        landing_page_id: route,
        cta_label: label,
        target_destination: 'purchase-modal',
      })
      onAction('purchase')
      return
    }
    const enquiryType = index === 0 ? 'early_access' : 'demo_request'
    trackCtaClick({
      landing_page_id: route,
      cta_label: label,
      target_destination: '/contact-sales',
    })
    navigate('/contact-sales', { state: { enquiryType } })
  }

  return (
    <section className="section soft" id={section?.id || 'plans'}>
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow">A clear way to begin</div>
            <h2>
              Try it first.
              <br />
              Or start with a plan.
            </h2>
          </div>
          <p>
            Seven days to explore. No credit card required. You can choose to purchase immediately.
          </p>
        </div>
        <div className="plans">
          <article className="plan">
            <span className="kicker">Explore Konn3ct</span>
            <h3>7-day free trial</h3>
            <div className="price">
              ₦0 <span>for 7 days</span>
            </div>
            <p>Start with your first useful meeting.</p>
            <ul className="check-list">
              <li>No credit card collection</li>
              <li>Guided first-meeting path</li>
              <li>Choose to buy at any time</li>
            </ul>
            <a
              className="button outline"
              href={REGISTER_URL}
              onClick={() =>
                trackCtaClick({
                  landing_page_id: route,
                  cta_label: 'Start your 7-day trial',
                  target_destination: REGISTER_URL,
                })
              }
            >
              Start your 7-day trial <span aria-hidden="true">↗</span>
            </a>
          </article>

          <article className="plan highlight">
            <span className="kicker">Prefer to begin now?</span>
            <h3>Buy a plan</h3>
            <div className="price" style={{ fontSize: '28px' }}>
              Your next step
            </div>
            <p>Go directly to the approved plan and payment journey.</p>
            <ul className="check-list">
              <li>No trial required</li>
              <li>Clear package entitlements</li>
              <li>Activation after verified payment</li>
            </ul>
            <button
              type="button"
              className="button light"
              onClick={() => handlePlanSelect(1, 'Choose a plan')}
            >
              Choose a plan <span aria-hidden="true">↗</span>
            </button>
          </article>

          <article className="plan">
            <span className="kicker">For organisations</span>
            <h3>Discuss your needs</h3>
            <div className="price" style={{ fontSize: '28px' }}>
              Built around you
            </div>
            <p>Assess an organisation package and deployment requirements.</p>
            <ul className="check-list">
              <li>A tailored demonstration</li>
              <li>Scope and package review</li>
              <li>Agreed support requirements</li>
            </ul>
            <Link
              className="button outline"
              to="/contact-sales"
              onClick={() =>
                trackCtaClick({
                  landing_page_id: route,
                  cta_label: 'Contact sales',
                  target_destination: '/contact-sales',
                })
              }
            >
              Contact sales <span aria-hidden="true">↗</span>
            </Link>
          </article>
        </div>
        <div className="note-inline">
          Design note: final paid prices, access duration, limits, renewal and trial-expiry wording
          must come from the approved commercial matrix. No price has been invented.
        </div>
      </div>
    </section>
  )
}

const defaultHomeFaqs = [
  {
    q: 'Do I need a credit card for the trial?',
    a: 'No. The approved trial period is seven days, with no credit-card collection.',
  },
  {
    q: 'Can I buy without starting a trial?',
    a: 'Yes. You can choose to purchase immediately through the approved plan and checkout journey.',
  },
  {
    q: 'How do I join an existing meeting?',
    a: 'Follow the meeting link and the supported joining guidance. Access behavior follows the approved meeting configuration.',
  },
  {
    q: 'Can recordings be shared or downloaded?',
    a: 'Recording, sharing and download are in the approved V1 scope. Availability, permissions and package limits must be confirmed for your plan.',
  },
  {
    q: 'Are AI, language and advanced event tools included?',
    a: 'They are not assumed to be included. Their availability must be confirmed against the released capabilities and package.',
  },
]

export function FAQSection({ section }) {
  const faqs = section?.faqs?.length ? section.faqs : defaultHomeFaqs

  return (
    <section className="section" id={section?.id || 'faq'}>
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow">Clear answers</div>
            <h2>A simpler beginning.</h2>
          </div>
        </div>
        <div className="faq">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CTASection({ section, onAction, route = 'home' }) {
  const sector = sectorProposals[route]
  if (route === 'home') {
    return (
      <section className="cta-band" id={section?.id}>
        <div className="wrap">
          <div>
            <h2>
              Your next meaningful
              <br />
              connection starts here.
            </h2>
            <p>Seven-day free trial. No credit card required.</p>
          </div>
          <a className="button green" href={REGISTER_URL}>
            Start your 7-day trial <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    )
  }

  const ctaLabel = sector?.cta || section?.actions?.[0] || 'Get started'
  const isBusiness = route === 'corporates'

  return (
    <section className="cta-band" id={section?.id}>
      <div className="wrap">
        <div>
          <h2>Every Connection Must Count.</h2>
          <p>Start with a clear purpose. Build around the people who matter.</p>
        </div>
        {isBusiness ? (
          <a className="button green" href={REGISTER_URL}>
            {ctaLabel} <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <a
            className="button green"
            href="#request"
            onClick={(e) => {
              e.preventDefault()
              if (onAction) {
                onAction()
                return
              }
              document
                .getElementById('request')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            {ctaLabel} <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </section>
  )
}

export function DemoSection({ section, form, route = 'demo', onSubmitted, onToast, onAction }) {
  const location = useLocation()
  const sector = sectorProposals[route]
  const legacyFields = form?.fields || []
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [consentAccepted, setConsentAccepted] = useState(true)
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const attemptIdRef = useRef(createSubmissionAttemptId(route))

  const routeMeta = useMemo(() => getRouteConversionMeta(route), [route])
  const experiment = useMemo(
    () => getExperimentAssignment('EXP-MK004-CTA-COPY', { landing_page_id: routeMeta.landing_page_id }),
    [routeMeta.landing_page_id]
  )

  const handleFieldChange = () => {
    if (submissionResult) {
      setSubmissionResult(null)
      attemptIdRef.current = createSubmissionAttemptId(route)
    }
    if (errorMessage) {
      setErrorMessage('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return

    const formEl = e.currentTarget
    const formData = new FormData(formEl)
    const orgValue =
      formData.get('organisation') ||
      formData.get('institution') ||
      formData.get('org') ||
      formData.get('company') ||
      ''
    const contextValue = formData.get('context') || formData.get('message') || ''
    const deploymentValue = formData.get('deployment') || ''
    const combinedMessage = [
      contextValue,
      deploymentValue ? `Deployment/Governance Requirements: ${deploymentValue}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')

    const payload = {
      route,
      landing_page_id: routeMeta.landing_page_id,
      conversion_goal_id: routeMeta.conversion_goal_id,
      page_path: location.pathname || routeMeta.path,
      submission_reference: attemptIdRef.current,
      enquiryType: 'demo_request',
      website_url: formData.get('website_url') || '',
      consentAccepted,
      marketingOptIn,
      experiment_id: experiment.experiment_id,
      variant_id: experiment.variant_id,
      name: formData.get('name') || '',
      email: formData.get('email') || '',
      organisation: orgValue,
      company: orgValue,
      institution: orgValue,
      org: orgValue,
      role: formData.get('role') || formData.get('title') || '',
      need: sector?.usecase || formData.get('need') || '',
      message: combinedMessage,
    }

    for (const field of legacyFields) {
      if (!payload[field.name] && formData.get(field.name)) {
        payload[field.name] = formData.get(field.name)
      }
    }

    const validation = validateClientLeadForm(payload, { requirePhone: false })
    if (!validation.valid) {
      setFieldErrors(validation.errors)
      setErrorMessage(validation.firstError)
      return
    }

    setFieldErrors({})
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const response = await submitLead(payload)

      setSubmissionResult(response)

      trackConfirmedLead(response, {
        landing_page_id: routeMeta.landing_page_id,
        conversion_goal_id: routeMeta.conversion_goal_id,
        page_path: location.pathname || routeMeta.path,
        enquiryType: 'demo_request',
        consentAccepted,
        experiment_id: experiment.experiment_id,
        variant_id: experiment.variant_id,
      })

      onSubmitted?.(response)
      onToast?.(
        response.deliveryStatus === 'crm_created'
          ? `${response.classification} registered (${response.leadReference})`
          : `${response.classification} queued (${response.leadReference})`
      )
    } catch (err) {
      setFieldErrors(err.fieldErrors || {})
      setErrorMessage(
        err.message || 'Unable to submit your demo request right now. Please try again.'
      )
      onToast?.('Demo request could not be completed. Please review the form message.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formTitle = sector?.formTitle || form?.submit || 'Request a demo'
  const outcomeTitle = sector?.outcome || section?.title || 'Start with your next session.'
  const orgPlaceholder =
    route === 'government' ? 'Ministry / Agency / Organisation name' : 'Organisation name'
  const emailPlaceholder =
    route === 'government' ? 'you@example.com (or name@institution.gov)' : 'you@example.com'

  return (
    <section id="request" className="section soft">
      <div className="wrap request-grid">
        <div>
          <div className="eyebrow">Let&apos;s make the first session useful</div>
          <h2>{outcomeTitle}</h2>
          <p>
            Tell us what your people need to achieve. We will confirm the capabilities, package and
            support available for your use case.
          </p>
          <ul className="sector-list">
            <li>
              <span>01</span>Talk through your purpose and audience
            </li>
            <li>
              <span>02</span>See a relevant demonstration
            </li>
            <li>
              <span>03</span>Agree a practical next step
            </li>
          </ul>
          {route === 'events-community' && (
            <div className="callout">
              Your audience estimate helps us assess requirements; capacity is confirmed in the
              agreed event scope.
            </div>
          )}
          <p className="fine">
            {route === 'associations'
              ? 'Supported trials are arranged for an agreed session. Trial access is seven days with no credit card required.'
              : 'A request starts a conversation. It does not commit you to a purchase.'}
          </p>
        </div>

        <div className="request-panel" id={section?.id && section.id !== 'request' ? section.id : undefined}>
          <div className="micro-label">Tailored demonstration</div>
          <h3>{formTitle}</h3>
          <form
            id="request-form"
            onSubmit={handleSubmit}
            onChange={handleFieldChange}
            noValidate
            aria-busy={isSubmitting}
          >
            {/* Honeypot anti-spam trap */}
            <div className="sr-only" aria-hidden="true">
              <label>
                Website URL
                <input type="text" name="website_url" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <div className="form-grid">
              <label>
                Your name *
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Full name (Your name)"
                  autoComplete="name"
                  maxLength={120}
                  aria-invalid={Boolean(fieldErrors.name)}
                />
              </label>

              <label>
                Email *
                <input
                  name="email"
                  type="email"
                  required
                  placeholder={emailPlaceholder}
                  autoComplete="email"
                  maxLength={160}
                  aria-invalid={Boolean(fieldErrors.email)}
                />
              </label>

              <label>
                Organisation or community *
                <input
                  name="organisation"
                  type="text"
                  required
                  placeholder={orgPlaceholder}
                  autoComplete="organization"
                  maxLength={160}
                  aria-invalid={Boolean(fieldErrors.company || fieldErrors.organisation)}
                />
              </label>

              <label>
                Your role <span className="optional">Optional</span>
                <input
                  name="role"
                  type="text"
                  placeholder="Role or responsibility"
                  autoComplete="organization-title"
                  maxLength={120}
                />
              </label>

              <label className="full">
                {route === 'events-community'
                  ? 'Expected concurrent audience'
                  : 'What would you like to improve?'}{' '}
                <span className="optional">Optional</span>
                <textarea
                  name="context"
                  maxLength={2000}
                  placeholder={
                    route === 'events-community'
                      ? 'Tell us about your format, date and audience requirements.'
                      : 'A short description helps us prepare the conversation.'
                  }
                />
              </label>

              {route === 'government' && (
                <details className="full">
                  <summary style={{ fontSize: '11px', cursor: 'pointer' }}>
                    Add deployment or governance requirements
                  </summary>
                  <label style={{ marginTop: '12px' }}>
                    Requirements <span className="optional">Optional</span>
                    <textarea
                      name="deployment"
                      placeholder="Data location, organisational controls or deployment needs"
                    />
                  </label>
                </details>
              )}
            </div>

            <p className="privacy-note">
              We use these details to respond to your enquiry. Read our{' '}
              <button
                type="button"
                onClick={() => onAction?.('policy:Privacy')}
              >
                privacy information
              </button>
              .
            </p>

            <div className="sr-only">
              <label>
                <input
                  type="checkbox"
                  name="consentAccepted"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                />
                Enquiry processing notice acknowledged
              </label>
            </div>

            <label className="consent">
              <input
                name="marketing"
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
              />
              <span>Keep me informed about Konn3ct updates and events. Optional.</span>
            </label>

            <button
              className="button"
              type="submit"
              disabled={isSubmitting}
              aria-label={isSubmitting ? 'Submitting request...' : `${formTitle} (Prepare request)`}
            >
              {isSubmitting ? 'Submitting request...' : formTitle}{' '}
              <span aria-hidden="true">↗</span>
            </button>

            {errorMessage && (
              <div
                role="alert"
                aria-live="assertive"
                className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold leading-5 text-red-700"
              >
                {errorMessage}
              </div>
            )}

            {submissionResult && !errorMessage && (
              <div
                role="status"
                aria-live="polite"
                className="form-message mt-3"
              >
                <strong>Your request has been received</strong>
                <p>{submissionResult.message}</p>
              </div>
            )}

            {!submissionResult && !errorMessage && (
              <p className="fine">
                Your details are transmitted securely to the Konn3ct team via Newwaves Ecosystem CRM.
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}

export function CardGridSection({ section, index, route = 'home' }) {
  const navigate = useNavigate()
  const dark = isDarkSection(section)
  const isSolutionsSection = section.id === 'solutions'

  const handleSolutionCardClick = (cardTitle) => {
    const targetRoute = solutionCardRouteMap[String(cardTitle || '').toLowerCase()]
    if (!targetRoute || !routePaths[targetRoute]) return
    trackCtaClick({
      landing_page_id: route,
      cta_label: cardTitle,
      target_destination: routePaths[targetRoute],
    })
    navigate(routePaths[targetRoute])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section
      id={section.id}
      className={`scroll-mt-36 py-20 sm:py-24 ${
        dark ? 'bg-brand-navy text-white' : index % 2 ? 'bg-brand-cloud' : 'bg-white'
      }`}
    >
      <div className="container-k3">
        <SectionHeading section={section} dark={dark} centered={section.cards.length >= 5} />
        <div
          className={`mt-10 grid gap-4 ${
            section.cards.length >= 5
              ? 'md:grid-cols-2 lg:grid-cols-3'
              : section.cards.length >= 3
              ? 'md:grid-cols-2 lg:grid-cols-4'
              : 'md:grid-cols-2'
          }`}
        >
          {section.cards.map((card, i) => {
            const Icon = iconSet[i % iconSet.length]
            const targetRoute = isSolutionsSection
              ? solutionCardRouteMap[String(card.title || '').toLowerCase()]
              : null
            return (
              <article
                key={`${card.title}-${i}`}
                onClick={targetRoute ? () => handleSolutionCardClick(card.title) : undefined}
                role={targetRoute ? 'button' : undefined}
                tabIndex={targetRoute ? 0 : undefined}
                onKeyDown={
                  targetRoute
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSolutionCardClick(card.title)
                        }
                      }
                    : undefined
                }
                className={`rounded-[20px] border p-6 transition hover:-translate-y-1 ${
                  targetRoute ? 'cursor-pointer' : ''
                } ${
                  dark
                    ? 'border-white/10 bg-white/[0.055]'
                    : 'border-brand-line bg-white shadow-soft hover:shadow-float'
                }`}
              >
                <div
                  className={`mb-5 grid h-11 w-11 place-items-center rounded-xl ${
                    i % 2
                      ? 'bg-brand-greenTint text-brand-green'
                      : 'bg-brand-blueTint text-brand-blue'
                  } ${dark ? '!bg-white/10 !text-white' : ''}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3
                  className={`font-display text-lg font-extrabold leading-6 ${
                    dark ? 'text-white' : 'text-brand-navy'
                  }`}
                >
                  {card.title}
                </h3>
                {card.description && (
                  <p
                    className={`mt-3 text-sm leading-6 ${
                      dark ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {card.description}
                  </p>
                )}
                {!!card.checks?.length && (
                  <div className="mt-4 space-y-2 border-t border-current/10 pt-4">
                    {card.checks.slice(0, 4).map((check, j) => (
                      <div
                        key={j}
                        className={`flex gap-2 text-xs ${
                          dark ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                        <span>{check}</span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function SplitSection({ section, index, route = 'home', onToast }) {
  const navigate = useNavigate()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const dark = isDarkSection(section)
  const reverse = index % 2 === 1

  const handleActionClick = (actionLabel, i) => {
    setSelectedIndex(i)
    const lowerLabel = String(actionLabel || '').toLowerCase()

    if (lowerLabel === 'start free' || lowerLabel.includes('trial')) {
      trackCtaClick({
        landing_page_id: route,
        cta_label: actionLabel,
        target_destination: REGISTER_URL,
      })
      window.location.href = REGISTER_URL
      return
    }

    if (
      lowerLabel.includes('discuss') ||
      lowerLabel.includes('plan') ||
      lowerLabel.includes('demo') ||
      lowerLabel.includes('sales') ||
      lowerLabel.includes('start')
    ) {
      const demoEl =
        document.getElementById('request') ||
        document.getElementById('demo') ||
        document.getElementById('cta')
      if (route !== 'home' && demoEl) {
        trackCtaClick({
          landing_page_id: route,
          cta_label: actionLabel,
          target_destination: `#${demoEl.id}`,
        })
        demoEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
      trackCtaClick({
        landing_page_id: route,
        cta_label: actionLabel,
        target_destination: '/contact-sales',
      })
      navigate('/contact-sales', { state: { enquiryType: 'demo_request' } })
      return
    }

    trackCtaClick({
      landing_page_id: route,
      cta_label: actionLabel,
      target_destination: `#${section.id}`,
    })
    onToast?.(`${actionLabel} mode selected.`)
  }

  return (
    <section
      id={section.id}
      className={`scroll-mt-36 py-20 sm:py-24 ${
        dark ? 'bg-brand-navy text-white' : index % 2 ? 'bg-brand-cloud' : 'bg-white'
      }`}
    >
      <div className="container-k3 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className={reverse ? 'lg:order-2' : ''}>
          <SectionHeading section={section} dark={dark} />
          {!!section.body?.length && (
            <div className="mt-6 space-y-3">
              {section.body.map((p, i) => (
                <p
                  key={i}
                  className={`text-sm leading-7 ${dark ? 'text-slate-300' : 'text-slate-600'}`}
                >
                  {p}
                </p>
              ))}
            </div>
          )}
          {!!section.actions?.length && (
            <div className="mt-7 flex flex-wrap gap-3">
              {section.actions.slice(0, 3).map((a, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleActionClick(a, i)}
                  className={
                    selectedIndex === i
                      ? 'btn-primary'
                      : `btn-secondary ${
                          dark ? '!border-white/20 !bg-transparent !text-white hover:!bg-white/10' : ''
                        }`
                  }
                >
                  {a}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={reverse ? 'lg:order-1' : ''}>
          <MediaPlaceholder dark={dark} label={section.eyebrow || 'Konn3ct experience'} />
        </div>
      </div>
    </section>
  )
}

export function TabbedSection({ section }) {
  const [active, setActive] = useState(0)
  const tab = section.tabs[active] || section.tabs[0]
  return (
    <section id={section.id} className="scroll-mt-36 bg-white py-20 sm:py-24">
      <div className="container-k3">
        <SectionHeading section={section} centered />
        <div className="mt-10 overflow-hidden rounded-[28px] border border-brand-line bg-white shadow-soft">
          <div className="flex overflow-x-auto border-b border-brand-line bg-brand-cloud [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {section.tabs.map((item, i) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setActive(i)}
                className={`relative min-w-max flex-1 px-4 py-4 text-xs font-extrabold transition ${
                  active === i ? 'bg-white text-brand-blue' : 'text-slate-500 hover:text-brand-navy'
                }`}
              >
                {item.label}
                {active === i && (
                  <span className="absolute bottom-0 left-[18%] right-[18%] h-[3px] rounded-t-full bg-brand-green" />
                )}
              </button>
            ))}
          </div>
          <div className="grid items-center gap-10 p-6 sm:p-8 lg:grid-cols-[.9fr_1.1fr] lg:p-11">
            <div>
              {tab?.eyebrow && <div className="eyebrow">{tab.eyebrow}</div>}
              <h3 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-[-0.035em] text-brand-navy">
                {tab?.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{tab?.description}</p>
              {!!tab?.checks?.length && (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {tab.checks.slice(0, 8).map((check, i) => (
                    <div key={i} className="flex gap-2 text-xs leading-5 text-slate-600">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-greenTint text-brand-green">
                        <CheckIcon className="h-3 w-3" />
                      </span>
                      <span>{check}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <MediaPlaceholder label={tab?.label || 'Capability'} />
          </div>
        </div>
      </div>
    </section>
  )
}

export default function SectionRenderer({ section, index, isLast, form, route, onToast, onAction }) {
  const navigate = useNavigate()
  const lower = `${section.id} ${section.title}`.toLowerCase()
  const isDemo = route !== 'home' && form && (section.id === 'demo' || section.id === 'cta' || isLast)
  if (isDemo) return <DemoSection section={section} form={form} route={route} onToast={onToast} onAction={onAction} />
  if (section.tabs?.length) return <TabbedSection section={section} />
  if (section.faqs?.length) return <FAQSection section={section} />
  if (lower.includes('pricing')) return <PricingSection section={section} route={route} onAction={onAction} />
  if (isLast || lower.includes('ready-to-connect') || lower.startsWith('build-') || lower.includes('make-your-next')) {
    const handleCtaAction = () => {
      const ctaLabel = section.actions?.[0] || 'Get started'
      if (String(ctaLabel).toLowerCase() === 'start free' || String(ctaLabel).toLowerCase().includes('trial')) {
        trackCtaClick({
          landing_page_id: route,
          cta_label: ctaLabel,
          target_destination: REGISTER_URL,
        })
        window.location.href = REGISTER_URL
        return
      }
      const demoEl = document.getElementById('request') || document.getElementById('demo') || document.getElementById('cta')
      if (route !== 'home' && demoEl && demoEl.id !== section.id) {
        trackCtaClick({
          landing_page_id: route,
          cta_label: ctaLabel,
          target_destination: `#${demoEl.id}`,
        })
        demoEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
      trackCtaClick({
        landing_page_id: route,
        cta_label: ctaLabel,
        target_destination: '/contact-sales',
      })
      navigate('/contact-sales', {
        state: { enquiryType: route === 'home' ? 'early_access' : 'demo_request' },
      })
    }
    return <CTASection section={section} route={route} onAction={handleCtaAction} />
  }
  if (section.cards?.length >= 3) return <CardGridSection section={section} index={index} route={route} />
  return <SplitSection section={section} index={index} route={route} onToast={onToast} />
}
