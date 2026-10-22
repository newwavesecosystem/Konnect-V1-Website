/**
 * Phase 2, Phase 3, Phase 6 & Phase 9: Odoo 18 CRM Integration Service
 * Connects to Newwaves Ecosystem Odoo 18 (`18.0+e`) via XML-RPC (/xmlrpc/2/common & /xmlrpc/2/object).
 */

const fs = require('fs');
const { callXmlRpc, OdooRpcError } = require('./xmlrpc');
const { DEFAULT_SALES_TEAM_NAME, buildOdooLeadPayload } = require('./classification');
const logger = require('./logger');

let cachedAuth = {
  key: null,
  uid: null,
  expiresAt: 0,
};

let cachedMetadata = {
  expiresAt: 0,
  teamId: null,
  sourcesByName: {},
  mediumsByName: {},
  campaignsByName: {},
  tagsByName: {},
};

const AUTH_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const META_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Strips browser path suffixes (such as `/odoo/crm` or `/web/login`) so the XML-RPC
 * client always targets the root Odoo origin (`https://www.newwavesecosystem.com`).
 */
function normalizeOdooBaseUrl(rawUrl) {
  const fallback = 'https://www.newwavesecosystem.com';
  if (!rawUrl || typeof rawUrl !== 'string') return fallback;
  try {
    const parsed = new URL(rawUrl.trim());
    return `${parsed.protocol}//${parsed.host}`;
  } catch (_) {
    return rawUrl
      .trim()
      .replace(/\/(odoo(\/.*)?|web(\/.*)?|xmlrpc(\/.*)?|jsonrpc(\/.*)?)$/i, '')
      .replace(/\/+$/, '');
  }
}

function getOdooConfig(overrides = {}) {
  const env = { ...process.env, ...overrides };
  const baseUrl = normalizeOdooBaseUrl(env.ODOO_URL || 'https://www.newwavesecosystem.com');
  const db = (env.ODOO_DB || 'newwavesecosystem-staging').trim();
  const username = (env.ODOO_USERNAME || '').trim();
  const apiKey = (env.ODOO_API_KEY || '').trim();
  const timeoutMs = parseInt(env.ODOO_TIMEOUT_MS || '10000', 10);
  const teamId = env.ODOO_CRM_TEAM_ID ? parseInt(env.ODOO_CRM_TEAM_ID, 10) : null;
  const teamName = (env.ODOO_CRM_TEAM_NAME || DEFAULT_SALES_TEAM_NAME).trim();
  const mode = (env.KONN3CT_CRM_MODE || (apiKey ? 'live' : 'unconfigured')).trim().toLowerCase();
  const enableDurableQueue = env.KONN3CT_ENABLE_DURABLE_QUEUE === 'true';
  const queueFilePath = env.KONN3CT_QUEUE_FILE || '';

  return {
    baseUrl,
    commonEndpoint: `${baseUrl}/xmlrpc/2/common`,
    objectEndpoint: `${baseUrl}/xmlrpc/2/object`,
    db,
    username,
    apiKey,
    timeoutMs,
    teamId: Number.isInteger(teamId) && teamId > 0 ? teamId : null,
    teamName,
    mode,
    enableDurableQueue,
    queueFilePath,
    env,
  };
}

/**
 * Queries Odoo server version via `/xmlrpc/2/common` `version()`.
 */
async function getOdooVersion({ configOverrides = {}, fetchImpl } = {}) {
  const cfg = getOdooConfig(configOverrides);
  const versionInfo = await callXmlRpc(cfg.commonEndpoint, 'version', [], {
    timeoutMs: cfg.timeoutMs,
    fetchImpl,
  });
  return {
    baseUrl: cfg.baseUrl,
    db: cfg.db,
    serverVersion: versionInfo?.server_version || null,
    serverSerie: versionInfo?.server_serie || null,
    serverVersionInfo: versionInfo?.server_version_info || null,
    protocolVersion: versionInfo?.protocol_version || null,
  };
}

/**
 * Authenticates with Odoo `/xmlrpc/2/common` `authenticate(db, username, apiKey, {})`.
 */
