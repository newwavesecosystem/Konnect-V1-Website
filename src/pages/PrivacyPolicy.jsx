import React, { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Footer from '../components/Footer'
import { trackPageView } from '../analytics/events'

const PRIVACY_SECTIONS = [
  { id: 'introduction', number: '01', title: 'Introduction' },
  { id: 'data-controller', number: '02', title: 'Data Controller & Contact Details' },
  { id: 'information-we-process', number: '03', title: 'Personal Information We Process' },
  { id: 'purposes-lawful-bases', number: '04', title: 'Purposes & Lawful Bases' },
  { id: 'sharing-service-providers', number: '05', title: 'Sharing & Service Providers' },
  { id: 'international-transfers', number: '06', title: 'International Transfers' },
  { id: 'retention', number: '07', title: 'Retention & Deletion Schedule' },
  { id: 'privacy-rights', number: '08', title: 'Your Privacy Rights & Requests' },
  { id: 'security', number: '09', title: 'Security & Incident Response' },
  { id: 'cookies-tracking', number: '10', title: 'Cookies, Tracking & Consent' },
  { id: 'children', number: '11', title: 'Children' },
  { id: 'changes', number: '12', title: 'Changes to This Policy' },
  { id: 'contact', number: '13', title: 'Contact' },
]

const RETENTION_REGISTER = [
  ['Account profile', 'Active account duration + approved closure period', 'Account closure', 'Product / Privacy'],
  ['Authentication logs', 'Approved security audit period', 'Log creation', 'Security'],
  ['Meeting metadata', 'Approved operational retention period', 'Meeting end', 'Product'],
  ['Stored recordings (if enabled)', 'Customer-configured / approved period', 'Recording creation or deletion request', 'Product / Privacy'],
  ['Customer support requests', 'Approved support resolution period', 'Case closure', 'Customer Success'],
  ['Marketing consent evidence', 'Duration of consent + audit period', 'Consent or withdrawal event', 'Growth / Privacy'],
  ['Financial and billing records', 'Statutory tax and accounting period', 'Transaction date', 'Finance'],
  ['Incident records', 'Approved security & legal review period', 'Case closure', 'Security / Legal'],
]

export default function PrivacyPolicy({ onAction }) {
  const location = useLocation()

  useEffect(() => {
    document.title = 'Privacy Policy · Konn3ct'
    window.scrollTo({ top: 0 })
    trackPageView({ route: 'privacy', page_path: '/privacy' })
  }, [location.pathname])

  return (
    <main>
      <section className="contact-hero legal-hero">
        <div className="wrap">
          <div className="legal-top-bar">
            <div className="eyebrow" style={{ marginBottom: 0 }}>
              Privacy &amp; Data Protection
            </div>
            <div className="legal-switch" role="navigation" aria-label="Legal documents">
              <Link to="/privacy" className="legal-switch-pill is-active">
                Privacy Policy
              </Link>
              <Link to="/terms" className="legal-switch-pill">
                Terms of Service
              </Link>
            </div>
          </div>

          <h1>Konn3ct V1 Privacy Policy</h1>
          <p>
            We are committed to protecting personal information and processing it lawfully, fairly,
            transparently and securely whenever you access or use Konn3ct.
          </p>
        </div>
      </section>

      <section className="section legal-section">
        <div className="wrap legal-layout">
          <aside className="legal-sidebar" aria-label="Privacy policy sections">
            <div className="legal-toc-card">
              <span className="kicker">On this page</span>
              <nav className="legal-toc-nav">
                {PRIVACY_SECTIONS.map((sec) => (
                  <a key={sec.id} href={`#${sec.id}`} className="legal-toc-link">
                    <span>{sec.number}</span>
                    {sec.title}
                  </a>
                ))}
              </nav>
              <div className="legal-toc-footer">
                <p>Looking for our service agreement?</p>
                <Link to="/terms" className="text-link">
                  View Terms of Service →
                </Link>
              </div>
            </div>
          </aside>

          <div className="legal-content">
            <article id="introduction" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">01</span>
                <h2>Introduction</h2>
              </div>
              <p>
                Konn3ct is a digital communications and collaboration platform operated by{' '}
                <strong>Newwaves Ecosystem Limited</strong> (&ldquo;Konn3ct&rdquo;, &ldquo;we&rdquo;,
                &ldquo;us&rdquo;, or &ldquo;our&rdquo;).
              </p>
              <p>
                We are committed to protecting personal information and processing it lawfully,
                fairly, transparently and securely. This Privacy Policy describes how we collect,
                use, disclose, retain and protect personal information when individuals access or
                use Konn3ct.
              </p>
            </article>

            <article id="data-controller" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">02</span>
                <h2>Data Controller and Contact Details</h2>
              </div>
              <div className="legal-info-grid">
                <div className="legal-info-item">
                  <span>Legal Entity</span>
                  <strong>Newwaves Ecosystem Limited</strong>
                </div>
                <div className="legal-info-item">
                  <span>Privacy Contact</span>
                  <strong>privacy@konn3ct.com</strong>
                </div>
                <div className="legal-info-item">
                  <span>Data Protection Officer</span>
                  <strong>dpo@konn3ct.com</strong>
                </div>
                <div className="legal-info-item">
                  <span>General &amp; Support Inquiries</span>
                  <strong>info@konn3ct.com</strong>
                </div>
              </div>
              <div className="callout" style={{ marginTop: '18px' }}>
                Where Konn3ct processes information on behalf of an enterprise customer, the
                customer may be the data controller and Konn3ct may act as its data processor. The
                applicable enterprise agreement will govern that processing.
              </div>
            </article>

            <article id="information-we-process" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">03</span>
                <h2>Personal Information We Process</h2>
              </div>
              <p>
                Depending on the features used, the categories of personal data we process may
                include:
              </p>
              <ul className="check-list legal-list">
                <li>
                  <strong>Account information:</strong> name, email address, account identifiers and
                  organisation membership.
                </li>
                <li>
                  <strong>Authentication information:</strong> login events, security identifiers and
                  authentication records.
                </li>
                <li>
                  <strong>Communications and collaboration information:</strong> meeting metadata,
                  room identifiers, participant information and any content actually collected or
                  stored by enabled features.
                </li>
                <li>
                  <strong>Technical information:</strong> IP address, device details, browser
                  information, security logs and diagnostic information.
                </li>
                <li>
                  <strong>Customer support information:</strong> support requests, messages and
                  resolution history.
                </li>
                <li>
                  <strong>Subscription information:</strong> selected plans, transaction identifiers
                  and billing records where commercial features are authorised.
                </li>
                <li>
                  <strong>Preferences:</strong> notification settings and marketing choices.
                </li>
              </ul>
            </article>

            <article id="purposes-lawful-bases" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">04</span>
                <h2>Purposes and Lawful Bases</h2>
              </div>
              <p>We process personal data for specified purposes, including:</p>
              <ul className="check-list legal-list">
                <li>Establishing and administering user accounts.</li>
                <li>Providing requested communications and collaboration services.</li>
                <li>Authenticating users and protecting accounts.</li>
                <li>Maintaining system security, reliability and availability.</li>
                <li>Providing customer support and investigating incidents.</li>
                <li>Meeting applicable legal and regulatory obligations.</li>
                <li>
                  Sending marketing communications where a valid lawful basis exists and applicable
                  requirements are satisfied.
                </li>
              </ul>
              <p style={{ marginTop: '16px' }}>
                The lawful basis for each processing activity is documented in our internal
                Processing Register (`KV1-LGL-008`). Depending on the circumstances, this may
                include contractual necessity, legal obligation, legitimate interests or valid
                consent.
              </p>
            </article>

            <article id="sharing-service-providers" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">05</span>
                <h2>Sharing and Service Providers</h2>
              </div>
              <p>
                We may share personal data with appropriately authorised service providers that
                support infrastructure, hosting, communications, security, analytics, support and
                payment operations, as applicable.
              </p>
              <p>
                We require suitable contractual and security safeguards. We do not authorise
                third-party use of personal data for independent purposes outside the applicable
                legal and contractual arrangements.
              </p>
            </article>

            <article id="international-transfers" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">06</span>
                <h2>International Transfers</h2>
              </div>
              <p>
                If personal data is transferred outside its originating jurisdiction, we will assess
                and implement applicable legal safeguards before the transfer.
              </p>
              <p>
                The countries, recipients and transfer mechanisms are documented and made available
                as required by applicable data protection law, including the Nigeria Data Protection
                Act (NDPA).
              </p>
            </article>

            <article id="retention" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">07</span>
                <h2>Retention &amp; Deletion Schedule</h2>
              </div>
              <p>
                Personal information is retained only for as long as necessary for the relevant
                purpose and applicable legal, security or contractual requirements. Retention
                periods are governed by the Konn3ct Data Retention and Deletion Schedule
                (`KV1-LGL-007`):
              </p>
              <ul className="check-list legal-list">
                <li>Retain data only for legitimate, documented purposes.</li>
                <li>Define a lawful basis and retention trigger for each category.</li>
                <li>Limit access to retained information and apply legal holds where required.</li>
                <li>Avoid retaining personal data indefinitely without justification.</li>
                <li>
                  Verify deletion or anonymisation in relevant active systems and scheduled backup
                  lifecycle processes.
                </li>
              </ul>

              <div className="legal-table-wrap">
                <table className="legal-table">
                  <thead>
                    <tr>
                      <th>Data Category</th>
                      <th>Retention Policy</th>
                      <th>Trigger</th>
                      <th>Governance Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RETENTION_REGISTER.map(([category, period, trigger, owner]) => (
                      <tr key={category}>
                        <th>{category}</th>
                        <td>{period}</td>
                        <td>{trigger}</td>
                        <td>{owner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="legal-subbox">
                <h3>Standard Deletion Process</h3>
                <ol className="legal-steps">
                  <li>Confirm eligibility for deletion and verify request authority where applicable.</li>
                  <li>Check retention obligations and active legal holds.</li>
                  <li>Delete or anonymise eligible active-system data and notify relevant processors.</li>
                  <li>Apply approved backup expiry and restoration safeguards.</li>
                  <li>Log action completion and provide confirmation where required.</li>
                </ol>
              </div>
            </article>

            <article id="privacy-rights" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">08</span>
                <h2>Your Privacy Rights &amp; Request Procedure</h2>
              </div>
              <p>Subject to applicable law, individuals may request:</p>
              <ul className="check-list legal-list">
                <li>Access to personal data.</li>
                <li>Correction of inaccurate information.</li>
                <li>Deletion of information where legally applicable.</li>
                <li>Restriction of or objection to certain processing.</li>
                <li>Data portability where applicable.</li>
                <li>Withdrawal of consent where processing relies on consent.</li>
                <li>Information about automated decision-making, where applicable.</li>
              </ul>
              <p style={{ marginTop: '16px' }}>
                Requests can be submitted to <strong>privacy@konn3ct.com</strong>. Under our Data
                Subject Rights Request Procedure (`KV1-LGL-005`), each request is logged with a
                unique reference, verified using proportionate identity checks, assessed against
                applicable law, fulfilled within statutory deadlines, and securely communicated.
                Individuals may also lodge complaints with the appropriate supervisory authority,
                including the Nigeria Data Protection Commission (NDPC).
              </p>
            </article>

            <article id="security" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">09</span>
                <h2>Security &amp; Incident Response</h2>
              </div>
              <p>
                We maintain organisational and technical safeguards appropriate to the risks of
                processing, including access controls, secure authentication, monitoring and
                incident response.
              </p>
              <p>
                No method of electronic processing is completely risk-free. Security incidents are
                managed under our Personal Data Breach Response Procedure (`KV1-LGL-006`) across
                seven coordinated stages: Detect &amp; Report, Contain, Investigate, Assess Legal
                Risk, Notify, Recover, and Review. Where the Nigeria Data Protection Act applies, we
                evaluate qualifying breaches for notification to the Nigeria Data Protection
                Commission within the applicable 72-hour regulatory reporting window and notify
                affected individuals when required.
              </p>
            </article>

            <article id="cookies-tracking" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">10</span>
                <h2>Cookies, Tracking &amp; Consent Management</h2>
              </div>
              <p>
                Konn3ct uses, or may use, cookies and similar technologies to support platform
                functions in accordance with our Cookie &amp; Tracking Notice (`KV1-LGL-003`) and
                Consent Management Standard (`KV1-LGL-004`):
              </p>
              <div className="legal-cookie-grid">
                <div className="legal-cookie-card">
                  <strong>Strictly Necessary</strong>
                  <p>
                    Technologies required for authentication, security, session management and core
                    platform functions.
                  </p>
                </div>
                <div className="legal-cookie-card">
                  <strong>Preferences</strong>
                  <p>
                    Technologies used to remember selected user settings and interface preferences.
                  </p>
                </div>
                <div className="legal-cookie-card">
                  <strong>Analytics</strong>
                  <p>
                    Technologies used to understand platform usage and performance, where
                    implemented.
                  </p>
                </div>
                <div className="legal-cookie-card">
                  <strong>Marketing</strong>
                  <p>
                    Technologies used for advertising, attribution or campaign measurement, where
                    implemented.
                  </p>
                </div>
              </div>
              <p style={{ marginTop: '16px' }}>
                Where consent is required, non-essential technologies are not activated before
                obtaining valid, affirmative consent. Users may accept, reject or withdraw optional
                consent choices at any time without unfairly blocking unrelated services.
              </p>
            </article>

            <article id="children" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">11</span>
                <h2>Children</h2>
              </div>
              <p>
                Konn3ct accounts are intended for individuals who meet applicable age and
                legal-capacity requirements, or authorised educational and community participants
                operating under institutional oversight. Any processing involving children is
                subject to the additional safeguards and parental or institutional authorisation
                required by applicable law.
              </p>
            </article>

            <article id="changes" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">12</span>
                <h2>Changes to This Policy</h2>
              </div>
              <p>
                We may update this Privacy Policy to reflect changes in our services, operations or
                applicable law. Material changes will be communicated through the platform or
                registered contact channels where required.
              </p>
            </article>

            <article id="contact" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">13</span>
                <h2>Contact</h2>
              </div>
              <p>
                For privacy inquiries, data subject requests or questions regarding this Privacy
                Policy, please contact our Privacy &amp; Data Protection team:
              </p>
              <div className="legal-info-grid" style={{ marginTop: '14px' }}>
                <div className="legal-info-item">
                  <span>Privacy Inquiries</span>
                  <strong>privacy@konn3ct.com</strong>
                </div>
                <div className="legal-info-item">
                  <span>Registered Entity</span>
                  <strong>Newwaves Ecosystem Limited</strong>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="wrap cta-grid">
          <div>
            <h2>Questions about privacy, governance or enterprise compliance?</h2>
            <p className="sub">Our team is ready to help with your organisation’s requirements.</p>
          </div>
          <div>
            <Link className="button green" to="/contact-sales">
              Contact our team <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer onAction={onAction} />
    </main>
  )
}
