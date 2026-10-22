/**
 * Phase 6, Phase 10 & MK-004-DEV-001: Secure Backend Lead Capture Endpoint (`/api/leads`)
 * Compatible with Vercel Serverless Functions (`api/leads.js`) and Express dev middleware (`src/setupProxy.js`).
 */

const { validateLeadSubmission, MAX_PAYLOAD_BYTES } = require('./_lib/validation');
const {
  computeContentFingerprint,
  resolveSubmissionId,
  checkIdempotency,
  getRepeatEnquiryContext,
  recordCompletedSubmission,
  executeWithIdempotencyLock,
  checkRateLimit,
  recordFunnelOutcome,
  getFunnelReconciliationSummary,
} = require('./_lib/idempotency');
const { createCrmLead, getOdooConfig, getOdooVersion } = require('./_lib/odooClient');
const logger = require('./_lib/logger');

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('X-Frame-Options', 'DENY');
  for (const [k, v] of Object.entries(extraHeaders)) {
    res.setHeader(k, v);
  }
  const body = JSON.stringify(payload);
  if (typeof res.send === 'function' && !res.writableEnded) {
    return res.status ? res.status(statusCode).end(body) : res.end(body);
  }
  return res.end(body);
}

function getClientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';
}

function verifyAllowedOrigin(req) {
  const allowedRaw = process.env.KONN3CT_ALLOWED_ORIGINS;
  if (!allowedRaw || !allowedRaw.trim()) return true;

  const allowedList = allowedRaw
    .split(',')
    .map((o) => o.trim().toLowerCase())
    .filter(Boolean);
  if (allowedList.length === 0 || allowedList.includes('*')) return true;

  const origin = String(req.headers?.origin || '').trim().toLowerCase();
  const referer = String(req.headers?.referer || '').trim().toLowerCase();

  if (!origin && !referer) return true;
  if (origin && allowedList.includes(origin)) return true;
  if (referer && allowedList.some((allowed) => referer.startsWith(allowed))) return true;

  return false;
}

async function parseRequestBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      return req.body;
    }
    if (typeof req.body === 'string') {
      if (Buffer.byteLength(req.body, 'utf8') > MAX_PAYLOAD_BYTES) {
        const err = new Error('Payload too large');
        err.code = 'PAYLOAD_TOO_LARGE';
        throw err;
      }
      return JSON.parse(req.body);
    }
    if (Buffer.isBuffer(req.body)) {
      if (req.body.length > MAX_PAYLOAD_BYTES) {
        const err = new Error('Payload too large');
        err.code = 'PAYLOAD_TOO_LARGE';
        throw err;
      }
      return JSON.parse(req.body.toString('utf8'));
    }
  }

  return await new Promise((resolve, reject) => {
    let raw = '';
    let bytes = 0;
    req.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_PAYLOAD_BYTES) {
        const err = new Error('Payload too large');
        err.code = 'PAYLOAD_TOO_LARGE';
        reject(err);
        if (typeof req.destroy === 'function') req.destroy();
        return;
      }
      raw += chunk.toString('utf8');
    });
    req.on('end', () => {
      if (!raw.trim()) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        const err = new Error('Invalid JSON payload');
        err.code = 'MALFORMED_JSON';
        reject(err);
      }
    });
    req.on('error', (err) => reject(err));
  });
}

/**
 * Main Serverless HTTP Handler for `/api/leads`
 */
