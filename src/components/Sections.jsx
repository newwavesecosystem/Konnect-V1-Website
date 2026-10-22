import React, { useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckIcon, DeviceIcon, GlobeIcon, ShieldIcon, SparkIcon, UsersIcon, WifiIcon } from './Icons'
import MediaPlaceholder from './MediaPlaceholder'
import { getRouteConversionMeta, routePaths } from '../data/metadata'
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
  'corporates & smes': 'corporates',
  'universities & training': 'education',
  'associations & memberships': 'associations',
  'churches & religious organisations': 'faith',
  'events & communities': 'events-community',
}

function isDarkSection(section) {
  const t = `${section.id} ${section.title}`.toLowerCase()
  return t.includes('trust') || t.includes('governance') || t.includes('network') || t.includes('bandwidth') || t.includes('connectivity') || t.includes('reliability')
}

function SectionHeading({ section, dark = false, centered = false }) {
  return (
    <div className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      {section.eyebrow && <div className={`eyebrow ${dark ? '!text-slate-300' : ''}`}>{section.eyebrow}</div>}
      <h2 className={`section-title mt-3 ${dark ? '!text-white' : ''}`}>{section.title}</h2>
      {section.intro && <p className={`section-copy mt-5 ${dark ? '!text-slate-300' : ''}`}>{section.intro}</p>}
    </div>
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
    <section id={section.id} className={`scroll-mt-36 py-20 sm:py-24 ${dark ? 'bg-brand-navy text-white' : index % 2 ? 'bg-brand-cloud' : 'bg-white'}`}>
      <div className="container-k3">
        <SectionHeading section={section} dark={dark} centered={section.cards.length >= 5} />
        <div className={`mt-10 grid gap-4 ${section.cards.length >= 5 ? 'md:grid-cols-2 lg:grid-cols-3' : section.cards.length >= 3 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2'}`}>
          {section.cards.map((card, i) => {
            const Icon = iconSet[i % iconSet.length]
            const targetRoute = isSolutionsSection ? solutionCardRouteMap[String(card.title || '').toLowerCase()] : null
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
                className={`rounded-[20px] border p-6 transition hover:-translate-y-1 ${targetRoute ? 'cursor-pointer' : ''} ${dark ? 'border-white/10 bg-white/[0.055]' : 'border-brand-line bg-white shadow-soft hover:shadow-float'}`}
              >
                <div className={`mb-5 grid h-11 w-11 place-items-center rounded-xl ${i % 2 ? 'bg-brand-greenTint text-brand-green' : 'bg-brand-blueTint text-brand-blue'} ${dark ? '!bg-white/10 !text-white' : ''}`}><Icon className="h-5 w-5" /></div>
                <h3 className={`font-display text-lg font-extrabold leading-6 ${dark ? 'text-white' : 'text-brand-navy'}`}>{card.title}</h3>
                {card.description && <p className={`mt-3 text-sm leading-6 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{card.description}</p>}
                {!!card.checks?.length && <div className="mt-4 space-y-2 border-t border-current/10 pt-4">{card.checks.slice(0,4).map((check, j) => <div key={j} className={`flex gap-2 text-xs ${dark ? 'text-slate-300' : 'text-slate-600'}`}><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-green"/><span>{check}</span></div>)}</div>}
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

    // Commercial / Demo / Requirements CTAs navigate to the on-page demo form or /contact-sales
    if (
      lowerLabel.includes('discuss') ||
      lowerLabel.includes('plan') ||
      lowerLabel.includes('demo') ||
      lowerLabel.includes('sales') ||
      lowerLabel.includes('start')
    ) {
      const demoEl = document.getElementById('demo') || document.getElementById('cta')
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

    // Interactive product mode toggles (e.g., Keep adaptive / Audio only / Language options)
    trackCtaClick({
      landing_page_id: route,
      cta_label: actionLabel,
      target_destination: `#${section.id}`,
    })
    onToast?.(`${actionLabel} mode selected.`)
  }

  return (
    <section id={section.id} className={`scroll-mt-36 py-20 sm:py-24 ${dark ? 'bg-brand-navy text-white' : index % 2 ? 'bg-brand-cloud' : 'bg-white'}`}>
      <div className={`container-k3 grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${reverse ? '' : ''}`}>
        <div className={reverse ? 'lg:order-2' : ''}>
          <SectionHeading section={section} dark={dark} />
          {!!section.body?.length && <div className="mt-6 space-y-3">{section.body.map((p, i) => <p key={i} className={`text-sm leading-7 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{p}</p>)}</div>}
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
                      : `btn-secondary ${dark ? '!border-white/20 !bg-transparent !text-white hover:!bg-white/10' : ''}`
                  }
                >
                  {a}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={reverse ? 'lg:order-1' : ''}><MediaPlaceholder dark={dark} label={section.eyebrow || 'Konn3ct experience'} /></div>
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
              <button key={item.label} onClick={() => setActive(i)} className={`relative min-w-max flex-1 px-4 py-4 text-xs font-extrabold transition ${active === i ? 'bg-white text-brand-blue' : 'text-slate-500 hover:text-brand-navy'}`}>
                {item.label}
                {active === i && <span className="absolute bottom-0 left-[18%] right-[18%] h-[3px] rounded-t-full bg-brand-green" />}
              </button>
            ))}
          </div>
          <div className="grid items-center gap-10 p-6 sm:p-8 lg:grid-cols-[.9fr_1.1fr] lg:p-11">
            <div>
              {tab?.eyebrow && <div className="eyebrow">{tab.eyebrow}</div>}
              <h3 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-[-0.035em] text-brand-navy">{tab?.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{tab?.description}</p>
              {!!tab?.checks?.length && <div className="mt-6 grid gap-3 sm:grid-cols-2">{tab.checks.slice(0,8).map((check, i) => <div key={i} className="flex gap-2 text-xs leading-5 text-slate-600"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-greenTint text-brand-green"><CheckIcon className="h-3 w-3" /></span><span>{check}</span></div>)}</div>}
            </div>
            <MediaPlaceholder label={tab?.label || 'Capability'} />
          </div>
        </div>
      </div>
    </section>
  )
}

export function PricingSection({ section, route = 'home' }) {
  const navigate = useNavigate()
  const handlePlanSelect = (index, label) => {
    const enquiryType = index === 0 ? 'early_access' : 'demo_request'
    trackCtaClick({
      landing_page_id: route,
      cta_label: label,
      target_destination: '/contact-sales',
    })
    navigate('/contact-sales', { state: { enquiryType } })
  }

  return (
    <section id={section.id} className="scroll-mt-36 bg-brand-cloud py-20 sm:py-24">
      <div className="container-k3">
        <SectionHeading section={section} centered />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {section.cards.map((card, i) => {
            const btnLabel = i === 0 ? 'Start free' : i === 1 ? 'Explore paid plans' : 'Talk to sales'
            return (
              <article key={card.title} className={`relative rounded-[26px] border p-7 ${i === 1 ? 'border-brand-blue bg-brand-navy text-white shadow-float' : 'border-brand-line bg-white shadow-soft'}`}>
                {i === 1 && <span className="absolute right-5 top-5 rounded-full bg-brand-green px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">Popular</span>}
                <h3 className={`font-display text-2xl font-extrabold ${i === 1 ? 'text-white' : 'text-brand-navy'}`}>{card.title}</h3>
                <p className={`mt-3 text-sm leading-6 ${i === 1 ? 'text-slate-300' : 'text-slate-600'}`}>{card.description}</p>
                <div className={`my-6 h-px ${i === 1 ? 'bg-white/10' : 'bg-brand-line'}`} />
                <div className="space-y-3">{card.checks?.map((check, j) => <div key={j} className={`flex gap-2 text-sm ${i === 1 ? 'text-slate-200' : 'text-slate-600'}`}><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />{check}</div>)}</div>
                <button
                  type="button"
                  onClick={() => handlePlanSelect(i, btnLabel)}
                  className={`mt-7 w-full ${i === 1 ? 'btn-primary !bg-brand-green' : 'btn-secondary'}`}
                >
                  {btnLabel}
                </button>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function FAQSection({ section }) {
  const [open, setOpen] = useState(0)
  return (
    <section id={section.id} className="scroll-mt-36 bg-white py-20 sm:py-24">
      <div className="container-k3 max-w-4xl">
        <SectionHeading section={section} centered />
        <div className="mt-9 overflow-hidden rounded-[22px] border border-brand-line bg-white shadow-soft">
          {section.faqs.map((item, i) => (
            <div key={item.q} className="border-b border-brand-line last:border-b-0">
              <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-6 px-5 py-5 text-left font-display text-sm font-extrabold text-brand-navy sm:px-7 sm:text-base">
                <span>{item.q}</span><span className="text-xl font-medium text-brand-blue">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && <div className="px-5 pb-6 text-sm leading-7 text-slate-600 sm:px-7">{item.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CTASection({ section, onAction }) {
  return (
    <section id={section.id} className="scroll-mt-36 bg-white py-14 sm:py-20">
      <div className="container-k3">
        <div className="relative overflow-hidden rounded-[32px] bg-brand-blue px-7 py-10 text-white sm:px-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10 lg:px-12 lg:py-12">
          <div className="absolute -right-24 -top-20 h-80 w-80 rounded-full border border-white/10 shadow-[0_0_0_55px_rgba(255,255,255,.035),0_0_0_110px_rgba(34,116,81,.08)]" />
          <div className="relative">
            {section.eyebrow && <div className="eyebrow !text-slate-200">{section.eyebrow}</div>}
            <h2 className="mt-3 max-w-3xl font-display text-3xl font-extrabold leading-tight tracking-[-0.035em] text-white sm:text-4xl">{section.title}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100">{section.intro}</p>
          </div>
          <div className="relative mt-7 flex flex-wrap gap-3 lg:mt-0">
            <button onClick={onAction} className="btn-primary !bg-brand-green">{section.actions?.[0] || 'Get started'} <ArrowRight className="ml-2 h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </section>
  )
}

export function DemoSection({ section, form, route = 'demo', onSubmitted, onToast }) {
  const location = useLocation()
  const fields = form?.fields || []
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [consentAccepted, setConsentAccepted] = useState(true)
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
    const payload = {
      route,
      landing_page_id: routeMeta.landing_page_id,
      conversion_goal_id: routeMeta.conversion_goal_id,
      page_path: location.pathname || routeMeta.path,
      submission_reference: attemptIdRef.current,
      enquiryType: 'demo_request',
      website_url: formData.get('website_url') || '',
      consentAccepted,
      experiment_id: experiment.experiment_id,
      variant_id: experiment.variant_id,
    }

    for (const field of fields) {
      payload[field.name] = formData.get(field.name) || ''
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

      // MK-004 DEV-AT-08 & DEV-AT-09: Emit GA4 `generate_lead` ONLY after confirmed backend success
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

  return (
    <section id={section.id} className="scroll-mt-36 bg-brand-cloud py-20 sm:py-24">
      <div className="container-k3 grid items-start gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-14">
        <div>
          <SectionHeading section={section} />
          {!!section.cards?.length && <div className="mt-8 grid gap-3">{section.cards.slice(0,3).map((card, i) => <div key={i} className="rounded-2xl border border-brand-line bg-white p-5"><h3 className="font-display text-sm font-extrabold text-brand-navy">{card.title}</h3>{card.description && <p className="mt-2 text-xs leading-5 text-slate-600">{card.description}</p>}</div>)}</div>}
          <div className="mt-6"><MediaPlaceholder label="Demo visual" /></div>
        </div>
        <form
          onSubmit={handleSubmit}
          onChange={handleFieldChange}
          noValidate
          aria-busy={isSubmitting}
          className="rounded-[26px] border border-brand-line bg-white p-6 shadow-float sm:p-8"
        >
          <div className="mb-6"><span className="eyebrow">Request</span><h3 className="mt-2 font-display text-2xl font-extrabold text-brand-navy">{section.cards?.slice(-1)[0]?.title || section.title}</h3></div>

          {/* Honeypot anti-spam trap */}
          <div className="sr-only" aria-hidden="true">
            <label>
              Website URL
              <input type="text" name="website_url" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field, i) => {
              const wide = field.type === 'textarea' || field.label.toLowerCase().includes('primary') || field.label.toLowerCase().includes('what would') || field.label.toLowerCase().includes('context')
              const isRequired = ['name', 'email', 'institution', 'org', 'company', 'organisation'].includes(field.name)
              const autoCompleteMap = {
                name: 'name',
                email: 'email',
                phone: 'tel',
                institution: 'organization',
                org: 'organization',
                company: 'organization',
                organisation: 'organization',
                title: 'organization-title',
                role: 'organization-title',
              }
              const hasFieldError = Boolean(
                fieldErrors[field.name] ||
                  (isRequired && field.name !== 'name' && field.name !== 'email' && fieldErrors.company)
              )
              return (
                <label key={`${field.name}-${i}`} className={`grid gap-2 ${wide ? 'sm:col-span-2' : ''}`}>
                  <span className="text-xs font-extrabold text-slate-700">{field.label}</span>
                  {field.type === 'select' ? (
                    <select name={field.name} className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10">
                      {(field.options || []).map((o, j) => (
                        <option key={j}>{o}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      name={field.name}
                      placeholder={field.placeholder}
                      rows="4"
                      maxLength={2000}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
                    />
                  ) : (
                    <input
                      name={field.name}
                      required={isRequired}
                      autoComplete={autoCompleteMap[field.name] || 'on'}
                      aria-invalid={hasFieldError}
                      type={field.type === 'email' ? 'email' : field.name === 'phone' ? 'tel' : 'text'}
                      placeholder={field.placeholder}
                      maxLength={160}
                      className={`h-12 rounded-xl border ${hasFieldError ? 'border-red-500 bg-red-50/30' : 'border-slate-300 bg-white'} px-3 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10`}
                    />
                  )}
                </label>
              )
            })}
          </div>

          <label className="mt-5 flex items-start gap-2.5 text-xs leading-5 text-slate-600">
            <input
              type="checkbox"
              name="consentAccepted"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
            />
            <span>
              I agree that Konn3ct (Newwaves Ecosystem Limited) may process these details to respond to my demo request.
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting request...' : form?.submit || 'Request demo'}
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
              Your details are transmitted securely to the Konn3ct team via Newwaves Ecosystem CRM.
            </p>
          )}
        </form>
      </div>
    </section>
  )
}

export default function SectionRenderer({ section, index, isLast, form, route, onToast }) {
  const navigate = useNavigate()
  const lower = `${section.id} ${section.title}`.toLowerCase()
  const isDemo = route !== 'home' && form && (section.id === 'demo' || section.id === 'cta' || isLast)
  if (isDemo) return <DemoSection section={section} form={form} route={route} onToast={onToast} />
  if (section.tabs?.length) return <TabbedSection section={section} />
  if (section.faqs?.length) return <FAQSection section={section} />
  if (lower.includes('pricing')) return <PricingSection section={section} route={route} />
  if (isLast || lower.includes('ready-to-connect') || lower.startsWith('build-') || lower.includes('make-your-next')) {
    const handleCtaAction = () => {
      const demoEl = document.getElementById('demo') || document.getElementById('cta')
      if (route !== 'home' && demoEl && demoEl.id !== section.id) {
        trackCtaClick({
          landing_page_id: route,
          cta_label: section.actions?.[0] || 'Get started',
          target_destination: `#${demoEl.id}`,
        })
        demoEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
      trackCtaClick({
        landing_page_id: route,
        cta_label: section.actions?.[0] || 'Get started',
        target_destination: '/contact-sales',
      })
      navigate('/contact-sales', {
        state: { enquiryType: route === 'home' ? 'early_access' : 'demo_request' },
      })
    }
    return <CTASection section={section} onAction={handleCtaAction} />
  }
  if (section.cards?.length >= 3) return <CardGridSection section={section} index={index} route={route} />
  return <SplitSection section={section} index={index} route={route} onToast={onToast} />
}
