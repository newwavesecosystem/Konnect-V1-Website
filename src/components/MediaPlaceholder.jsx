import React from 'react'

function Silhouette({ skin, shirt, hair }) {
  return (
    <svg viewBox="0 0 180 160" aria-hidden="true">
      <path d="M25 160c1-57 31-66 65-66s64 9 65 66" fill={shirt} />
      <rect x="75" y="80" width="30" height="30" rx="12" fill={skin} />
      <ellipse cx="90" cy="56" rx="31" ry="39" fill={skin} />
      <path
        d="M59 50C49 8 70 1 92 3c29-3 41 24 30 53-4-22-11-29-14-32-8 13-23 15-49 16Z"
        fill={hair}
      />
      <circle cx="80" cy="56" r="2" fill="#222" />
      <circle cx="101" cy="56" r="2" fill="#222" />
      <path
        d="M81 73q10 8 20-1"
        fill="none"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MeetingPreview() {
  const participants = [
    ['Ada · Host', '#985e43', '#faf7ee', '#2b211f'],
    ['Tunde', '#64422f', '#153956', '#1a181c'],
    ['Amina', '#ba8166', '#6c4572', '#27232a'],
    ['David', '#754c38', '#b38246', '#201b1a'],
  ]

  return (
    <div className="meeting">
      <div className="meeting-head">
        <strong>Konn3ct</strong>
        <span>ILLUSTRATIVE MEETING</span>
      </div>
      <div className="video-grid">
        {participants.map(([name, skin, shirt, hair], i) => (
          <div className="person" key={name}>
            <Silhouette skin={skin} shirt={shirt} hair={hair} />
            <b>{name}</b>
            {i === 0 && <span className="host">HOST</span>}
          </div>
        ))}
      </div>
      <div className="meeting-bottom">
        <span>♩</span>
        <span>▣</span>
        <span>▤</span>
        <span>↥</span>
        <span className="end">⌁</span>
      </div>
    </div>
  )
}

const waveHeights = [12, 20, 34, 47, 31, 62, 45, 28, 49, 67, 40, 26, 55, 36, 20, 42, 25, 13]

export default function MediaPlaceholder({ variant = 'home', type }) {
  const rawType = type || variant || 'home'
  const visualType =
    rawType === 'corporates'
      ? 'business'
      : rawType === 'events-community'
      ? 'events'
      : rawType

  return (
    <div className="hero-visual">
      {(visualType === 'home' || visualType === 'business' || visualType === 'meeting') && (
        <>
          <MeetingPreview />
          <div className="floating one">
            <strong>
              <span className="check-dot">✓</span>Start with a conversation
            </strong>
            Meet · share · agree next steps
          </div>
          <div className="floating two">
            <strong>Connection Freedom</strong>
            People first. Clear controls.
          </div>
        </>
      )}

      {visualType === 'government' && (
        <div className="session-preview">
          <div className="board-label">ILLUSTRATIVE BRIEFING WORKFLOW</div>
          <div className="institution-stamp">⌂</div>
          <h3>
            Inter-agency
            <br />
            coordination briefing
          </h3>
          <p style={{ fontSize: '11px' }}>One agenda. Clear responsibilities.</p>
          <div className="board-row">
            <div>
              <strong>Session agenda</strong>
              <small>Welcome · discussion · next steps</small>
            </div>
            <span className="badge blue">Prepared</span>
          </div>
          <div className="board-row">
            <div>
              <strong>Host responsibilities</strong>
              <small>Access · participation · recording</small>
            </div>
            <span className="badge">Defined</span>
          </div>
          <div className="board-row">
            <div>
              <strong>Authorised follow-up</strong>
              <small>Files and recording permissions</small>
            </div>
            <span>↗</span>
          </div>
        </div>
      )}

      {visualType === 'associations' && (
        <div className="session-preview">
          <div className="session-banner">
            <span className="tiny">ILLUSTRATIVE MEMBER SESSION</span>
            <h3>
              Knowledge shared.
              <br />
              Members connected.
            </h3>
            <p>Professional learning · Supported pilot</p>
          </div>
          <div className="board-header">
            <div>
              <div className="board-label">Your first session</div>
              <h3 style={{ fontSize: '19px' }}>Member training pilot</h3>
            </div>
            <div className="avatar-stack">
              <span>AK</span>
              <span>TO</span>
              <span>AM</span>
            </div>
          </div>
          <div className="timeline-line">
            <div>
              <strong>Agree the outcome</strong>
              <small>Audience, format and host preparation</small>
            </div>
            <div>
              <strong>Run the session</strong>
              <small>Guided joining and participation</small>
            </div>
            <div>
              <strong>Review and decide</strong>
              <small>Experience review and purchasing proposal</small>
            </div>
          </div>
          <span className="badge">Supported 7-day trial</span>
        </div>
      )}

      {visualType === 'education' && (
        <>
          <div className="lesson">
            <div className="lesson-top">
              <strong>Konn3ct · Learning session</strong>
              <span>ILLUSTRATIVE</span>
            </div>
            <div className="lesson-canvas">
              <div className="board-label">A shared place to learn</div>
              <h3>
                Big ideas start
                <br />
                with a conversation.
              </h3>
              <div className="formula">
                <span>Ask</span>
                <b>→</b>
                <span>Discuss</span>
                <b>→</b>
                <span>Learn</span>
              </div>
            </div>
            <div className="lesson-bottom">
              <span>Audio · Video · Chat</span>
              <span className="badge">Host-led session</span>
            </div>
          </div>
          <div className="floating one">
            <strong>Live class → authorised recording</strong>
            A clearer journey, beyond the session.
          </div>
        </>
      )}

      {visualType === 'faith' && (
        <div className="session-preview">
          <div className="board-label">ILLUSTRATIVE GATHERING WORKFLOW</div>
          <span style={{ color: '#227451', fontSize: '35px' }}>♧</span>
          <h3>
            Closer in fellowship.
            <br />
            Wherever you join.
          </h3>
          <div className="audio-wave">
            {waveHeights.map((h, i) => (
              <i key={i} style={{ '--h': `${h}px` }} />
            ))}
          </div>
          <div className="board-row">
            <div>
              <strong>Welcome your community</strong>
              <small>Clear joining guidance</small>
            </div>
            <span>01</span>
          </div>
          <div className="board-row">
            <div>
              <strong>Make recording choices clear</strong>
              <small>Host responsibilities and permissions</small>
            </div>
            <span>02</span>
          </div>
          <div className="board-row">
            <div>
              <strong>Share with care</strong>
              <small>Authorised follow-up material</small>
            </div>
            <span>03</span>
          </div>
        </div>
      )}

      {visualType === 'events' && (
        <div className="session-preview">
          <div className="board-label">ILLUSTRATIVE EVENT RUN SHEET</div>
          <h3>
            A gathering with
            <br />
            a clear plan.
          </h3>
          <div className="schedule">
            {[
              ['Before', 'Scope & rehearsal', 'Format, audience and support'],
              ['Live', 'Host & participate', 'Joining and contribution'],
              ['After', 'Share & reconnect', 'Authorised recordings and follow-up'],
            ].map(([badge, title, subtitle], i) => (
              <div className="board-row" key={badge}>
                <span className={`badge ${i === 1 ? 'blue' : ''}`}>{badge}</span>
                <div>
                  <strong>{title}</strong>
                  <small>{subtitle}</small>
                </div>
                <span>↗</span>
              </div>
            ))}
          </div>
          <div className="callout">
            Audience requirements are assessed before capacity is confirmed.
          </div>
        </div>
      )}

      <span className="concept-label">Interface concept · not a product screenshot</span>
    </div>
  )
}
