/**
 * MK-004 AC-07 & MK-004-C09: Controlled A/B Variant Assignment, Exposure Measurement & Rollback
 *
 * Features:
 * - Deterministic & session-persistent variant assignment (`control` vs `variant_b`).
 * - Instant rollback / kill-switch (`disableExperiment()` or `window.__KONN3CT_AB_DISABLED__`).
 * - Deduplicated exposure logging via `trackExperimentExposure`.
 * - Preserves existing Konn3ct branding and layout while enabling measurable CTA/copy experiments.
 */

import { trackExperimentExposure } from '../analytics/events';

const STORAGE_PREFIX = 'konn3ct_exp_';
const exposedInSession = new Set();
const runtimeKillSwitch = new Set();

export const EXPERIMENT_REGISTRY = {
  'EXP-MK004-CTA-COPY': {
    id: 'EXP-MK004-CTA-COPY',
    name: 'Conversion Form Submit CTA Framing',
    enabled: true,
    variants: ['control', 'variant_b'],
    weights: [0.5, 0.5],
  },
};

function hashSeedToUnitInterval(seedStr) {
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

/**
 * Assigns or retrieves a sticky variant for a given experiment ID and logs exposure once.
 */
export function getExperimentAssignment(
  experimentId = 'EXP-MK004-CTA-COPY',
  { landing_page_id = 'home', visitorSeed = null, logExposure = true } = {}
) {
  const exp = EXPERIMENT_REGISTRY[experimentId];

  // Instant rollback / kill-switch check
  if (
    !exp ||
    !exp.enabled ||
    runtimeKillSwitch.has(experimentId) ||
    (typeof window !== 'undefined' && window.__KONN3CT_AB_DISABLED__ === true)
  ) {
    return {
      experiment_id: experimentId,
      variant_id: 'control',
      rolledBack: true,
    };
  }

  const storageKey = `${STORAGE_PREFIX}${experimentId}`;
  let assigned = null;

  // Check URL override for QA (`?ab_variant=variant_b`)
  if (typeof window !== 'undefined' && window.location?.search) {
    const urlVariant = new URLSearchParams(window.location.search).get('ab_variant');
    if (urlVariant && exp.variants.includes(urlVariant)) {
      assigned = urlVariant;
    }
  }

  // Check persisted assignment in sessionStorage
  if (!assigned && typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const stored = window.sessionStorage.getItem(storageKey);
      if (stored && exp.variants.includes(stored)) {
        assigned = stored;
      }
    } catch (_) {
      // Ignore storage errors
    }
  }

  // Deterministic assignment from visitorSeed or random unit interval
  if (!assigned) {
    const unit = visitorSeed
      ? hashSeedToUnitInterval(`${experimentId}:${visitorSeed}`)
      : Math.random();
    assigned = unit < (exp.weights?.[0] ?? 0.5) ? exp.variants[0] : exp.variants[1];

    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(storageKey, assigned);
      } catch (_) {
        // Ignore storage errors
      }
    }
  }

  const exposureKey = `${experimentId}:${assigned}:${landing_page_id}`;
  if (logExposure && !exposedInSession.has(exposureKey)) {
    exposedInSession.add(exposureKey);
    trackExperimentExposure({
      experiment_id: experimentId,
      variant_id: assigned,
      landing_page_id,
    });
  }

  return {
    experiment_id: experimentId,
    variant_id: assigned,
    rolledBack: false,
  };
}

/**
 * Triggers an immediate rollback to `control` for the specified experiment.
 */
export function rollbackExperiment(experimentId = 'EXP-MK004-CTA-COPY') {
  runtimeKillSwitch.add(experimentId);
}

export function resetExperimentsForTesting() {
  exposedInSession.clear();
  runtimeKillSwitch.clear();
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.removeItem(`${STORAGE_PREFIX}EXP-MK004-CTA-COPY`);
    } catch (_) {
      // Ignore
    }
  }
}
