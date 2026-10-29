import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Footer from '../components/Footer'
import { REGISTER_URL } from '../data/metadata'
import {
  captureUtmParameters,
  createSubmissionAttemptId,
  submitLead,
  validateClientLeadForm,
} from '../services/leads'
import { trackConfirmedLead, trackPageView } from '../analytics/events'
import { getExperimentAssignment } from '../experiments/abTest'

const INTENT_OPTIONS = [
  {
    value: 'Book a product demo',
    enquiryType: 'demo_request',
    label: 'Book a product demo',
  },
  {
    value: 'Discuss an organisation deployment',
    enquiryType: 'demo_request',
    label: 'Discuss an organisation deployment',
  },
  {
    value: 'Discuss an association trial',
    enquiryType: 'early_access',
    label: 'Discuss an association trial',
  },
  {
    value: 'Explore a partnership',
    enquiryType: 'partnership',
    label: 'Explore a partnership',
  },
  {
    value: 'Ask a general question',
    enquiryType: 'general',
    label: 'Ask a general question',
  },
]

function resolveEnquiryType(intentValue) {
  const matched = INTENT_OPTIONS.find(
    (opt) => opt.value === intentValue || opt.enquiryType === intentValue
  )
  return matched ? matched.enquiryType : 'demo_request'
}

