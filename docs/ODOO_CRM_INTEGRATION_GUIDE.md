# Konn3ct Landing Page × Newwaves Ecosystem Odoo 18 CRM
## Architecture, Configuration, Security, CRM Setup & Deployment Runbook

**Project:** Konn3ct  
**Ecosystem:** Newwaves Ecosystem Limited  
**Verified CRM Platform:** Odoo `18.0+e` (Enterprise Edition) behind `nginx/1.24.0 (Ubuntu)`  
**Verified Origin:** `https://www.newwavesecosystem.com`  
**Verified Databases:** `newwavesecosystem-staging` (Staging) / `newwavesecosystem` (Production)  
**Verified External API Protocol:** XML-RPC (`/xmlrpc/2/common` and `/xmlrpc/2/object`)

---

## 1. Architecture Overview

```
[Konn3ct React 18 SPA]
  ├── /contact-sales (ContactSales.jsx)
  ├── /government, /associations, /education, /faith, /corporates, /events-community (DemoSection)
  └── src/services/leadService.js (UTM capture, client validation, X-Idempotency-Key)
          │
          ▼ HTTPS POST /api/leads (JSON)
[Vercel Serverless Endpoint: api/leads.js]
  ├── Origin & Rate Limit Guard (api/_lib/idempotency.js)
  ├── Payload Size (16 KB), Input Validation, Sanitization & Honeypot Guard (api/_lib/validation.js)
  ├── Idempotency Lock & Repeat-Enquiry Context Tracker (api/_lib/idempotency.js)
  ├── Phase 8 Lead Classifier & `crm.lead` Dossier Builder (api/_lib/classification.js)
  ├── PII-Masking Operational Logger (api/_lib/logger.js)
  └── Zero-Dependency XML-RPC Client (api/_lib/xmlrpc.js & api/_lib/odooClient.js)
          │
          ▼ HTTPS POST /xmlrpc/2/common & /xmlrpc/2/object
[Newwaves Ecosystem Odoo 18.0+e CRM]
  ├── Database: `newwavesecosystem-staging` | `newwavesecosystem`
  ├── Sales Team: `Konn3ct Growth & Partnerships`
  └── Model: `crm.lead` (Preserves existing pipeline: New → Contacted → Responded → Qualified → Demo Scheduled → Negotiation → Won)
```

---

## 2. Odoo 18 CRM Setup & Service-Account Instructions

### 2.1 Resolving the "User is not a member of a sales team" Warning
In Odoo 18 CRM, the pipeline warning appears when the logged-in user is not assigned to a `crm.team` record. To configure the Konn3ct CRM workspace cleanly without affecting other Newwaves Ecosystem business units:

1. Log in to `https://www.newwavesecosystem.com/odoo/crm` with an account holding **Sales / Administrator** privileges.
2. Navigate to **CRM → Configuration → Sales Teams** and verify whether **Konn3ct Growth & Partnerships** already exists.
   - If it does not exist, click **New** and create:
     - **Sales Team Name:** `Konn3ct Growth & Partnerships`
     - **Leads (`use_leads`):** Checked (enables the incoming **Leads** menu for unqualified Waitlist / Early Access registrations before converting to pipeline Opportunities).
     - **Pipeline (`use_opportunities`):** Checked.
     - **Team Leader & Members:** Add the authorized Konn3ct sales/growth users and the dedicated Konn3ct integration service user.
3. Preserve the existing global pipeline stages unchanged:
   `New` → `Contacted` → `Responded` → `Qualified` → `Demo Scheduled` → `Negotiation` → `Won`.

### 2.2 Creating the Least-Privilege Integration Service Account
1. Navigate to **Settings → Users & Companies → Users → New**:
   - **Name:** `Konn3ct Website CRM Integration`
   - **Email / Login:** e.g. `konn3ct-crm-bot@newwavesecosystem.com`
   - **Sales Access Rights:** `User: Own Documents Only` (or `User: All Documents` if cross-team repeat-enquiry lookup is desired; **do not** grant `Administrator` or System Settings permissions).
2. Assign the service account as a member of the **Konn3ct Growth & Partnerships** Sales Team.
3. Generate an **Odoo 18 API Key**:
   - While logged in as the service account (or via User Preferences → **Account Security** tab → **New API Key**):
   - **Description:** `Konn3ct Landing Page Vercel Backend`
   - Copy the generated key into `ODOO_API_KEY` in Vercel Environment Variables.

### 2.3 Recommended CRM Tags (`crm.tag`)
Create the following tags under **CRM → Configuration → Tags** so `api/_lib/odooClient.js` automatically links them via `tag_ids`:
- `Konn3ct Waitlist`
- `Konn3ct Early Access`
- `Konn3ct Demo Request`
- `Konn3ct Partnership`
- `Konn3ct General Enquiry`

---

## 3. Duplicate & Lead-Idempotency Policy (Phase 5)

1. **Accidental Double-Clicks & Network Retries:**
   - Every form attempt generates a client `X-Idempotency-Key` (`k3_<route>_<timestamp>_<random>`) that remains stable across network retries of the same form state.
   - The backend also computes a `SHA-256` content fingerprint over `(email | organization | route | classification | primaryNeed | enquiryMessage)`.
   - Concurrent identical requests share an in-flight lock (`executeWithIdempotencyLock`), and completed requests are cached (`24h` for `submissionId`, `10m` for identical content fingerprint). Duplicate retries return HTTP `200 OK` with `duplicate: true` and the original `leadReference`.
