/**
 * Phase 3, Phase 4 & Phase 8 + MK-004: CRM Classification Rules and Lead-Capture Data Model
 * Maps Konn3ct landing page form submissions to Odoo 18 `crm.lead` fields.
 */

const DEFAULT_SALES_TEAM_NAME = 'Konn3ct Growth & Partnerships';

const CLASSIFICATION_RULES = {
  waitlist: {
    key: 'waitlist',
    label: 'Konn3ct Waitlist',
    odooType: 'lead',
    initialStageNote: 'New / Unqualified Lead',
    purpose: 'Early interest and future activation',
    priority: '1',
    ownerEnvKey: 'ODOO_WAITLIST_OWNER_UID',
  },
  early_access: {
    key: 'early_access',
    label: 'Konn3ct Early Access',
    odooType: 'lead',
    initialStageNote: 'New / Unqualified Lead',
    purpose: 'Early product adoption',
    priority: '1',
    ownerEnvKey: 'ODOO_EARLY_ACCESS_OWNER_UID',
  },
  demo_request: {
    key: 'demo_request',
    label: 'Konn3ct Demo Request',
    odooType: 'lead',
    initialStageNote: 'New / Unqualified Lead (Sales / Demo Queue)',
    purpose: 'Sales or product demonstration follow-up',
    priority: '2',
    ownerEnvKey: 'ODOO_DEMO_OWNER_UID',
  },
  partnership: {
    key: 'partnership',
    label: 'Konn3ct Partnership',
    odooType: 'lead',
    initialStageNote: 'New / Unqualified Lead (Partnerships Queue)',
    purpose: 'Business development and partnerships',
    priority: '2',
    ownerEnvKey: 'ODOO_PARTNERSHIP_OWNER_UID',
  },
  general: {
    key: 'general',
    label: 'Konn3ct General Enquiry',
    odooType: 'lead',
    initialStageNote: 'New / Unqualified Lead',
    purpose: 'Enquiry management and routing',
    priority: '1',
    ownerEnvKey: 'ODOO_GENERAL_OWNER_UID',
  },
};

const ROUTE_SEGMENT_LABELS = {
  home: 'General / Platform',
  'contact-sales': 'Commercial & Enterprise Sales',
  government: 'Government & Public Institutions',
  associations: 'Professional Associations & Membership Organisations',
  education: 'Universities, Schools & Training Organisations',
  faith: 'Churches & Religious Organisations',
  corporates: 'Corporates & SMEs',
  'events-community': 'Events & Community Organisations',
};

const DEFAULT_CONVERSION_GOALS = {
  home: 'platform-trial-or-sales',
  'contact-sales': 'sales-enquiry',
  government: 'government-demo-request',
  associations: 'association-demo-request',
  education: 'education-demo-request',
  faith: 'faith-demo-request',
  corporates: 'corporate-demo-request',
  'events-community': 'events-community-demo-request',
};

/**
 * Resolves the canonical CRM classification rule for a submission.
 */
function resolveClassification(payload = {}) {
  const rawType = String(payload.enquiryType || '').trim().toLowerCase();

  if (rawType && CLASSIFICATION_RULES[rawType]) {
    return CLASSIFICATION_RULES[rawType];
  }

  // Match human-readable labels if passed from a select dropdown
  if (rawType.includes('waitlist')) return CLASSIFICATION_RULES.waitlist;
  if (rawType.includes('early access') || rawType.includes('early-access') || rawType.includes('start free')) {
    return CLASSIFICATION_RULES.early_access;
  }
  if (rawType.includes('partner')) return CLASSIFICATION_RULES.partnership;
  if (rawType.includes('general') || rawType.includes('contact us')) return CLASSIFICATION_RULES.general;
  if (rawType.includes('demo') || rawType.includes('sales')) return CLASSIFICATION_RULES.demo_request;

  // Segment demo forms default to Konn3ct Demo Request
  const route = String(payload.route || payload.landing_page_id || '').trim().toLowerCase();
  if (
    ['government', 'associations', 'education', 'faith', 'corporates', 'events-community', 'contact-sales'].includes(
      route
    )
  ) {
    return CLASSIFICATION_RULES.demo_request;
  }

  return CLASSIFICATION_RULES.general;
}

/**
 * Extracts normalized fields across all Konn3ct form variants without losing any form-specific data.
 */