async function leadsHandler(req, res, options = {}) {
  const startMs = Date.now();
  const method = String(req.method || 'GET').toUpperCase();

  if (method === 'OPTIONS') {
    return sendJson(res, 204, {}, { Allow: 'GET, POST, OPTIONS' });
  }

  // Health, Readiness & Funnel Reconciliation Check (`GET /api/leads`)
  if (method === 'GET') {
    const cfg = getOdooConfig(options.configOverrides);
    const hasCredentials = Boolean(cfg.username && cfg.apiKey && cfg.db);
    let upstreamVersion = null;

    if (req.url && req.url.includes('probe=1')) {
      try {
        upstreamVersion = await getOdooVersion({
          configOverrides: options.configOverrides,
          fetchImpl: options.fetchImpl,
        });
      } catch (err) {
        upstreamVersion = { reachable: false, errorCode: err.code };
      }
    }

    const includeReconciliation = Boolean(req.url && req.url.includes('reconcile=1'));

    return sendJson(res, 200, {
      ok: true,
      success: true,
      service: 'konn3ct-odoo-crm-integration',
      mode: cfg.mode,
      credentialsConfigured: hasCredentials,
      durableQueueEnabled: cfg.enableDurableQueue,
      odooTargetOrigin: cfg.baseUrl,
      salesTeamTarget: cfg.teamName,
      ...(upstreamVersion ? { upstreamVersion } : {}),
      ...(includeReconciliation ? { reconciliation: getFunnelReconciliationSummary() } : {}),
    });
  }

  if (method !== 'POST') {
    return sendJson(
      res,
      405,
      {
        ok: false,
        success: false,
        code: 'METHOD_NOT_ALLOWED',
        errorCode: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are accepted for lead submissions.',
      },
      { Allow: 'GET, POST, OPTIONS' }
    );
  }

  // 1. Origin check
  if (!verifyAllowedOrigin(req)) {
    logger.warn('lead_submission_blocked_origin', { origin: req.headers?.origin });
    return sendJson(res, 403, {
      ok: false,
      success: false,
      code: 'FORBIDDEN_ORIGIN',
      errorCode: 'FORBIDDEN_ORIGIN',
      message: 'Request origin is not authorized.',
    });
  }

  // 2. Rate limiting check
  const clientIp = getClientIp(req);
  const rateStatus = checkRateLimit(clientIp);
  if (!rateStatus.allowed) {
    logger.warn('lead_submission_rate_limited', {
      clientIp,
      retryAfterSeconds: rateStatus.retryAfterSeconds,
    });
    return sendJson(
      res,
      429,
      {
        ok: false,
        success: false,
        code: 'RATE_LIMITED',
        errorCode: 'RATE_LIMITED',
        message: 'Too many submissions from this connection. Please wait a few minutes and try again.',
        retryAfterSeconds: rateStatus.retryAfterSeconds,
      },
      { 'Retry-After': String(rateStatus.retryAfterSeconds) }
    );
  }

  // 3. Parse JSON body safely with size ceiling
  let rawBody;
  try {
    rawBody = await parseRequestBody(req);
  } catch (err) {
    if (err.code === 'PAYLOAD_TOO_LARGE') {
      return sendJson(res, 413, {
        ok: false,
        success: false,
        code: 'PAYLOAD_TOO_LARGE',
        errorCode: 'PAYLOAD_TOO_LARGE',
        message: 'Submission exceeds maximum allowed size.',
      });
    }
    return sendJson(res, 400, {
      ok: false,
      success: false,
      code: 'MALFORMED_JSON',
      errorCode: 'MALFORMED_JSON',
      message: 'Request body must be valid JSON.',
    });
  }

  const rawLandingPageId = String(rawBody?.landing_page_id || rawBody?.route || 'contact-sales')
    .trim()
    .toLowerCase();
  const rawConversionGoalId = String(
    rawBody?.conversion_goal_id || `${rawLandingPageId}-enquiry`
  )
    .trim()
    .toLowerCase();

  recordFunnelOutcome({
    landingPageId: rawLandingPageId,
    conversionGoalId: rawConversionGoalId,
    outcome: 'attempted',
  });

  // 4. Validate and normalize input fields, consent, and honeypot
  const validation = validateLeadSubmission(rawBody);
  if (!validation.valid) {
    recordFunnelOutcome({
      landingPageId: rawLandingPageId,
      conversionGoalId: rawConversionGoalId,
      outcome: 'validation_rejected',
    });
    logger.warn('lead_submission_validation_failed', {
      errorCode: validation.errorCode,
      route: rawBody?.route,
      isSpam: Boolean(validation.isSpam),
    });
    return sendJson(res, validation.statusCode || 422, {
      ok: false,
      success: false,
      code: validation.errorCode,
      errorCode: validation.errorCode,
      message: validation.message,
      errors: validation.errors,
    });
  }

  const { normalized, classification } = validation;

  // 5. Idempotency & Duplicate Prevention
  const headerKey = req.headers?.['x-idempotency-key'];
  const submissionId = resolveSubmissionId(
    headerKey || rawBody?.submission_reference || rawBody?.submissionId
  );
  const contentFingerprint = computeContentFingerprint(normalized, classification);

  const existingCheck = checkIdempotency(submissionId, contentFingerprint);
  if (existingCheck.isDuplicate) {
    recordFunnelOutcome({
      landingPageId: normalized.landingPageId,
      conversionGoalId: normalized.conversionGoalId,
      outcome: 'deduplicated',
    });
    logger.info('lead_submission_deduplicated', {
      submissionId: existingCheck.record.submissionId,
      reason: existingCheck.reason,
      route: normalized.route,
      classification: classification.key,
    });
    return sendJson(res, 200, {
      ok: true,
      success: true,
      status: 'accepted',
      duplicate: true,
      deduplicatedBy: existingCheck.reason,
      deliveryStatus: existingCheck.record.deliveryStatus,
      submissionId: existingCheck.record.submissionId,
      submission_reference: existingCheck.record.submissionId,
      leadReference: existingCheck.record.leadReference,
      classification: existingCheck.record.classification,
      landing_page_id: normalized.landingPageId,
      conversion_goal_id: normalized.conversionGoalId,
      message:
        existingCheck.record.deliveryStatus === 'crm_created'
          ? 'Your enquiry has already been registered with the Konn3ct team.'
          : 'Your enquiry has already been received and queued for the Konn3ct team.',
    });
  }

  // 6. Execute CRM creation inside concurrency lock to prevent race-condition duplicates
  try {
    const result = await executeWithIdempotencyLock(submissionId, contentFingerprint, async () => {
      const innerCheck = checkIdempotency(submissionId, contentFingerprint);
      if (innerCheck.isDuplicate) {
        return {
          ...innerCheck.record,
          duplicate: true,
          deduplicatedBy: innerCheck.reason,
        };
      }

      const repeatContext = getRepeatEnquiryContext(normalized.email);
      const created = await createCrmLead({
        normalized,
        classification,
        submissionId,
        repeatContext,
        configOverrides: options.configOverrides,
        fetchImpl: options.fetchImpl,
      });

      const responseRecord = {
        ok: true,
        success: true,
        status: 'accepted',
        duplicate: false,
        deliveryStatus: created.deliveryStatus,
        submissionId: created.submissionId,
        submission_reference: created.submissionId,
        leadReference: created.leadReference,
        classification: created.classification,
        classificationKey: created.classificationKey,
        landing_page_id: normalized.landingPageId,
        conversion_goal_id: normalized.conversionGoalId,
        isRepeatEnquiry: Boolean(created.isRepeatEnquiry),
        submittedAt: created.submittedAt,
      };

      recordCompletedSubmission({
        submissionId,
        contentFingerprint,
        email: normalized.email,
        classificationKey: classification.key,
        route: normalized.route,
        result: responseRecord,
      });

      recordFunnelOutcome({
        landingPageId: normalized.landingPageId,
        conversionGoalId: normalized.conversionGoalId,
        outcome: created.deliveryStatus === 'crm_created' ? 'crm_created' : 'queued_pending_crm',
      });

      return responseRecord;
    });

    const durationMs = Date.now() - startMs;
    const statusCode = result.duplicate
      ? 200
      : result.deliveryStatus === 'crm_created'
      ? 201
      : 202;

    const userMessage =
      result.deliveryStatus === 'crm_created'
        ? `Thank you. Your ${result.classification} has been registered with the Konn3ct team (Ref: ${result.leadReference}).`
        : `Thank you. Your ${result.classification} has been securely queued for Konn3ct CRM processing (Ref: ${result.leadReference}).`;

    logger.info('lead_submission_completed', {
      submissionId: result.submissionId,
      leadReference: result.leadReference,
      deliveryStatus: result.deliveryStatus,
      duplicate: Boolean(result.duplicate),
      route: normalized.route,
      classification: classification.key,
      durationMs,
    });

    return sendJson(res, statusCode, {
      ...result,
      message: userMessage,
    });
  } catch (err) {
    const durationMs = Date.now() - startMs;
    const statusCode = err.statusCode && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 502;
    const errorCode = err.code || 'CRM_UNAVAILABLE';

    recordFunnelOutcome({
      landingPageId: normalized.landingPageId,
      conversionGoalId: normalized.conversionGoalId,
      outcome: 'failed',
    });

    logger.error('lead_submission_failed', {
      submissionId,
      route: normalized.route,
      classification: classification.key,
      errorCode,
      statusCode,
      durationMs,
      reason: err.message,
    });

    const safeUserMessage =
      errorCode === 'ODOO_TIMEOUT'
        ? 'Our CRM service took too long to respond. Your details were not lost on this page—please click submit again to retry.'
        : errorCode === 'ODOO_CREDENTIALS_MISSING'
        ? 'CRM integration credentials are not yet active in this environment. Please contact info@konn3ct.com or try again shortly.'
        : 'We could not complete your registration with our CRM right now. Please try again in a moment or email info@konn3ct.com.';

    return sendJson(res, statusCode, {
      ok: false,
      success: false,
      code: errorCode,
      errorCode,
      submissionId,
      submission_reference: submissionId,
      message: safeUserMessage,
    });
  }
}

module.exports = leadsHandler;
module.exports.leadsHandler = leadsHandler;
