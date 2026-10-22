import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Footer from '../components/Footer'
import { ArrowRight, CheckIcon, DeviceIcon, GlobeIcon, ShieldIcon, SparkIcon, UsersIcon, WifiIcon } from '../components/Icons'
import {
  captureUtmParameters,
  createSubmissionAttemptId,
  submitLead,
  validateClientLeadForm,
} from '../services/leads'
import { trackConfirmedLead, trackPageView } from '../analytics/events'
import { getExperimentAssignment } from '../experiments/abTest'

const featureOptions = [
  'Meetings & team collaboration',
  'Webinars & large events',
  'Training, learning & enablement',
  'AI meeting intelligence & productivity',
  'TrustLock™ governance & administration',
  'Low-bandwidth & mobile resilience',
  'Recording, replay & knowledge',
  'Community, member & customer engagement',
]

const enquiryTypeOptions = [
  { value: 'demo_request', label: 'Sales & Product Demo Request' },
  { value: 'early_access', label: 'Early Access Registration' },
  { value: 'waitlist', label: 'Join Konn3ct Waitlist' },
  { value: 'partnership', label: 'Partnership & Ecosystem Enquiry' },
  { value: 'general', label: 'General Contact & Enquiry' },
]

const featureCards = [
  {
    title: 'Meetings & collaboration',
    description: 'Run secure team, executive, customer and partner meetings across devices and locations.',
    Icon: UsersIcon,
  },
  {
    title: 'Webinars & large events',
    description: 'Host town halls, conferences, launches, public forums and large audience experiences.',
    Icon: GlobeIcon,
  },
  {
    title: 'AI productivity',
    description: 'Support captions, transcripts, summaries, Q&A and reusable meeting knowledge.',
    Icon: SparkIcon,
  },
  {
    title: 'TrustLock™ governance',
    description: 'Control participant roles, permissions, recording, moderation and institutional policies.',
    Icon: ShieldIcon,
  },
  {
    title: 'Resilient connection',
    description: 'Keep people connected across changing bandwidth conditions and real-world networks.',
    Icon: WifiIcon,
  },
  {
    title: 'Mobile-first access',
    description: 'Give people a consistent Konn3ct experience across desktop and mobile devices.',
    Icon: DeviceIcon,
  },
]

