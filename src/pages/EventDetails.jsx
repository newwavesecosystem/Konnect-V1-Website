import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Footer from '../components/Footer'
import { fetchEventByRef } from '../services/eventsApi'
import {
  initializePaidEventCheckout,
  openPaystackCheckout,
  registerFreeEvent,
} from '../services/eventCommerceApi'
import { trackPageView } from '../analytics/events'

const formatDate = (event) => {
  if (!event?.date) return 'Date to be announced'
  const parsed = new Date(`${event.date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return event.date
  return parsed.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const formatTime = (event) => {
  if (!event?.time) return 'Time to be announced'
  const [hours, minutes] = String(event.time).split(':').map(Number)
  if (!Number.isFinite(hours)) return event.time
  const parsed = new Date(2000, 0, 1, hours, Number.isFinite(minutes) ? minutes : 0)
  return parsed.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

const formatPrice = (event) => {
  if (!event || event.free || Number(event.amount) <= 0) return 'Free'
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: event.currency || 'NGN',
      maximumFractionDigits: 0,
    }).format(event.amount)
  } catch {
    return `${event.currency || 'NGN'} ${Number(event.amount || 0).toLocaleString()}`
  }
}

const getStatus = (event) => {
  if (!event?.start) return 'Upcoming'
  return event.start.getTime() < Date.now() ? 'Ended' : 'Upcoming'
}

const toneForEvent = (event) => {
  const tones = ['blue', 'green', 'mint', 'navy']
  const seed = String(event?.ref || event?.title || '')
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return tones[seed % tones.length]
}

function EventPoster({ event }) {
  const [imageFailed, setImageFailed] = useState(false)
  const imageUrl = event?.banner || event?.logo || event?.image

  if (imageUrl && !imageFailed) {
    return (
      <div className="ev-poster ev-poster-has-image large">
        <img
          className="ev-poster-image"
          src={imageUrl}
          alt={`${event?.title || 'Konn3ct event'} banner`}
          loading="eager"
          onError={() => setImageFailed(true)}
        />
      </div>
    )
  }

  const label = event?.tags?.[0]
    ? `Connect around ${event.tags[0]}.`
    : 'Find your people. Make your next connection.'

  return (
    <div className={`ev-poster ${toneForEvent(event)} large`}>
      <div className="ev-poster-top"><span>Konn3ct / {event?.category || 'Event'}</span><span>↗</span></div>
      <strong>{label}</strong>
      <div className="ev-poster-bottom"><span>{formatDate(event)}</span><span>{event?.format || 'Online'}</span></div>
    </div>
  )
}

function downloadCalendar(event) {
  const start = event?.start
  if (!start) return
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  const toUtc = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const escapeIcs = (value) => String(value || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Konn3ct//Public Events//EN',
    'BEGIN:VEVENT',
    `UID:${escapeIcs(event.ref)}@konn3ct.com`,
    `DTSTAMP:${toUtc(new Date())}`,
    `DTSTART:${toUtc(start)}`,
    `DTEND:${toUtc(end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
    `LOCATION:${escapeIcs(event.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `Konn3ct-${event.ref}.ics`
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function EventDetails({ onAction }) {
  const { ref } = useParams()
  const routeRef = useMemo(() => decodeURIComponent(ref || ''), [ref])
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' })

  useEffect(() => {
    trackPageView({ route: 'events', page_path: `/event/${routeRef}` })
    window.scrollTo(0, 0)
  }, [routeRef])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    fetchEventByRef(routeRef, 'GLOBAL')
      .then((data) => {
        if (!active) return
        if (!data) {
          setError('This public event could not be found.')
          return
        }
        setEvent(data)
        document.title = `${data.title} | Konn3ct Events`
      })
      .catch((err) => {
        if (active) setError(err?.message || 'Unable to load this event.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [routeRef])

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }))
    if (message) setMessage('')
  }

  const handleRegistration = async (submitEvent) => {
    submitEvent.preventDefault()
    if (!event || submitLoading) return

    setSubmitLoading(true)
    setMessage('')
    setSuccess(false)

    try {
      if (event.free) {
        const response = await registerFreeEvent({
          ref: event.ref || routeRef,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        })
        setSuccess(true)
        setMessage(response?.message || 'Your registration has been confirmed.')
      } else {
        const checkout = await initializePaidEventCheckout({
          eventId: event.eventId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        })

        await openPaystackCheckout({
          checkout,
          onSuccess: () => {
            setSuccess(true)
            setMessage('Payment completed. Your Konn3ct event registration is being confirmed.')
          },
          onCancel: () => setMessage('Payment was not completed. You can try again when you are ready.'),
          onError: (err) => setMessage(err?.message || 'Paystack could not complete the transaction.'),
        })
      }
    } catch (err) {
      if (err?.code === 'ALREADY_REGISTERED') {
        setMessage('This email or phone number is already registered for the event.')
      } else if (err?.code === 'ALREADY_PAID') {
        setMessage('A completed payment already exists for this event registration.')
      } else {
        setMessage(err?.message || 'Registration could not be completed. Please try again.')
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  if (loading) {
    return (
      <main id="main">
        <section className="section ev-detail ev-detail-state">
          <div className="wrap"><div className="ev-service-message"><strong>Loading event…</strong></div></div>
        </section>
        <Footer onAction={onAction} />
      </main>
    )
  }

  if (error || !event) {
    return (
      <main id="main">
        <section className="section ev-detail ev-detail-state">
          <div className="wrap">
            <Link className="text-link" to="/events">← Back to all events</Link>
            <div className="ev-service-message error">
              <strong>Event unavailable</strong>
              <p>{error || 'This public event could not be found.'}</p>
              <Link className="button outline" to="/events">Explore public events ↗</Link>
            </div>
          </div>
        </section>
        <Footer onAction={onAction} />
      </main>
    )
  }

  const status = getStatus(event)
  const closed = status === 'Ended'

  return (
    <main id="main">
      <section className="section ev-detail">
        <div className="wrap">
          <Link className="text-link" to="/events">← Back to all events</Link>
          <p className="ev-live-note">Public event information supplied by the Konn3ct events service.</p>

          <div className="ev-detail-top">
            <EventPoster event={event} />
            <aside className="ev-booking">
              <div className="ev-badges">
                <span>{event.format}</span>
                <span className={`ev-status ${status.toLowerCase()}`}>{status}</span>
              </div>
              <h2>{closed ? 'This event has ended.' : 'Make your next connection.'}</h2>
              <p>{closed ? 'Registration is closed for this event.' : 'Review the details below before reserving your place.'}</p>
              <div className="ev-ticket-price">{formatPrice(event)}<small>{event.free ? 'Admission' : 'Event ticket'}</small></div>
              <dl>
                <dt>Date</dt><dd>{formatDate(event)}</dd>
                <dt>Time</dt><dd>{formatTime(event)}<small>{event.timezone}</small></dd>
                <dt>Location</dt><dd>{event.location}</dd>
              </dl>
              {closed ? (
                <Link className="button outline" to="/events">Discover other events ↗</Link>
              ) : (
                <a className="button" href="#reserve">{event.free ? 'Reserve your place' : 'Register & pay'} ↗</a>
              )}
              <button className="ev-calendar" type="button" onClick={() => downloadCalendar(event)}>Add to calendar ↓</button>
            </aside>
          </div>

          <div className="ev-detail-body">
            <div>
              <div className="eyebrow">{event.category}</div>
              <h1>{event.title}</h1>
              <p className="ev-host">Hosted by {event.organizer}</p>

              <h2>About this event</h2>
              <p>{event.description}</p>

              {event.tags?.length ? (
                <>
                  <h2>Topics</h2>
                  <div className="ev-topic-tags">
                    {event.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                </>
              ) : null}

              <h2>Your host</h2>
              <p>{event.organizer}</p>

              <details className="ev-faq">
                <summary>How do I join?</summary>
                <p>Complete the registration process for this event. Use the event confirmation and joining instructions provided by Konn3ct or the organiser.</p>
              </details>
              <details className="ev-faq">
                <summary>What if the event changes?</summary>
                <p>Check this public event page and any organiser communication for current event information before attending.</p>
              </details>
              <details className="ev-faq">
                <summary>Are recordings or replays included?</summary>
                <p>Replay availability depends on the organiser’s event settings and recording permissions.</p>
              </details>
              <a
                className="text-link ev-report"
                href={`mailto:support@konn3ct.com?subject=${encodeURIComponent(`Report public event: ${event.title} (${event.ref})`)}`}
              >
                Report this event
              </a>
            </div>

            <section id="reserve" className="ev-registration">
              <div className="eyebrow">{closed ? 'Registration closed' : 'Event registration'}</div>
              <h2>{closed ? 'Find your next event.' : 'Your place in the conversation.'}</h2>
              {closed ? (
                <>
                  <p>This event is no longer accepting registrations.</p>
                  <Link className="button outline" to="/events">Explore events ↗</Link>
                </>
              ) : success && event.free ? (
                <div className="ev-registration-success" role="status">
                  <strong>Registration confirmed.</strong>
                  <p>{message}</p>
                  <button className="button outline" type="button" onClick={() => downloadCalendar(event)}>Add to calendar ↓</button>
                </div>
              ) : (
                <form onSubmit={handleRegistration}>
                  <label>
                    Full name
                    <input name="name" autoComplete="name" required value={formData.name} onChange={handleChange} />
                  </label>
                  <label>
                    Email address
                    <input name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} />
                  </label>
                  <label>
                    Phone number
                    <input name="phone" type="tel" autoComplete="tel" required value={formData.phone} onChange={handleChange} />
                  </label>

                  {!event.free ? (
                    <div className="ev-ticket-summary">
                      <span>1 event ticket</span>
                      <strong>{formatPrice(event)}</strong>
                      <p>Payment is processed securely through Paystack after Konn3ct initializes the checkout.</p>
                    </div>
                  ) : null}

                  <p className="fine">
                    By registering, you are submitting your details for this event. Review the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
                  </p>

                  {message ? (
                    <div className={`ev-form-message ${success ? 'success' : ''}`} role="status">{message}</div>
                  ) : null}

                  <button className="button" type="submit" disabled={submitLoading}>
                    {submitLoading ? 'Please wait…' : event.free ? 'Register for this event ↗' : 'Continue to Paystack ↗'}
                  </button>
                </form>
              )}
            </section>
          </div>
        </div>
      </section>
      <Footer onAction={onAction} />
    </main>
  )
}





