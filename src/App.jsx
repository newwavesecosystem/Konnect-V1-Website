import React, { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Header from './components/Header'
import SegmentNav from './components/SegmentNav'
import Hero from './components/Hero'
import SectionRenderer from './components/Sections'
import Footer from './components/Footer'
import siteContent from './data/siteContent.json'
import subnav from './data/subnav.json'
import { REGISTER_URL, routePaths, solutionMeta, solutionOrder } from './data/metadata'
import ContactSales from './pages/ContactSales'
import { captureUtmParameters } from './services/leadService'
import { trackPageView } from './analytics/events'

const pathToRoute = Object.fromEntries(Object.entries(routePaths).map(([route, path]) => [path, route]))

function RoutePage({ route, onToast }) {
  const page = siteContent[route]
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = page.documentTitle || 'Konn3ct'
    captureUtmParameters(location.search)
    trackPageView({ route, page_path: location.pathname })
    if (location.state?.anchor) {
      const anchor = location.state.anchor
      setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    } else {
      window.scrollTo({ top: 0 })
    }
  }, [route, page.documentTitle, location.state, location.search, location.pathname])

  const primaryAction = () => {
    if (route === 'home') {
      window.location.href = REGISTER_URL
      return
    }
    const id = document.getElementById('demo') ? 'demo' : document.getElementById('cta') ? 'cta' : page.sections.at(-1)?.id
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <SegmentNav route={route} links={subnav[route] || []} />
      <Hero route={route} hero={page.hero} onPrimary={primaryAction} onSecondary={() => route === 'home' ? navigate('/contact-sales') : document.getElementById('capabilities')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
      {route === 'home' ? (
        <section className="border-y border-brand-line bg-white">
          <div className="container-k3 grid gap-px overflow-hidden sm:grid-cols-2 lg:grid-cols-6">
            {solutionOrder.map((key, i) => (
              <div key={key} className="flex min-h-[94px] items-center gap-3 border-brand-line px-4 py-5 lg:border-r lg:last:border-r-0">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[11px] font-extrabold ${i % 2 ? 'bg-brand-greenTint text-brand-green' : 'bg-brand-blueTint text-brand-blue'}`}>0{i+1}</span>
                <span className="text-xs font-extrabold leading-5 text-brand-navy">{solutionMeta[key].short}</span>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="border-y border-brand-line bg-white">
          <div className="container-k3 flex flex-wrap items-center justify-between gap-4 py-5">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand-green">Designed for</p><p className="mt-1 font-display text-sm font-extrabold text-brand-navy">{solutionMeta[route].label}</p></div>
            <div className="flex flex-wrap gap-2"><span className="rounded-full bg-brand-blueTint px-3 py-2 text-[10px] font-extrabold text-brand-blue">Connection Freedom</span><span className="rounded-full bg-brand-greenTint px-3 py-2 text-[10px] font-extrabold text-brand-green">TrustLock™</span><span className="rounded-full bg-slate-100 px-3 py-2 text-[10px] font-extrabold text-slate-600">Mobile + desktop</span><span className="rounded-full bg-slate-100 px-3 py-2 text-[10px] font-extrabold text-slate-600">Low-bandwidth ready</span></div>
          </div>
        </section>
      )}
      <main>
        {page.sections.map((section, index) => (
          <SectionRenderer key={`${section.id}-${index}`} section={section} index={index} isLast={index === page.sections.length - 1} form={page.form} route={route} onToast={onToast} />
        ))}
      </main>
      <Footer />
    </>
  )
}

function SiteShell() {
  const [toast, setToast] = useState('')
  const location = useLocation()
  const route = pathToRoute[location.pathname] || 'home'

  const showToast = (message) => {
    setToast(message)
    window.clearTimeout(window.__k3Toast)
    window.__k3Toast = window.setTimeout(() => setToast(''), 2200)
  }

  return (
    <div className="min-h-screen bg-white text-brand-ink">
      <Header onToast={showToast} />
      <Routes>
        <Route path="/" element={<RoutePage route="home" onToast={showToast} />} />
        <Route path="/government" element={<RoutePage route="government" onToast={showToast} />} />
        <Route path="/associations" element={<RoutePage route="associations" onToast={showToast} />} />
        <Route path="/education" element={<RoutePage route="education" onToast={showToast} />} />
        <Route path="/faith" element={<RoutePage route="faith" onToast={showToast} />} />
        <Route path="/corporates" element={<RoutePage route="corporates" onToast={showToast} />} />
        <Route path="/events-community" element={<RoutePage route="events-community" onToast={showToast} />} />
        <Route path="/contact-sales" element={<ContactSales onToast={showToast} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <div className={`fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-brand-navy px-4 py-3 text-xs font-extrabold text-white shadow-float transition-all ${toast ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}>{toast}</div>
    </div>
  )
}

export default function App() {
  return <SiteShell />
}




// import React, { useEffect, useMemo, useState } from 'react'
// import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
// import Header from './components/Header'
// import SegmentNav from './components/SegmentNav'
// import Hero from './components/Hero'
// import SectionRenderer from './components/Sections'
// import Footer from './components/Footer'
// import siteContent from './data/siteContent.json'
// import subnav from './data/subnav.json'
// import { routePaths, solutionMeta, solutionOrder } from './data/metadata'

// const pathToRoute = Object.fromEntries(Object.entries(routePaths).map(([route, path]) => [path, route]))

// function RoutePage({ route, onToast }) {
//   const page = siteContent[route]
//   const location = useLocation()

//   useEffect(() => {
//     document.title = page.documentTitle || 'Konn3ct'
//     if (location.state?.anchor) {
//       const anchor = location.state.anchor
//       setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
//     } else {
//       window.scrollTo({ top: 0 })
//     }
//   }, [route, page.documentTitle, location.state, location.search, location.pathname])

//   const primaryAction = () => {
//     const id = route === 'home' ? 'pricing' : (document.getElementById('demo') ? 'demo' : document.getElementById('cta') ? 'cta' : page.sections.at(-1)?.id)
//     document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
//   }

//   return (
//     <>
//       <SegmentNav route={route} links={subnav[route] || []} />
//       <Hero route={route} hero={page.hero} onPrimary={primaryAction} />
//       {route === 'home' ? (
//         <section className="border-y border-brand-line bg-white">
//           <div className="container-k3 grid gap-px overflow-hidden sm:grid-cols-2 lg:grid-cols-6">
//             {solutionOrder.map((key, i) => (
//               <div key={key} className="flex min-h-[94px] items-center gap-3 border-brand-line px-4 py-5 lg:border-r lg:last:border-r-0">
//                 <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[11px] font-extrabold ${i % 2 ? 'bg-brand-greenTint text-brand-green' : 'bg-brand-blueTint text-brand-blue'}`}>0{i+1}</span>
//                 <span className="text-xs font-extrabold leading-5 text-brand-navy">{solutionMeta[key].short}</span>
//               </div>
//             ))}
//           </div>
//         </section>
//       ) : (
//         <section className="border-y border-brand-line bg-white">
//           <div className="container-k3 flex flex-wrap items-center justify-between gap-4 py-5">
//             <div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand-green">Designed for</p><p className="mt-1 font-display text-sm font-extrabold text-brand-navy">{solutionMeta[route].label}</p></div>
//             <div className="flex flex-wrap gap-2"><span className="rounded-full bg-brand-blueTint px-3 py-2 text-[10px] font-extrabold text-brand-blue">Connection Freedom</span><span className="rounded-full bg-brand-greenTint px-3 py-2 text-[10px] font-extrabold text-brand-green">TrustLock™</span><span className="rounded-full bg-slate-100 px-3 py-2 text-[10px] font-extrabold text-slate-600">Mobile + desktop</span><span className="rounded-full bg-slate-100 px-3 py-2 text-[10px] font-extrabold text-slate-600">Low-bandwidth ready</span></div>
//           </div>
//         </section>
//       )}
//       <main>
//         {page.sections.map((section, index) => (
//           <SectionRenderer key={`${section.id}-${index}`} section={section} index={index} isLast={index === page.sections.length - 1} form={page.form} route={route} onToast={onToast} />
//         ))}
//       </main>
//       <Footer />
//     </>
//   )
// }

// function SiteShell() {
//   const [toast, setToast] = useState('')
//   const location = useLocation()
//   const route = pathToRoute[location.pathname] || 'home'

//   const showToast = (message) => {
//     setToast(message)
//     window.clearTimeout(window.__k3Toast)
//     window.__k3Toast = window.setTimeout(() => setToast(''), 2200)
//   }

//   return (
//     <div className="min-h-screen bg-white text-brand-ink">
//       <Header onToast={showToast} />
//       <Routes>
//         <Route path="/" element={<RoutePage route="home" onToast={showToast} />} />
//         <Route path="/government" element={<RoutePage route="government" onToast={showToast} />} />
//         <Route path="/associations" element={<RoutePage route="associations" onToast={showToast} />} />
//         <Route path="/education" element={<RoutePage route="education" onToast={showToast} />} />
//         <Route path="/faith" element={<RoutePage route="faith" onToast={showToast} />} />
//         <Route path="/corporates" element={<RoutePage route="corporates" onToast={showToast} />} />
//         <Route path="/events-community" element={<RoutePage route="events-community" onToast={showToast} />} />
//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>
//       <div className={`fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-brand-navy px-4 py-3 text-xs font-extrabold text-white shadow-float transition-all ${toast ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}>{toast}</div>
//     </div>
//   )
// }

// export default function App() {
//   return <SiteShell />
// }