async function authenticateOdoo(cfg, { fetchImpl, forceRefresh = false } = {}) {
  if (!cfg.username || !cfg.apiKey || !cfg.db) {
    throw new OdooRpcError(
      'Odoo API credentials (ODOO_DB, ODOO_USERNAME, ODOO_API_KEY) are not configured on the server.',
      { code: 'ODOO_CREDENTIALS_MISSING', statusCode: 503 }
    );
  }

  const cacheKey = `${cfg.baseUrl}|${cfg.db}|${cfg.username}`;
  const now = Date.now();
  if (!forceRefresh && cachedAuth.key === cacheKey && cachedAuth.uid && cachedAuth.expiresAt > now) {
    return cachedAuth.uid;
  }

  const uid = await callXmlRpc(
    cfg.commonEndpoint,
    'authenticate',
    [cfg.db, cfg.username, cfg.apiKey, {}],
    { timeoutMs: cfg.timeoutMs, fetchImpl }
  );

  if (!uid || typeof uid !== 'number' || uid <= 0) {
    throw new OdooRpcError(
      'Odoo XML-RPC authentication failed: invalid username, API key, or database name.',
      { code: 'ODOO_AUTH_FAILED', statusCode: 401 }
    );
  }

  cachedAuth = {
    key: cacheKey,
    uid,
    expiresAt: now + AUTH_CACHE_TTL_MS,
  };

  return uid;
}

/**
 * Executes an authenticated model method via `/xmlrpc/2/object` `execute_kw`.
 */
async function executeKw(cfg, uid, model, method, args = [], kwargs = {}, { fetchImpl } = {}) {
  const params = [cfg.db, uid, cfg.apiKey, model, method, args];
  if (kwargs && Object.keys(kwargs).length > 0) {
    params.push(kwargs);
  }
  return await callXmlRpc(cfg.objectEndpoint, 'execute_kw', params, {
    timeoutMs: cfg.timeoutMs,
    fetchImpl,
  });
}

/**
 * Resolves non-destructive CRM metadata (Sales Team ID, UTM IDs, Tag IDs, and prior Konn3ct leads for repeat context).
 * Never creates or modifies sales teams or global stages unless explicitly authorized.
 */
async function resolveCrmRoutingMetadata(cfg, uid, normalized, classification, { fetchImpl } = {}) {
  const now = Date.now();
  let teamId = cfg.teamId;

  // 1. Resolve Sales Team ID (`Konn3ct Growth & Partnerships` or configured ODOO_CRM_TEAM_ID)
  if (!teamId) {
    if (cachedMetadata.teamId && cachedMetadata.expiresAt > now) {
      teamId = cachedMetadata.teamId;
    } else if (cfg.teamName) {
      try {
        const teams = await executeKw(
          cfg,
          uid,
          'crm.team',
          'search_read',
          [[['name', 'ilike', cfg.teamName]]],
          { fields: ['id', 'name', 'use_leads', 'use_opportunities'], limit: 1 },
          { fetchImpl }
        );
        if (Array.isArray(teams) && teams.length > 0 && teams[0].id) {
          teamId = teams[0].id;
          cachedMetadata.teamId = teamId;
          cachedMetadata.expiresAt = now + META_CACHE_TTL_MS;
        }
      } catch (err) {
        logger.warn('odoo_team_lookup_skipped', { errorCode: err.code, message: err.message });
      }
    }
  }

  // 2. Resolve optional owner user_id for Demo Request / Partnership if configured
  let ownerUid = null;
  const rawOwnerId =
    (classification.ownerEnvKey && cfg.env[classification.ownerEnvKey]) ||
    cfg.env.ODOO_DEFAULT_OWNER_UID;
  if (rawOwnerId) {
    const parsedOwner = parseInt(rawOwnerId, 10);
    if (Number.isInteger(parsedOwner) && parsedOwner > 0) {
      ownerUid = parsedOwner;
    }
  }

  // 3. Look up existing CRM Tag matching classification label (read-only unless ODOO_AUTO_CREATE_TAGS=true)
  const tagIds = [];
  try {
    const tagName = classification.label;
    if (cachedMetadata.tagsByName[tagName]) {
      tagIds.push(cachedMetadata.tagsByName[tagName]);
    } else {
      const tags = await executeKw(
        cfg,
        uid,
        'crm.tag',
        'search_read',
        [[['name', '=', tagName]]],
        { fields: ['id', 'name'], limit: 1 },
        { fetchImpl }
      );
      if (Array.isArray(tags) && tags.length > 0 && tags[0].id) {
        cachedMetadata.tagsByName[tagName] = tags[0].id;
        tagIds.push(tags[0].id);
      } else if (cfg.env.ODOO_AUTO_CREATE_TAGS === 'true' && tagName) {
        const createdTagId = await executeKw(
          cfg,
          uid,
          'crm.tag',
          'create',
          [[{ name: tagName }]],
          {},
          { fetchImpl }
        );
        const numericTagId = Array.isArray(createdTagId) ? createdTagId[0] : createdTagId;
        if (typeof numericTagId === 'number' && numericTagId > 0) {
          cachedMetadata.tagsByName[tagName] = numericTagId;
          tagIds.push(numericTagId);
        }
      }
    }
  } catch (_) {
    // Tag lookup is optional; classification is always preserved in lead title and description
  }

  // 4. Look up existing UTM Source & Campaign if present (read-only)
  let sourceId = null;
  let campaignId = null;
  try {
    const sourceName = normalized.utm.utm_source;
    if (sourceName) {
      if (cachedMetadata.sourcesByName[sourceName]) {
        sourceId = cachedMetadata.sourcesByName[sourceName];
      } else {
        const sources = await executeKw(
          cfg,
          uid,
          'utm.source',
          'search_read',
          [[['name', 'ilike', sourceName]]],
          { fields: ['id', 'name'], limit: 1 },
          { fetchImpl }
        );
        if (Array.isArray(sources) && sources.length > 0 && sources[0].id) {
          sourceId = sources[0].id;
          cachedMetadata.sourcesByName[sourceName] = sourceId;
        }
      }
    }
  } catch (_) {
    // Non-fatal if integration user lacks utm.source read rights
  }

  // 5. Check Odoo for prior Konn3ct leads from the same email (to enrich repeat-enquiry context without merging)
  let upstreamPriorLeads = [];
  try {
    const existingLeads = await executeKw(
      cfg,
      uid,
      'crm.lead',
      'search_read',
      [
        [
          ['email_from', '=ilike', normalized.email],
          ['name', 'ilike', '[Konn3ct'],
        ],
      ],
      { fields: ['id', 'name', 'create_date'], limit: 5 },
      { fetchImpl }
    );
    if (Array.isArray(existingLeads) && existingLeads.length > 0) {
      upstreamPriorLeads = existingLeads.map((l) => `ODOO-${l.id}`);
    }
  } catch (_) {
    // Non-fatal if search_read on crm.lead is restricted to create-only integration role
  }

  return {
    teamId,
    ownerUid,
    sourceId,
    campaignId,
    tagIds,
    upstreamPriorLeads,
  };
}

