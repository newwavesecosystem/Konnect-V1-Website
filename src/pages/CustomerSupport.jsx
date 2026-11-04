import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Footer from '../components/Footer'
import { trackPageView } from '../analytics/events'

const REQUEST_TYPES = [
  'Technical problem',
  'Customer complaint',
  'Account or access help',
  'Billing or subscription query',
  'Feature request or feedback',
  'Other',
]

const PRODUCT_AREAS = [
  'Account, sign-in & registration',
  'Dashboard & scheduling',
  'Meeting joining & waiting room',
  'Audio & microphone',
  'Video & camera',
  'Connection & reconnection',
  'Screen sharing & presentation',
  'Chat, files & documents',
  'Host controls & participant access',
  'Recording & playback',
  'Events & event registration',
  'Subscription & payments',
  'Privacy or security concern',
  'Website & mobile experience',
  'Other / not sure',
]

const PRIORITIES = [
  ['Low', 'Low — minor issue or general question'],
  ['Normal', 'Normal — some disruption; workaround available'],
  ['High', 'High — important activity blocked'],
  ['Critical', 'Critical — widespread outage or suspected security incident'],
]

const AFFECTED_SCOPES = [
  'Only me',
  'Several meeting participants',
  'My team or organisation',
  'Multiple customers / not sure',
]

function validateSelectedFiles(fileList) {
  const files = Array.from(fileList || [])
  const messages = []
  if (files.length > 3) {
    messages.push('Select no more than 3 files.')
  }
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) {
      messages.push(`${file.name} exceeds the 10 MB limit.`)
    }
    if (!/\.(png|jpe?g|pdf|txt)$/i.test(file.name)) {
      messages.push(`${file.name} is not a supported file type.`)
    }
  }
  return messages
}

