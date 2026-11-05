const getApiBase = () => {
  const envUrl =
    process.env.REACT_APP_PUBLIC_API_BASE_URL ||
    process.env.REACT_APP_KAY_API_BASE_URL

  return (envUrl || 'https://backend-api.konn3ct.ng').replace(/\/+$/, '')
}

const API_BASE = getApiBase()

const buildApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const apiPath = cleanEndpoint.startsWith('/api/') ? cleanEndpoint : `/api${cleanEndpoint}`
  return `${API_BASE}${apiPath}`
}

const getImageBase = () => {
  const configured = process.env.REACT_APP_PREREG_IMAGE_BASE_URL
  if (configured) return configured.replace(/\/+$/, '')
  // return `${API_BASE}/prereg`
  const apiBase = getApiBase();

  return apiBase ? `${apiBase}/prereg` : "https://backend-api.konn3ct.ng/prereg";
}

const readJson = async (response) => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

const titleCase = (value = '') =>
  String(value)
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const parseTags = (value) => {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean)
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const getEventStart = (apiEvent = {}) => {
  const date = String(apiEvent.date || '').trim()
  const time = String(apiEvent.time || '').trim()
  if (!date) return null

  const dateTime = new Date(`${date}T${time || '00:00:00'}`)
  return Number.isNaN(dateTime.getTime()) ? null : dateTime
}

export const formatEventFromAPI = (apiEvent = {}) => {
  const tags = parseTags(apiEvent.tags)
  const start = getEventStart(apiEvent)
  const isFree =
    apiEvent.free === undefined || apiEvent.free === null
      ? Number(apiEvent.amount || 0) <= 0
      : Number(apiEvent.free) === 1

  const location =
    apiEvent.location || apiEvent.city || apiEvent.venue || apiEvent.event_location || 'Online on Konn3ct'

  const rawFormat = apiEvent.format || apiEvent.event_format || apiEvent.type
  const format = rawFormat ? titleCase(rawFormat) : 'Online'

  const resolveImageUrl = (value) => {
    const raw = String(value || '').trim()
    if (!raw) return null

    if (/^https?:\/\//i.test(raw)) return raw
    if (raw.startsWith('//')) return `https:${raw}`
    if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw

    return `${getImageBase()}/${raw.replace(/^\/+/, '')}`
  }

  const logoUrl = resolveImageUrl(apiEvent.banner || apiEvent.logo || apiEvent.image)

  return {
    eventId: apiEvent.id ?? apiEvent.event_id ?? null,
    ref: apiEvent.ref ?? apiEvent.reference ?? null,
    title: apiEvent.title || 'Untitled Event',
    organizer: apiEvent.host_name || apiEvent.organizer || 'Konn3ct organiser',
    description: apiEvent.about || apiEvent.description || 'Event details will be provided by the organiser.',
    date: apiEvent.date || '',
    time: apiEvent.time || '',
    timezone: apiEvent.timezone || 'Africa/Lagos (UTC+01:00)',
    start,
    location,
    image: logoUrl,
    logo: logoUrl,
    banner: logoUrl,
    country: apiEvent.country || null,
    format,
    category: titleCase(apiEvent.category || tags[0] || 'Community'),
    tags,
    public: Number(apiEvent.public ?? 1) === 1,
    free: isFree,
    amount: Number(apiEvent.amount || 0),
    currency: String(apiEvent.currency || 'NGN').toUpperCase(),
    eventUrl: apiEvent.event_url || null,
    raw: apiEvent,
  }
}

const makeRequestError = (response, body, fallback) => {
  const error = new Error(body?.message || fallback || `Request failed (HTTP ${response.status}).`)
  error.status = response.status
  error.body = body
  return error
}

const requestSearch = async ({ search = '', location = '', country = 'GLOBAL' } = {}) => {
  const formData = new FormData()
  if (String(search).trim()) formData.append('search', String(search).trim())
  if (String(location).trim()) formData.append('location', String(location).trim())
  if (country) formData.append('country', country)

  let response
  try {
    response = await fetch(buildApiUrl('/pre-registration-search'), {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
    })
  } catch (cause) {
    const error = new Error('Unable to reach the Konn3ct events service. Please check your connection and try again.')
    error.code = 'NETWORK_ERROR'
    error.cause = cause
    throw error
  }

  const body = await readJson(response)
  if (!response.ok || body?.success === false) {
    throw makeRequestError(response, body, 'Unable to load public events.')
  }

  const rows = Array.isArray(body?.data)
    ? body.data
    : Array.isArray(body?.data?.events)
    ? body.data.events
    : []

  return rows.map(formatEventFromAPI).filter((event) => event.public && event.ref)
}

export const fetchAllEvents = async (country = 'GLOBAL') => requestSearch({ country })

export const searchEvents = async (search = '', location = '', country = 'GLOBAL') =>
  requestSearch({ search, location, country })

const enrichEventId = async (event, requestedRef, countryCode) => {
  if (event?.eventId) return event

  const findExact = (events) =>
    events.find((item) => String(item.ref || '') === String(requestedRef || ''))

  try {
    const countryEvents = await requestSearch({ country: countryCode || 'GLOBAL' })
    const match = findExact(countryEvents)
    if (match?.eventId) return { ...event, eventId: match.eventId }
  } catch {
    // The detail endpoint can still be displayed if event_id enrichment is unavailable.
  }

  return event
}

export const fetchEventByRef = async (requestedRef, countryCode = 'GLOBAL') => {
  if (!requestedRef) return null

  let response
  try {
    response = await fetch(
      buildApiUrl(`/pre-registration/${encodeURIComponent(requestedRef)}`),
      { method: 'GET', headers: { Accept: 'application/json' } }
    )
  } catch (cause) {
    const error = new Error('Unable to reach the Konn3ct events service. Please check your connection and try again.')
    error.code = 'NETWORK_ERROR'
    error.cause = cause
    throw error
  }

  if (response.status === 404) return null

  const body = await readJson(response)
  if (!response.ok || body?.success === false) {
    throw makeRequestError(response, body, 'Unable to load this event.')
  }

  const apiEvent =
    body?.data?.preg?.[0] ||
    body?.data?.event ||
    body?.data?.[0] ||
    body?.data ||
    null

  if (!apiEvent || Array.isArray(apiEvent)) return null

  const formatted = formatEventFromAPI(apiEvent)
  const event = {
    ...formatted,
    ref: formatted.ref || requestedRef,
  }

  return enrichEventId(event, requestedRef, countryCode)
}

export { API_BASE as EVENTS_API_BASE }




