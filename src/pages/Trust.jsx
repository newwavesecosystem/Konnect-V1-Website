import React, { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Footer from '../components/Footer'
import { trackPageView } from '../analytics/events'

export const INFO_PAGES = {
  trust: {
    eyebrow: 'Trust & controls',
    title: (
      <>
        Freedom needs
        <br />
        <em>understandable controls.</em>
      </>
    ),
    docTitle: 'Trust & controls · Konn3ct',
    intro:
      'Know who can join, who hosts, what may be recorded and how authorised material is shared.',
    items: [
      [
        'Joining & access',
        'Share invitations with the intended audience and make the joining route clear.',
      ],
      [
        'Host responsibilities',
        'Agree who admits participants, manages contribution and handles session settings.',
      ],
      [
        'Recording choices',
        'Explain when recording is enabled, who authorises it and who may access the result.',
      ],
      [
        'Organisation requirements',
        'Confirm the released TrustLock controls and any contractual deployment requirements.',
      ],
    ],
  },
  recordings: {
    eyebrow: 'Recording & sharing',
    title: (
      <>
        Keep the value.
        <br />
        <em>Respect the people.</em>
      </>
    ),
    docTitle: 'Recording & sharing · Konn3ct',
    intro: 'Make recording and sharing choices clear before the conversation begins.',
    items: [
      [
        'Before recording',
        'Confirm that recording is available in your plan and that the required notice and permissions are in place.',
      ],
      [
        'During the session',
        'Explain recording choices to participants and follow the host’s responsibilities.',
      ],
      [
        'After the meeting',
        'Share or download material only through the authorised workflow and with the intended audience.',
      ],
      [
        'Access & retention',
        'Check the applicable plan, privacy policy and organisational retention requirements.',
      ],
    ],
  },
  help: {
    eyebrow: 'Help & joining',
    title: (
      <>
        Your next useful
        <br />
        <em>conversation starts here.</em>
      </>
    ),
    docTitle: 'Help & joining · Konn3ct',
    intro: 'Prepare your device, follow your invitation and keep help within reach.',
    items: [
      [
        'Open your invitation',
        'Use the meeting link provided by your host. Check that you are joining the intended session.',
      ],
      [
        'Check your device',
        'Use a supported browser and device. Review microphone and camera permissions when prompted.',
      ],
      [
        'Wait for admission',
        'If the host requires admission, remain on the joining screen and contact the organiser if needed.',
      ],
      [
        'Recover your connection',
        'Follow the connection guidance shown in the meeting. If you cannot rejoin, ask the host for help.',
      ],
    ],
  },
}

export default function Trust({ pageKey = 'trust', onAction }) {
  const location = useLocation()
  const cfg = INFO_PAGES[pageKey] || INFO_PAGES.trust

  useEffect(() => {
    document.title = cfg.docTitle
    window.scrollTo({ top: 0 })
    trackPageView({ route: pageKey, page_path: location.pathname })
  }, [cfg.docTitle, pageKey, location.pathname])

  return (
    <>
      <main id="main">
        <section className="inner-head">
          <div className="wrap">
            <div className="eyebrow">{cfg.eyebrow}</div>
            <h1>{cfg.title}</h1>
            <p>{cfg.intro}</p>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="grid2 trust-info-grid">
              {cfg.items.map(([heading, copy], i) => (
                <article className="benefit" key={heading}>
                  <span className="num">0{i + 1}</span>
                  <h2>{heading}</h2>
                  <p>{copy}</p>
                </article>
              ))}
            </div>

            <div className="enterprise-panel">
              <div>
                <h2>Keep help close.</h2>
                <p>
                  Support contact published on the current Terms page:{' '}
                  <a href="mailto:support@konn3ct.com">support@konn3ct.com</a>
                </p>
                <p>
                  Privacy queries: <a href="mailto:privacy@konn3ct.com">privacy@konn3ct.com</a>
                </p>
              </div>
              <Link className="button" to="/contact-sales">
                Talk to our team <span aria-hidden="true">↗</span>
              </Link>
            </div>

            <div className="hero-actions">
              <Link className="button outline" to="/privacy">
                Privacy Policy <span aria-hidden="true">↗</span>
              </Link>
              <Link className="button outline" to="/terms">
                Terms of Service <span aria-hidden="true">↗</span>
              </Link>
              <Link className="button outline" to="/recordings">
                Recording &amp; sharing <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer onAction={onAction} />
    </>
  )
}
