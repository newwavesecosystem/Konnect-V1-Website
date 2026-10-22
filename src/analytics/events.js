/**
 * MK-004 AC-05, DEV-AT-08 & DEV-AT-09: Consent-Controlled GA4 Analytics & Conversion Instrumentation
 *
 * Security & Privacy Rules:
 * 1. `generate_lead` is emitted ONLY after the backend confirms CRM acceptance (`success: true` / `ok: true`).
 * 2. Duplicate idempotent replays (`duplicate: true`) never emit a second conversion event.
 * 3. If consent is denied (`consentAccepted === false` or `analyticsConsent === false`), NO GA4 conversion
 *    event is emitted (`DEV-AT-08`).
 * 4. Personal Identifiable Information (name, email, phone, company, free-text message) and raw internal
 *    database IDs are NEVER sent to `gtag` or `dataLayer`. Only opaque `submission_reference` and
 *    campaign/route metadata are included.
 */

import { captureUtmParameters } from '../services/leadService';
import { getRouteConversionMeta } from '../data/metadata';

const CONSENT_STORAGE_KEY = 'konn3ct_analytics_consent';
const emittedSubmissionRefs = new Set();
const analyticsEventLog = [];

const PII_KEYS_BLACKLIST = new Set([
  'name',
  'contact_name',
  'contactName',
  'email',
  'email_from',
  'phone',
  'company',
  'partner_name',
  'institution',
  'org',
  'organisation',
  'message',
  'description',
  'leadId',
]);

/**
 * Sets or updates the visitor's analytics consent preference.
 */
export function setAnalyticsConsent(granted) {
  const boolVal = Boolean(granted);
  if (typeof window !== 'undefined') {
    window.__KONN3CT_ANALYTICS_CONSENT__ = boolVal;
    try {
      if (window.sessionStorage) {
        window.sessionStorage.setItem(CONSENT_STORAGE_KEY, boolVal ? 'granted' : 'denied');
      }
    } catch (_) {
      // Ignore storage restrictions
    }
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: boolVal ? 'granted' : 'denied',
      });
    }
  }
  return boolVal;
}

/**
 * Evaluates whether analytics tracking is permitted for the current interaction.
 */
export function isAnalyticsPermitted(explicitConsentFlag) {
  if (explicitConsentFlag === false) return false;
  if (typeof window !== 'undefined' && window.__KONN3CT_ANALYTICS_CONSENT__ === false) {
    return false;
  }
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const stored = window.sessionStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored === 'denied') return false;
    }
  } catch (_) {
    // Ignore storage errors
  }
  return true;
}

/**
 * Strips any accidental PII keys from an analytics event payload before dispatch.
 */
function stripPiiFromEventPayload(rawPayload = {}) {
  const safe = {};
  for (const [k, v] of Object.entries(rawPayload)) {
    if (PII_KEYS_BLACKLIST.has(k)) continue;
    if (v !== undefined && v !== null && v !== '') {
      safe[k] = v;
    }
  }
  return safe;
}

function dispatchToGa4(eventName, rawParams = {}) {
  const safeParams = stripPiiFromEventPayload(rawParams);
  const entry = {
    event: eventName,
    timestamp: new Date().toISOString(),
    params: safeParams,
  };

  analyticsEventLog.push(entry);

  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...safeParams,
    });

    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, safeParams);
    }
  }

  return entry;
}

/**
 * DEV-AT-08 & DEV-AT-09: Emits the GA4 `generate_lead` conversion event ONLY after
 * confirmed backend acceptance and ONLY when consent is permitted.
 */
