const getApiBase = () => {
  const envUrl =
    process.env.REACT_APP_PUBLIC_API_BASE_URL ||
    process.env.REACT_APP_KAY_API_BASE_URL
  return (envUrl || 'https://backend-api.konn3ct.ng').replace(/\/+$/, '')
}

const API_BASE = getApiBase()
const PAYSTACK_INLINE_SRC = 'https://js.paystack.co/v2/inline.js'

const readJson = async (response) => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

const makeApiError = (response, body, fallback) => {
  const error = new Error(body?.message || fallback || `Request failed (HTTP ${response.status}).`)
  error.status = response.status
  error.body = body
  return error
}

export const registerFreeEvent = async ({ ref, name, email, phone }) => {
  const payload = {
    ref: String(ref || '').trim(),
    name: String(name || '').trim(),
    email: String(email || '').trim(),
    phone: String(phone || '').trim(),
  }

  if (!payload.ref) throw new Error('Event reference is required.')
  if (!payload.name || !payload.email || !payload.phone) {
    throw new Error('Name, email and phone number are required.')
  }

  let response
  try {
    response = await fetch(`${API_BASE}/api/pre-registration`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (cause) {
    const error = new Error('Unable to reach the Konn3ct event service. Please check your connection and try again.')
    error.code = 'NETWORK_ERROR'
    error.cause = cause
    throw error
  }

  const body = await readJson(response)
  if (!response.ok || body?.success === false) {
    const error = makeApiError(response, body, 'Unable to register for this event.')
    if (response.status === 400 && /already|registered/i.test(body?.message || '')) {
      error.code = 'ALREADY_REGISTERED'
    }
    throw error
  }

  return body
}

export const initializePaidEventCheckout = async ({ eventId, name, email, phone }) => {
  const numericEventId = Number(eventId)
  const cleanName = String(name || '').trim()
  const cleanEmail = String(email || '').trim()
  const cleanPhone = String(phone || '').trim()

  if (!Number.isFinite(numericEventId) || numericEventId <= 0) {
    const error = new Error('This paid event is missing the event ID required for checkout.')
    error.code = 'EVENT_ID_REQUIRED'
    throw error
  }
  if (!cleanName || !cleanEmail || !cleanPhone) {
    throw new Error('Name, email and phone number are required.')
  }

  let response
  try {
    response = await fetch(`${API_BASE}/api/v1/checkout/initialize`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: numericEventId,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        provider: 'paystack',
      }),
    })
  } catch (cause) {
    const error = new Error('Unable to start Paystack checkout. Please check your connection and try again.')
    error.code = 'NETWORK_ERROR'
    error.cause = cause
    throw error
  }

  const body = await readJson(response)
  if (!response.ok) {
    const error = makeApiError(response, body, 'Unable to initialize Paystack checkout.')
    if (response.status === 422 && /already paid/i.test(body?.message || '')) {
      error.code = 'ALREADY_PAID'
    }
    throw error
  }

  const accessCode = body?.access_code || body?.data?.access_code || null
  const paymentUrl =
    body?.payment_url || body?.authorization_url || body?.data?.payment_url || body?.data?.authorization_url || null

  if (!accessCode && !paymentUrl) {
    const error = new Error('Checkout initialized but the server did not return a Paystack access code or payment URL.')
    error.body = body
    throw error
  }

  return {
    accessCode,
    paymentUrl,
    localReference: body?.local_reference || body?.data?.local_reference || null,
    ticketNumber: body?.ticket_number || body?.data?.ticket_number || null,
    provider: 'paystack',
    raw: body,
  }
}

let paystackLoaderPromise = null

const preloadPaystackInline = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Paystack checkout is only available in a browser.'))
  }
  if (window.PaystackPop) return Promise.resolve(window.PaystackPop)
  if (paystackLoaderPromise) return paystackLoaderPromise

  paystackLoaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${PAYSTACK_INLINE_SRC}"]`)
    const finish = () => {
      if (window.PaystackPop) resolve(window.PaystackPop)
      else {
        paystackLoaderPromise = null
        reject(new Error('Paystack checkout library did not load correctly.'))
      }
    }

    if (existing) {
      existing.addEventListener('load', finish, { once: true })
      existing.addEventListener('error', () => reject(new Error('Unable to load Paystack checkout.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = PAYSTACK_INLINE_SRC
    script.async = true
    script.onload = finish
    script.onerror = () => {
      paystackLoaderPromise = null
      reject(new Error('Unable to load Paystack checkout.'))
    }
    document.head.appendChild(script)
  })

  return paystackLoaderPromise
}

export const openPaystackCheckout = async ({ checkout, onSuccess, onCancel, onError }) => {
  if (checkout?.accessCode) {
    const PaystackPop = await preloadPaystackInline()
    const popup = new PaystackPop()
    return popup.resumeTransaction(checkout.accessCode, {
      onSuccess: (transaction) => onSuccess?.(transaction),
      onCancel: () => onCancel?.(),
      onError: (error) => onError?.(error),
    })
  }

  if (checkout?.paymentUrl) {
    window.location.assign(checkout.paymentUrl)
    return null
  }

  throw new Error('Paystack checkout information is missing.')
}
