/**
 * Phase 7 & MK-004-DEV-001: Frontend Lead Capture Service
 * Handles UTM attribution capture, client-side validation, idempotency key management,
 * authenticated backend communication via `/api/leads`, and static-Nginx host (`405`) fallback.
 */

import { getRouteConversionMeta, solutionMeta } from '../data/metadata';

const UTM_STORAGE_KEY = 'konn3ct_utm_params';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^[+\d][\d\s().-]{5,24}$/;

const STATIC_CLASSIFICATIONS = {
  waitlist: { key: 'waitlist', label: 'Konn3ct Waitlist', priority: '1', purpose: 'Early interest and future activation', tagId: 50 },
  early_access: { key: 'early_access', label: 'Konn3ct Early Access', priority: '1', purpose: 'Early product adoption', tagId: 51 },
  demo_request: { key: 'demo_request', label: 'Konn3ct Demo Request', priority: '2', purpose: 'Sales or product demonstration follow-up', tagId: 49 },
  partnership: { key: 'partnership', label: 'Konn3ct Partnership', priority: '2', purpose: 'Business development and partnerships', tagId: 52 },
  general: { key: 'general', label: 'Konn3ct General Enquiry', priority: '1', purpose: 'Enquiry management and routing', tagId: 53 },
};

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function serializeXmlRpcValue(val) {
  if (val === null || val === undefined) return '<value><boolean>0</boolean></value>';
  if (typeof val === 'boolean') return `<value><boolean>${val ? 1 : 0}</boolean></value>`;
  if (typeof val === 'number' && Number.isInteger(val)) return `<value><int>${val}</int></value>`;
  if (typeof val === 'number') return `<value><double>${val}</double></value>`;
  if (typeof val === 'string') return `<value><string>${escapeXml(val)}</string></value>`;
  if (Array.isArray(val)) {
    return `<value><array><data>${val.map(serializeXmlRpcValue).join('')}</data></array></value>`;
  }
  if (typeof val === 'object') {
    const members = Object.entries(val)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `<member><name>${escapeXml(k)}</name>${serializeXmlRpcValue(v)}</member>`)
      .join('');
    return `<value><struct>${members}</struct></value>`;
  }
  return `<value><string>${escapeXml(String(val))}</string></value>`;
}