export default function ContactSales({ onToast }) {
  const location = useLocation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [interest, setInterest] = useState(featureOptions[0])
  const [enquiryType, setEnquiryType] = useState('demo_request')
  const [consentAccepted, setConsentAccepted] = useState(true)
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const attemptIdRef = useRef(createSubmissionAttemptId('contact-sales'))

  const experiment = useMemo(
    () => getExperimentAssignment('EXP-MK004-CTA-COPY', { landing_page_id: 'contact-sales' }),
    []
  )

  const selectedFeature = useMemo(
    () => (featureOptions.includes(interest) ? interest : featureOptions[0]),
    [interest]
  )

  useEffect(() => {
    document.title = 'Contact Sales | Konn3ct'
    window.scrollTo({ top: 0 })
    captureUtmParameters(location.search)
    trackPageView({ route: 'contact-sales', page_path: '/contact-sales' })

    const requestedType =
      location.state?.enquiryType || new URLSearchParams(location.search).get('type')
    if (requestedType && enquiryTypeOptions.some((o) => o.value === requestedType)) {
      setEnquiryType(requestedType)
    }
  }, [location.search, location.state])

  const handleFieldChange = () => {
    // Generate a fresh attempt ID when the user modifies form inputs after a completed submission
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
    const payload = {
      route: 'contact-sales',
      landing_page_id: 'contact-sales',
      conversion_goal_id: 'sales-enquiry',
      page_path: location.pathname || '/contact-sales',
      submission_reference: attemptIdRef.current,
      enquiryType,
      name: formData.get('name') || '',
      company: formData.get('company') || '',
      email: formData.get('email') || '',
      phone: formData.get('phone') || '',
      role: formData.get('role') || '',
      organisationType: formData.get('organisationType') || 'Corporate / SME',
      interest: selectedFeature,
      scale: formData.get('scale') || 'Up to 100',
      message: formData.get('message') || '',
      website_url: formData.get('website_url') || '',
      consentAccepted,
      marketingOptIn,
      experiment_id: experiment.experiment_id,
      variant_id: experiment.variant_id,
    }

    const validation = validateClientLeadForm(payload, { requirePhone: true })
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

      // MK-004 DEV-AT-08 & DEV-AT-09: Emit GA4 `generate_lead` ONLY after confirmed backend success
      trackConfirmedLead(response, {
        landing_page_id: 'contact-sales',
        conversion_goal_id: 'sales-enquiry',
        page_path: location.pathname || '/contact-sales',
        enquiryType,
        consentAccepted,
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
      <main>
        <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fff_0%,#F7FAFF_78%,#fff_100%)] py-14 sm:py-20 lg:py-24">
          <div className="pointer-events-none absolute -right-40 top-12 h-[520px] w-[520px] rounded-full border border-brand-blue/5 shadow-[0_0_0_80px_rgba(0,40,130,.018),0_0_0_160px_rgba(34,116,81,.016)]" />
          <div className="container-k3 relative grid items-start gap-12 lg:grid-cols-[.88fr_1.12fr] lg:gap-16">
            <div className="lg:sticky lg:top-[118px]">
              <div className="eyebrow">Talk to Konn3ct</div>
              <h1 className="mt-5 max-w-[620px] font-display text-[42px] font-extrabold leading-[1.03] tracking-[-0.045em] text-brand-navy sm:text-[54px] lg:text-[64px]">
                Contact our Sales team
              </h1>
              <p className="mt-6 max-w-[610px] text-lg leading-8 text-slate-600">
                Tell us how your organisation connects today and what you want to improve. We will help you design the right Konn3ct setup for your people, use cases, scale, network conditions and governance needs.
              </p>
              <p className="mt-4 max-w-[590px] text-sm leading-7 text-slate-500">
                Complete the form and a member of the Konn3ct team can follow up on meetings, webinars, training, enterprise administration, AI productivity, TrustLock™ controls, resilient connection and deployment options.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {['Government & public institutions','Corporates & SMEs','Associations & membership','Education & training','Faith organisations','Events & communities'].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-brand-line bg-white px-4 py-3 shadow-soft">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-greenTint text-brand-green"><CheckIcon className="h-4 w-4" /></span>
                    <span className="text-xs font-extrabold leading-5 text-brand-navy">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              onChange={handleFieldChange}
              noValidate
              aria-busy={isSubmitting}
              className="rounded-[28px] border border-brand-line bg-white p-6 shadow-float sm:p-8 lg:p-9"
            >
              <div className="mb-7 border-b border-brand-line pb-6">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-brand-green">Sales enquiry</p>
                <h2 className="mt-2 font-display text-2xl font-extrabold text-brand-navy sm:text-3xl">Tell us about your organisation</h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">A few details help us route your request to the right Konn3ct team.</p>
              </div>

              {/* Honeypot anti-spam trap (hidden from human users and screen readers) */}
              <div className="sr-only" aria-hidden="true">
                <label>
                  Website URL
                  <input type="text" name="website_url" tabIndex={-1} autoComplete="off" />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-xs font-extrabold text-slate-700">Enquiry type</span>
                  <select
                    name="enquiryType"
                    value={enquiryType}
                    onChange={(e) => setEnquiryType(e.target.value)}
                    className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
                  >
                    {enquiryTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-extrabold text-slate-700">Full name</span>
                  <input
                    required
                    name="name"
                    maxLength={120}
                    aria-invalid={Boolean(fieldErrors.name)}
                    placeholder="Your full name"
                    className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-extrabold text-slate-700">Organisation name</span>
                  <input
                    required
                    name="company"
                    maxLength={160}
                    aria-invalid={Boolean(fieldErrors.company)}
                    placeholder="Company / institution"
                    className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-extrabold text-slate-700">Work email</span>
                  <input
                    required
                    name="email"
                    type="email"
                    maxLength={160}
                    aria-invalid={Boolean(fieldErrors.email)}
                    placeholder="name@organisation.com"
                    className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-extrabold text-slate-700">Phone number</span>
                  <input
                    required
                    name="phone"
                    type="tel"
                    maxLength={25}
                    aria-invalid={Boolean(fieldErrors.phone)}
                    placeholder="+234 ..."
                    className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
                  />
                </label>

                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-xs font-extrabold text-slate-700">Organisation type</span>
                  <select name="organisationType" className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10">
                    <option>Corporate / SME</option>
                    <option>Government / Public Institution</option>
                    <option>Professional Association / Membership Organisation</option>
                    <option>University / School / Training Organisation</option>
                    <option>Church / Faith Organisation</option>
                    <option>Event / Community Organisation</option>
                    <option>Other</option>
                  </select>
                </label>

                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-xs font-extrabold text-slate-700">What are you interested in?</span>
                  <select name="interest" value={interest} onChange={(e) => setInterest(e.target.value)} className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10">
                    {featureOptions.map(option => <option key={option}>{option}</option>)}
                  </select>
                </label>

                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-xs font-extrabold text-slate-700">Expected participant / user scale</span>
                  <select name="scale" className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10">
                    <option>Up to 100</option>
                    <option>101–500</option>
                    <option>501–2,000</option>
                    <option>2,001–10,000</option>
                    <option>10,000+</option>
                    <option>Not sure yet</option>
                  </select>
                </label>

                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-xs font-extrabold text-slate-700">Tell us what you want Konn3ct to help you achieve</span>
                  <textarea
                    name="message"
                    rows="5"
                    maxLength={2000}
                    placeholder="Share your current tools, audience, meeting or event needs, deployment requirements, governance concerns or network challenges."
                    className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
                  />
                </label>
              </div>

              <div className="mt-5 space-y-2.5">
                <label className="flex items-start gap-2.5 text-xs leading-5 text-slate-600">
                  <input
                    type="checkbox"
                    name="consentAccepted"
                    checked={consentAccepted}
                    onChange={(e) => setConsentAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                  />
                  <span>
                    I agree that Konn3ct (Newwaves Ecosystem Limited) may process these details to register and respond to my enquiry in line with applicable data protection laws.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 text-xs leading-5 text-slate-500">
                  <input
                    type="checkbox"
                    name="marketingOptIn"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                  />
                  <span>
                    Keep me informed about Konn3ct product updates, early-access releases and events (optional).
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary mt-6 w-full gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting to Konn3ct...' : 'Contact sales'}{' '}
                <ArrowRight className="h-4 w-4" />
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
                  className="mt-3 rounded-xl border border-brand-green/30 bg-brand-greenTint px-3.5 py-2.5 text-xs font-bold leading-5 text-brand-green"
                >
                  {submissionResult.message}
                </div>
              )}

              {!submissionResult && !errorMessage && (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  By submitting this form, you agree that Konn3ct may use these details to respond to your sales enquiry.
                </p>
              )}
            </form>
          </div>
        </section>

        <section className="border-y border-brand-line bg-brand-cloud py-16 sm:py-20">
          <div className="container-k3">
            <div className="mx-auto max-w-3xl text-center">
              <div className="eyebrow">What we can design with you</div>
              <h2 className="section-title mt-3">One conversation. The right Konn3ct configuration.</h2>
              <p className="section-copy mx-auto mt-5">Your sales conversation can be shaped around the parts of Konn3ct that matter most to your organisation.</p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featureCards.map(({ title, description, Icon }, index) => (
                <article key={title} className="rounded-[20px] border border-brand-line bg-white p-6 shadow-soft">
                  <div className={`grid h-11 w-11 place-items-center rounded-xl ${index % 2 ? 'bg-brand-greenTint text-brand-green' : 'bg-brand-blueTint text-brand-blue'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-extrabold text-brand-navy">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