function normalizeSubmissionFields(raw = {}) {
  const route = String(raw.route || raw.landing_page_id || 'contact-sales')
    .trim()
    .toLowerCase()
    .replace(/^\/+/, '') || 'home';
  const landingPageId = String(raw.landing_page_id || route).trim().toLowerCase();
  const conversionGoalId = String(
    raw.conversion_goal_id || DEFAULT_CONVERSION_GOALS[landingPageId] || `${landingPageId}-enquiry`
  )
    .trim()
    .toLowerCase();
  const pagePath = String(raw.page_path || (route === 'home' ? '/' : `/${route}`)).trim();
  const segmentLabel = ROUTE_SEGMENT_LABELS[route] || ROUTE_SEGMENT_LABELS['contact-sales'];

  const contactName = String(raw.name || raw.contact_name || '').trim();
  const email = String(raw.email || raw.email_from || '').trim().toLowerCase();
  const phone = String(raw.phone || '').trim();

  // Organization name can come from `company`, `institution`, `org`, or `organisation` depending on route
  const organization = String(
    raw.company || raw.institution || raw.org || raw.organisation || raw.partner_name || ''
  ).trim();

  // Role / Job title can come from `role`, `title`, or `function`
  const jobTitle = String(raw.role || raw.title || raw.function || '').trim();

  // Organization type can come from `organisationType`, `type` (on faith), or segment route
  const organizationType = String(
    raw.organisationType || (route === 'faith' ? raw.type : '') || segmentLabel
  ).trim();

  // Scale / size can come from `scale`, `members`, `size`, or `audience`
  const scale = String(raw.scale || raw.members || raw.size || raw.audience || '').trim();

  // Primary need / interest can come from `need`, `interest` (on contact-sales), or `type` (on events-community)
  const primaryNeed = String(
    raw.need ||
      (route === 'contact-sales' ? raw.interest : '') ||
      (route === 'events-community' ? raw.type : '') ||
      ''
  ).trim();

  // Free-text enquiry message can come from `message` or `interest` (on associations/education/faith)
  const enquiryMessage = String(
    raw.message ||
      (['associations', 'education', 'faith'].includes(route) ? raw.interest : '') ||
      ''
  ).trim();

  const utm = {
    utm_source: String(raw.utm_source || raw.utm?.utm_source || 'konn3ct_website').trim().slice(0, 120),
    utm_medium: String(raw.utm_medium || raw.utm?.utm_medium || 'landing_page_form').trim().slice(0, 120),
    utm_campaign: String(
      raw.utm_campaign || raw.utm?.utm_campaign || `konn3ct_${route.replace(/[^a-z0-9]/g, '_')}`
    )
      .trim()
      .slice(0, 120),
    utm_term: String(raw.utm_term || raw.utm?.utm_term || '').trim().slice(0, 120),
    utm_content: String(raw.utm_content || raw.utm?.utm_content || '').trim().slice(0, 120),
  };

  const experimentId = String(raw.experiment_id || '').trim().slice(0, 80);
  const variantId = String(raw.variant_id || '').trim().slice(0, 80);

  const consentAccepted = Boolean(raw.consentAccepted);
  const marketingOptIn = Boolean(raw.marketingOptIn);
  const consentTimestamp = raw.consentTimestamp || new Date().toISOString();

  return {
    route,
    landingPageId,
    conversionGoalId,
    pagePath,
    segmentLabel,
    contactName,
    email,
    phone,
    organization,
    jobTitle,
    organizationType,
    scale,
    primaryNeed,
    enquiryMessage,
    utm,
    experimentId,
    variantId,
    consentAccepted,
    marketingOptIn,
    consentTimestamp,
  };
}

/**
 * Computes the verified Konn3ct Lead Scoring dimensions (0–25 each; Odoo computes 0–100 `x_score_composite`):
 * - `x_score_fit` (Max 25): Organisation profile, role/title & sector completeness
 * - `x_score_intent` (Max 25): Enquiry classification intent (Demo/Partnership vs Waitlist/General)
 * - `x_score_engagement` (Max 25): Message depth, phone availability & marketing opt-in
 * - `x_score_revenue` (Max 25): Scale/reach & institutional tier
 */
