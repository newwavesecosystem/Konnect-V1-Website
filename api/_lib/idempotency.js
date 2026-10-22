/**
 * Phase 5, Phase 10 & MK-004 AC-06:
 * Duplicate & Lead-Idempotency Policy + Sliding-Window Rate Limiter + Funnel Reconciliation Ledger
 *
 * Policy Guarantees:
 * 1. Accidental double-clicks and network retries of the same request are deduplicated via
 *    explicit `idempotencyKey` AND short-window `contentFingerprint` (SHA-256 of full submission context).
 * 2. Concurrent identical submissions share an in-flight lock so only one Odoo RPC call executes.
 * 3. Email address alone is NEVER treated as a unique key: legitimate repeat enquiries from the
 *    same email (different form/segment, different enquiry type, different message, or subsequent
 *    enquiry outside the double-click window) create a new CRM lead with historical context attached.
 * 4. Maintains non-PII funnel reconciliation counters by `landing_page_id` and `conversion_goal_id`.
 */

const crypto = require('crypto');
const fs = require('fs');

const IDEMPOTENCY_KEY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours for explicit idempotency key
const CONTENT_FINGERPRINT_TTL_MS = 10 * 60 * 1000; // 10 minutes for identical-content double-click protection
const SAFE_KEY_REGEX = /^[a-zA-Z0-9_.:-]{8,96}$/;

// Stores
const byIdempotencyKey = new Map();
const byContentFingerprint = new Map();
const contactHistoryByEmail = new Map();
const inFlightLocks = new Map();
const rateLimitBuckets = new Map();
const funnelReconciliationLedger = new Map();

function loadDurableStoreIfConfigured() {
  const filePath = process.env.KONN3CT_IDEMPOTENCY_FILE;
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const now = Date.now();
      for (const [k, v] of Object.entries(raw.byIdempotencyKey || {})) {
        if (v.expiresAt > now) byIdempotencyKey.set(k, v);
      }
      for (const [k, v] of Object.entries(raw.byContentFingerprint || {})) {
        if (v.expiresAt > now) byContentFingerprint.set(k, v);
      }
      for (const [k, v] of Object.entries(raw.contactHistoryByEmail || {})) {
        contactHistoryByEmail.set(k, v);
      }
    }
  } catch (_) {
    // Non-fatal if durable cache file does not exist yet
  }
}

function persistDurableStoreIfConfigured() {
  const filePath = process.env.KONN3CT_IDEMPOTENCY_FILE;
  if (!filePath) return;
  try {
    const serialized = JSON.stringify(
      {
        byIdempotencyKey: Object.fromEntries(byIdempotencyKey.entries()),
        byContentFingerprint: Object.fromEntries(byContentFingerprint.entries()),
        contactHistoryByEmail: Object.fromEntries(contactHistoryByEmail.entries()),
      },
      null,
      2
    );
    fs.writeFileSync(filePath, serialized, 'utf8');
  } catch (_) {
    // Ignore write failures in read-only serverless filesystems
  }
}

loadDurableStoreIfConfigured();