/**
 * Appends a validated lead to the durable fallback queue when enabled.
 */
function enqueueLeadDurably(queueFilePath, entry) {
  const record = {
    queueId: `q_${entry.submissionId}`,
    queuedAt: new Date().toISOString(),
    ...entry,
  };

  if (queueFilePath) {
    let queue = [];
    try {
      if (fs.existsSync(queueFilePath)) {
        queue = JSON.parse(fs.readFileSync(queueFilePath, 'utf8'));
        if (!Array.isArray(queue)) queue = [];
      }
    } catch (_) {
      queue = [];
    }
    queue.push(record);
    fs.writeFileSync(queueFilePath, JSON.stringify(queue, null, 2), 'utf8');
  }

  return record;
}

/**
 * Submits a validated, classified lead to Odoo 18 CRM via XML-RPC.
 */
async function createCrmLead({
  normalized,
  classification,
  submissionId,
  repeatContext = null,
  configOverrides = {},
  fetchImpl,
}) {
  const cfg = getOdooConfig(configOverrides);
  const submittedAt = new Date().toISOString();

  // If credentials are not configured and durable queue is enabled, accept into durable queue
  // and explicitly distinguish `queued_pending_crm` from `crm_created`.
  if ((!cfg.username || !cfg.apiKey) && cfg.enableDurableQueue) {
    const leadPayload = buildOdooLeadPayload(normalized, classification, {
      submissionId,
      submittedAt,
      teamId: cfg.teamId,
      repeatContext,
    });
    const queued = enqueueLeadDurably(cfg.queueFilePath, {
      submissionId,
      submittedAt,
      classification: classification.label,
      route: normalized.route,
      leadPayload,
    });

    logger.warn('lead_accepted_into_durable_queue', {
      submissionId,
      queueId: queued.queueId,
      classification: classification.key,
      route: normalized.route,
      reason: 'odoo_credentials_unconfigured',
    });

    return {
      ok: true,
      deliveryStatus: 'queued_pending_crm',
      submissionId,
      leadId: null,
      leadReference: queued.queueId,
      classification: classification.label,
      classificationKey: classification.key,
      submittedAt,
      leadPayload,
    };
  }

  try {
    const uid = await authenticateOdoo(cfg, { fetchImpl });
    const routingMeta = await resolveCrmRoutingMetadata(cfg, uid, normalized, classification, {
      fetchImpl,
    });

    // Combine local and upstream repeat-enquiry history without merging or overwriting records
    const mergedPriorIds = Array.from(
      new Set([...(repeatContext?.priorLeadIds || []), ...(routingMeta.upstreamPriorLeads || [])])
    );
    const combinedRepeatContext = {
      isRepeatEnquiry: Boolean(repeatContext?.isRepeatEnquiry || mergedPriorIds.length > 0),
      priorSubmissionCount: Math.max(
        repeatContext?.priorSubmissionCount || 0,
        mergedPriorIds.length
      ),
      priorLeadIds: mergedPriorIds,
    };

    const leadPayload = buildOdooLeadPayload(normalized, classification, {
      submissionId,
      submittedAt,
      teamId: routingMeta.teamId,
      ownerUid: routingMeta.ownerUid,
      sourceId: routingMeta.sourceId,
      campaignId: routingMeta.campaignId,
      tagIds: routingMeta.tagIds,
      repeatContext: combinedRepeatContext,
    });

    const createdLeadId = await executeKw(
      cfg,
      uid,
      'crm.lead',
      'create',
      [[leadPayload]],
      {},
      { fetchImpl }
    );

    const numericId = Array.isArray(createdLeadId) ? createdLeadId[0] : createdLeadId;
    if (!numericId || typeof numericId !== 'number' || numericId <= 0) {
      throw new OdooRpcError('Odoo crm.lead.create did not return a valid numeric record ID.', {
        code: 'ODOO_CREATE_FAILED',
        statusCode: 502,
      });
    }

    // Preserve Konn3ct team & owner if an upstream Odoo on-create automation ("Hot Lead Escalation")
    // re-assigns high-scoring leads to the default global Sales team.
    if (
      cfg.env.ODOO_ENFORCE_KONN3CT_OWNER === 'true' &&
      (routingMeta.teamId || routingMeta.ownerUid)
    ) {
      const enforcePatch = {};
      if (routingMeta.teamId) enforcePatch.team_id = routingMeta.teamId;
      if (routingMeta.ownerUid) enforcePatch.user_id = routingMeta.ownerUid;
      try {
        await executeKw(
          cfg,
          uid,
          'crm.lead',
          'write',
          [[numericId], enforcePatch],
          {},
          { fetchImpl }
        );
      } catch (_) {
        // Non-fatal if write is restricted
      }
    }

    const leadReference = `ODOO-${numericId}`;
    logger.info('odoo_crm_lead_created', {
      submissionId,
      leadReference,
      classification: classification.key,
      route: normalized.route,
      teamId: routingMeta.teamId,
      isRepeatEnquiry: combinedRepeatContext.isRepeatEnquiry,
    });

    return {
      ok: true,
      deliveryStatus: 'crm_created',
      submissionId,
      leadId: numericId,
      leadReference,
      classification: classification.label,
      classificationKey: classification.key,
      submittedAt,
      isRepeatEnquiry: combinedRepeatContext.isRepeatEnquiry,
      leadPayload,
    };
  } catch (err) {
    // If durable queue fallback on upstream outage is explicitly enabled, queue safely and report `queued_pending_crm`
    if (cfg.enableDurableQueue && err.statusCode >= 500) {
      const leadPayload = buildOdooLeadPayload(normalized, classification, {
        submissionId,
        submittedAt,
        teamId: cfg.teamId,
        repeatContext,
      });
      const queued = enqueueLeadDurably(cfg.queueFilePath, {
        submissionId,
        submittedAt,
        classification: classification.label,
        route: normalized.route,
        leadPayload,
        upstreamErrorCode: err.code,
      });

      logger.warn('lead_queued_on_upstream_outage', {
        submissionId,
        queueId: queued.queueId,
        errorCode: err.code,
      });

      return {
        ok: true,
        deliveryStatus: 'queued_pending_crm',
        submissionId,
        leadId: null,
        leadReference: queued.queueId,
        classification: classification.label,
        classificationKey: classification.key,
        submittedAt,
        leadPayload,
      };
    }

    throw err;
  }
}

function resetOdooClientCacheForTesting() {
  cachedAuth = { key: null, uid: null, expiresAt: 0 };
  cachedMetadata = {
    expiresAt: 0,
    teamId: null,
    sourcesByName: {},
    mediumsByName: {},
    campaignsByName: {},
    tagsByName: {},
  };
}

module.exports = {
  normalizeOdooBaseUrl,
  getOdooConfig,
  getOdooVersion,
  authenticateOdoo,
  executeKw,
  resolveCrmRoutingMetadata,
  createCrmLead,
  resetOdooClientCacheForTesting,
};