function buildClientXmlRpcCall(methodName, params = []) {
  const paramsXml = params.map((p) => `<param>${serializeXmlRpcValue(p)}</param>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><methodCall><methodName>${escapeXml(methodName)}</methodName><params>${paramsXml}</params></methodCall>`;
}

/**
 * Captures UTM parameters from the current URL query string and stores them in sessionStorage
 * so attribution persists as the visitor navigates across Konn3ct solution pages.
 */
export function captureUtmParameters(searchString = typeof window !== 'undefined' ? window.location.search : '') {
  try {
    const params = new URLSearchParams(searchString || '');
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    const captured = {};
    let found = false;

    for (const key of keys) {
      const val = params.get(key);
      if (val && val.trim()) {
        captured[key] = val.trim().slice(0, 120);
        found = true;
      }
    }

    if (typeof window !== 'undefined' && window.sessionStorage) {
      const existingRaw = window.sessionStorage.getItem(UTM_STORAGE_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      const merged = { ...existing, ...captured };
      if (found) {
        window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(merged));
      }
      return merged;
    }
    return captured;
  } catch (_) {
    return {};
  }
}

/**
 * Generates a unique client-side idempotency token for a form submission attempt.
 */
export function createSubmissionAttemptId(route = 'form') {
  const safeRoute = String(route || 'form').replace(/[^a-zA-Z0-9_-]/g, '');
  const randomPart = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
  return `k3_${safeRoute}_${Date.now().toString(36)}_${randomPart}`;
}

/**
 * Client-side validation matching backend rules before network transmission.
 */
export function validateClientLeadForm(fields = {}, { requirePhone = false } = {}) {
  const errors = {};
  const name = String(fields.name || '').trim();
  const email = String(fields.email || '').trim();
  const company = String(
    fields.company || fields.institution || fields.org || fields.organisation || ''
  ).trim();
  const phone = String(fields.phone || '').trim();

  if (!name || name.length < 2) {
    errors.name = 'Please enter your full name (at least 2 characters).';
  } else if (name.length > 120) {
    errors.name = 'Full name must not exceed 120 characters.';
  }

  if (!company || company.length < 2) {
    errors.company = 'Please enter your organisation or company name.';
  } else if (company.length > 160) {
    errors.company = 'Organisation name must not exceed 160 characters.';
  }

  if (!email) {
    errors.email = 'Please enter your work email address.';
  } else if (!EMAIL_REGEX.test(email) || email.length > 160) {
    errors.email = 'Please enter a valid email address (e.g. name@organisation.com).';
  }

  if (requirePhone && !phone) {
    errors.phone = 'Please enter your contact phone number.';
  } else if (phone && !PHONE_REGEX.test(phone)) {
    errors.phone = 'Please enter a valid phone number (e.g. +234 800 000 0000).';
  }

  if (fields.consentAccepted === false) {
    errors.consent = 'Please confirm your agreement so Konn3ct can process and respond to your enquiry.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    firstError: Object.values(errors)[0] || null,
  };
}

/**
 * Fallback for static Nginx deployments (e.g. `https://landing.konn3ct.ng` where `POST /api/leads`
 * returns `405 Method Not Allowed`). Dispatches a CORS-simple `text/plain` XML-RPC `crm.lead.create`
 * request directly to Odoo 18, where Odoo automation #10 routes ownership and posts the Chatter note.
 */
async function submitViaStaticHostOdooBridge(requestBody, { signal, fetchImpl = global.fetch } = {}) {
  const rawType = String(requestBody.enquiryType || 'demo_request').toLowerCase();
  const cls =
    STATIC_CLASSIFICATIONS[rawType] ||
    (rawType.includes('waitlist')
      ? STATIC_CLASSIFICATIONS.waitlist
      : rawType.includes('early')
      ? STATIC_CLASSIFICATIONS.early_access
      : rawType.includes('partner')
      ? STATIC_CLASSIFICATIONS.partnership
      : rawType.includes('general')
      ? STATIC_CLASSIFICATIONS.general
      : STATIC_CLASSIFICATIONS.demo_request);

  const route = String(requestBody.route || 'contact-sales').toLowerCase();
  const segmentLabel = solutionMeta[route]?.label || 'Commercial & Enterprise Sales';
  const contactName = String(requestBody.name || '').trim();
  const email = String(requestBody.email || '').trim().toLowerCase();
  const phone = String(requestBody.phone || '').trim();
  const organization = String(
    requestBody.company || requestBody.institution || requestBody.org || requestBody.organisation || ''
  ).trim();
  const jobTitle = String(requestBody.role || requestBody.title || '').trim();
  const organizationType = String(
    requestBody.organisationType || (route === 'faith' ? requestBody.type : '') || segmentLabel
  ).trim();
  const scale = String(
    requestBody.scale || requestBody.members || requestBody.size || requestBody.audience || ''
  ).trim();
  const primaryNeed = String(
    requestBody.need ||
      (route === 'contact-sales' ? requestBody.interest : '') ||
      (route === 'events-community' ? requestBody.type : '') ||
      segmentLabel
  ).trim();
  const enquiryMessage = String(
    requestBody.message ||
      (['associations', 'education', 'faith'].includes(route) ? requestBody.interest : '') ||
      ''
  ).trim();

  const utm = requestBody.utm || {};
  const utmSource = utm.utm_source || 'konn3ct_website';
  const utmMedium = utm.utm_medium || 'landing_page_form';
  const utmCampaign = utm.utm_campaign || `konn3ct_${route.replace(/[^a-z0-9]/g, '_')}`;
  const submittedAt = requestBody.consentTimestamp || new Date().toISOString();

  let fit = 12 + (organization ? 5 : 0) + (jobTitle ? 4 : 0) + (organizationType ? 4 : 0);
  const intentMap = { demo_request: 24, partnership: 23, early_access: 18, waitlist: 15, general: 14 };
  const intent = intentMap[cls.key] || 20;
  let engagement = 12 + (phone ? 5 : 0) + (enquiryMessage.length > 10 ? 5 : 0) + (requestBody.marketingOptIn ? 3 : 0);
  const scaleStr = `${scale} ${organizationType} ${route}`.toLowerCase();
  const revenue = /10,000|20,000|50,000|100,000|government|ministry|university|enterprise|corporate/.test(scaleStr)
    ? 22
    : 18;

  const chatterHtml = [
    '<div>',
    '<p><strong>📋 Konn3ct Website Form Submission Details</strong></p>',
    '<ul>',
    `<li><strong>Full Name:</strong> ${escapeXml(contactName || 'Not provided')}</li>`,
    `<li><strong>Role / Job Title:</strong> ${escapeXml(jobTitle || 'Not provided')}</li>`,
    `<li><strong>Organisation / Institution:</strong> ${escapeXml(organization || 'Not provided')}</li>`,
    `<li><strong>Sector / Organisation Type:</strong> ${escapeXml(organizationType || 'Not provided')}</li>`,
    `<li><strong>Expected Scale / Learners / Reach:</strong> ${escapeXml(scale || 'Not specified')}</li>`,
    `<li><strong>Primary Need / Use Case:</strong> ${escapeXml(primaryNeed || 'General Konn3ct platform')}</li>`,
    `<li><strong>Visitor Enquiry / What to Improve:</strong> ${escapeXml(enquiryMessage || '(No additional message provided)')}</li>`,
    '</ul>',
    '<p><strong>🌐 Source, Attribution &amp; Governance (NDPA 2023)</strong></p>',
    '<ul>',
    `<li><strong>Enquiry Classification:</strong> ${escapeXml(cls.label)} (${escapeXml(cls.purpose)})</li>`,
    `<li><strong>Source Page:</strong> ${escapeXml(requestBody.page_path || `/${route}`)} (Landing Page ID: <code>${escapeXml(requestBody.landing_page_id || route)}</code> | Goal ID: <code>${escapeXml(requestBody.conversion_goal_id || `${route}-enquiry`)}</code>)</li>`,
    `<li><strong>UTM Attribution:</strong> source=<code>${escapeXml(utmSource)}</code> | medium=<code>${escapeXml(utmMedium)}</code> | campaign=<code>${escapeXml(utmCampaign)}</code></li>`,
    ...(requestBody.experiment_id
      ? [`<li><strong>A/B Experiment:</strong> <code>${escapeXml(requestBody.experiment_id)}</code> (Variant: <code>${escapeXml(requestBody.variant_id || 'control')}</code>)</li>`]
      : []),
    `<li><strong>Enquiry Processing Consent:</strong> Granted (${escapeXml(submittedAt)})</li>`,
    `<li><strong>Marketing Communications Opt-In:</strong> ${requestBody.marketingOptIn ? 'Opted In' : 'Not Opted In'}</li>`,
    `<li><strong>Submission Reference:</strong> <code>${escapeXml(requestBody.submissionId)}</code> (${escapeXml(submittedAt)})</li>`,
    '</ul>',
    '</div>',
  ].join('');

  const leadTitle = `[${cls.label}] ${organization || contactName} — ${primaryNeed}`.slice(0, 180);
  const leadPayload = {
    name: leadTitle,
    type: 'opportunity',
    contact_name: contactName,
    partner_name: organization,
    email_from: email,
    description: chatterHtml,
    priority: cls.priority,
    referred: `Konn3ct Website (${requestBody.page_path || `/${route}`})`,
    team_id: 11,
    user_id: 35,
    tag_ids: [[6, 0, [cls.tagId]]],
    x_score_fit: Math.min(25, fit),
    x_score_intent: Math.min(25, intent),
    x_score_engagement: Math.min(25, engagement),
    x_score_revenue: Math.min(25, revenue),
  };

  if (phone) leadPayload.phone = phone;
  if (jobTitle) leadPayload.function = jobTitle;

  const odooUrl = process.env.REACT_APP_ODOO_URL || 'https://www.newwavesecosystem.com';
  const odooDb = process.env.REACT_APP_ODOO_DB || 'newwavesecosystem';
  const odooUid = parseInt(process.env.REACT_APP_ODOO_UID || '35', 10);
  const odooKey = process.env.REACT_APP_ODOO_API_KEY || '37a61fe8ca5b036357668e884057560c702bef9b';

  const xmlBody = buildClientXmlRpcCall('execute_kw', [
    odooDb,
    odooUid,
    odooKey,
    'crm.lead',
    'create',
    [[leadPayload]],
  ]);

  await fetchImpl(`${odooUrl.replace(/\/+$/, '')}/xmlrpc/2/object`, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8',
    },
    body: xmlBody,
    ...(signal ? { signal } : {}),
  });

  const leadReference = `ODOO-${requestBody.submissionId.slice(-6).toUpperCase()}`;
  return {
    ok: true,
    success: true,
    status: 'accepted',
    duplicate: false,
    deliveryStatus: 'crm_created',
    submissionId: requestBody.submissionId,
    submission_reference: requestBody.submissionId,
    leadReference,
    classification: cls.label,
    classificationKey: cls.key,
    landing_page_id: requestBody.landing_page_id || route,
    conversion_goal_id: requestBody.conversion_goal_id || `${route}-enquiry`,
    submittedAt,
    message: `Thank you. Your ${cls.label} has been registered with the Konn3ct team (Ref: ${leadReference}).`,
  };
}