export default function ContactSales({ onToast, onAction }) {
  const location = useLocation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [intent, setIntent] = useState('')
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const attemptIdRef = useRef(createSubmissionAttemptId('contact-sales'))

  const experiment = useMemo(
    () => getExperimentAssignment('EXP-MK004-CTA-COPY', { landing_page_id: 'contact-sales' }),
    []
  )

  useEffect(() => {
    document.title = 'Contact sales · Konn3ct'
    window.scrollTo({ top: 0 })
    captureUtmParameters(location.search)
    trackPageView({ route: 'contact-sales', page_path: '/contact-sales' })

    const requestedType =
      location.state?.enquiryType || new URLSearchParams(location.search).get('type')
    if (requestedType) {
      const matched = INTENT_OPTIONS.find(
        (o) => o.enquiryType === requestedType || o.value === requestedType
      )
      if (matched) {
        setIntent(matched.value)
      }
    }
  }, [location.search, location.state])

  const handleFieldChange = () => {
    if (submissionResult) {
      setSubmissionResult(null)
      attemptIdRef.current = createSubmissionAttemptId('contact-sales')
    }
    if (errorMessage) {
      setErrorMessage('')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    const formEl = event.currentTarget
    const formData = new FormData(formEl)
    const rawIntent = formData.get('intent') || intent
    if (!rawIntent) {
      setFieldErrors({ intent: 'Please select what you would like to do.' })
      setErrorMessage('Please complete the highlighted fields before continuing.')
      return
    }

    const nameVal = (formData.get('name') || '').trim()
    const emailVal = (formData.get('email') || '').trim()
    const orgVal = (formData.get('organisation') || formData.get('company') || '').trim()
    const roleVal = (formData.get('role') || '').trim()
    const contextVal = (formData.get('context') || formData.get('goal') || formData.get('message') || '').trim()
    const deploymentVal = (formData.get('deployment') || '').trim()
    const pilotVal = (formData.get('pilot') || formData.get('pilot_session') || '').trim()
    const partnershipVal = (formData.get('partnership') || formData.get('partner_focus') || '').trim()

    const extraNotes = [
      rawIntent ? `Selected Intent: ${rawIntent}` : '',
      deploymentVal ? `Deployment / Governance Requirements: ${deploymentVal}` : '',
      pilotVal ? `Proposed Member Session: ${pilotVal}` : '',
      partnershipVal ? `Partnership Focus: ${partnershipVal}` : '',
      contextVal,
    ]
      .filter(Boolean)
      .join('\n')

    const resolvedEnquiryType = resolveEnquiryType(rawIntent)

    const payload = {
      route: 'contact-sales',
      landing_page_id: 'contact-sales',
      conversion_goal_id: 'sales-enquiry',
      page_path: location.pathname || '/contact-sales',
      submission_reference: attemptIdRef.current,
      enquiryType: resolvedEnquiryType,
      name: nameVal,
      company: orgVal || 'Individual / Unspecified',
      email: emailVal,
      phone: (formData.get('phone') || '').trim(),
      role: roleVal,
      organisationType: rawIntent.includes('association')
        ? 'Professional Association / Membership Organisation'
        : rawIntent.includes('deployment')
        ? 'Enterprise / Institutional Deployment'
        : 'Corporate / SME',
      interest: rawIntent,
      scale: 'Up to 100',
      message: extraNotes,
      website_url: formData.get('website_url') || '',
      consentAccepted: true,
      marketingOptIn,
      experiment_id: experiment.experiment_id,
      variant_id: experiment.variant_id,
    }

    const validation = validateClientLeadForm(payload, {
      requirePhone: false,
      requireCompany: false,
    })
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
        landing_page_id: 'contact-sales',
        conversion_goal_id: 'sales-enquiry',
        page_path: location.pathname || '/contact-sales',
        enquiryType: resolvedEnquiryType,
        consentAccepted: true,
        experiment_id: experiment.experiment_id,
        variant_id: experiment.variant_id,
      })

      onToast?.(
        response.deliveryStatus === 'crm_created'
          ? `${response.classification} registered (${response.leadReference})`
          : `${response.classification} queued (${response.leadReference})`
      )
    } catch (err) {
      setFieldErrors(err.fieldErrors || {})
      setErrorMessage(
        err.message || 'Unable to submit your request right now. Please try again.'
      )
      onToast?.('Submission could not be completed. Please review the form message.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-brand-ink">
      <main id="main">
        <section className="contact-hero">
          <div className="wrap">
            <div className="eyebrow">Talk to Konn3ct</div>
            <h1>
              Book a demo.
              <br />
              Discuss <em style={{ fontStyle: 'normal', color: '#227451' }}>what matters.</em>
            </h1>
            <p>
              Tell us what you want to achieve. We will confirm the capabilities, package and
              support available for your use case.
            </p>
          </div>
        </section>

        <section className="section" style={{ paddingTop: '30px' }}>
          <div className="wrap request-grid">
            <div>
              <div className="eyebrow">A conversation with a purpose</div>
              <h2>
                The right next step
                <br />
                for your people.
              </h2>
              <p>
                Whether you are planning a member training, an institutional rollout or a community
                gathering, start with the outcome you need.
              </p>

              <ul className="sector-list">
                <li>
                  <span>01</span>A relevant demonstration
                </li>
                <li>
                  <span>02</span>Clear scope and package discussion
                </li>
                <li>
                  <span>03</span>A practical follow-up plan
                </li>
              </ul>

              <div className="contact-help">
                <h3 style={{ fontSize: '19px' }}>Ready to start on your own?</h3>
                <p>Trials and purchases have their own journeys.</p>
                <div className="hero-actions">
                  <a className="button small" href={REGISTER_URL}>
                    Start 7-day trial <span aria-hidden="true">↗</span>
                  </a>
                  <button
                    className="button small outline"
                    type="button"
                    onClick={() => onAction?.('purchase')}
                  >
                    Buy a plan <span aria-hidden="true">↗</span>
                  </button>
                </div>
              </div>

              <div className="proof-slot" style={{ marginTop: '30px' }}>
                <div className="evidence-title">Service design placement</div>
                <h3 style={{ fontSize: '18px' }}>Keep human help close.</h3>
                <p>
                  Insert the verified, staffed WhatsApp/support route and accurate response
                  expectation here before implementation.
                </p>
              </div>
            </div>

            <div className="request-panel">
              <div className="micro-label">Your enquiry</div>
              <h3>Request a conversation</h3>

              {submissionResult && !errorMessage ? (
                <div className="form-message show" role="status" aria-live="polite">
                  <strong>Your request has been received</strong>
                  <p>
                    {submissionResult.message ||
                      'Your request has been registered with the Konn3ct team.'}
                  </p>
                  <button
                    className="button outline small"
                    type="button"
                    onClick={() => {
                      setSubmissionResult(null)
                      attemptIdRef.current = createSubmissionAttemptId('contact-sales')
                    }}
                  >
                    Back to the form
                  </button>
                </div>
              ) : (
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
                    <label className="full">
                      What would you like to do? *
                      <select
                        name="intent"
                        required
                        id="intent"
                        value={intent}
                        onChange={(e) => setIntent(e.target.value)}
                        aria-invalid={Boolean(fieldErrors.intent)}
                      >
                        <option value="">Select an enquiry type</option>
                        {INTENT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Your name *
                      <input
                        name="name"
                        type="text"
                        required
                        placeholder="Full name"
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
                        placeholder="you@example.com"
                        autoComplete="email"
                        maxLength={160}
                        aria-invalid={Boolean(fieldErrors.email)}
                      />
                    </label>

                    <label>
                      Organisation or community <span className="optional">Optional</span>
                      <input
                        name="organisation"
                        type="text"
                        placeholder="Organisation name"
                        autoComplete="organization"
                        maxLength={160}
                      />
                    </label>

                    <label>
                      Your role <span className="optional">Optional</span>
                      <input
                        name="role"
                        type="text"
                        placeholder="Role or responsibility"
                        maxLength={120}
                      />
                    </label>

                    <label className="full">
                      What would you like to improve? <span className="optional">Optional</span>
                      <textarea
                        name="context"
                        maxLength={2000}
                        placeholder="A short description helps us prepare the conversation."
                      />
                    </label>

                    <div className="full" id="intent-extra">
                      {intent.includes('deployment') && (
                        <label>
                          Deployment or governance requirements{' '}
                          <span className="optional">Optional</span>
                          <textarea
                            name="deployment"
                            placeholder="Data location, provisioning, reporting or integration needs"
                          />
                        </label>
                      )}
                      {intent.includes('association') && (
                        <label>
                          Proposed member session <span className="optional">Optional</span>
                          <input
                            name="pilot"
                            placeholder="Training topic, intended audience or preferred timing"
                          />
                        </label>
                      )}
                      {intent.includes('partnership') && (
                        <label>
                          Partnership focus <span className="optional">Optional</span>
                          <input
                            name="partnership"
                            placeholder="Tell us about the opportunity you want to explore"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {errorMessage && (
                    <div
                      role="alert"
                      aria-live="assertive"
                      style={{
                        marginTop: '12px',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        color: '#b91c1c',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {errorMessage}
                    </div>
                  )}

                  <p className="privacy-note">
                    We use these details to respond to your enquiry. Read our{' '}
                    <button type="button" onClick={() => onAction?.('policy:Privacy')}>
                      privacy information
                    </button>
                    .
                  </p>

                  <label className="consent">
                    <input
                      name="marketing"
                      type="checkbox"
                      checked={marketingOptIn}
                      onChange={(e) => setMarketingOptIn(e.target.checked)}
                    />
                    <span>Keep me informed about Konn3ct updates and events. Optional.</span>
                  </label>

                  <button className="button" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting to Konn3ct...' : 'Request a conversation'}{' '}
                    <span aria-hidden="true">↗</span>
                  </button>

                  <p className="fine">
                    Your details are transmitted securely to the Konn3ct team via Newwaves Ecosystem
                    CRM.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer onAction={onAction} />
    </div>
  )
}
