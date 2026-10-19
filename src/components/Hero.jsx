import React from 'react'
import { ArrowRight, CheckIcon } from './Icons'
import MediaPlaceholder from './MediaPlaceholder'
import { solutionMeta } from '../data/metadata'

export default function Hero({ route, hero, onPrimary, onSecondary }) {
  const meta = solutionMeta[route]
  const actions = hero.actions?.length ? hero.actions : [route === 'home' ? 'Start free' : 'Request a demo', 'Explore Konn3ct']
  return (
    <section id="home" className="relative overflow-hidden bg-[linear-gradient(180deg,#fff_0%,#F7FAFF_75%,#fff_100%)] py-16 sm:py-20 lg:py-24">
      <div className="pointer-events-none absolute -right-40 top-6 h-[520px] w-[520px] rounded-full border border-brand-blue/5 shadow-[0_0_0_80px_rgba(0,40,130,.018),0_0_0_160px_rgba(34,116,81,.016)]" />
      <div className="container-k3 relative grid items-center gap-12 lg:grid-cols-[1.02fr_.98fr] lg:gap-16">
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-blueTint px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-brand-blue">{hero.eyebrow || meta.eyebrow}</span>
            <span className="rounded-full border border-brand-line bg-white px-3 py-2 text-[11px] font-extrabold text-brand-navy">AI powered · Human governed</span>
          </div>
          <h1 className="max-w-[780px] font-display text-[44px] font-extrabold leading-[1.01] tracking-[-0.05em] text-brand-navy sm:text-[58px] lg:text-[74px]">
            {hero.title}
          </h1>
          <p className="mt-6 max-w-[690px] text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9">{hero.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => onPrimary(actions[0])} className="btn-primary min-h-[54px] gap-2 px-6">{actions[0]} <ArrowRight className="h-4 w-4" /></button>
            {actions[1] && <button onClick={onSecondary || (() => document.getElementById(route === 'home' ? 'product' : 'capabilities')?.scrollIntoView({ behavior: 'smooth' }))} className="btn-secondary min-h-[54px] px-6">{actions[1]}</button>}
          </div>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3">
            {(hero.proof?.length ? hero.proof : ['Low-bandwidth ready', 'Mobile & desktop', 'TrustLock™ controls']).slice(0,4).map((p, i) => (
              <span key={i} className="inline-flex items-center gap-2 text-xs font-bold text-slate-600"><span className="grid h-5 w-5 place-items-center rounded-full bg-brand-greenTint text-brand-green"><CheckIcon className="h-3.5 w-3.5" /></span>{p.replace(/^✓\s*/, '')}</span>
            ))}
          </div>
        </div>
        <MediaPlaceholder variant={route} label={meta.short} />
      </div>
    </section>
  )
}






// import React from 'react'
// import { ArrowRight, CheckIcon } from './Icons'
// import MediaPlaceholder from './MediaPlaceholder'
// import { solutionMeta } from '../data/metadata'

// export default function Hero({ route, hero, onPrimary }) {
//   const meta = solutionMeta[route]
//   const actions = hero.actions?.length ? hero.actions : [route === 'home' ? 'Start free' : 'Request a demo', 'Explore Konn3ct']
//   return (
//     <section id="home" className="relative overflow-hidden bg-[linear-gradient(180deg,#fff_0%,#F7FAFF_75%,#fff_100%)] py-16 sm:py-20 lg:py-24">
//       <div className="pointer-events-none absolute -right-40 top-6 h-[520px] w-[520px] rounded-full border border-brand-blue/5 shadow-[0_0_0_80px_rgba(0,40,130,.018),0_0_0_160px_rgba(34,116,81,.016)]" />
//       <div className="container-k3 relative grid items-center gap-12 lg:grid-cols-[1.02fr_.98fr] lg:gap-16">
//         <div>
//           <div className="mb-5 flex flex-wrap items-center gap-2">
//             <span className="rounded-full bg-brand-blueTint px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-brand-blue">{hero.eyebrow || meta.eyebrow}</span>
//             <span className="rounded-full border border-brand-line bg-white px-3 py-2 text-[11px] font-extrabold text-brand-navy">AI-powered · Human-governed</span>
//           </div>
//           <h1 className="max-w-[780px] font-display text-[44px] font-extrabold leading-[1.01] tracking-[-0.05em] text-brand-navy sm:text-[58px] lg:text-[74px]">
//             {hero.title}
//           </h1>
//           <p className="mt-6 max-w-[690px] text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9">{hero.description}</p>
//           <div className="mt-8 flex flex-wrap gap-3">
//             <button onClick={() => onPrimary(actions[0])} className="btn-primary min-h-[54px] gap-2 px-6">{actions[0]} <ArrowRight className="h-4 w-4" /></button>
//             {actions[1] && <button onClick={() => document.getElementById(route === 'home' ? 'product' : 'capabilities')?.scrollIntoView({ behavior: 'smooth' })} className="btn-secondary min-h-[54px] px-6">{actions[1]}</button>}
//           </div>
//           <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3">
//             {(hero.proof?.length ? hero.proof : ['Low-bandwidth ready', 'Mobile & desktop', 'TrustLock™ controls']).slice(0,4).map((p, i) => (
//               <span key={i} className="inline-flex items-center gap-2 text-xs font-bold text-slate-600"><span className="grid h-5 w-5 place-items-center rounded-full bg-brand-greenTint text-brand-green"><CheckIcon className="h-3.5 w-3.5" /></span>{p.replace(/^✓\s*/, '')}</span>
//             ))}
//           </div>
//         </div>
//         <MediaPlaceholder variant={route} label={meta.short} />
//       </div>
//     </section>
//   )
// }
