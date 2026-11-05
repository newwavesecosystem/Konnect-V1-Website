import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import { REGISTER_URL } from '../data/metadata'
import { fetchAllEvents, searchEvents } from '../services/eventsApi'
import { trackPageView } from '../analytics/events'

const periodOptions = [
  ['upcoming', 'Upcoming'],
  ['all', 'All events'],
  ['today', 'Today'],
  ['week', 'Next 7 days'],
  ['month', 'This month'],
  ['past', 'Past events'],
]

const formatDate = (event) => {
  if (!event?.date) return 'Date to be announced'
  const parsed = new Date(`${event.date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return event.date
  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formatTime = (event) => {
  if (!event?.time) return 'Time to be announced'
  const [hours, minutes] = String(event.time).split(':').map(Number)
  if (!Number.isFinite(hours)) return event.time
  const parsed = new Date(2000, 0, 1, hours, Number.isFinite(minutes) ? minutes : 0)
  return parsed.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

const formatPrice = (event) => {
  if (event.free || Number(event.amount) <= 0) return 'Free'
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

const toneForEvent = (event, index = 0) => {
  const tones = ['blue', 'green', 'mint', 'navy']
  const seed = String(event?.ref || event?.title || index)
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return tones[seed % tones.length]
}

function EventPoster({ event, large = false, index = 0 }) {
  const [imageFailed, setImageFailed] = useState(false)
  const imageUrl = event?.banner || event?.logo || event?.image

  if (imageUrl && !imageFailed) {
    return (
      <div className={`ev-poster ev-poster-has-image ${large ? 'large' : ''}`}>
        <img
          className="ev-poster-image"
          src={imageUrl}
          alt={`${event?.title || 'Konn3ct event'} banner`}
          loading={large ? 'eager' : 'lazy'}
          onError={() => setImageFailed(true)}
        />
      </div>
    )
  }

  const label = event?.tags?.[0]
    ? `Connect around ${event.tags[0]}.`
    : 'Find your people. Make your next connection.'

  return (
    <div className={`ev-poster ${toneForEvent(event, index)} ${large ? 'large' : ''}`}>
      <div className="ev-poster-top">
        <span>Konn3ct / {event?.category || 'Event'}</span>
        <span>↗</span>
      </div>
      <strong>{label}</strong>
      <div className="ev-poster-bottom">
        <span>{formatDate(event)}</span>
        <span>{event?.format || 'Online'}</span>
      </div>
    </div>
  )
}

function EventCard({ event, index }) {
  const status = getStatus(event)
  return (
    <article className="ev-card">
      <Link to={`/event/${encodeURIComponent(event.ref)}`} className="ev-poster-link" tabIndex={-1} aria-hidden="true">
        <EventPoster event={event} index={index} />
      </Link>
      <div className="ev-card-body">
        <div className="ev-badges">
          <span>{event.category || 'Event'}</span>
          <span className={`ev-status ${status.toLowerCase()}`}>{status}</span>
        </div>
        <h3>
          <Link to={`/event/${encodeURIComponent(event.ref)}`}>{event.title}</Link>
        </h3>
        <p className="ev-host">By {event.organizer}</p>
        <p className="ev-date">
          {formatDate(event)} <span>· {formatTime(event)} · {event.timezone}</span>
        </p>
        <p className="ev-location">
          {String(event.format).toLowerCase() === 'online' ? '◎' : '⌖'} {event.location}
        </p>
        <div className="ev-card-foot">
          <strong>{formatPrice(event)}</strong>
          <Link to={`/event/${encodeURIComponent(event.ref)}`} aria-label={`View ${event.title}`}>
            View event ↗
          </Link>
        </div>
      </div>
    </article>
  )
}

export default function Events({ onAction }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [period, setPeriod] = useState('upcoming')
  const [category, setCategory] = useState('All topics')
  const [format, setFormat] = useState('All formats')
  const [location, setLocation] = useState('All locations')
  const [price, setPrice] = useState('Any price')
  const [sort, setSort] = useState('soonest')
  const [limit, setLimit] = useState(6)

  useEffect(() => {
    trackPageView({ route: 'events', page_path: '/events' })
    document.title = 'Public Events on Konn3ct | Konn3ct'
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    fetchAllEvents('GLOBAL')
      .then((data) => {
        if (!active) return
        setEvents(data)
      })
      .catch((err) => {
        if (!active) return
        setError(err?.message || 'Unable to load events right now.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const categories = useMemo(
    () => ['All topics', ...Array.from(new Set(events.map((event) => event.category).filter(Boolean))).sort()],
    [events]
  )
  const formats = useMemo(
    () => ['All formats', ...Array.from(new Set(events.map((event) => event.format).filter(Boolean))).sort()],
    [events]
  )
  const locations = useMemo(
    () => ['All locations', ...Array.from(new Set(events.map((event) => event.location).filter(Boolean))).sort()],
    [events]
  )

  const filteredEvents = useMemo(() => {
    const now = new Date()
    const todayKey = now.toISOString().slice(0, 10)
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() + 7)
    const monthKey = todayKey.slice(0, 7)
    const localQuery = submittedQuery.trim().toLowerCase()

    return events
      .filter((event) => {
        const status = getStatus(event)
        const searchText = [
          event.title,
          event.organizer,
          event.category,
          event.location,
          event.date,
          ...(event.tags || []),
        ]
          .join(' ')
          .toLowerCase()

        const periodMatch =
          period === 'all' ||
          (period === 'upcoming' && status === 'Upcoming') ||
          (period === 'past' && status === 'Ended') ||
          (period === 'today' && event.date === todayKey) ||
          (period === 'week' && event.start && event.start >= now && event.start < weekEnd) ||
          (period === 'month' && String(event.date || '').startsWith(monthKey))

        return (
          (!localQuery || searchText.includes(localQuery)) &&
          periodMatch &&
          (category === 'All topics' || event.category === category) &&
          (format === 'All formats' || event.format === format) &&
          (location === 'All locations' || event.location === location) &&
          (price === 'Any price' || (price === 'Free' ? event.free : !event.free))
        )
      })
      .sort((a, b) => {
        if (sort === 'title') return a.title.localeCompare(b.title)
        const aTime = a.start?.getTime?.() || 0
        const bTime = b.start?.getTime?.() || 0
        return sort === 'latest' ? bTime - aTime : aTime - bTime
      })
  }, [events, submittedQuery, period, category, format, location, price, sort])

  const featured = useMemo(
    () => events.find((event) => getStatus(event) === 'Upcoming') || events[0] || null,
    [events]
  )

  const resetFilters = async () => {
    setQuery('')
    setSubmittedQuery('')
    setPeriod('upcoming')
    setCategory('All topics')
    setFormat('All formats')
    setLocation('All locations')
    setPrice('Any price')
    setSort('soonest')
    setLimit(6)

    setLoading(true)
    setError('')
    try {
      setEvents(await fetchAllEvents('GLOBAL'))
    } catch (err) {
      setError(err?.message || 'Unable to reload events right now.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (event) => {
    event.preventDefault()
    const cleanQuery = query.trim()
    setSubmittedQuery(cleanQuery)
    setLimit(6)

    if (!cleanQuery) {
      setLoading(true)
      setError('')
      try {
        setEvents(await fetchAllEvents('GLOBAL'))
      } catch (err) {
        setError(err?.message || 'Unable to reload events right now.')
      } finally {
        setLoading(false)
      }
      return
    }

    setLoading(true)
    setError('')
    try {
      const results = await searchEvents(cleanQuery, '', 'GLOBAL')
      setEvents(results)
    } catch (err) {
      setError(err?.message || 'Unable to search events right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main id="main">
      <section className="ev-hero">
        <div className="wrap">
          <div className="ev-heading">
            <div>
              <div className="eyebrow">Public events on Konn3ct</div>
              <h1>
                Find your people.<br />
                <em>Be part of something.</em>
              </h1>
              <p>
                Discover conversations, classes and gatherings published by Konn3ct organisers.
                Find what matters to you, then make your next connection.
              </p>
            </div>
            <Link className="text-link" to="/events-community">
              Hosting a gathering? Explore event solutions ↗
            </Link>
          </div>

          <form className="ev-search" role="search" onSubmit={handleSearch}>
            <label htmlFor="event-query" className="sr-only">
              Search events by name, organiser, date or location
            </label>
            <span aria-hidden="true">⌕</span>
            <input
              id="event-query"
              type="search"
              placeholder="Search events, organisers, dates or places"
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button className="button" type="submit" disabled={loading}>
              {loading ? 'Searching…' : 'Find events ↗'}
            </button>
          </form>
          <p className="ev-live-note">Live public event information supplied by the Konn3ct events service.</p>
        </div>
      </section>

      {error ? (
        <section className="section ev-featured-section">
          <div className="wrap">
            <div className="ev-service-message error" role="alert">
              <strong>We could not load the event feed.</strong>
              <p>{error}</p>
              <button className="button outline" type="button" onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {featured && !error ? (
        <section className="section ev-featured-section">
          <div className="wrap">
            <div className="ev-featured">
              <EventPoster event={featured} large />
              <div>
                <div className="eyebrow">Featured event</div>
                <h2>{featured.title}</h2>
                <p>{featured.description}</p>
                <div className="ev-meta">
                  {formatDate(featured)} · {formatTime(featured)} · {featured.timezone}
                  <br />
                  {featured.location} · {formatPrice(featured)}
                </div>
                <Link className="button outline" to={`/event/${encodeURIComponent(featured.ref)}`}>
                  Explore this event ↗
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section ev-listing" id="event-listing">
        <div className="wrap">
          <div className="ev-list-head">
            <div>
              <div className="eyebrow">Discover your next connection</div>
              <h2>Explore events.</h2>
            </div>
            <p role="status" aria-live="polite">
              {loading ? 'Loading events…' : `${filteredEvents.length} ${filteredEvents.length === 1 ? 'event' : 'events'} found`}
            </p>
          </div>

          <div className="ev-periods" role="group" aria-label="Event date filters">
            {periodOptions.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={period === value}
                onClick={() => {
                  setPeriod(value)
                  setLimit(6)
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="ev-filters">
            <label>
              Topic
              <select value={category} onChange={(e) => { setCategory(e.target.value); setLimit(6) }}>
                {categories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Format
              <select value={format} onChange={(e) => { setFormat(e.target.value); setLimit(6) }}>
                {formats.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Location
              <select value={location} onChange={(e) => { setLocation(e.target.value); setLimit(6) }}>
                {locations.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Admission
              <select value={price} onChange={(e) => { setPrice(e.target.value); setLimit(6) }}>
                <option>Any price</option>
                <option>Free</option>
                <option>Paid</option>
              </select>
            </label>
            <label>
              Sort by
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="soonest">Soonest first</option>
                <option value="latest">Latest first</option>
                <option value="title">Event name</option>
              </select>
            </label>
            <button className="ev-reset" type="button" onClick={resetFilters}>Reset filters</button>
          </div>

          {loading && events.length === 0 ? (
            <div className="ev-loading-grid" aria-label="Loading events">
              {[1, 2, 3].map((item) => <div className="ev-loading-card" key={item} />)}
            </div>
          ) : filteredEvents.length ? (
            <div className="ev-grid">
              {filteredEvents.slice(0, limit).map((event, index) => (
                <EventCard event={event} index={index} key={event.ref} />
              ))}
            </div>
          ) : !error ? (
            <div className="ev-empty">
              <span aria-hidden="true">⌕</span>
              <h3>No events match your search.</h3>
              <p>Try a different topic, date or location.</p>
              <button className="button outline" type="button" onClick={resetFilters}>Clear filters</button>
            </div>
          ) : null}

          {filteredEvents.length > limit ? (
            <div className="ev-more-wrap">
              <button className="button outline" type="button" onClick={() => setLimit((value) => value + 6)}>
                Show more events ↓
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section ev-organiser">
        <div className="wrap">
          <div>
            <div className="eyebrow">For organisers &amp; community leaders</div>
            <h2>
              Your audience.<br />
              <em>Your next gathering.</em>
            </h2>
            <p>
              Prepare your event details, set the audience and publish through your Konn3ct account.
              Public events can then be discovered here by your audience.
            </p>
            <div className="hero-actions">
              <a className="button" href={REGISTER_URL}>Create a Konn3ct account ↗</a>
              <Link className="button outline" to="/events-community">Discuss event requirements ↗</Link>
            </div>
          </div>
          <ol>
            <li><strong>01 / Prepare</strong><span>Add the event details your audience needs.</span></li>
            <li><strong>02 / Publish publicly</strong><span>Make the event available through Konn3ct’s public event catalogue.</span></li>
            <li><strong>03 / Welcome your audience</strong><span>Keep registration and event information in one clear journey.</span></li>
          </ol>
        </div>
      </section>

      <Footer onAction={onAction} />
    </main>
  )
}