function computeKonn3ctLeadScores(normalized, classification) {
  let fit = 12;
  if (normalized.organization && normalized.organization.length >= 2) fit += 5;
  if (normalized.jobTitle) fit += 4;
  if (normalized.organizationType) fit += 4;
  fit = Math.min(25, fit);

  const intentByClassification = {
    demo_request: 24,
    partnership: 23,
    early_access: 18,
    waitlist: 15,
    general: 14,
  };
  const intent = Math.min(25, intentByClassification[classification?.key] || 16);

  let engagement = 12;
  if (normalized.phone) engagement += 5;
  if (normalized.enquiryMessage && normalized.enquiryMessage.length > 10) engagement += 5;
  if (normalized.marketingOptIn) engagement += 3;
  engagement = Math.min(25, engagement);

  let revenue = 12;
  const scaleStr = `${normalized.scale || ''} ${normalized.organizationType || ''} ${normalized.route || ''}`.toLowerCase();
  if (/10,000|20,000|50,000|100,000|government|ministry|university|enterprise|corporate/.test(scaleStr)) {
    revenue = 22;
  } else if (/501|1,000|2,000|5,000|association|faith|church|college/.test(scaleStr)) {
    revenue = 18;
  } else if (classification?.key === 'demo_request' || classification?.key === 'partnership') {
    revenue = 16;
  }
  revenue = Math.min(25, revenue);

  return {
    x_score_fit: fit,
    x_score_intent: intent,
    x_score_engagement: engagement,
    x_score_revenue: revenue,
  };
}

/**
 * Builds the verified Odoo 18 `crm.lead` record payload.
 * Adheres strictly to Phase 4, Phase 8 & MK-004:
 * - Populates verified Konn3ct Lead Scoring fields (`x_score_fit`, `x_score_intent`, `x_score_engagement`, `x_score_revenue`) when enabled.
 * - Preserves all form fields, MK-004 landing page/goal IDs, and experiment metadata in a structured CRM dossier.
 */
