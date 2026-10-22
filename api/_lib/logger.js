/**
 * Privacy-preserving structured operational logger for Konn3ct -> Odoo CRM integration.
 * Complies with Phase 6, Phase 10, and Nigeria Data Protection Act (NDPA) data-minimization rules:
 * - Never logs credentials, API keys, or session tokens.
 * - Masks personal identifiers (email, phone, full name) before logging.
 */

function maskEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) return '[redacted-email]';
  const [local, domain] = email.trim().split('@');
  if (!local || !domain) return '[redacted-email]';
  const visibleLocal = local.length <= 2 ? `${local[0]}*` : `${local[0]}***${local[local.length - 1]}`;
  return `${visibleLocal}@${domain.toLowerCase()}`;
}

function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return undefined;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***${digits.slice(-4)}`;
}

function sanitizeMeta(meta = {}) {
  const safe = {};
  const redactKeys = /password|apikey|api_key|secret|token|authorization|cookie/i;

  for (const [key, value] of Object.entries(meta)) {
    if (redactKeys.test(key)) {
      safe[key] = '[REDACTED]';
    } else if (key === 'email' || key === 'email_from') {
      safe[key] = maskEmail(String(value));
    } else if (key === 'phone') {
      safe[key] = maskPhone(String(value));
    } else if (key === 'message' || key === 'description' || key === 'contact_name' || key === 'name') {
      // Never log raw enquiry message or personal full name in operational logs
      safe[`${key}Length`] = typeof value === 'string' ? value.length : 0;
    } else {
      safe[key] = value;
    }
  }
  return safe;
}

function formatEntry(level, event, meta = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    service: 'konn3ct-odoo-crm',
    level,
    event,
    ...sanitizeMeta(meta),
  });
}

const logger = {
  maskEmail,
  maskPhone,
  sanitizeMeta,
  info(event, meta = {}) {
    if (process.env.NODE_ENV !== 'test' || process.env.KONN3CT_LOG_IN_TEST === 'true') {
      console.info(formatEntry('INFO', event, meta));
    }
  },
  warn(event, meta = {}) {
    if (process.env.NODE_ENV !== 'test' || process.env.KONN3CT_LOG_IN_TEST === 'true') {
      console.warn(formatEntry('WARN', event, meta));
    }
  },
  error(event, meta = {}) {
    if (process.env.NODE_ENV !== 'test' || process.env.KONN3CT_LOG_IN_TEST === 'true') {
      console.error(formatEntry('ERROR', event, meta));
    }
  },
};

module.exports = logger;
