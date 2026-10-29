/**
 * Phase 6 & Phase 10: Input Validation, Normalization, Spam Protection & Payload Limits
 */

const { normalizeSubmissionFields, resolveClassification } = require('./classification');

const MAX_PAYLOAD_BYTES = 16 * 1024; // 16 KB strict payload ceiling
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^[+\d][\d\s().-]{5,24}$/;

const FIELD_LIMITS = {
  contactName: { min: 2, max: 120 },
  email: { min: 5, max: 160 },
  phone: { min: 6, max: 25 },
  organization: { min: 2, max: 160 },
  jobTitle: { min: 0, max: 120 },
  organizationType: { min: 0, max: 120 },
  scale: { min: 0, max: 80 },
  primaryNeed: { min: 0, max: 160 },
  enquiryMessage: { min: 0, max: 2000 },
};

/**
 * Strips control characters and neutralizes potential script/HTML injection vectors
 * while preserving legitimate punctuation and international characters.
 */
function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<\s*\/?\s*script[^>]*>/gi, '')
    .trim();
}

/**
 * Validates raw request body size and structure, spam honeypot, consent, and field rules.
 */
function validateLeadSubmission(rawBody) {
  const errors = {};

  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    return {
      valid: false,
      statusCode: 400,
      errorCode: 'MALFORMED_PAYLOAD',
      message: 'Request payload must be a valid JSON object.',
      errors: { payload: 'Malformed JSON object.' },
    };
  }

  const rawJsonLength = Buffer.byteLength(JSON.stringify(rawBody), 'utf8');
  if (rawJsonLength > MAX_PAYLOAD_BYTES) {
    return {
      valid: false,
      statusCode: 413,
      errorCode: 'PAYLOAD_TOO_LARGE',
      message: `Submission exceeds maximum allowed size of ${MAX_PAYLOAD_BYTES} bytes.`,
      errors: { payload: 'Payload size limit exceeded.' },
    };
  }

  // Anti-spam Honeypot check (`website_url` or `company_website_hp` must remain empty)
  const honeypot = String(rawBody.website_url || rawBody.company_website_hp || '').trim();
  if (honeypot.length > 0) {
    return {
      valid: false,
      statusCode: 400,
      errorCode: 'SPAM_DETECTED',
      isSpam: true,
      message: 'Submission rejected by automated abuse protection.',
      errors: { form: 'Automated spam submission detected.' },
    };
  }

  // Sanitize all string properties before normalization
  const sanitizedInput = {};
  for (const [k, v] of Object.entries(rawBody)) {
    if (typeof v === 'string') {
      sanitizedInput[k] = sanitizeText(v);
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      sanitizedInput[k] = {};
      for (const [subK, subV] of Object.entries(v)) {
        sanitizedInput[k][subK] = typeof subV === 'string' ? sanitizeText(subV) : subV;
      }
    } else {
      sanitizedInput[k] = v;
    }
  }

  const normalized = normalizeSubmissionFields(sanitizedInput);
  const classification = resolveClassification(sanitizedInput);

  // 1. Validate Full Name
  if (!normalized.contactName) {
    errors.name = 'Full name is required.';
  } else if (
    normalized.contactName.length < FIELD_LIMITS.contactName.min ||
    normalized.contactName.length > FIELD_LIMITS.contactName.max
  ) {
    errors.name = `Full name must be between ${FIELD_LIMITS.contactName.min} and ${FIELD_LIMITS.contactName.max} characters.`;
  }

  // 2. Validate Email Address
  if (!normalized.email) {
    errors.email = 'Work email address is required.';
  } else if (
    normalized.email.length > FIELD_LIMITS.email.max ||
    !EMAIL_REGEX.test(normalized.email)
  ) {
    errors.email = 'Please enter a valid email address.';
  }

  // 3. Validate Organization / Company
  if (!normalized.organization) {
    errors.company = 'Organisation or company name is required.';
  } else if (
    normalized.organization.length < FIELD_LIMITS.organization.min ||
    normalized.organization.length > FIELD_LIMITS.organization.max
  ) {
    errors.company = `Organisation name must be between ${FIELD_LIMITS.organization.min} and ${FIELD_LIMITS.organization.max} characters.`;
  }

  // 4. Validate Phone Number (validated when provided, optional when omitted on streamlined forms)
  if (normalized.phone && !PHONE_REGEX.test(normalized.phone)) {
    errors.phone = 'Please enter a valid phone number (e.g. +234 800 000 0000).';
  }

  // 5. Validate optional field length ceilings
  if (normalized.jobTitle.length > FIELD_LIMITS.jobTitle.max) {
    errors.role = `Role must not exceed ${FIELD_LIMITS.jobTitle.max} characters.`;
  }
  if (normalized.primaryNeed.length > FIELD_LIMITS.primaryNeed.max) {
    errors.need = `Primary interest must not exceed ${FIELD_LIMITS.primaryNeed.max} characters.`;
  }
  if (normalized.enquiryMessage.length > FIELD_LIMITS.enquiryMessage.max) {
    errors.message = `Enquiry message must not exceed ${FIELD_LIMITS.enquiryMessage.max} characters.`;
  }

  // 6. Validate Privacy & Enquiry Processing Consent (NDPA 2023 compliance)
  if (sanitizedInput.consentAccepted === false) {
    errors.consent = 'You must agree to the processing of your enquiry details to submit this form.';
  } else if (sanitizedInput.consentAccepted === undefined) {
    // Default explicit form submission consent to true only if not explicitly false,
    // while frontend forms always send explicit boolean consentAccepted: true
    normalized.consentAccepted = true;
  }

  if (Object.keys(errors).length > 0) {
    return {
      valid: false,
      statusCode: 422,
      errorCode: 'VALIDATION_ERROR',
      message: Object.values(errors)[0],
      errors,
    };
  }

  return {
    valid: true,
    normalized,
    classification,
  };
}

module.exports = {
  MAX_PAYLOAD_BYTES,
  FIELD_LIMITS,
  sanitizeText,
  validateLeadSubmission,
};
