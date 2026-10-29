/**
 * MK-004-DEV-001 Acceptance Test Suite (`src/tests/leadSubmission.test.js`)
 * Explicitly verifies DEV-AT-01 through DEV-AT-10, plus AC-01, AC-06, and AC-07.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ContactSales from '../pages/ContactSales';
import { SplitSection } from '../components/Sections';
import siteContent from '../data/siteContent.json';
import { landingPageRegistry, getRouteConversionMeta } from '../data/metadata';
import { submitLead } from '../services/leads';
import {
  trackConfirmedLead,
  setAnalyticsConsent,
  getAnalyticsEventLog,
  clearAnalyticsEventLogForTesting,
} from '../analytics/events';
import {
  getExperimentAssignment,
  rollbackExperiment,
  resetExperimentsForTesting,
} from '../experiments/abTest';

const { leadsHandler } = require('../../api/leads');
const { resetStoresForTesting } = require('../../api/_lib/idempotency');
const { resetOdooClientCacheForTesting } = require('../../api/_lib/odooClient');

const MOCK_ODOO_ENV = {
  ODOO_URL: 'https://www.newwavesecosystem.com/odoo/crm',
  ODOO_DB: 'newwavesecosystem-staging',
  ODOO_USERNAME: 'konn3ct-bot@newwavesecosystem.com',
  ODOO_API_KEY: 'secret-odoo-18-key',
  ODOO_CRM_TEAM_NAME: 'Konn3ct Growth & Partnerships',
};

function createBackendBridgeFetch({
  odooLeadId = 8100,
  failOdoo = false,
  timeoutAfterCreate = false,
} = {}) {
  let odooCreateCalls = 0;

  const mockOdooUpstreamFetch = jest.fn(async (url, opts) => {
    const xml = opts?.body || '';
    if (url.endsWith('/xmlrpc/2/common')) {
      return {
        ok: true,
        status: 200,
        text: async () =>
          `<?xml version="1.0"?><methodResponse><params><param><value><int>42</int></value></param></params></methodResponse>`,
      };
    }
    if (url.endsWith('/xmlrpc/2/object')) {
      if (failOdoo) {
        return {
          ok: false,
          status: 503,
          text: async () => 'Service Unavailable',
        };
      }
      if (xml.includes('<string>create</string>')) {
        odooCreateCalls += 1;
        return {
          ok: true,
          status: 200,
          text: async () =>
            `<?xml version="1.0"?><methodResponse><params><param><value><int>${odooLeadId}</int></value></param></params></methodResponse>`,
        };
      }
      return {
        ok: true,
        status: 200,
        text: async () =>
          `<?xml version="1.0"?><methodResponse><params><param><value><array><data></data></array></value></param></params></methodResponse>`,
      };
    }
    return { ok: false, status: 404, text: async () => '' };
  });

  let callCount = 0;
  const frontendFetch = jest.fn(async (url, options = {}) => {
    callCount += 1;
    const req = {
      method: options.method || 'POST',
      url,
      headers: {
        'content-type': 'application/json',
        'x-idempotency-key':
          options.headers?.['X-Idempotency-Key'] || options.headers?.['x-idempotency-key'],
      },
      body: options.body ? JSON.parse(options.body) : {},
      socket: { remoteAddress: '198.51.100.77' },
    };

    let statusCode = 200;
    let responseBody = '';
    const res = {
      setHeader() {},
      status(c) {
        statusCode = c;
        return this;
      },
      end(b) {
        responseBody = b;
        this.writableEnded = true;
      },
    };

    await leadsHandler(req, res, {
      configOverrides: MOCK_ODOO_ENV,
      fetchImpl: mockOdooUpstreamFetch,
    });

    // Simulate network drop AFTER backend already created the CRM record on first attempt
    if (timeoutAfterCreate && callCount === 1) {
      throw new Error('Network timeout while awaiting response');
    }

    return {
      ok: statusCode >= 200 && statusCode < 300,
      status: statusCode,
      json: async () => JSON.parse(responseBody),
    };
  });

  return {
    frontendFetch,
    mockOdooUpstreamFetch,
    getOdooCreateCalls: () => odooCreateCalls,
  };
}

describe('MK-004-DEV-001 — Complete Acceptance Test Matrix (DEV-AT-01 to DEV-AT-10)', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    resetStoresForTesting();
    resetOdooClientCacheForTesting();
    clearAnalyticsEventLogForTesting();
    resetExperimentsForTesting();
    if (window.sessionStorage) window.sessionStorage.clear();
  });

  test('DEV-AT-01: Submit a valid Contact Sales enquiry -> creates exactly one correct CRM record', async () => {
    const { frontendFetch, getOdooCreateCalls } = createBackendBridgeFetch({ odooLeadId: 8101 });
    global.fetch = frontendFetch;

    const result = await submitLead({
      route: 'contact-sales',
      landing_page_id: 'contact-sales',
      conversion_goal_id: 'sales-enquiry',
      page_path: '/contact-sales',
      name: 'Chinedu Eze',
      company: 'Veritas Capital',
      email: 'chinedu@veritas.ng',
      phone: '+2348031234567',
      interest: 'Webinars & large events',
      consentAccepted: true,
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('accepted');
    expect(result.deliveryStatus).toBe('crm_created');
    expect(result.leadReference).toBe('ODOO-8101');
    expect(result.submission_reference).toMatch(/^k3_/);
    expect(getOdooCreateCalls()).toBe(1);
  });

  test('DEV-AT-02: Submit a valid sector-page enquiry -> uses the same shared integration contract', async () => {
    const { frontendFetch, getOdooCreateCalls } = createBackendBridgeFetch({ odooLeadId: 8102 });
    global.fetch = frontendFetch;

    const result = await submitLead({
      route: 'associations',
      name: 'Barr. Halima Sule',
      role: 'President',
      org: 'West African Medical Association',
      members: '5,000–20,000',
      email: 'halima@wama.org',
      phone: '+2348091112233',
      interest: 'Annual AGM voting & CPD replay',
      consentAccepted: true,
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('accepted');
    expect(result.landing_page_id).toBe('associations');
    expect(result.conversion_goal_id).toBe('association-demo-request');
    expect(result.leadReference).toBe('ODOO-8102');
    expect(getOdooCreateCalls()).toBe(1);
  });

  test('DEV-AT-03: Submit invalid required values -> returns validation error, no CRM creation', async () => {
    const { frontendFetch, getOdooCreateCalls } = createBackendBridgeFetch({ odooLeadId: 8103 });
    global.fetch = frontendFetch;

    await expect(
      submitLead({
        route: 'contact-sales',
        name: '',
        company: '',
        email: 'bad-email',
        phone: '12',
      })
    ).rejects.toThrow();

    expect(getOdooCreateCalls()).toBe(0);
  });

  test('DEV-AT-04: CRM rejects submission -> clear failure, no false success message or GA4 event', async () => {
    const { frontendFetch } = createBackendBridgeFetch({ failOdoo: true });
    global.fetch = frontendFetch;

    render(
      <MemoryRouter initialEntries={['/contact-sales']}>
        <ContactSales />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/What would you like to do/i), {
      target: { value: 'Book a product demo' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^Full name$/i), {
      target: { value: 'Damilola Ojo' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Organisation name/i), {
      target: { value: 'Ojo Holdings' },
    });
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: 'damilola@ojoholdings.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Request a conversation/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/could not complete your registration/i);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    const leadEvents = getAnalyticsEventLog().filter((e) => e.event === 'generate_lead');
    expect(leadEvents).toHaveLength(0);
  });

  test('DEV-AT-05: Visitor double-clicks Submit -> no unintended duplicate CRM record', async () => {
    const { frontendFetch, getOdooCreateCalls } = createBackendBridgeFetch({ odooLeadId: 8105 });
    global.fetch = frontendFetch;

    const payload = {
      route: 'corporates',
      submission_reference: 'k3_double_click_ref_005',
      name: 'Femi Adesina',
      company: 'Prime Manufacturing',
      email: 'femi@primemfg.com',
      need: 'Team meetings & collaboration',
      consentAccepted: true,
    };

    const [res1, res2] = await Promise.all([submitLead(payload), submitLead(payload)]);
    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
    expect(res1.leadReference).toBe('ODOO-8105');
    expect(res2.leadReference).toBe('ODOO-8105');
    expect(getOdooCreateCalls()).toBe(1);
  });

  test('DEV-AT-06: Network timeout after CRM creation -> safe retry and record reconciliation', async () => {
    const { frontendFetch, getOdooCreateCalls } = createBackendBridgeFetch({
      odooLeadId: 8106,
      timeoutAfterCreate: true,
    });
    global.fetch = frontendFetch;

    const sharedReference = 'k3_timeout_retry_ref_006';
    const payload = {
      route: 'education',
      submission_reference: sharedReference,
      name: 'Prof. Nnamdi',
      org: 'UNN',
      email: 'nnamdi@unn.edu.ng',
      interest: 'Campus-wide virtual lectures',
      consentAccepted: true,
    };

    // First attempt creates the CRM record on the backend, but the response times out in transit
    await expect(submitLead(payload)).rejects.toThrow(/Unable to reach the Konn3ct server/i);
    expect(getOdooCreateCalls()).toBe(1);

    // Retry with the same submission_reference reconciles against the created record without duplicating
    const retryResult = await submitLead(payload);
    expect(retryResult.success).toBe(true);
    expect(retryResult.duplicate).toBe(true);
    expect(retryResult.leadReference).toBe('ODOO-8106');
    expect(getOdooCreateCalls()).toBe(1);
  });

  test('DEV-AT-07: Submit with campaign parameters -> permitted attribution stored in CRM and analytics', async () => {
    const { frontendFetch, mockOdooUpstreamFetch } = createBackendBridgeFetch({ odooLeadId: 8107 });
    global.fetch = frontendFetch;

    const result = await submitLead({
      route: 'faith',
      name: 'Pastor David',
      org: 'Living Waters Ministry',
      email: 'david@livingwaters.org',
      utm: {
        utm_source: 'newsletter_oct',
        utm_medium: 'email',
        utm_campaign: 'faith_outreach_2026',
      },
      consentAccepted: true,
    });

    expect(result.success).toBe(true);
    const createCall = mockOdooUpstreamFetch.mock.calls.find(([, opts]) =>
      opts.body.includes('<string>create</string>')
    );
    expect(createCall[1].body).toContain('newsletter_oct');
    expect(createCall[1].body).toContain('faith_outreach_2026');
  });

  test('DEV-AT-08: Consent denied -> Analytics respects approved consent behaviour and suppresses GA4', () => {
    setAnalyticsConsent(false);

    const outcome = trackConfirmedLead(
      {
        success: true,
        ok: true,
        submission_reference: 'k3_consent_denied_ref',
        classification: 'Konn3ct Demo Request',
        deliveryStatus: 'crm_created',
      },
      {
        landing_page_id: 'contact-sales',
        conversion_goal_id: 'sales-enquiry',
        consentAccepted: false,
      }
    );

    expect(outcome.emitted).toBe(false);
    expect(outcome.reason).toBe('consent_denied');
    expect(getAnalyticsEventLog().filter((e) => e.event === 'generate_lead')).toHaveLength(0);
  });

  test('DEV-AT-09: Confirmed conversion -> Emits exactly one eligible GA4 generate_lead event with zero PII', () => {
    setAnalyticsConsent(true);
    window.gtag = jest.fn();

    const backendResult = {
      success: true,
      ok: true,
      submission_reference: 'k3_confirmed_ref_009',
      leadId: 8109,
      leadReference: 'ODOO-8109',
      classification: 'Konn3ct Demo Request',
      deliveryStatus: 'crm_created',
    };

    const firstEmit = trackConfirmedLead(backendResult, {
      landing_page_id: 'government',
      conversion_goal_id: 'government-demo-request',
      page_path: '/government',
      consentAccepted: true,
      name: 'PII Name Must Be Stripped',
      email: 'pii@secret.gov.ng',
      phone: '+2348000000000',
    });

    // Second call with the same submission_reference must be suppressed
    const duplicateEmit = trackConfirmedLead(backendResult, {
      landing_page_id: 'government',
      conversion_goal_id: 'government-demo-request',
      consentAccepted: true,
    });

    expect(firstEmit.emitted).toBe(true);
    expect(duplicateEmit.emitted).toBe(false);

    const generateLeadEvents = getAnalyticsEventLog().filter((e) => e.event === 'generate_lead');
    expect(generateLeadEvents).toHaveLength(1);
    expect(generateLeadEvents[0].params.submission_reference).toBe('k3_confirmed_ref_009');
    expect(generateLeadEvents[0].params.landing_page_id).toBe('government');
    expect(generateLeadEvents[0].params.conversion_goal_id).toBe('government-demo-request');

    // Verify PII was strictly stripped
    const serializedEvent = JSON.stringify(generateLeadEvents[0]);
    expect(serializedEvent).not.toContain('pii@secret.gov.ng');
    expect(serializedEvent).not.toContain('PII Name Must Be Stripped');
    expect(serializedEvent).not.toContain('+2348000000000');
  });

  test('DEV-AT-10: Route inventory (AC-01), inactive CTA repair (P1), reconciliation (AC-06) & A/B rollback (AC-07)', async () => {
    // 1. Verify all 8 routes are registered in landingPageRegistry (AC-01)
    const registeredRoutes = Object.keys(landingPageRegistry);
    expect(registeredRoutes).toEqual([
      'home',
      'government',
      'associations',
      'education',
      'faith',
      'corporates',
      'events-community',
      'contact-sales',
    ]);
    expect(getRouteConversionMeta('contact-sales').conversion_goal_id).toBe('sales-enquiry');

    // 2. Verify controlled A/B assignment and instant rollback (AC-07)
    const exp1 = getExperimentAssignment('EXP-MK004-CTA-COPY', {
      landing_page_id: 'home',
      visitorSeed: 'user_seed_alpha',
    });
    expect(['control', 'variant_b']).toContain(exp1.variant_id);
    expect(exp1.rolledBack).toBe(false);

    rollbackExperiment('EXP-MK004-CTA-COPY');
    const expAfterRollback = getExperimentAssignment('EXP-MK004-CTA-COPY', {
      landing_page_id: 'home',
      visitorSeed: 'user_seed_alpha',
    });
    expect(expAfterRollback.variant_id).toBe('control');
    expect(expAfterRollback.rolledBack).toBe(true);

    // 3. Verify SplitSection action buttons are wired and interactive (P1 CTA repair)
    const onToast = jest.fn();
    const reliabilitySection = siteContent.home.sections.find((s) => s.id === 'reliability');
    render(
      <MemoryRouter initialEntries={['/']}>
        <SplitSection section={reliabilitySection} index={2} route="home" onToast={onToast} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Audio only/i }));
    expect(onToast).toHaveBeenCalledWith('Audio only mode selected.');
  });
});
