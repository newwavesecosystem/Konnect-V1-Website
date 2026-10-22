export const solutionMeta = {
  home: {
    label: "Home",
    short: "Konn3ct",
    description: "AI-enabled meetings, webinars, events, replay and collaboration designed around Connection Freedom.",
    eyebrow: "Connection Freedom by Design",
  },
  government: {
    label: "Government & Public Institutions",
    short: "Government",
    description: "Governed communication, sovereign deployment, large meetings and trusted administration.",
    eyebrow: "Public Institutions",
  },
  associations: {
    label: "Professional Associations & Membership Organisations",
    short: "Associations",
    description: "Member meetings, CPD, conferences, committees and ongoing engagement.",
    eyebrow: "Membership Organisations",
  },
  education: {
    label: "Universities, Schools & Training Organisations",
    short: "Education",
    description: "Classes, lectures, webinars, training, recordings and distributed learning.",
    eyebrow: "Education & Training",
  },
  faith: {
    label: "Churches & Religious Organisations",
    short: "Faith",
    description: "Services, teaching, prayer programmes, conferences and diaspora participation.",
    eyebrow: "Faith Communities",
  },
  corporates: {
    label: "Corporates & SMEs",
    short: "Business",
    description: "Everyday collaboration, webinars, training, customer engagement and enterprise control.",
    eyebrow: "Corporates & SMEs",
  },
  "events-community": {
    label: "Events & Community Organisations",
    short: "Events & Community",
    description: "Registration, ticketing, live sessions, participation, replay and community continuity.",
    eyebrow: "Events & Community",
  },
};

export const solutionOrder = [
  "government",
  "associations",
  "education",
  "faith",
  "corporates",
  "events-community",
];

export const routePaths = {
  home: "/",
  government: "/government",
  associations: "/associations",
  education: "/education",
  faith: "/faith",
  corporates: "/corporates",
  "events-community": "/events-community",
};

/**
 * MK-004 AC-01 & AC-02: Formal 8-Route Landing Page & Conversion Goal Inventory
 */
export const landingPageRegistry = {
  home: {
    routeKey: "home",
    path: "/",
    landing_page_id: "home",
    conversion_goal_id: "platform-trial-or-sales",
    primaryCtaLabel: "Start free",
    secondaryCtaLabel: "Contact sales",
    ownerTeam: "Konn3ct Growth & Partnerships",
  },
  government: {
    routeKey: "government",
    path: "/government",
    landing_page_id: "government",
    conversion_goal_id: "government-demo-request",
    primaryCtaLabel: "Request a government demo",
    secondaryCtaLabel: "Explore public-sector capabilities",
    ownerTeam: "Konn3ct Growth & Partnerships",
  },
  associations: {
    routeKey: "associations",
    path: "/associations",
    landing_page_id: "associations",
    conversion_goal_id: "association-demo-request",
    primaryCtaLabel: "Book an association demo →",
    secondaryCtaLabel: "See the member lifecycle",
    ownerTeam: "Konn3ct Growth & Partnerships",
  },
  education: {
    routeKey: "education",
    path: "/education",
    landing_page_id: "education",
    conversion_goal_id: "education-demo-request",
    primaryCtaLabel: "Book an education demo →",
    secondaryCtaLabel: "See the learning lifecycle",
    ownerTeam: "Konn3ct Growth & Partnerships",
  },
  faith: {
    routeKey: "faith",
    path: "/faith",
    landing_page_id: "faith",
    conversion_goal_id: "faith-demo-request",
    primaryCtaLabel: "Book a faith-community demo →",
    secondaryCtaLabel: "Explore the experience",
    ownerTeam: "Konn3ct Growth & Partnerships",
  },
  corporates: {
    routeKey: "corporates",
    path: "/corporates",
    landing_page_id: "corporates",
    conversion_goal_id: "corporate-demo-request",
    primaryCtaLabel: "Book a Business Demo",
    secondaryCtaLabel: "Explore Business Capabilities",
    ownerTeam: "Konn3ct Growth & Partnerships",
  },
  "events-community": {
    routeKey: "events-community",
    path: "/events-community",
    landing_page_id: "events-community",
    conversion_goal_id: "events-community-demo-request",
    primaryCtaLabel: "Plan Your Event",
    secondaryCtaLabel: "Explore Capabilities",
    ownerTeam: "Konn3ct Growth & Partnerships",
  },
  "contact-sales": {
    routeKey: "contact-sales",
    path: "/contact-sales",
    landing_page_id: "contact-sales",
    conversion_goal_id: "sales-enquiry",
    primaryCtaLabel: "Contact sales",
    secondaryCtaLabel: null,
    ownerTeam: "Konn3ct Growth & Partnerships",
  },
};

export function getRouteConversionMeta(routeKeyOrPath = "home") {
  const normalized = String(routeKeyOrPath || "home").replace(/^\/+/, "") || "home";
  return (
    landingPageRegistry[normalized] || {
      routeKey: normalized,
      path: `/${normalized}`,
      landing_page_id: normalized,
      conversion_goal_id: `${normalized}-enquiry`,
      ownerTeam: "Konn3ct Growth & Partnerships",
    }
  );
}