function computeContentFingerprint(normalized, classification) {
  const canonical = [
    normalized.email.toLowerCase(),
    normalized.organization.toLowerCase(),
    normalized.route.toLowerCase(),
    classification.key.toLowerCase(),
    normalized.primaryNeed.toLowerCase(),
    normalized.enquiryMessage.toLowerCase(),
  ].join('|');

  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

function resolveSubmissionId(clientKey) {
  if (typeof clientKey === 'string' && SAFE_KEY_REGEX.test(clientKey.trim())) {
    return clientKey.trim();
  }
  const randomHex = crypto.randomBytes(12).toString('hex');
  return `k3_${Date.now().toString(36)}_${randomHex}`;
}

function pruneExpired(now = Date.now()) {
  for (const [key, entry] of byIdempotencyKey.entries()) {
    if (entry.expiresAt <= now) byIdempotencyKey.delete(key);
  }
  for (const [fp, entry] of byContentFingerprint.entries()) {
    if (entry.expiresAt <= now) byContentFingerprint.delete(fp);
  }
}

/**
 * Checks whether a submission is a duplicate of a completed request.
 */
function checkIdempotency(submissionId, contentFingerprint, now = Date.now()) {
  pruneExpired(now);

  if (submissionId && byIdempotencyKey.has(submissionId)) {
    const cached = byIdempotencyKey.get(submissionId);
    return {
      isDuplicate: true,
      reason: 'idempotency_key_match',
      record: cached.result,
    };
  }

  if (contentFingerprint && byContentFingerprint.has(contentFingerprint)) {
    const cached = byContentFingerprint.get(contentFingerprint);
    return {
      isDuplicate: true,
      reason: 'identical_payload_window_match',
      record: cached.result,
    };
  }

  return { isDuplicate: false };
}

/**
 * Inspects prior legitimate enquiries from the same email address so repeat enquiries
 * are preserved as distinct leads while retaining historical linkage.
 */
function getRepeatEnquiryContext(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const history = contactHistoryByEmail.get(normalizedEmail) || [];
  if (history.length === 0) {
    return {
      isRepeatEnquiry: false,
      priorSubmissionCount: 0,
      priorLeadIds: [],
    };
  }
  return {
    isRepeatEnquiry: true,
    priorSubmissionCount: history.length,
    priorLeadIds: history.map((h) => h.leadReference).filter(Boolean),
    lastSubmittedAt: history[history.length - 1]?.submittedAt,
  };
}

/**
 * Records a completed lead submission in idempotency and contact history stores.
 */
function recordCompletedSubmission({
  submissionId,
  contentFingerprint,
  email,
  classificationKey,
  route,
  result,
  now = Date.now(),
}) {
  if (submissionId) {
    byIdempotencyKey.set(submissionId, {
      result,
      createdAt: now,
      expiresAt: now + IDEMPOTENCY_KEY_TTL_MS,
    });
  }

  if (contentFingerprint) {
    byContentFingerprint.set(contentFingerprint, {
      result,
      createdAt: now,
      expiresAt: now + CONTENT_FINGERPRINT_TTL_MS,
    });
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (normalizedEmail) {
    const existing = contactHistoryByEmail.get(normalizedEmail) || [];
    existing.push({
      submissionId,
      leadReference: result.leadReference,
      classification: classificationKey,
      route,
      submittedAt: result.submittedAt || new Date(now).toISOString(),
    });
    contactHistoryByEmail.set(normalizedEmail, existing.slice(-20));
  }

  persistDurableStoreIfConfigured();
}

/**
 * Executes an async submission operation under an in-flight concurrency lock
 * keyed by both `submissionId` and `contentFingerprint`.
 */
async function executeWithIdempotencyLock(submissionId, contentFingerprint, taskFn) {
  const lockKey =
    (submissionId && inFlightLocks.has(`id:${submissionId}`) && `id:${submissionId}`) ||
    (contentFingerprint && inFlightLocks.has(`fp:${contentFingerprint}`) && `fp:${contentFingerprint}`) ||
    null;

  if (lockKey) {
    const firstResult = await inFlightLocks.get(lockKey);
    return {
      ...firstResult,
      duplicate: true,
      deduplicatedBy: 'concurrent_inflight_lock',
    };
  }

  const promise = (async () => {
    return await taskFn();
  })();

  if (submissionId) inFlightLocks.set(`id:${submissionId}`, promise);
  if (contentFingerprint) inFlightLocks.set(`fp:${contentFingerprint}`, promise);

  try {
    const result = await promise;
    return result;
  } finally {
    if (submissionId) inFlightLocks.delete(`id:${submissionId}`);
    if (contentFingerprint) inFlightLocks.delete(`fp:${contentFingerprint}`);
  }
}

/**
 * Sliding-window per-client IP rate limiter.
 */
function checkRateLimit(clientIp, now = Date.now()) {
  const maxRequests = parseInt(process.env.KONN3CT_RATE_LIMIT_MAX || '8', 10);
  const windowMs = parseInt(process.env.KONN3CT_RATE_LIMIT_WINDOW_MS || String(10 * 60 * 1000), 10);
  const key = String(clientIp || 'unknown_ip').trim();

  const timestamps = (rateLimitBuckets.get(key) || []).filter((ts) => now - ts < windowMs);

  if (timestamps.length >= maxRequests) {
    const oldest = timestamps[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    rateLimitBuckets.set(key, timestamps);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  timestamps.push(now);
  rateLimitBuckets.set(key, timestamps);

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - timestamps.length),
    retryAfterSeconds: 0,
  };
}

/**
 * MK-004 AC-06: Records non-PII funnel reconciliation counters by landing_page_id and conversion_goal_id.
 */
function recordFunnelOutcome({ landingPageId = 'unknown', conversionGoalId = 'unknown', outcome }) {
  const key = `${landingPageId}|${conversionGoalId}`;
  const current = funnelReconciliationLedger.get(key) || {
    landing_page_id: landingPageId,
    conversion_goal_id: conversionGoalId,
    attempted: 0,
    crm_created: 0,
    queued_pending_crm: 0,
    deduplicated: 0,
    validation_rejected: 0,
    failed: 0,
    lastUpdatedAt: null,
  };

  if (outcome === 'attempted') current.attempted += 1;
  else if (outcome === 'crm_created') current.crm_created += 1;
  else if (outcome === 'queued_pending_crm') current.queued_pending_crm += 1;
  else if (outcome === 'deduplicated') current.deduplicated += 1;
  else if (outcome === 'validation_rejected') current.validation_rejected += 1;
  else if (outcome === 'failed') current.failed += 1;

  current.lastUpdatedAt = new Date().toISOString();
  funnelReconciliationLedger.set(key, current);
  return current;
}

function getFunnelReconciliationSummary() {
  return Array.from(funnelReconciliationLedger.values());
}

/**
 * Resets in-memory stores (used by automated test suites).
 */
function resetStoresForTesting() {
  byIdempotencyKey.clear();
  byContentFingerprint.clear();
  contactHistoryByEmail.clear();
  inFlightLocks.clear();
  rateLimitBuckets.clear();
  funnelReconciliationLedger.clear();
}

module.exports = {
  computeContentFingerprint,
  resolveSubmissionId,
  checkIdempotency,
  getRepeatEnquiryContext,
  recordCompletedSubmission,
  executeWithIdempotencyLock,
  checkRateLimit,
  recordFunnelOutcome,
  getFunnelReconciliationSummary,
  resetStoresForTesting,
};
