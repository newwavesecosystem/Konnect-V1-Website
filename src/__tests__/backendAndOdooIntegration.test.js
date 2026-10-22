/**
 * Phase 11: Backend & Odoo 18 Integration Automated Test Suite
 * Covers:
 * - XML-RPC protocol serialization, parsing, XML injection defense & XXE protection
 * - Input validation, payload limits, honeypot spam protection, and NDPA consent checks
 * - Odoo 18 authentication, team routing, UTM/tag resolution, and `crm.lead` payload mapping
 * - All 5 Phase 8 CRM classifications & all 7 Konn3ct form variants
 * - Idempotency, concurrent double-submission locking, and legitimate repeat enquiries
 * - Sliding-window rate limiting, API timeouts, permission errors, and durable queue fallback
 * - Security & PII log masking
 */

const {
  buildXmlRpcMethodCall,
  parseXmlRpcResponse,
  callXmlRpc,
} = require('../../api/_lib/xmlrpc');
const {
  resolveClassification,
  normalizeSubmissionFields,
  buildOdooLeadPayload,
} = require('../../api/_lib/classification');
const { validateLeadSubmission, MAX_PAYLOAD_BYTES } = require('../../api/_lib/validation');
const {
  resetStoresForTesting,
  computeContentFingerprint,
  checkIdempotency,
} = require('../../api/_lib/idempotency');
const {
  normalizeOdooBaseUrl,
  resetOdooClientCacheForTesting,
} = require('../../api/_lib/odooClient');
const logger = require('../../api/_lib/logger');
const { leadsHandler } = require('../../api/leads');

