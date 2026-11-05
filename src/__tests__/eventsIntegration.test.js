import { formatEventFromAPI, fetchAllEvents, fetchEventByRef } from '../services/eventsApi'
import { registerFreeEvent, initializePaidEventCheckout } from '../services/eventCommerceApi'

const jsonResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

describe('Konn3ct public Events API integration', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('formats the documented public event payload', () => {
    const event = formatEventFromAPI({
      id: 5,
      reference: 'ABC123',
      title: 'Community Forum',
      host_name: 'Konn3ct Community',
      about: 'A public conversation.',
      date: '2026-11-20',
      time: '12:00',
      timezone: 'Africa/Lagos (UTC+01:00)',
      public: 1,
      free: 0,
      currency: 'NGN',
      amount: '6000',
      tags: 'community,lagos',
      country: 'NG',
    })

    expect(event.eventId).toBe(5)
    expect(event.ref).toBe('ABC123')
    expect(event.organizer).toBe('Konn3ct Community')
    expect(event.free).toBe(false)
    expect(event.amount).toBe(6000)
    expect(event.category).toBe('Community')
  })

  test('loads the public event catalogue through pre-registration-search', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse(200, {
        success: true,
        data: [{ id: 1, reference: 'EVT1', title: 'Test Event', public: 1, free: 1 }],
      })
    )

    const events = await fetchAllEvents('GLOBAL')
    expect(events).toHaveLength(1)
    expect(events[0].ref).toBe('EVT1')
    expect(global.fetch.mock.calls[0][0]).toContain('/api/pre-registration-search')
    expect(global.fetch.mock.calls[0][1].method).toBe('POST')
  })

  test('loads a single public event using its reference', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse(200, {
        success: true,
        data: { preg: [{ id: 9, reference: 'DETAIL9', title: 'Detail Event', public: 1, free: 1 }] },
      })
    )

    const event = await fetchEventByRef('DETAIL9')
    expect(event.ref).toBe('DETAIL9')
    expect(global.fetch.mock.calls[0][0]).toContain('/api/pre-registration/DETAIL9')
  })

  test('submits free registration using the Konn3ct pre-registration endpoint', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, { success: true, message: 'Registered' }))

    const result = await registerFreeEvent({
      ref: 'FREE1',
      name: 'Test User',
      email: 'test@example.com',
      phone: '+2348000000000',
    })

    expect(result.success).toBe(true)
    expect(global.fetch.mock.calls[0][0]).toContain('/api/pre-registration')
    const payload = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(payload.ref).toBe('FREE1')
  })

  test('initializes paid event checkout with event_id and Paystack', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse(200, { access_code: 'ACCESS_123', local_reference: 'LOCAL_123', provider: 'paystack' })
    )

    const checkout = await initializePaidEventCheckout({
      eventId: 22,
      name: 'Paid User',
      email: 'paid@example.com',
      phone: '+2348111111111',
    })

    expect(checkout.accessCode).toBe('ACCESS_123')
    const payload = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(payload).toMatchObject({ event_id: 22, provider: 'paystack' })
  })
})