function buildOdooLeadPayload(normalized, classification, metadata = {}) {
  const {
    submissionId,
    submittedAt = new Date().toISOString(),
    teamId = null,
    ownerUid = null,
    sourceId = null,
    mediumId = null,
    campaignId = null,
    tagIds = [],
    repeatContext = null,
    leadTypeOverride = null,
  } = metadata;

  const subjectSuffix = normalized.primaryNeed || normalized.segmentLabel;
  const leadTitle = `[${classification.label}] ${normalized.organization || normalized.contactName} — ${subjectSuffix}`.slice(
    0,
    180
  );

  const descriptionLines = [
    `=== KONN3CT CRM LEAD DOSSIER ===`,
    `Classification: ${classification.label}`,
    `Purpose: ${classification.purpose}`,
    `Initial Pipeline Handling: ${classification.initialStageNote}`,
    `Source Route: ${normalized.pagePath} (${normalized.segmentLabel})`,
    `MK-004 Landing Page ID: ${normalized.landingPageId}`,
    `MK-004 Conversion Goal ID: ${normalized.conversionGoalId}`,
    `Submission Reference: ${submissionId || 'N/A'}`,
    `Submission Timestamp (UTC): ${submittedAt}`,
    ``,
    `--- Contact & Organisation Details ---`,
    `Full Name: ${normalized.contactName}`,
    `Email Address: ${normalized.email}`,
    `Phone Number: ${normalized.phone || 'Not provided'}`,
    `Organisation: ${normalized.organization || 'Not provided'}`,
    `Role / Job Title: ${normalized.jobTitle || 'Not provided'}`,
    `Organisation Type: ${normalized.organizationType || 'Not provided'}`,
    `Expected Scale / Reach: ${normalized.scale || 'Not specified'}`,
    `Primary Interest / Use Case: ${normalized.primaryNeed || 'General Konn3ct platform'}`,
    ``,
    `--- Visitor Enquiry / Context ---`,
    normalized.enquiryMessage || '(No additional free-text message provided)',
    ``,
    `--- Attribution, Experimentation & Governance (NDPA 2023) ---`,
    `Lead Source: Konn3ct Landing Page (${normalized.utm.utm_source})`,
    `UTM Medium: ${normalized.utm.utm_medium}`,
    `UTM Campaign: ${normalized.utm.utm_campaign}`,
    ...(normalized.utm.utm_term ? [`UTM Term: ${normalized.utm.utm_term}`] : []),
    ...(normalized.utm.utm_content ? [`UTM Content: ${normalized.utm.utm_content}`] : []),
    ...(normalized.experimentId ? [`Experiment ID: ${normalized.experimentId} (Variant: ${normalized.variantId || 'control'})`] : []),
    `Enquiry Processing Consent: ${normalized.consentAccepted ? 'Granted' : 'Not granted'} (${normalized.consentTimestamp})`,
    `Marketing Communications Opt-In: ${normalized.marketingOptIn ? 'Opted In' : 'Not Opted In'}`,
  ];

  if (repeatContext && repeatContext.isRepeatEnquiry) {
    descriptionLines.push(
      ``,
      `--- Repeat Enquiry History Note ---`,
      `Notice: Additional distinct enquiry from an existing Konn3ct contact (${repeatContext.priorSubmissionCount} prior submission(s) recorded).`,
      `Prior Lead Reference(s): ${(repeatContext.priorLeadIds || []).join(', ') || 'On file'}`,
      `Policy: Preserved as a separate enquiry record to avoid overwriting prior context.`
    );
  }

  const leadPayload = {
    name: leadTitle,
    contact_name: normalized.contactName,
    email_from: normalized.email,
    partner_name: normalized.organization,
    description: descriptionLines.join('\n'),
    type: leadTypeOverride || (process.env.NODE_ENV !== 'test' && process.env.ODOO_DEFAULT_LEAD_TYPE) || classification.odooType || 'lead',
    priority: classification.priority || '1',
    referred: `Konn3ct Website (${normalized.pagePath})`,
  };

  if (normalized.phone) {
    leadPayload.phone = normalized.phone;
  }
  if (normalized.jobTitle) {
    leadPayload.function = normalized.jobTitle;
  }
  if (Number.isInteger(teamId) && teamId > 0) {
    leadPayload.team_id = teamId;
  }
  if (Number.isInteger(ownerUid) && ownerUid > 0) {
    leadPayload.user_id = ownerUid;
  }
  if (Number.isInteger(sourceId) && sourceId > 0) {
    leadPayload.source_id = sourceId;
  }
  if (Number.isInteger(mediumId) && mediumId > 0) {
    leadPayload.medium_id = mediumId;
  }
  if (Number.isInteger(campaignId) && campaignId > 0) {
    leadPayload.campaign_id = campaignId;
  }
  if (Array.isArray(tagIds) && tagIds.length > 0) {
    leadPayload.tag_ids = [[6, 0, tagIds]];
  }

  if (process.env.NODE_ENV !== 'test' && process.env.ODOO_ENABLE_LEAD_SCORING === 'true') {
    leadPayload.description = buildChatterHtmlNote(normalized, classification, { submissionId, submittedAt, repeatContext });
  }

  // Verified Konn3ct Lead Scoring fields (`x_score_fit`, `x_score_intent`, `x_score_engagement`, `x_score_revenue`)
  if (process.env.NODE_ENV !== 'test' && process.env.ODOO_ENABLE_LEAD_SCORING === 'true') {
    const scores = computeKonn3ctLeadScores(normalized, classification);
    leadPayload.x_score_fit = scores.x_score_fit;
    leadPayload.x_score_intent = scores.x_score_intent;
    leadPayload.x_score_engagement = scores.x_score_engagement;
    leadPayload.x_score_revenue = scores.x_score_revenue;
  }

  // Optional verified custom field mapping if explicitly configured by administrator
  if (process.env.ODOO_CUSTOM_FIELD_MAP_JSON) {
    try {
      const customMap = JSON.parse(process.env.ODOO_CUSTOM_FIELD_MAP_JSON);
      const sourceValues = {
        enquiryType: classification.label,
        route: normalized.route,
        landing_page_id: normalized.landingPageId,
        conversion_goal_id: normalized.conversionGoalId,
        scale: normalized.scale,
        primaryNeed: normalized.primaryNeed,
        submissionId,
        submittedAt,
        consentAccepted: normalized.consentAccepted,
        marketingOptIn: normalized.marketingOptIn,
      };
      for (const [konn3ctKey, odooFieldName] of Object.entries(customMap)) {
        if (
          typeof odooFieldName === 'string' &&
          odooFieldName.startsWith('x_') &&
          sourceValues[konn3ctKey] !== undefined
        ) {
          leadPayload[odooFieldName] = sourceValues[konn3ctKey];
        }
      }
    } catch (_) {
      // Ignore malformed custom field map JSON safely
    }
  }

  return leadPayload;
}