function createMockReqRes({
  method = 'POST',
  url = '/api/leads',
  headers = {},
  body = {},
  ip = '198.51.100.42',
} = {}) {
  const req = {
    method,
    url,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body,
    socket: { remoteAddress: ip },
  };

  const resHeaders = {};
  const res = {
    statusCode: 200,
    headers: resHeaders,
    bodyText: '',
    setHeader(k, v) {
      resHeaders[k.toLowerCase()] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    end(str = '') {
      this.bodyText = str;
      this.writableEnded = true;
      return this;
    },
    json() {
      return this.bodyText ? JSON.parse(this.bodyText) : null;
    },
  };

  return { req, res };
}

/**
 * Helper that builds a realistic mock `fetch` simulating Odoo 18 XML-RPC endpoints
 * (`/xmlrpc/2/common` and `/xmlrpc/2/object`).
 */
function createMockOdooFetch({
  uid = 42,
  teamId = 15,
  sourceId = 7,
  tagId = 11,
  createdLeadId = 901,
  priorLeads = [],
  failAuth = false,
  permissionDenied = false,
  timeout = false,
  httpErrorStatus = null,
  malformedXml = false,
} = {}) {
  const calls = [];

  const mockFetch = jest.fn(async (url, options) => {
    const bodyXml = options?.body || '';
    calls.push({ url, bodyXml });

    if (timeout) {
      const abortErr = new Error('The operation was aborted');
      abortErr.name = 'AbortError';
      throw abortErr;
    }

    if (httpErrorStatus) {
      return {
        ok: false,
        status: httpErrorStatus,
        text: async () => 'Upstream Error',
      };
    }

    if (malformedXml) {
      return {
        ok: true,
        status: 200,
        text: async () => '<html>Not XML-RPC</html>',
      };
    }

    if (url.endsWith('/xmlrpc/2/common')) {
      if (bodyXml.includes('<methodName>version</methodName>')) {
        return {
          ok: true,
          status: 200,
          text: async () => `<?xml version="1.0"?>
            <methodResponse><params><param><value><struct>
              <member><name>server_version</name><value><string>18.0+e</string></value></member>
              <member><name>server_serie</name><value><string>18.0</string></value></member>
              <member><name>protocol_version</name><value><int>1</int></value></member>
            </struct></value></param></params></methodResponse>`,
        };
      }

      if (bodyXml.includes('<methodName>authenticate</methodName>')) {
        const resultVal = failAuth ? '<boolean>0</boolean>' : `<int>${uid}</int>`;
        return {
          ok: true,
          status: 200,
          text: async () =>
            `<?xml version="1.0"?><methodResponse><params><param><value>${resultVal}</value></param></params></methodResponse>`,
        };
      }
    }

    if (url.endsWith('/xmlrpc/2/object')) {
      if (permissionDenied) {
        return {
          ok: true,
          status: 200,
          text: async () => `<?xml version="1.0"?>
            <methodResponse><fault><value><struct>
              <member><name>faultCode</name><value><int>4</int></value></member>
              <member><name>faultString</name><value><string>AccessError: You are not allowed to access 'Lead/Opportunity' (crm.lead) records.</string></value></member>
            </struct></value></fault></methodResponse>`,
        };
      }

      if (bodyXml.includes('<string>crm.team</string>')) {
        return {
          ok: true,
          status: 200,
          text: async () => `<?xml version="1.0"?>
            <methodResponse><params><param><value><array><data>
              <value><struct>
                <member><name>id</name><value><int>${teamId}</int></value></member>
                <member><name>name</name><value><string>Konn3ct Growth &amp; Partnerships</string></value></member>
              </struct></value>
            </data></array></value></param></params></methodResponse>`,
        };
      }

      if (bodyXml.includes('<string>crm.tag</string>')) {
        return {
          ok: true,
          status: 200,
          text: async () => `<?xml version="1.0"?>
            <methodResponse><params><param><value><array><data>
              <value><struct>
                <member><name>id</name><value><int>${tagId}</int></value></member>
                <member><name>name</name><value><string>Konn3ct Demo Request</string></value></member>
              </struct></value>
            </data></array></value></param></params></methodResponse>`,
        };
      }

      if (bodyXml.includes('<string>utm.source</string>')) {
        return {
          ok: true,
          status: 200,
          text: async () => `<?xml version="1.0"?>
            <methodResponse><params><param><value><array><data>
              <value><struct>
                <member><name>id</name><value><int>${sourceId}</int></value></member>
                <member><name>name</name><value><string>konn3ct_website</string></value></member>
              </struct></value>
            </data></array></value></param></params></methodResponse>`,
        };
      }

      if (
        bodyXml.includes('<string>crm.lead</string>') &&
        bodyXml.includes('<string>search_read</string>')
      ) {
        const itemsXml = priorLeads
          .map(
            (id) => `<value><struct>
              <member><name>id</name><value><int>${id}</int></value></member>
              <member><name>name</name><value><string>[Konn3ct Demo Request] Prior</string></value></member>
            </struct></value>`
          )
          .join('');
        return {
          ok: true,
          status: 200,
          text: async () =>
            `<?xml version="1.0"?><methodResponse><params><param><value><array><data>${itemsXml}</data></array></value></param></params></methodResponse>`,
        };
      }

      if (
        bodyXml.includes('<string>crm.lead</string>') &&
        bodyXml.includes('<string>create</string>')
      ) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            `<?xml version="1.0"?><methodResponse><params><param><value><int>${createdLeadId}</int></value></param></params></methodResponse>`,
        };
      }
    }

    return {
      ok: true,
      status: 200,
      text: async () =>
        `<?xml version="1.0"?><methodResponse><params><param><value><nil/></value></param></params></methodResponse>`,
    };
  });

  return { mockFetch, calls };
}

const TEST_ODOO_CONFIG = {
  ODOO_URL: 'https://www.newwavesecosystem.com/odoo/crm', // Deliberately tests URL normalization!
  ODOO_DB: 'newwavesecosystem-staging',
  ODOO_USERNAME: 'konn3ct-integration@newwavesecosystem.com',
  ODOO_API_KEY: 'test_api_key_secret_do_not_expose',
  ODOO_CRM_TEAM_NAME: 'Konn3ct Growth & Partnerships',
  ODOO_DEMO_OWNER_UID: '24',
  ODOO_PARTNERSHIP_OWNER_UID: '31',
};

