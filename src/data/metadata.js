export const solutionMeta = {
  home: {
    label: "Home",
    short: "Konn3ct",
    description: "Bring your people together for meetings, learning and collaboration with Konn3ct.",
    eyebrow: "Connection Freedom by Design",
  },
  government: {
    label: "Government & Public Institutions",
    short: "Government",
    description: "Public missions. Clear institutional control.",
    eyebrow: "For government & public institutions",
  },
  associations: {
    label: "Professional Associations & Membership Organisations",
    short: "Associations",
    description: "Member meetings and professional learning.",
    eyebrow: "For professional & membership organisations",
  },
  education: {
    label: "Universities, Schools & Training Organisations",
    short: "Education",
    description: "Institutions, trainers and campus groups.",
    eyebrow: "For education, training & campus communities",
  },
  faith: {
    label: "Churches & Religious Organisations",
    short: "Faith communities",
    description: "Teaching, fellowship and leadership.",
    eyebrow: "For churches & religious organisations",
  },
  corporates: {
    label: "Corporates & SMEs",
    short: "Business",
    description: "Teams, customers and partners.",
    eyebrow: "For teams, SMEs & enterprises",
  },
  "events-community": {
    label: "Events & Community Organisations",
    short: "Events & community",
    description: "Purposeful gatherings and follow-through.",
    eyebrow: "For organisers & community leaders",
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

export const REGISTER_URL =
  process.env.REACT_APP_REGISTER_URL || "https://dashboard.konn3ct.ng/register";

export const LOGIN_URL =
  process.env.REACT_APP_LOGIN_URL || "https://dashboard.konn3ct.ng/login";

export const EVENTS_URL =
  process.env.REACT_APP_EVENTS_URL || "https://www.konn3ct.com/EventsPage";

export const proposalSolutions = [
  ["government", "Government", "Public missions. Clear institutional control.", "⌂"],
  ["associations", "Associations", "Member meetings and professional learning.", "◎"],
  ["education", "Education", "Institutions, trainers and campus groups.", "▱"],
  ["faith", "Faith communities", "Teaching, fellowship and leadership.", "♧"],
  ["corporates", "Business", "Teams, customers and partners.", "▦"],
  ["events-community", "Events & community", "Purposeful gatherings and follow-through.", "◌"],
];

export const sectorProposals = {
  government: {
    name: "Government",
    route: "government",
    eyebrow: "For government & public institutions",
    titleHtml: "Public service should <em>connect everyone.</em>",
    intro:
      "Bring leadership teams and public institutions together for briefings, coordination and training, with clear access and host controls.",
    cta: "Request a government demo",
    alt: "Explore deployment options",
    anchor: "deployment",
    visual: "government",
    tag: "Institutional communication",
    benefits: [
      [
        "Coordinate across institutions",
        "Bring offices, departments and remote teams into one conversation.",
      ],
      [
        "Keep authority clear",
        "Make host responsibilities, participant access and recording choices understandable.",
      ],
      [
        "Turn discussion into shared knowledge",
        "Share authorised recordings and files with the people who need them.",
      ],
    ],
    flowTitle: "A clearer briefing. From invitation to follow-through.",
    flowText:
      "Design the session around the public mission, then confirm access, participation and follow-up.",
    steps: [
      ["Define the session", "Agree the audience, meeting purpose and host responsibilities."],
      ["Bring the right people in", "Use the approved joining route and meeting controls."],
      ["Share what is authorised", "Make approved recordings and files available after the session."],
    ],
    tabs: [
      [
        "Briefings",
        "Bring decision-makers into the same conversation.",
        "Run leadership briefings and cross-department coordination around a clear agenda.",
        ["Audio and video meetings", "File sharing and in-meeting chat", "Core host access controls"],
      ],
      [
        "Training",
        "Make distributed training easier to follow.",
        "Bring staff together for live instruction and share authorised material after the session.",
        [
          "Present and discuss learning material",
          "Record approved sessions",
          "Share or download authorised recordings",
        ],
      ],
      [
        "Administration",
        "Confirm the controls your institution needs.",
        "Map provisioning and reporting requirements to the approved package before rollout.",
        [
          "Organisation-wide provisioning scope",
          "Reporting requirements",
          "Access and recording responsibilities",
        ],
      ],
    ],
    formTitle: "Request a government demo",
    usecase: "Briefings & coordination",
    outcome: "A session designed around your public mission.",
    note: "Dedicated and sovereign environments are assessment-led proposals, not assumed V1 entitlements.",
  },
  associations: {
    name: "Associations",
    route: "associations",
    eyebrow: "For professional & membership organisations",
    titleHtml: "Turn membership<br>into <em>momentum.</em>",
    intro:
      "Bring member meetings and professional learning together. Start with a supported trial for an agreed session, then build on the value your members experience.",
    cta: "Request an association demo",
    alt: "Discuss a supported training trial",
    anchor: "pilot",
    visual: "associations",
    tag: "A stronger member experience",
    benefits: [
      ["Connect your chapters", "Bring committees, branches and members together across locations."],
      ["Make knowledge more accessible", "Run live member training and share authorised recordings."],
      ["Begin with a useful outcome", "Test a real session before discussing your purchasing proposal."],
    ],
    flowTitle: "One supported session. A practical first step.",
    flowText:
      "Try Konn3ct for your next member training with a supported seven-day trial for an agreed session.",
    steps: [
      [
        "Agree the pilot outcome",
        "Choose the session, audience and what a successful meeting looks like.",
      ],
      [
        "Run the approved session",
        "Prepare hosts and members for joining, participation and recording.",
      ],
      ["Review, then decide", "Review the experience and discuss the right purchasing proposal."],
    ],
    tabs: [
      [
        "Member meetings",
        "Keep member conversations moving.",
        "Bring chapters and committees into a shared meeting with clear roles and practical collaboration tools.",
        [
          "Member and committee meetings",
          "In-meeting text chat and file sharing",
          "Core host controls",
        ],
      ],
      [
        "Professional learning",
        "Give expertise a useful second life.",
        "Host a member learning session and share its authorised recording with the intended audience.",
        [
          "Live audio and video",
          "Recording with appropriate permissions",
          "Authorised sharing and download",
        ],
      ],
      [
        "Organisation setup",
        "Make the operating model explicit.",
        "Confirm who hosts, how accounts are provisioned and which reports belong in your package.",
        ["Provisioning requirements", "Host responsibilities", "Approved reporting scope"],
      ],
    ],
    formTitle: "Request an association demo",
    usecase: "Member meetings & training",
    outcome: "Start with your next member gathering.",
    note: "Polls, where verified, are participation tools. No CPD accreditation or certified election capability is implied.",
  },
  education: {
    name: "Education",
    route: "education",
    eyebrow: "For education, training & campus communities",
    titleHtml: "Bring learning<br><em>within reach.</em>",
    intro:
      "Connect educators and learners for live classes, tutorials and training across supported mobile and desktop devices.",
    cta: "Book an education demo",
    alt: "Start a campus trial",
    action: "trial",
    visual: "education",
    tag: "Different learners. Clearer paths.",
    benefits: [
      [
        "For institutions",
        "Discuss live teaching, faculty collaboration and the controls your institution requires.",
      ],
      [
        "For trainers",
        "Bring learners into a shared session and distribute authorised recordings and files.",
      ],
      [
        "For campus communities",
        "Start a seven-day trial, join your first meeting and invite your group.",
      ],
    ],
    flowTitle: "Help every learner find their next step.",
    flowText: "A simple class journey makes first use easier for hosts and participants.",
    steps: [
      ["Invite and prepare", "Share the session details and supported joining guidance."],
      ["Join and take part", "Connect through audio, video, chat and the approved collaboration tools."],
      [
        "Return to authorised learning",
        "Access recordings and shared files according to the host’s permissions.",
      ],
    ],
    tabs: [
      [
        "Live teaching",
        "Bring the class into one conversation.",
        "Run live tutorials, lectures and training sessions with clear host controls.",
        ["Audio and video participation", "In-meeting text chat", "File sharing"],
      ],
      [
        "Recording access",
        "Keep the right material within reach.",
        "Record authorised sessions and make them available through approved sharing or download.",
        ["Meeting recording", "Authorised sharing", "Recording download permissions"],
      ],
      [
        "Campus groups",
        "Begin with your first useful meeting.",
        "Create or join a meeting during your seven-day trial. Referral attribution belongs in the final onboarding journey.",
        [
          "Seven-day trial, no credit card",
          "Meeting creation and joining",
          "Guided first-session checklist",
        ],
      ],
    ],
    formTitle: "Book an education demo",
    usecase: "Live classes & training",
    outcome: "A learning experience that starts with people.",
    note: "This is a communication platform proposal. LMS, examination, certification and AI-language capabilities are not implied.",
  },
  faith: {
    name: "Faith communities",
    route: "faith",
    eyebrow: "For churches & religious organisations",
    titleHtml: "Bring your faith community <em>closer.</em>",
    intro:
      "Wherever members join, gather for teaching, fellowship and leadership meetings with clear host controls and access to authorised recordings.",
    cta: "Book a faith-community demo",
    alt: "Discuss a supported first gathering",
    anchor: "journey",
    visual: "faith",
    tag: "Gather with purpose",
    benefits: [
      [
        "Stay close across distance",
        "Bring local members and diaspora participants into shared gatherings.",
      ],
      [
        "Support everyday fellowship",
        "Connect leadership groups, teaching sessions and community meetings.",
      ],
      [
        "Share with care",
        "Keep recording, access and sharing choices clear to hosts and participants.",
      ],
    ],
    flowTitle: "Thoughtful controls. A more welcoming gathering.",
    flowText: "Make the invitation, host role and recording choices clear before the gathering begins.",
    steps: [
      ["Prepare your hosts", "Agree the purpose, joining route and recording plan."],
      ["Welcome your community", "Help members join through supported devices and browsers."],
      ["Continue with care", "Share only authorised recordings and follow-up material."],
    ],
    tabs: [
      [
        "Gatherings",
        "Make room for meaningful connection.",
        "Bring people together for teaching, fellowship and leadership conversations.",
        ["Live audio and video", "In-meeting chat", "Core host access controls"],
      ],
      [
        "Recordings",
        "Keep the message within its intended audience.",
        "Make recording choices visible and use the approved sharing workflow.",
        [
          "Authorised recording",
          "Sharing and download permissions",
          "Clear participant guidance",
        ],
      ],
      [
        "Mobile access",
        "Help people use the device available to them.",
        "Prepare joining guidance around the actual supported mobile and browser capabilities.",
        ["Supported-device guidance", "Audio and video controls", "Connection recovery help"],
      ],
    ],
    formTitle: "Book a faith-community demo",
    usecase: "Teaching & fellowship",
    outcome: "Plan your first gathering with confidence.",
    note: "Giving, translation and AI media functions require separate scope and release confirmation.",
  },
  corporates: {
    name: "Business",
    route: "corporates",
    eyebrow: "For teams, SMEs & enterprises",
    titleHtml: "Bring your team, customers and partners <em>closer.</em>",
    intro:
      "Meet, share files and agree next steps in one conversation. Start simply, or discuss the requirements of a larger organisation.",
    cta: "Start a business trial",
    action: "trial",
    alt: "Book an enterprise demo",
    anchor: "request",
    visual: "business",
    tag: "From conversation to useful work",
    benefits: [
      [
        "Bring the team together",
        "Connect colleagues across offices, homes and field locations.",
      ],
      [
        "Move customer conversations forward",
        "Use meetings for discovery, demonstrations, onboarding and account reviews.",
      ],
      [
        "Build on the right package",
        "Choose the approved plan or scope an enterprise deployment with the team.",
      ],
    ],
    flowTitle: "Good collaboration starts with a clear next step.",
    flowText: "Make it easy to move from a meeting to authorised material and follow-up.",
    steps: [
      ["Bring people in", "Create a meeting or share the approved joining route."],
      ["Work through the task", "Use audio, video, files and chat to discuss the work."],
      ["Keep the useful material", "Share an authorised recording and agree what happens next."],
    ],
    tabs: [
      [
        "Teams & collaboration",
        "Bring colleagues into a shared meeting.",
        "Discuss work, share files and agree next steps with practical collaboration tools.",
        ["Audio and video meetings", "File sharing and in-meeting chat", "Core host access controls"],
      ],
      [
        "Customers",
        "Make every customer conversation useful.",
        "Use a meeting to understand needs, demonstrate work or guide a customer through an agreed process.",
        ["Meeting creation and joining", "Live discussion and shared files", "Authorised recording"],
      ],
      [
        "Enterprise setup",
        "Match the package to the organisation.",
        "Confirm provisioning, reporting and governance requirements before committing to a rollout.",
        ["Organisation provisioning scope", "Advanced reporting requirements", "Deployment assessment"],
      ],
    ],
    formTitle: "Book an enterprise demo",
    usecase: "Team & customer collaboration",
    outcome: "Start small. Grow around a clear need.",
    note: "AI summaries, searchable transcripts and SSO are not presented as released V1 capabilities.",
  },
  "events-community": {
    name: "Events & community",
    route: "events-community",
    eyebrow: "For organisers & community leaders",
    titleHtml: "Bring people together.<br><em>Keep the connection going.</em>",
    intro:
      "Plan a gathering around meaningful participation, with clear joining guidance, host responsibilities and an authorised recording workflow.",
    cta: "Request an event consultation",
    alt: "See the event journey",
    anchor: "journey",
    visual: "events",
    tag: "Before. During. After.",
    benefits: [
      ["Before the session", "Agree the format, audience needs and host responsibilities."],
      ["During the session", "Make joining, contribution and moderation understandable."],
      ["After the session", "Share authorised material and invite the next conversation."],
    ],
    flowTitle: "A useful gathering starts before people join.",
    flowText:
      "Talk through the requirements, rehearse the approved experience and define the follow-up.",
    steps: [
      ["Scope and rehearse", "Confirm format, expected concurrency, support and actual capacity."],
      ["Host and participate", "Prepare joining guidance and use the approved host controls."],
      ["Share and reconnect", "Distribute authorised recordings and plan the next gathering."],
    ],
    tabs: [
      [
        "Events & gatherings",
        "Build the session around your audience.",
        "Discuss the format and audience requirements before confirming a suitable scope.",
        [
          "Meeting and participation needs",
          "Core host access controls",
          "Rehearsal and support requirements",
        ],
      ],
      [
        "Participation",
        "Help people contribute to the conversation.",
        "Use the verified tools included in the agreed event package.",
        ["Audio and video participation", "In-meeting text chat", "File sharing"],
      ],
      [
        "Recording & follow-up",
        "Keep useful material available with permission.",
        "Use the authorised recording and sharing workflow after the session.",
        ["Meeting recording", "Sharing and download controls", "Follow-up gathering planning"],
      ],
    ],
    formTitle: "Request an event consultation",
    usecase: "Event & gathering requirements",
    outcome: "Design a gathering people can take part in.",
    note: "Your audience estimate helps us assess requirements. Capacity is confirmed in the agreed event scope. Ticketing, sponsorship and breakouts require separate confirmation.",
  },
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
    primaryCtaLabel: "Start your 7-day free trial",
    secondaryCtaLabel: "Buy a plan",
    ownerTeam: "Konn3ct Growth & Partnerships",
  },
  government: {
    routeKey: "government",
    path: "/government",
    landing_page_id: "government",
    conversion_goal_id: "government-demo-request",
    primaryCtaLabel: "Request a government demo",
    secondaryCtaLabel: "Explore deployment options",
    ownerTeam: "Konn3ct Growth & Partnerships",
  },
  associations: {
    routeKey: "associations",
    path: "/associations",
    landing_page_id: "associations",
    conversion_goal_id: "association-demo-request",
    primaryCtaLabel: "Request an association demo",
    secondaryCtaLabel: "Discuss a supported training trial",
    ownerTeam: "Konn3ct Growth & Partnerships",
  },
  education: {
    routeKey: "education",
    path: "/education",
    landing_page_id: "education",
    conversion_goal_id: "education-demo-request",
    primaryCtaLabel: "Book an education demo",
    secondaryCtaLabel: "Start a campus trial",
    ownerTeam: "Konn3ct Growth & Partnerships",
  },
  faith: {
    routeKey: "faith",
    path: "/faith",
    landing_page_id: "faith",
    conversion_goal_id: "faith-demo-request",
    primaryCtaLabel: "Book a faith-community demo",
    secondaryCtaLabel: "Discuss a supported first gathering",
    ownerTeam: "Konn3ct Growth & Partnerships",
  },
  corporates: {
    routeKey: "corporates",
    path: "/corporates",
    landing_page_id: "corporates",
    conversion_goal_id: "corporate-demo-request",
    primaryCtaLabel: "Start a business trial",
    secondaryCtaLabel: "Book an enterprise demo",
    ownerTeam: "Konn3ct Growth & Partnerships",
  },
  "events-community": {
    routeKey: "events-community",
    path: "/events-community",
    landing_page_id: "events-community",
    conversion_goal_id: "events-community-demo-request",
    primaryCtaLabel: "Request an event consultation",
    secondaryCtaLabel: "See the event journey",
    ownerTeam: "Konn3ct Growth & Partnerships",
  },
  "contact-sales": {
    routeKey: "contact-sales",
    path: "/contact-sales",
    landing_page_id: "contact-sales",
    conversion_goal_id: "sales-enquiry",
    primaryCtaLabel: "Request a conversation",
    secondaryCtaLabel: null,
    ownerTeam: "Konn3ct Growth & Partnerships",
  },
};

export function getRouteConversionMeta(routeKeyOrPath = "home") {
  const normalized = String(routeKeyOrPath || "home").replace(/^\/+/, "") || "home";
  const mappedKey =
    normalized === "business"
      ? "corporates"
      : normalized === "events"
      ? "events-community"
      : normalized === "contact"
      ? "contact-sales"
      : normalized;
  return (
    landingPageRegistry[mappedKey] || {
      routeKey: mappedKey,
      path: `/${mappedKey}`,
      landing_page_id: mappedKey,
      conversion_goal_id: `${mappedKey}-enquiry`,
      ownerTeam: "Konn3ct Growth & Partnerships",
    }
  );
}