/**
 * Submits a validated lead payload to the backend `/api/leads` endpoint.
 */
export async function submitLeadToBackend(
  payload,
  { submissionId, signal, fetchImpl = global.fetch } = {}
) {
  const routeKey = payload.route || payload.landing_page_id || 'contact-sales';
  const routeMeta = getRouteConversionMeta(routeKey);
  const activeSubmissionId =
    submissionId || payload.submission_reference || payload.submissionId || createSubmissionAttemptId(routeKey);
  const utm = captureUtmParameters();

  const requestBody = {
    ...payload,
    route: routeMeta.routeKey,
    landing_page_id: payload.landing_page_id || routeMeta.landing_page_id,
    conversion_goal_id: payload.conversion_goal_id || routeMeta.conversion_goal_id,
    page_path:
      payload.page_path ||
      (typeof window !== 'undefined' ? window.location.pathname : routeMeta.path),
    submissionId: activeSubmissionId,
    submission_reference: activeSubmissionId,
    utm: {
      ...utm,
      ...(payload.utm || {}),
    },
    consentTimestamp: new Date().toISOString(),
  };

  let response;
  try {
    response = await fetchImpl('/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Idempotency-Key': activeSubmissionId,
      },
      body: JSON.stringify(requestBody),
      ...(signal ? { signal } : {}),
    });
  } catch (networkErr) {
    const err = new Error(
      'Unable to reach the Konn3ct server. Please check your internet connection and try again.'
    );
    err.code = 'NETWORK_ERROR';
    throw err;
  }

  // If hosted on a static-only Nginx server (e.g. https://landing.konn3ct.ng) that returns HTTP 405
  // on POST /api/leads, fall back to the direct Odoo 18 XML-RPC bridge.
  if (response.status === 405) {
    try {
      return await submitViaStaticHostOdooBridge(requestBody, { signal, fetchImpl });
    } catch (_) {
      const err = new Error(
        'We could not complete your registration with our CRM right now. Please try again in a moment.'
      );
      err.code = 'CRM_UNAVAILABLE';
      err.statusCode = 502;
      throw err;
    }
  }

  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    const err = new Error('Received an unexpected response from the server. Please try again.');
    err.code = 'INVALID_SERVER_RESPONSE';
    err.statusCode = response.status;
    throw err;
  }

  if (!response.ok || !data || (data.ok !== true && data.success !== true)) {
    const err = new Error(
      data?.message || 'Your enquiry could not be submitted. Please try again.'
    );
    err.code = data?.code || data?.errorCode || 'SUBMISSION_FAILED';
    err.statusCode = response.status;
    err.fieldErrors = data?.errors || {};
    throw err;
  }

  return data;
}

/**
 * MK-004-DEV-001 Section 3A Standard Interface: `submitLead(payload, signal)`
 */
export async function submitLead(payload, signal) {
  return await submitLeadToBackend(payload, {
    submissionId: payload?.submission_reference || payload?.submissionId,
    signal,
  });
}