describe('Phase 11 — Backend & Odoo 18 CRM Integration Test Suite', () => {
  beforeEach(() => {
    resetStoresForTesting();
    resetOdooClientCacheForTesting();
  });

  describe('1. Odoo Base URL & XML-RPC Protocol Security', () => {
    test('normalizes browser CRM URL (/odoo/crm) to root API origin', () => {
      expect(normalizeOdooBaseUrl('https://www.newwavesecosystem.com/odoo/crm')).toBe(
        'https://www.newwavesecosystem.com'
      );
      expect(normalizeOdooBaseUrl('https://www.newwavesecosystem.com/web/login?redirect=/odoo/crm')).toBe(
        'https://www.newwavesecosystem.com'
      );
    });

    test('escapes XML special characters to prevent XML injection in XML-RPC calls', () => {
      const xml = buildXmlRpcMethodCall('execute_kw', [
        'db',
        1,
        'key',
        'crm.lead',
        'create',
        [{ name: 'Test & Co <script>"alert(\'xss\')"</script>' }],
      ]);
      expect(xml).toContain('Test &amp; Co &lt;script&gt;&quot;alert(&apos;xss&apos;)&quot;&lt;/script&gt;');
      expect(xml).not.toContain('<script>');
    });

    test('rejects XML-RPC responses containing DOCTYPE/ENTITY declarations (XXE defense)', () => {
      const maliciousXml = `<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><methodResponse><params><param><value><string>&xxe;</string></value></param></params></methodResponse>`;
      expect(() => parseXmlRpcResponse(maliciousXml)).toThrow(/DOCTYPE\/ENTITY/i);
    });
  });

  describe('2. Input Validation, Spam Protection & Payload Limits', () => {
    test('rejects missing required fields and invalid email addresses', () => {
      const result = validateLeadSubmission({
        route: 'contact-sales',
        name: 'A',
        company: '',
        email: 'invalid-email',
        phone: '123',
      });
      expect(result.valid).toBe(false);
      expect(result.statusCode).toBe(422);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.company).toBeDefined();
      expect(result.errors.email).toBeDefined();
      expect(result.errors.phone).toBeDefined();
    });

    test('rejects automated spam when honeypot field is populated', () => {
      const result = validateLeadSubmission({
        route: 'contact-sales',
        name: 'Bot User',
        company: 'Spam Corp',
        email: 'bot@spam.com',
        phone: '+2348012345678',
        website_url: 'https://spam-link.example.com',
      });
      expect(result.valid).toBe(false);
      expect(result.isSpam).toBe(true);
      expect(result.errorCode).toBe('SPAM_DETECTED');
    });

    test('rejects submissions when NDPA privacy consent is declined', () => {
      const result = validateLeadSubmission({
        route: 'government',
        name: 'Adaeze Okafor',
        institution: 'Federal Ministry of Communications',
        email: 'adaeze@comm.gov.ng',
        consentAccepted: false,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.consent).toMatch(/must agree/i);
    });

    test('rejects oversized payloads (> 16 KB) with HTTP 413', async () => {
      const hugeMessage = 'X'.repeat(MAX_PAYLOAD_BYTES + 500);
      const { req, res } = createMockReqRes({
        body: {
          route: 'contact-sales',
          name: 'Test User',
          company: 'Org',
          email: 'test@org.com',
          phone: '+2348000000000',
          message: hugeMessage,
        },
      });

      await leadsHandler(req, res, { configOverrides: TEST_ODOO_CONFIG });
      expect(res.statusCode).toBe(413);
      expect(res.json().errorCode).toBe('PAYLOAD_TOO_LARGE');
    });
  });

  describe('3. CRM Classification Rules (Phase 8) & Field Mapping (Phase 4)', () => {
    test.each([
      ['waitlist', 'Konn3ct Waitlist', 'lead', '1', null],
      ['early_access', 'Konn3ct Early Access', 'lead', '1', null],
      ['demo_request', 'Konn3ct Demo Request', 'lead', '2', 24],
      ['partnership', 'Konn3ct Partnership', 'lead', '2', 31],
      ['general', 'Konn3ct General Enquiry', 'lead', '1', null],
    ])(
      'maps enquiryType=%s to %s with type=%s, priority=%s',
      (enquiryType, expectedLabel, expectedOdooType, expectedPriority) => {
        const classification = resolveClassification({ route: 'contact-sales', enquiryType });
        expect(classification.label).toBe(expectedLabel);
        expect(classification.odooType).toBe(expectedOdooType);
        expect(classification.priority).toBe(expectedPriority);

        const normalized = normalizeSubmissionFields({
          route: 'contact-sales',
          name: 'Chidi Nwosu',
          company: 'FinTech Nigeria Ltd',
          email: 'Chidi@FinTech.ng',
          phone: '+234 803 123 4567',
          role: 'CTO',
          interest: 'TrustLock™ governance & administration',
          scale: '501–2,000',
          message: 'Evaluating enterprise deployment.',
          utm_source: 'linkedin',
          utm_campaign: 'q4_enterprise',
          consentAccepted: true,
        });

        const payload = buildOdooLeadPayload(normalized, classification, {
          submissionId: 'k3_test_123456',
          teamId: 15,
          sourceId: 7,
          tagIds: [11],
        });

        expect(payload.contact_name).toBe('Chidi Nwosu');
        expect(payload.email_from).toBe('chidi@fintech.ng');
        expect(payload.phone).toBe('+234 803 123 4567');
        expect(payload.partner_name).toBe('FinTech Nigeria Ltd');
        expect(payload.function).toBe('CTO');
        expect(payload.type).toBe('lead');
        expect(payload.team_id).toBe(15);
        expect(payload.source_id).toBe(7);
        expect(payload.tag_ids).toEqual([[6, 0, [11]]]);
        expect(payload.name).toContain(`[${expectedLabel}] FinTech Nigeria Ltd`);
        expect(payload.description).toContain('Classification: ' + expectedLabel);
        expect(payload.description).toContain('UTM Campaign: q4_enterprise');
      }
    );

    test.each([
      [
        'government',
        {
          route: 'government',
          name: 'Dr. Ibrahim Musa',
          title: 'Director, ICT',
          institution: 'National Digital Agency',
          email: 'imusa@nda.gov.ng',
          need: 'Sovereign / national deployment',
          message: 'Need sovereign cloud architecture.',
        },
        'National Digital Agency',
        'Director, ICT',
      ],
      [
        'associations',
        {
          route: 'associations',
          name: 'Funke Adeyemi',
          role: 'National Secretary',
          org: 'Nigerian Bar Forum',
          members: '20,000–100,000',
          email: 'secretary@barforum.org.ng',
          phone: '+2348099887766',
          interest: 'AGM polling and chapter rooms.',
        },
        'Nigerian Bar Forum',
        'National Secretary',
      ],
      [
        'education',
        {
          route: 'education',
          name: 'Prof. E. Ojo',
          role: 'Dean of Studies',
          org: 'Lagos State University',
          members: '10,000–20,000',
          email: 'eojo@lasu.edu.ng',
          phone: '+2348022334455',
          interest: 'Low-bandwidth virtual lectures.',
        },
        'Lagos State University',
        'Dean of Studies',
      ],
      [
        'faith',
        {
          route: 'faith',
          name: 'Pastor S. Danjuma',
          role: 'Media Lead',
          org: 'Grace Assembly',
          type: 'Church / Ministry',
          size: '10,000 – 50,000',
          email: 'media@graceassembly.org',
          interest: 'Multilingual captions in Hausa and Yoruba.',
        },
        'Grace Assembly',
        'Media Lead',
      ],
      [
        'corporates',
        {
          route: 'corporates',
          name: 'Tunde Bakare',
          role: 'Head of IT',
          company: 'PanAfrican Bank',
          email: 'tbakare@pabank.com',
          size: '501–2,000 people',
          need: 'Enterprise administration & governance',
          message: 'Board and branch collaboration.',
        },
        'PanAfrican Bank',
        'Head of IT',
      ],
      [
        'events-community',
        {
          route: 'events-community',
          name: 'Zainab Bello',
          role: 'Event Director',
          organisation: 'Abuja Tech Summit',
          email: 'zainab@abujatechsummit.com',
          audience: '2,001–10,000',
          type: 'Hybrid event',
          message: 'Ticketing and replay monetization.',
        },
        'Abuja Tech Summit',
        'Event Director',
      ],
    ])(
      'preserves all segment-specific form fields for route /%s',
      (route, rawForm, expectedPartnerName, expectedFunction) => {
        const validation = validateLeadSubmission(rawForm);
        expect(validation.valid).toBe(true);
        expect(validation.normalized.organization).toBe(expectedPartnerName);
        expect(validation.normalized.jobTitle).toBe(expectedFunction);
        expect(validation.classification.label).toBe('Konn3ct Demo Request');
      }
    );
  });

  describe('4. End-to-End Odoo XML-RPC Lead Creation, Idempotency & Repeat Enquiries', () => {
    test('authenticates with Odoo 18 XML-RPC and creates crm.lead with team & source attribution', async () => {
      const { mockFetch, calls } = createMockOdooFetch({
        uid: 42,
        teamId: 19,
        sourceId: 5,
        tagId: 12,
        createdLeadId: 1045,
      });

      const { req, res } = createMockReqRes({
        headers: { 'x-idempotency-key': 'k3_contact_sales_unique001' },
        body: {
          route: 'contact-sales',
          enquiryType: 'demo_request',
          name: 'Amina Yusuf',
          company: 'Sahel Logistics',
          email: 'amina@sahellogistics.ng',
          phone: '+234 805 555 1212',
          organisationType: 'Corporate / SME',
          interest: 'Webinars & large events',
          scale: '501–2,000',
          message: 'Looking for a town hall platform.',
          consentAccepted: true,
        },
      });

      await leadsHandler(req, res, {
        configOverrides: TEST_ODOO_CONFIG,
        fetchImpl: mockFetch,
      });

      const body = res.json();
      expect(res.statusCode).toBe(201);
      expect(body.ok).toBe(true);
      expect(body.deliveryStatus).toBe('crm_created');
      expect(body.leadReference).toBe('ODOO-1045');
      expect(body.classification).toBe('Konn3ct Demo Request');

      // Verify XML-RPC calls targeted root origin `/xmlrpc/2/common` and `/xmlrpc/2/object`, NOT `/odoo/crm`
      expect(calls[0].url).toBe('https://www.newwavesecosystem.com/xmlrpc/2/common');
      const createCall = calls.find((c) => c.bodyXml.includes('<string>create</string>'));
      expect(createCall).toBeDefined();
      expect(createCall.url).toBe('https://www.newwavesecosystem.com/xmlrpc/2/object');
      expect(createCall.bodyXml).toContain('<name>team_id</name><value><int>19</int></value>');
      expect(createCall.bodyXml).toContain('<name>user_id</name><value><int>24</int></value>');
    });

    test('deduplicates accidental double-clicks and retries without creating a second CRM record', async () => {
      const { mockFetch, calls } = createMockOdooFetch({ createdLeadId: 2001 });
      const payload = {
        route: 'government',
        name: 'Engr. Kolawole',
        institution: 'State ICT Agency',
        email: 'kolawole@ict.gov.ng',
        need: 'Public town halls & consultations',
        message: 'Quarterly citizen forum.',
        consentAccepted: true,
      };

      // First submission
      const { req: req1, res: res1 } = createMockReqRes({
        headers: { 'x-idempotency-key': 'k3_gov_retry_key_01' },
        body: payload,
      });
      await leadsHandler(req1, res1, {
        configOverrides: TEST_ODOO_CONFIG,
        fetchImpl: mockFetch,
      });
      expect(res1.statusCode).toBe(201);
      expect(res1.json().duplicate).toBe(false);

      const createCallsAfterFirst = calls.filter((c) =>
        c.bodyXml.includes('<string>create</string>')
      ).length;
      expect(createCallsAfterFirst).toBe(1);

      // Second submission (network retry with same idempotency key)
      const { req: req2, res: res2 } = createMockReqRes({
        headers: { 'x-idempotency-key': 'k3_gov_retry_key_01' },
        body: payload,
      });
      await leadsHandler(req2, res2, {
        configOverrides: TEST_ODOO_CONFIG,
        fetchImpl: mockFetch,
      });
      expect(res2.statusCode).toBe(200);
      expect(res2.json().duplicate).toBe(true);
      expect(res2.json().leadReference).toBe('ODOO-2001');

      // Third submission (different idempotency key, but identical content within double-click window)
      const { req: req3, res: res3 } = createMockReqRes({
        headers: { 'x-idempotency-key': 'k3_gov_different_key_02' },
        body: payload,
      });
      await leadsHandler(req3, res3, {
        configOverrides: TEST_ODOO_CONFIG,
        fetchImpl: mockFetch,
      });
      expect(res3.statusCode).toBe(200);
      expect(res3.json().duplicate).toBe(true);
      expect(res3.json().deduplicatedBy).toBe('identical_payload_window_match');

      // Confirm Odoo `crm.lead.create` was still only called ONCE
      const createCallsAfterAll = calls.filter((c) =>
        c.bodyXml.includes('<string>create</string>')
      ).length;
      expect(createCallsAfterAll).toBe(1);
    });

    test('supports legitimate repeat enquiries from the same email without overwriting or merging', async () => {
      let nextLeadId = 3001;
      const { mockFetch, calls } = createMockOdooFetch({
        createdLeadId: 3001,
        priorLeads: [2990],
      });

      // First enquiry: Waitlist registration
      const { req: req1, res: res1 } = createMockReqRes({
        headers: { 'x-idempotency-key': 'k3_repeat_test_001' },
        body: {
          route: 'contact-sales',
          enquiryType: 'waitlist',
          name: 'Ngozi Eze',
          company: 'EduBridge Africa',
          email: 'ngozi@edubridge.africa',
          phone: '+2348030001111',
          message: 'Joining the waitlist for our training cohort.',
          consentAccepted: true,
        },
      });
      await leadsHandler(req1, res1, {
        configOverrides: TEST_ODOO_CONFIG,
        fetchImpl: mockFetch,
      });
      expect(res1.statusCode).toBe(201);
      expect(res1.json().classification).toBe('Konn3ct Waitlist');

      // Second enquiry from the SAME email: Partnership enquiry with different context
      const { mockFetch: mockFetch2, calls: calls2 } = createMockOdooFetch({
        createdLeadId: 3002,
        priorLeads: [3001],
      });
      const { req: req2, res: res2 } = createMockReqRes({
        headers: { 'x-idempotency-key': 'k3_repeat_test_002' },
        body: {
          route: 'contact-sales',
          enquiryType: 'partnership',
          name: 'Ngozi Eze',
          company: 'EduBridge Africa',
          email: 'ngozi@edubridge.africa',
          phone: '+2348030001111',
          message: 'We also want to become a channel partner for universities.',
          consentAccepted: true,
        },
      });
      await leadsHandler(req2, res2, {
        configOverrides: TEST_ODOO_CONFIG,
        fetchImpl: mockFetch2,
      });

      const body2 = res2.json();
      expect(res2.statusCode).toBe(201);
      expect(body2.duplicate).toBe(false);
      expect(body2.isRepeatEnquiry).toBe(true);
      expect(body2.classification).toBe('Konn3ct Partnership');
      expect(body2.leadReference).toBe('ODOO-3002');

      const createCall2 = calls2.find((c) => c.bodyXml.includes('<string>create</string>'));
      expect(createCall2.bodyXml).toContain('Repeat Enquiry History Note');
      expect(createCall2.bodyXml).toContain('ODOO-3001');
    });
  });

  describe('5. Rate Limiting, Error Handling, Timeouts & Durable Queue Guarantees', () => {
    test('enforces sliding-window rate limit per IP (HTTP 429 with Retry-After)', async () => {
      const { mockFetch } = createMockOdooFetch({ createdLeadId: 4001 });
      const rateConfig = {
        ...TEST_ODOO_CONFIG,
        KONN3CT_RATE_LIMIT_MAX: '2',
      };

      const originalMax = process.env.KONN3CT_RATE_LIMIT_MAX;
      process.env.KONN3CT_RATE_LIMIT_MAX = '2';

      try {
        for (let i = 1; i <= 2; i++) {
          const { req, res } = createMockReqRes({
            ip: '203.0.113.99',
            headers: { 'x-idempotency-key': `k3_rate_key_00${i}` },
            body: {
              route: 'corporates',
              name: `User ${i}`,
              company: `Company ${i}`,
              email: `user${i}@company.com`,
              message: `Request ${i}`,
              consentAccepted: true,
            },
          });
          await leadsHandler(req, res, {
            configOverrides: rateConfig,
            fetchImpl: mockFetch,
          });
          expect(res.statusCode).toBe(201);
        }

        // 3rd request from same IP within window must be rate-limited
        const { req: req3, res: res3 } = createMockReqRes({
          ip: '203.0.113.99',
          headers: { 'x-idempotency-key': 'k3_rate_key_003' },
          body: {
            route: 'corporates',
            name: 'User 3',
            company: 'Company 3',
            email: 'user3@company.com',
            consentAccepted: true,
          },
        });
        await leadsHandler(req3, res3, {
          configOverrides: rateConfig,
          fetchImpl: mockFetch,
        });
        expect(res3.statusCode).toBe(429);
        expect(res3.json().errorCode).toBe('RATE_LIMITED');
        expect(res3.headers['retry-after']).toBeDefined();
      } finally {
        if (originalMax === undefined) delete process.env.KONN3CT_RATE_LIMIT_MAX;
        else process.env.KONN3CT_RATE_LIMIT_MAX = originalMax;
      }
    });

    test('handles Odoo XML-RPC timeout gracefully with HTTP 504', async () => {
      const { mockFetch } = createMockOdooFetch({ timeout: true });
      const { req, res } = createMockReqRes({
        body: {
          route: 'education',
          name: 'Dr. Bello',
          org: 'ABU Zaria',
          email: 'bello@abu.edu.ng',
          consentAccepted: true,
        },
      });

      await leadsHandler(req, res, {
        configOverrides: { ...TEST_ODOO_CONFIG, ODOO_TIMEOUT_MS: '50' },
        fetchImpl: mockFetch,
      });

      expect(res.statusCode).toBe(504);
      expect(res.json().errorCode).toBe('ODOO_TIMEOUT');
    });

    test('handles Odoo permission failure (AccessError) with HTTP 403 without leaking secrets', async () => {
      const { mockFetch } = createMockOdooFetch({ permissionDenied: true });
      const { req, res } = createMockReqRes({
        body: {
          route: 'faith',
          name: 'Rev. John',
          org: 'Covenant Centre',
          email: 'john@covenant.org',
          consentAccepted: true,
        },
      });

      await leadsHandler(req, res, {
        configOverrides: TEST_ODOO_CONFIG,
        fetchImpl: mockFetch,
      });

      expect(res.statusCode).toBe(403);
      const body = res.json();
      expect(body.errorCode).toBe('ODOO_PERMISSION_DENIED');
      expect(JSON.stringify(body)).not.toContain(TEST_ODOO_CONFIG.ODOO_API_KEY);
    });

    test('distinguishes durable queue acceptance (202 queued_pending_crm) from live CRM creation (201 crm_created)', async () => {
      const { mockFetch } = createMockOdooFetch({ httpErrorStatus: 503 });
      const { req, res } = createMockReqRes({
        body: {
          route: 'events-community',
          name: 'Tola Peters',
          organisation: 'Lagos Creative Week',
          email: 'tola@lagoscreative.com',
          consentAccepted: true,
        },
      });

      await leadsHandler(req, res, {
        configOverrides: {
          ...TEST_ODOO_CONFIG,
          KONN3CT_ENABLE_DURABLE_QUEUE: 'true',
        },
        fetchImpl: mockFetch,
      });

      expect(res.statusCode).toBe(202);
      const body = res.json();
      expect(body.ok).toBe(true);
      expect(body.deliveryStatus).toBe('queued_pending_crm');
      expect(body.leadReference).toMatch(/^q_/);
    });
  });

  describe('6. Security & PII Data Minimization in Operational Logs', () => {
    test('masks email and phone and redacts secrets in logger metadata', () => {
      const sanitized = logger.sanitizeMeta({
        email: 'feranmi.developer@konn3ct.com',
        phone: '+234 803 123 9876',
        apiKey: 'super-secret-odoo-key',
        message: 'Confidential enterprise rollout details',
        route: 'contact-sales',
      });

      expect(sanitized.email).toBe('f***r@konn3ct.com');
      expect(sanitized.phone).toBe('***9876');
      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.message).toBeUndefined();
      expect(sanitized.messageLength).toBe(39);
      expect(sanitized.route).toBe('contact-sales');
    });
  });
});