export function trackConfirmedLead(backendResult = {}, context = {}) {
  // 1. Require authoritative backend confirmation
  if (!backendResult || (backendResult.success !== true && backendResult.ok !== true)) {
    return { emitted: false, reason: 'unconfirmed_backend_response' };
  }

  // 2. Respect consent controls (DEV-AT-08)
  const consentFlag =
    context.consentAccepted !== undefined
      ? context.consentAccepted
      : context.analyticsConsent;
  if (!isAnalyticsPermitted(consentFlag)) {
    return { emitted: false, reason: 'consent_denied' };
  }

  // 3. Do not double-emit on idempotent duplicate responses
  const opaqueRef =
    backendResult.submission_reference || backendResult.submissionId || null;
  if (backendResult.duplicate === true || (opaqueRef && emittedSubmissionRefs.has(opaqueRef))) {
    return { emitted: false, reason: 'duplicate_submission_suppressed' };
  }

  if (opaqueRef) {
    emittedSubmissionRefs.add(opaqueRef);
  }

  const routeMeta = getRouteConversionMeta(
    context.landing_page_id || context.route || backendResult.landing_page_id || 'contact-sales'
  );
  const utm = captureUtmParameters();

  const eventPayload = {
    landing_page_id: context.landing_page_id || backendResult.landing_page_id || routeMeta.landing_page_id,
    conversion_goal_id:
      context.conversion_goal_id || backendResult.conversion_goal_id || routeMeta.conversion_goal_id,
    page_path:
      context.page_path ||
      (typeof window !== 'undefined' ? window.location.pathname : routeMeta.path),
    submission_reference: opaqueRef,
    lead_classification: backendResult.classification || context.enquiryType || 'Konn3ctDemoRequest',
    delivery_status: backendResult.deliveryStatus || backendResult.status || 'accepted',
    utm_source: utm.utm_source || 'konn3ct_website',
    utm_medium: utm.utm_medium || 'landing_page_form',
    utm_campaign: utm.utm_campaign || `konn3ct_${routeMeta.landing_page_id}`,
    ...(context.experiment_id ? { experiment_id: context.experiment_id } : {}),
    ...(context.variant_id ? { variant_id: context.variant_id } : {}),
  };

  const entry = dispatchToGa4('generate_lead', eventPayload);
  return { emitted: true, entry };
}

/**
 * Tracks CTA interactions across all 8 routes.
 */
export function trackCtaClick({
  landing_page_id,
  conversion_goal_id,
  cta_label,
  target_destination,
  experiment_id,
  variant_id,
} = {}) {
  if (!isAnalyticsPermitted()) return { emitted: false, reason: 'consent_denied' };
  const routeMeta = getRouteConversionMeta(landing_page_id || 'home');
  const entry = dispatchToGa4('cta_click', {
    landing_page_id: routeMeta.landing_page_id,
    conversion_goal_id: conversion_goal_id || routeMeta.conversion_goal_id,
    cta_label: String(cta_label || '').slice(0, 80),
    target_destination: String(target_destination || '').slice(0, 120),
    ...(experiment_id ? { experiment_id } : {}),
    ...(variant_id ? { variant_id } : {}),
  });
  return { emitted: true, entry };
}

/**
 * Tracks landing page views with UTM attribution.
 */
export function trackPageView({ route, page_path } = {}) {
  if (!isAnalyticsPermitted()) return { emitted: false, reason: 'consent_denied' };
  const routeMeta = getRouteConversionMeta(route || page_path || 'home');
  const utm = captureUtmParameters();
  const entry = dispatchToGa4('page_view_konn3ct', {
    landing_page_id: routeMeta.landing_page_id,
    conversion_goal_id: routeMeta.conversion_goal_id,
    page_path: page_path || routeMeta.path,
    utm_source: utm.utm_source || 'direct',
    utm_medium: utm.utm_medium || 'none',
    utm_campaign: utm.utm_campaign || `konn3ct_${routeMeta.landing_page_id}`,
  });
  return { emitted: true, entry };
}

/**
 * Tracks A/B experiment exposure events (AC-07).
 */
export function trackExperimentExposure({ experiment_id, variant_id, landing_page_id } = {}) {
  if (!isAnalyticsPermitted()) return { emitted: false, reason: 'consent_denied' };
  const entry = dispatchToGa4('experiment_exposure', {
    experiment_id,
    variant_id,
    landing_page_id,
  });
  return { emitted: true, entry };
}

export function getAnalyticsEventLog() {
  return [...analyticsEventLog];
}

export function clearAnalyticsEventLogForTesting() {
  analyticsEventLog.length = 0;
  emittedSubmissionRefs.clear();
  if (typeof window !== 'undefined') {
    delete window.__KONN3CT_ANALYTICS_CONSENT__;
    if (window.dataLayer) window.dataLayer.length = 0;
  }
}