function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Builds a structured HTML note for the Odoo 18 Chatter (`crm.lead` `message_post` with `body_is_html: true`)
 * so all remaining website form fields, context, attribution, and governance details appear directly in the Chatter timeline.
 */
function buildChatterHtmlNote(normalized, classification, metadata = {}) {
  const {
    submissionId,
    submittedAt = new Date().toISOString(),
    repeatContext = null,
  } = metadata;

  const lines = [
    '<div>',
    '<p><strong>📋 Konn3ct Website Form Submission Details</strong></p>',
    '<ul>',
    `<li><strong>Full Name:</strong> ${escapeHtml(normalized.contactName || 'Not provided')}</li>`,
    `<li><strong>Role / Job Title:</strong> ${escapeHtml(normalized.jobTitle || 'Not provided')}</li>`,
    `<li><strong>Organisation / Institution:</strong> ${escapeHtml(normalized.organization || 'Not provided')}</li>`,
    `<li><strong>Sector / Organisation Type:</strong> ${escapeHtml(normalized.organizationType || normalized.segmentLabel || 'Not provided')}</li>`,
    `<li><strong>Expected Scale / Learners / Reach:</strong> ${escapeHtml(normalized.scale || 'Not specified')}</li>`,
    `<li><strong>Primary Need / Use Case:</strong> ${escapeHtml(normalized.primaryNeed || 'General Konn3ct platform')}</li>`,
    `<li><strong>Visitor Enquiry / What to Improve:</strong> ${escapeHtml(normalized.enquiryMessage || '(No additional message provided)')}</li>`,
    '</ul>',
    '<p><strong>🌐 Source, Attribution &amp; Governance (NDPA 2023)</strong></p>',
    '<ul>',
    `<li><strong>Enquiry Classification:</strong> ${escapeHtml(classification.label)} (${escapeHtml(classification.purpose)})</li>`,
    `<li><strong>Source Page:</strong> ${escapeHtml(normalized.pagePath)} (Landing Page ID: <code>${escapeHtml(normalized.landingPageId)}</code> | Goal ID: <code>${escapeHtml(normalized.conversionGoalId)}</code>)</li>`,
    `<li><strong>UTM Attribution:</strong> source=<code>${escapeHtml(normalized.utm.utm_source)}</code> | medium=<code>${escapeHtml(normalized.utm.utm_medium)}</code> | campaign=<code>${escapeHtml(normalized.utm.utm_campaign)}</code>${normalized.utm.utm_term ? ` | term=<code>${escapeHtml(normalized.utm.utm_term)}</code>` : ''}${normalized.utm.utm_content ? ` | content=<code>${escapeHtml(normalized.utm.utm_content)}</code>` : ''}</li>`,
    ...(normalized.experimentId
      ? [
          `<li><strong>A/B Experiment:</strong> <code>${escapeHtml(normalized.experimentId)}</code> (Variant: <code>${escapeHtml(normalized.variantId || 'control')}</code>)</li>`,
        ]
      : []),
    `<li><strong>Enquiry Processing Consent:</strong> ${normalized.consentAccepted ? 'Granted' : 'Not granted'} (${escapeHtml(normalized.consentTimestamp)})</li>`,
    `<li><strong>Marketing Communications Opt-In:</strong> ${normalized.marketingOptIn ? 'Opted In' : 'Not Opted In'}</li>`,
    `<li><strong>Submission Reference:</strong> <code>${escapeHtml(submissionId || 'N/A')}</code> (${escapeHtml(submittedAt)})</li>`,
  ];

  if (repeatContext && repeatContext.isRepeatEnquiry) {
    lines.push(
      `<li><strong>Repeat Enquiry History:</strong> ${escapeHtml(repeatContext.priorSubmissionCount)} prior submission(s) recorded (${escapeHtml((repeatContext.priorLeadIds || []).join(', ') || 'On file')})</li>`
    );
  }

  lines.push('</ul>', '</div>');
  return lines.join('');
}

module.exports = {
  DEFAULT_SALES_TEAM_NAME,
  CLASSIFICATION_RULES,
  ROUTE_SEGMENT_LABELS,
  DEFAULT_CONVERSION_GOALS,
  resolveClassification,
  normalizeSubmissionFields,
  computeKonn3ctLeadScores,
  buildOdooLeadPayload,
  buildChatterHtmlNote,
};