export default function CustomerSupport({ onAction }) {
  const location = useLocation()
  const formRef = useRef(null)
  const errorsRef = useRef(null)
  const resultRef = useRef(null)
  const fileInputRef = useRef(null)

  const [selectedFiles, setSelectedFiles] = useState([])
  const [validationIssues, setValidationIssues] = useState([])
  const [invalidIds, setInvalidIds] = useState({})
  const [submittedDraft, setSubmittedDraft] = useState(null)

  useEffect(() => {
    document.title = 'Customer Support · Konn3ct'
    window.scrollTo({ top: 0 })
    trackPageView({ route: 'support', page_path: '/support' })
  }, [location.pathname])

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(files)
    const issues = validateSelectedFiles(files)
    if (e.target && typeof e.target.setCustomValidity === 'function') {
      e.target.setCustomValidity(issues.join(' '))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const form = formRef.current
    if (!form) return

    const controls = Array.from(form.querySelectorAll('input, select, textarea')).filter(
      (el) => el.type !== 'file'
    )
    const nextIssues = []
    const nextInvalid = {}

    controls.forEach((field) => {
      if (field.required && !field.value.trim()) {
        field.setCustomValidity('Please complete this field.')
      } else {
        field.setCustomValidity('')
      }

      if (!field.checkValidity()) {
        nextInvalid[field.id] = true
        const labelEl = form.querySelector(`label[for="${field.id}"]`)
        const labelText = labelEl?.childNodes?.[0]?.textContent?.trim() || field.name || 'Field'
        nextIssues.push([field.id, `${labelText}: ${field.validationMessage || 'Please complete this field.'}`])
      }
    })

    const fileIssues = validateSelectedFiles(selectedFiles)
    fileIssues.forEach((msg) => {
      nextInvalid['support-files'] = true
      nextIssues.push(['support-files', msg])
    })

    setInvalidIds(nextInvalid)
    setValidationIssues(nextIssues)

    if (nextIssues.length > 0) {
      requestAnimationFrame(() => {
        errorsRef.current?.focus()
      })
      return
    }

    const fieldValues = Object.fromEntries(
      controls.filter((f) => f.name).map((f) => [f.name, f.value.trim()])
    )

    const draft = {
      status: 'Support request recorded',
      createdAt: new Date().toISOString(),
      ...fieldValues,
      attachments: selectedFiles.map((f) => ({
        name: f.name,
        sizeBytes: f.size,
        type: f.type,
      })),
    }

    setSubmittedDraft(draft)
    requestAnimationFrame(() => {
      resultRef.current?.focus()
      resultRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleEdit = () => {
    setSubmittedDraft(null)
    requestAnimationFrame(() => {
      document.getElementById('support-title')?.focus()
    })
  }

  const handleDownload = () => {
    if (!submittedDraft) return
    const blob = new Blob([JSON.stringify(submittedDraft, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Konn3ct-Support-Request.json'
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <>
      <main id="main">
        <section className="support-hero">
          <div className="wrap">
            <div className="eyebrow">Customer support</div>
            <h1>
              We&rsquo;re here to help.
              <br />
              <em>Let&rsquo;s put things right.</em>
            </h1>
            <p>
              Tell us what happened, where it happened and how it affected you. Give our support
              team the details they need to understand your concern.
            </p>
          </div>
        </section>

        <section className="section support-main">
          <div className="wrap support-layout">
            <aside className="support-aside">
              <div className="support-intro">
                <span className="support-icon" aria-hidden="true">
                  ?
                </span>
                <h2>
                  A clearer path
                  <br />
                  to getting help.
                </h2>
                <p>
                  Report a problem, raise a complaint or ask for help with your Konn3ct experience.
                </p>
              </div>

              <ol className="support-steps">
                <li>
                  <strong>01 / Tell us what happened</strong>
                  <p>Choose the product area and describe the issue.</p>
                </li>
                <li>
                  <strong>02 / Help us understand the impact</strong>
                  <p>Select a priority and include useful details or screenshots.</p>
                </li>
                <li>
                  <strong>03 / Keep the conversation connected</strong>
                  <p>
                    The connected helpdesk will provide a ticket reference and follow-up through
                    your email.
                  </p>
                </li>
              </ol>

              <div className="support-help">
                <h3>Need joining guidance?</h3>
                <p>Check the quick guide for device setup, meeting access and reconnecting.</p>
                <Link to="/help" className="text-link">
                  Help with joining a meeting <span aria-hidden="true">↗</span>
                </Link>
              </div>

              <div className="support-help">
                <h3>Protect your information</h3>
                <p>
                  Do not include passwords, access codes, card details or private meeting content.
                  Mask personal information in screenshots.
                </p>
                <Link to="/privacy" className="text-link">
                  How we handle personal information <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </aside>

            <div className="support-form-card">
              <div className="support-card-head">
                <span className="eyebrow">Raise a support request</span>
                <h2>What can we help with?</h2>
                <p>
                  Fields marked <span aria-hidden="true">*</span> are required.
                </p>
              </div>

              <form
                id="support-form"
                ref={formRef}
                noValidate
                hidden={Boolean(submittedDraft)}
                onSubmit={handleSubmit}
              >
                <div
                  id="support-errors"
                  ref={errorsRef}
                  className="support-errors"
                  role="alert"
                  tabIndex={-1}
                  hidden={validationIssues.length === 0}
                >
                  {validationIssues.length > 0 && (
                    <>
                      <strong>Please check the following before continuing:</strong>
                      <ul>
                        {validationIssues.map(([id, msg], idx) => (
                          <li key={`${id}-${idx}`}>
                            <a
                              href={`#${id}`}
                              onClick={(ev) => {
                                ev.preventDefault()
                                document.getElementById(id)?.focus()
                              }}
                            >
                              {msg}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                <fieldset>
                  <legend>
                    <span>01</span> Your contact details
                  </legend>
                  <div className="support-fields">
                    <label htmlFor="support-name">
                      Name of customer <span aria-hidden="true">*</span>
                      <input
                        id="support-name"
                        name="customerName"
                        autoComplete="name"
                        required
                        maxLength={120}
                        placeholder="Your full name"
                        aria-invalid={invalidIds['support-name'] ? 'true' : undefined}
                      />
                    </label>

                    <label htmlFor="support-email">
                      Email address <span aria-hidden="true">*</span>
                      <input
                        id="support-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        maxLength={254}
                        placeholder="you@example.com"
                        aria-invalid={invalidIds['support-email'] ? 'true' : undefined}
                      />
                      <small>Use the email where you want to receive a response.</small>
                    </label>

                    <label htmlFor="support-phone">
                      Phone number <span className="optional">Optional</span>
                      <input
                        id="support-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        maxLength={30}
                        placeholder="e.g. +234 800 000 0000"
                      />
                    </label>

                    <label htmlFor="support-org">
                      Organisation <span className="optional">Optional</span>
                      <input
                        id="support-org"
                        name="organisation"
                        autoComplete="organization"
                        maxLength={160}
                        placeholder="Company, institution or community"
                      />
                    </label>
                  </div>
                </fieldset>

                <fieldset>
                  <legend>
                    <span>02</span> Your issue
                  </legend>
                  <label htmlFor="support-title">
                    Title of the issue <span aria-hidden="true">*</span>
                    <input
                      id="support-title"
                      name="title"
                      required
                      minLength={5}
                      maxLength={160}
                      placeholder="A short, clear summary of the problem"
                      aria-invalid={invalidIds['support-title'] ? 'true' : undefined}
                    />
                  </label>

                  <div className="support-fields">
                    <label htmlFor="support-type">
                      Type of request <span aria-hidden="true">*</span>
                      <select
                        id="support-type"
                        name="requestType"
                        required
                        defaultValue=""
                        aria-invalid={invalidIds['support-type'] ? 'true' : undefined}
                      >
                        <option value="">Select a request type</option>
                        {REQUEST_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label htmlFor="support-area">
                      Section of the product <span aria-hidden="true">*</span>
                      <select
                        id="support-area"
                        name="productArea"
                        required
                        defaultValue=""
                        aria-invalid={invalidIds['support-area'] ? 'true' : undefined}
                      >
                        <option value="">Select the area affected</option>
                        {PRODUCT_AREAS.map((area) => (
                          <option key={area} value={area}>
                            {area}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label htmlFor="support-priority">
                      Priority <span aria-hidden="true">*</span>
                      <select
                        id="support-priority"
                        name="priority"
                        required
                        defaultValue=""
                        aria-describedby="support-priority-help"
                        aria-invalid={invalidIds['support-priority'] ? 'true' : undefined}
                      >
                        <option value="">Select the impact</option>
                        {PRIORITIES.map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label htmlFor="support-impact">
                      Who is affected? <span className="optional">Optional</span>
                      <select id="support-impact" name="affectedUsers" defaultValue="">
                        <option value="">Select the scope</option>
                        {AFFECTED_SCOPES.map((scope) => (
                          <option key={scope} value={scope}>
                            {scope}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <p id="support-priority-help" className="support-field-note">
                    Choose the actual impact. The support team confirms priority during triage; a
                    selection does not guarantee a response time.
                  </p>

                  <label htmlFor="support-description">
                    Describe the issue <span aria-hidden="true">*</span>
                    <textarea
                      id="support-description"
                      name="description"
                      required
                      minLength={20}
                      maxLength={5000}
                      rows={6}
                      placeholder="What were you trying to do? What happened instead? Include any error message and how this affected you."
                      aria-invalid={invalidIds['support-description'] ? 'true' : undefined}
                    />
                    <small>
                      Be specific. Do not include passwords, payment details or private meeting
                      content.
                    </small>
                  </label>

                  <label htmlFor="support-steps">
                    Steps to reproduce <span className="optional">Optional</span>
                    <textarea
                      id="support-steps"
                      name="reproductionSteps"
                      maxLength={3000}
                      rows={3}
                      placeholder={
                        '1. Opened the meeting link…\n2. Selected the microphone…\n3. Saw the error…'
                      }
                    />
                  </label>
                </fieldset>

                <details className="support-extra">
                  <summary>
                    Add technical details <span>Optional</span>
                  </summary>
                  <div className="support-fields">
                    <label htmlFor="support-device">
                      Device &amp; operating system
                      <input
                        id="support-device"
                        name="device"
                        maxLength={160}
                        placeholder="e.g. Android phone, Windows laptop"
                      />
                    </label>

                    <label htmlFor="support-browser">
                      Browser or app
                      <input
                        id="support-browser"
                        name="browser"
                        maxLength={120}
                        placeholder="e.g. Chrome, Safari, Konn3ct app"
                      />
                    </label>

                    <label htmlFor="support-time">
                      When did it happen?
                      <input id="support-time" name="occurredAt" type="datetime-local" />
                      <small>Enter your local time and specify the time zone alongside it.</small>
                    </label>

                    <label htmlFor="support-zone">
                      Time zone
                      <input
                        id="support-zone"
                        name="timeZone"
                        maxLength={80}
                        placeholder="e.g. Africa/Lagos (UTC+1)"
                      />
                    </label>

                    <label htmlFor="support-reference">
                      Meeting / event / transaction reference
                      <input
                        id="support-reference"
                        name="relatedReference"
                        maxLength={160}
                        placeholder="Reference only — no access codes"
                      />
                    </label>

                    <label htmlFor="support-existing">
                      Existing ticket reference
                      <input
                        id="support-existing"
                        name="existingTicket"
                        maxLength={80}
                        placeholder="If this relates to an earlier request"
                      />
                    </label>
                  </div>
                </details>

                <fieldset>
                  <legend>
                    <span>03</span> Supporting evidence
                  </legend>
                  <label htmlFor="support-files" className="support-upload">
                    Screenshots or supporting files <span className="optional">Optional</span>
                    <input
                      id="support-files"
                      ref={fileInputRef}
                      name="attachments"
                      type="file"
                      multiple
                      accept=".png,.jpg,.jpeg,.pdf,.txt"
                      aria-describedby="support-files-help"
                      aria-invalid={invalidIds['support-files'] ? 'true' : undefined}
                      onChange={handleFileChange}
                    />
                    <small id="support-files-help">
                      Up to 3 files, 10 MB each. PNG, JPG, PDF or TXT.
                    </small>
                  </label>
                  <div id="support-file-list" aria-live="polite">
                    {selectedFiles.map((f) => (
                      <p key={`${f.name}-${f.size}`}>
                        {f.name} · {(f.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    ))}
                  </div>
                </fieldset>

                <div className="support-submit">
                  <p>
                    We use your contact details to handle this request. This form does not subscribe
                    you to marketing. Read our <Link to="/privacy">Privacy Policy</Link>.
                  </p>
                  <button className="button" type="submit">
                    Submit complaint <span aria-hidden="true">↗</span>
                  </button>
                </div>
              </form>

              <section
                id="support-result"
                ref={resultRef}
                className="support-result"
                tabIndex={-1}
                hidden={!submittedDraft}
                aria-live="polite"
              >
                {submittedDraft && (
                  <>
                    <span className="support-result-icon" aria-hidden="true">
                      ✓
                    </span>
                    <div className="eyebrow">Request summary</div>
                    <h2>Your complaint details are ready.</h2>
                    <p>
                      Review the summary below. You can download a copy of your request details or
                      edit your submission.
                    </p>
                    <dl id="support-summary">
                      <dt>Issue</dt>
                      <dd>{submittedDraft.title}</dd>
                      <dt>Customer</dt>
                      <dd>{submittedDraft.customerName}</dd>
                      <dt>Email</dt>
                      <dd>{submittedDraft.email}</dd>
                      <dt>Product area</dt>
                      <dd>{submittedDraft.productArea}</dd>
                      <dt>Priority</dt>
                      <dd>{submittedDraft.priority}</dd>
                      <dt>Evidence</dt>
                      <dd>{submittedDraft.attachments.length} file(s) selected locally</dd>
                    </dl>
                    <div className="hero-actions">
                      <button
                        type="button"
                        className="button"
                        id="support-download"
                        onClick={handleDownload}
                      >
                        Download complaint draft ↓
                      </button>
                      <button
                        type="button"
                        className="button outline"
                        id="support-edit"
                        onClick={handleEdit}
                      >
                        Edit complaint
                      </button>
                    </div>
                    <p className="fine">
                      The download contains the details you entered and attachment filenames. It
                      does not include the files themselves.
                    </p>
                  </>
                )}
              </section>
            </div>
          </div>
        </section>
      </main>

      <Footer onAction={onAction} />
    </>
  )
}