2. **Legitimate Repeat Enquiries:**
   - Email address alone is **never** treated as a unique key.
   - If the same visitor submits a different form/segment, selects a different enquiry type (e.g. Waitlist followed by Partnership), or sends a new message, a new `crm.lead` record is created and annotated with a `[Repeat Enquiry History Note]` referencing prior Konn3ct lead IDs so no existing CRM data is overwritten or merged destructively.

---

## 4. Deployment & Rollback Runbook (Phase 12)

### 4.1 Pre-Deployment Configuration (Staging First)
1. In Vercel Project Settings → **Environment Variables**, configure the variables from [`.env.example`](../.env.example), starting with:
   - `ODOO_URL=https://www.newwavesecosystem.com`
   - `ODOO_DB=newwavesecosystem-staging`
   - `ODOO_USERNAME=<service-account-login>`
   - `ODOO_API_KEY=<odoo-18-api-key>`
   - `ODOO_CRM_TEAM_NAME=Konn3ct Growth & Partnerships`
   - `KONN3CT_CRM_MODE=staging`
2. Deploy the `feat/odoo-crm-integration` branch to a **Vercel Preview / Staging URL**.

### 4.2 Post-Deployment Verification Checklist
- [ ] Call `GET /api/leads?probe=1` on the preview deployment and verify `ok: true`, `credentialsConfigured: true`, and `upstreamVersion.serverVersion: "18.0+e"`.
- [ ] Submit a test enquiry on `/contact-sales` (`Sales & Product Demo Request`) and verify HTTP `201` with `deliveryStatus: "crm_created"` and `Ref: ODOO-<id>`.
- [ ] Confirm the lead appears in `newwavesecosystem-staging` under **CRM → Leads** assigned to `Konn3ct Growth & Partnerships` with full contact, organisation, UTM, consent, and classification details.
- [ ] Submit a second identical request with the same idempotency key and verify HTTP `200` (`duplicate: true`) with no duplicate record created in Odoo.
- [ ] Obtain explicit production sign-off before switching `ODOO_DB` to `newwavesecosystem` and `KONN3CT_CRM_MODE=live`.

### 4.3 Rollback Procedure
- **Immediate Traffic Rollback:** In Vercel Deployments, promote the previous production deployment via **Instant Rollback** (< 10 seconds), or set `KONN3CT_ENABLE_DURABLE_QUEUE=true` to decouple form capture from live Odoo RPC calls during any upstream CRM maintenance window.
- **Git Rollback:** `git revert <commit-sha>` on the integration branch. No destructive schema migrations or global Odoo pipeline changes are made by this integration.

---

## 5. MK-004 / MK-004-DEV-001 Specification & Acceptance Matrix

### 5.1 8-Route Landing Page & Conversion Registry (`src/data/metadata.js`)
| Route Path | `landing_page_id` | `conversion_goal_id` | Default Segment |
| :--- | :--- | :--- | :--- |
| `/` | `lp_home_edge` | `goal_home_demo_or_trial` | `home` |
| `/government` | `lp_government_mda` | `goal_gov_briefing_request` | `government` |
| `/associations` | `lp_associations_agm` | `goal_assoc_demo_request` | `associations` |
| `/education` | `lp_education_campus` | `goal_edu_demo_request` | `education` |
| `/faith` | `lp_faith_ministry` | `goal_faith_demo_request` | `faith` |
| `/corporates` | `lp_corporates_enterprise` | `goal_corp_demo_request` | `corporates` |
| `/events-community` | `lp_events_community` | `goal_events_sandbox_request` | `events` |
| `/contact-sales` | `lp_contact_sales` | `goal_contact_sales_submission` | `contact-sales` |

### 5.2 Consent-Gated GA4 Instrumentation (`src/analytics/events.js`)
- `trackGenerateLead(payload)` fires `generate_lead` **strictly after** backend HTTP `2xx` confirmation (`ok: true` / `success: true`) and only when analytics consent is granted (`hasAnalyticsConsent()`).
- Explicitly strips PII (`email`, `full_name`, `fullName`, `phone`, `organization`, `notes`, `enquiryMessage`) before dispatching to `window.gtag` / `window.dataLayer`.
- `GET /api/leads?reconcile=1` exposes `getFunnelReconciliationSummary()` (`api/_lib/idempotency.js`) so marketing ops can verify `< 5%` variance between `generate_lead` events and accepted Odoo CRM leads (`AC-06`).

### 5.3 Controlled A/B Experimentation & Rollback (`src/experiments/abTest.js`)
- Deterministic visitor bucketing (`assignExperimentVariant`) with single-exposure session deduplication (`trackExperimentExposureOnce`).
- Instant kill-switch (`rollbackExperiment(experimentId)` or `REACT_APP_AB_DISABLED_EXPERIMENTS`) reverts visitors to `control` (`v_control`) and suppresses exposure tracking (`AC-07` / `DEV-AT-09`).

### 5.4 Automated Test Matrix (`npm test -- --watchAll=false`)
- `src/tests/leadSubmission.test.js`: Verifies `DEV-AT-01` through `DEV-AT-10` and `AC-01` through `AC-10`.
- `src/__tests__/backendAndOdooIntegration.test.js`: Verifies XML-RPC serialization/XXE security, classification, validation, rate limiting, idempotency, and live `/api/leads` handler behavior.
- `src/__tests__/frontendIntegration.test.js`: Verifies UI states, CTA routing (`PricingSection`, `CTASection`, `SplitSection`), and form submissions.

