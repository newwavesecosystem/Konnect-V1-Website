// import React from 'react'
// import { useNavigate } from 'react-router-dom'
// import Brand from './Brand'
// import { routePaths, solutionMeta, solutionOrder } from '../data/metadata'

// export default function Footer() {
//   const navigate = useNavigate()
//   return (
//     <footer className="bg-[#07152F] py-14 text-slate-300">
//       <div className="container-k3">
//         <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
//           <div><button onClick={() => navigate('/')}><Brand inverse /></button><p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">Connection Freedom for people, teams, organisations and communities. AI-powered, human-governed.</p></div>
//           <div><h4 className="font-display text-sm font-extrabold text-white">Solutions</h4><div className="mt-4 grid gap-2.5">{solutionOrder.slice(0,3).map(route => <button key={route} onClick={() => navigate(routePaths[route])} className="text-left text-xs text-slate-400 hover:text-white">{solutionMeta[route].short}</button>)}</div></div>
//           <div><h4 className="font-display text-sm font-extrabold text-white">More solutions</h4><div className="mt-4 grid gap-2.5">{solutionOrder.slice(3).map(route => <button key={route} onClick={() => navigate(routePaths[route])} className="text-left text-xs text-slate-400 hover:text-white">{solutionMeta[route].short}</button>)}</div></div>
//           <div><h4 className="font-display text-sm font-extrabold text-white">Doctrine</h4><div className="mt-4 grid gap-2.5 text-xs text-slate-400"><span>Connection Freedom</span><span>Every Connection Must Count</span><span>TrustLock™</span><span>AI-powered. Human-governed.</span></div></div>
//         </div>
//         <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-[11px] text-slate-500"><span>© 2026 Konn3ct · Newwaves Ecosystem Limited</span><span>Connection Freedom by Design</span></div>
//       </div>
//     </footer>
//   )
// }


import React from 'react'
import { useNavigate } from 'react-router-dom'
import Brand from './Brand'
import { routePaths, solutionMeta, solutionOrder } from '../data/metadata'

const FacebookIcon = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13.5 22v-9h3l.45-3.5H13.5V7.25c0-1.01.28-1.7 1.74-1.7H17.1V2.42A24.8 24.8 0 0 0 14.39 2C11.7 2 9.85 3.64 9.85 6.66V9.5H6.8V13h3.05v9h3.65Z" />
  </svg>
)

const TwitterIcon = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-6.39L6.48 22H3.36l7.26-8.3L2.97 2h6.4l4.42 5.84L18.9 2Zm-1.1 17.84h1.73L8.43 4.05H6.58L17.8 19.84Z" />
  </svg>
)

const LinkedInIcon = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6.94 8.5H3.56V19.3h3.38V8.5ZM5.25 3.12A1.96 1.96 0 1 0 5.25 7a1.96 1.96 0 0 0 0-3.88ZM20.44 13.1c0-3.26-1.74-4.78-4.07-4.78-1.87 0-2.71 1.03-3.18 1.75V8.5H9.8c.04 1.04 0 10.8 0 10.8h3.39v-6.03c0-.32.02-.65.12-.88.26-.65.86-1.32 1.87-1.32 1.32 0 1.85 1 1.85 2.48v5.75h3.4l.01-6.2Z" />
  </svg>
)

const InstagramIcon = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
)

const YouTubeIcon = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.55 3.6 12 3.6 12 3.6s-7.55 0-9.4.5A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.85.5 9.4.5 9.4.5s7.55 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z" />
  </svg>
)

const socials = [
  { name: 'Facebook', icon: FacebookIcon, url: 'https://facebook.com/konn3ctapp' },
  { name: 'X', icon: TwitterIcon, url: 'https://x.com/konn3ctapp' },
  { name: 'LinkedIn', icon: LinkedInIcon, url: 'https://linkedin.com/in/konnectng' },
  { name: 'Instagram', icon: InstagramIcon, url: 'https://www.instagram.com/konn3ct_app' },
  {
    name: 'YouTube',
    icon: YouTubeIcon,
    url: 'https://www.youtube.com/channel/UC6R90Zju7mJ0_pEZ5pBMA5w',
  },
]

export default function Footer() {
  const navigate = useNavigate()

  return (
    <footer className="bg-[#07152F] py-14 text-slate-300">
      <div className="container-k3">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
          <div>
            <button
              type="button"
              onClick={() => navigate('/')}
              aria-label="Go to Konn3ct home"
            >
              <Brand inverse />
            </button>

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              Connection Freedom for people, teams, organisations and communities.
              AI-powered, human-governed.
            </p>
          </div>

                    <div>
            <h4 className="font-display text-sm font-extrabold text-white">
              Doctrine
            </h4>

            <div className="mt-4 grid gap-2.5 text-xs text-slate-400">
              <span>Connection Freedom</span>
              <span>Every Connection Must Count</span>
              <span>TrustLock™</span>
              <span>AI-powered. Human-governed.</span>
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm font-extrabold text-white">
              Solutions
            </h4>

            <div className="mt-4 grid gap-2.5">
              {solutionOrder.map((route) => (
                <button
                  key={route}
                  type="button"
                  onClick={() => navigate(routePaths[route])}
                  className="text-left text-xs text-slate-400 transition-colors hover:text-white"
                >
                  {solutionMeta[route].short}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm font-extrabold text-white">
              Contact
            </h4>

            <div className="mt-4 grid gap-3 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => navigate('/contact-sales')}
                className="text-left font-semibold text-slate-300 transition-colors hover:text-white"
              >
                Contact sales
              </button>

              <a
                href="mailto:info@konn3ct.com"
                className="break-all transition-colors hover:text-white"
              >
                info@konn3ct.com
              </a>
            </div>

            <div className="mt-7">
              <h5 className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                Connect
              </h5>

              <div className="mt-4 flex flex-wrap gap-2.5">
                {socials.map(({ name, icon: Icon, url }) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Konn3ct on ${name}`}
                    title={name}
                    className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10 hover:text-white"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>
          </div>


        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-[11px] text-slate-500">
          <span>© 2026 Konn3ct · Newwaves Ecosystem Limited</span>
          <span>Connection Freedom by Design</span>
        </div>
      </div>
    </footer>
  )
}
