# Konn3ct Integrated Website — React + Tailwind CSS (MK-004 CRM & Conversion Edition)

This edition uses **Create React App / react-scripts**, integrated with the **Newwaves Ecosystem Odoo 18 CRM** via a secured serverless boundary (`/api/leads`), consent-controlled GA4 analytics, and controlled A/B experimentation.

## Run locally

```bash
npm install
npm start
```

The app opens on `http://localhost:3000` by default, with `/api/leads` automatically mounted via `src/setupProxy.js`.

## Production build & tests

```bash
CI=true npm test -- --watchAll=false
npm run build
```

## Registered Landing Page Programme (MK-004 AC-01 Inventory — 8 Routes)

| Route | `landing_page_id` | `conversion_goal_id` | Audience / Conversion Objective |
|---|---|---|---|
| `/` | `home` | `platform-trial-or-sales` | Primary homepage — trial/early-access & commercial routing |
| `/government` | `government` | `government-demo-request` | Government & Public Institutions demo request |
| `/associations` | `associations` | `association-demo-request` | Professional Associations & Membership demo request |
| `/education` | `education` | `education-demo-request` | Universities, Schools & Training demo request |
| `/faith` | `faith` | `faith-demo-request` | Churches & Religious Organisations demo request |
| `/corporates` | `corporates` | `corporate-demo-request` | Corporates & SMEs business demo request |
| `/events-community` | `events-community` | `events-community-demo-request` | Events & Community Organisations demo request |
| `/contact-sales` | `contact-sales` | `sales-enquiry` | Dedicated commercial sales, waitlist, early-access & partnership capture |

## Technology

- React 18
- React Router 6
- Tailwind CSS 3
- react-scripts 5 (Create React App toolchain)
- Vercel Serverless Functions (`/api/leads`) + Odoo 18 XML-RPC CRM Integration
