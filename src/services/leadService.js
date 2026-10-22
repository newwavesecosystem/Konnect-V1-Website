/**
 * Phase 7 & MK-004-DEV-001: Frontend Lead Capture Service
 * Handles UTM attribution capture, client-side validation, idempotency key management,
 * and authenticated backend communication via `/api/leads`.
 */

import { getRouteConversionMeta } from '../data/metadata';

const UTM_STORAGE_KEY = 'konn3ct_utm_params';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^[+\d][\d\s().-]{5,24}$/;

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
