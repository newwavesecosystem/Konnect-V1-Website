import React, { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Footer from '../components/Footer'
import { REGISTER_URL } from '../data/metadata'
import { trackPageView } from '../analytics/events'

const TERMS_SECTIONS = [
  { id: 'agreement', number: '01', title: 'Agreement' },
  { id: 'eligibility-accounts', number: '02', title: 'Eligibility & Accounts' },
  { id: 'services', number: '03', title: 'Services' },
  { id: 'acceptable-use', number: '04', title: 'Acceptable Use' },
  { id: 'user-content', number: '05', title: 'User Content' },
  { id: 'privacy', number: '06', title: 'Privacy' },
  { id: 'pricing-payment', number: '07', title: 'Pricing & Payment' },
  { id: 'availability-changes', number: '08', title: 'Availability & Changes' },
  { id: 'suspension-termination', number: '09', title: 'Suspension & Termination' },
  { id: 'warranties-liability', number: '10', title: 'Warranties & Liability' },
  { id: 'complaints-disputes', number: '11', title: 'Complaints & Disputes' },
  { id: 'contact-information', number: '12', title: 'Contact Information' },
]

export default function TermsOfService({ onAction }) {
  const location = useLocation()

  useEffect(() => {
    document.title = 'Terms of Service · Konn3ct'
    window.scrollTo({ top: 0 })
    trackPageView({ route: 'terms', page_path: '/terms' })
  }, [location.pathname])

  return (
    <main>
      <section className="contact-hero legal-hero">
        <div className="wrap">
          <div className="legal-top-bar">
            <div className="eyebrow" style={{ marginBottom: 0 }}>
              Service Agreement
            </div>
          </div>

          <h1>Konn3ct Terms of Service</h1>
          <p>
            These Terms govern access to and use of the Konn3ct communications and collaboration
            platform provided by Newwaves Ecosystem Limited.
          </p>
        </div>
      </section>

      <section className="section legal-section">
        <div className="wrap legal-layout">
          <aside className="legal-sidebar" aria-label="Terms of Service sections">
            <div className="legal-toc-card">
              <span className="kicker">On this page</span>
              <nav className="legal-toc-nav">
                {TERMS_SECTIONS.map((sec) => (
                  <a key={sec.id} href={`#${sec.id}`} className="legal-toc-link">
                    <span>{sec.number}</span>
                    {sec.title}
                  </a>
                ))}
              </nav>
              <div className="legal-toc-footer">
                <p>How we handle personal information:</p>
                <Link to="/privacy" className="text-link">
                  View Privacy Policy →
                </Link>
              </div>
            </div>
          </aside>

          <div className="legal-content">
            <article id="agreement" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">01</span>
                <h2>Agreement</h2>
              </div>
              <p>
                These Terms govern access to and use of the Konn3ct platform provided by{' '}
                <strong>Newwaves Ecosystem Limited</strong>, referred to as &ldquo;Konn3ct&rdquo;,
                &ldquo;we&rdquo; or &ldquo;us&rdquo;.
              </p>
              <p>
                By creating an account or using the platform, a person agrees to these Terms,
                subject to any applicable statutory consumer protections.
              </p>
              <p>
                If a separate enterprise agreement applies, the order of precedence between that
                agreement and these Terms will be governed by the signed contract.
              </p>
            </article>

            <article id="eligibility-accounts" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">02</span>
                <h2>Eligibility and Accounts</h2>
              </div>
              <p>
                Users must meet applicable age and legal-capacity requirements and provide accurate
                registration information.
              </p>
              <p>
                Users are responsible for protecting their account credentials and notifying Konn3ct
                promptly of suspected unauthorised account access.
              </p>
              <p>
                Organisations must ensure that their authorised representatives have appropriate
                authority to administer organisational accounts.
              </p>
            </article>

            <article id="services" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">03</span>
                <h2>Services</h2>
              </div>
              <p>
                Konn3ct provides the communications and collaboration features described in the
                applicable approved product documentation.
              </p>
              <p>
                Features may vary by plan, configuration, region and release stage. Service
                availability, performance commitments and support service levels apply only where
                expressly included in the relevant agreement or published service terms.
              </p>
            </article>

            <article id="acceptable-use" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">04</span>
                <h2>Acceptable Use</h2>
              </div>
              <p>Users must not:</p>
              <ul className="check-list legal-list legal-list-prohibit">
                <li>Access accounts or data without authorisation.</li>
                <li>Harass, impersonate or unlawfully monitor others.</li>
                <li>Upload or distribute unlawful or harmful content.</li>
                <li>Interfere with service security or reliability.</li>
                <li>Attempt unauthorised access, credential theft or exploitation.</li>
                <li>Use the service in violation of applicable law or the rights of others.</li>
              </ul>
            </article>

            <article id="user-content" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">05</span>
                <h2>User Content</h2>
              </div>
              <p>Users retain the rights they hold in their original content.</p>
              <p>
                Users grant Konn3ct a limited right to process their content only as necessary to
                provide the contracted service and fulfill applicable obligations.
              </p>
              <p>
                Where communications are recorded or stored, users and enterprise customers must
                comply with applicable notice and consent requirements. Detailed content ownership,
                administration, export and deletion rules are aligned with product capabilities and
                enterprise contracts.
              </p>
            </article>

            <article id="privacy" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">06</span>
                <h2>Privacy</h2>
              </div>
              <p>
                Personal data is handled under the applicable{' '}
                <Link to="/privacy" className="text-link">
                  Konn3ct Privacy Policy
                </Link>{' '}
                and, where relevant, an executed data processing agreement.
              </p>
            </article>

            <article id="pricing-payment" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">07</span>
                <h2>Pricing and Payment</h2>
              </div>
              <p>
                Any fees, taxes, billing periods, renewals, cancellation rules and refund terms are
                disclosed clearly before a customer agrees to purchase.
              </p>
              <p>
                Commercial subscriptions and live payments operate in accordance with approved
                pricing, payment terms and refund procedures.
              </p>
            </article>

            <article id="availability-changes" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">08</span>
                <h2>Availability and Changes</h2>
              </div>
              <p>
                Konn3ct may perform maintenance, security updates and service changes. Material
                service changes will be communicated in accordance with applicable contracts and
                legal obligations.
              </p>
            </article>

            <article id="suspension-termination" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">09</span>
                <h2>Suspension and Termination</h2>
              </div>
              <p>
                Accounts may be restricted or suspended where reasonably necessary to address
                security threats, contractual breaches, misuse or legal obligations.
              </p>
              <p>
                Users retain applicable statutory rights and access to required remedies.
                Termination procedures, data export arrangements and deletion timelines are
                described in the applicable agreement and{' '}
                <Link to="/privacy#retention" className="text-link">
                  privacy documentation
                </Link>
                .
              </p>
            </article>

            <article id="warranties-liability" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">10</span>
                <h2>Warranties and Liability</h2>
              </div>
              <p>
                The platform is supplied subject to applicable contractual commitments and mandatory
                law. No provision in these Terms excludes rights or protections that cannot
                lawfully be excluded under applicable consumer or data protection law.
              </p>
            </article>

            <article id="complaints-disputes" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">11</span>
                <h2>Complaints and Disputes</h2>
              </div>
              <p>
                Users may submit complaints to <strong>support@konn3ct.com</strong> or{' '}
                <strong>info@konn3ct.com</strong>.
              </p>
              <p>
                Disputes will first be handled under our complaint-resolution procedure. Applicable
                statutory rights, court jurisdiction and regulatory remedies under the laws of the
                Federal Republic of Nigeria remain unaffected.
              </p>
            </article>

            <article id="contact-information" className="legal-card">
              <div className="legal-card-head">
                <span className="legal-num">12</span>
                <h2>Contact Information</h2>
              </div>
              <div className="legal-info-grid">
                <div className="legal-info-item">
                  <span>Provider</span>
                  <strong>Newwaves Ecosystem Limited</strong>
                </div>
                <div className="legal-info-item">
                  <span>Support Inquiries</span>
                  <strong>support@konn3ct.com</strong>
                </div>
                <div className="legal-info-item">
                  <span>Legal Inquiries</span>
                  <strong>legal@konn3ct.com</strong>
                </div>
                <div className="legal-info-item">
                  <span>General Contact</span>
                  <strong>info@konn3ct.com</strong>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="wrap cta-grid">
          <div>
            <h2>Ready to connect on your terms?</h2>
            <p className="sub">Seven-day trial. No credit card required.</p>
          </div>
          <div>
            <a className="button green" href={REGISTER_URL}>
              Start 7-day trial <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>

      <Footer onAction={onAction} />
    </main>
  )
}
