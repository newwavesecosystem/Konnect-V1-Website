import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Brand from './Brand'
import { ChevronDown, CloseIcon, MenuIcon } from './Icons'
import { LOGIN_URL, REGISTER_URL, routePaths, solutionMeta, solutionOrder } from '../data/metadata'

function navToAnchor(navigate, location, anchor) {
  if (location.pathname !== '/') {
    navigate('/', { state: { anchor } })
    return
  }
  requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

export default function Header({ onToast }) {
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const megaRef = useRef(null)

  useEffect(() => {
    const close = (event) => {
      if (megaRef.current && !megaRef.current.contains(event.target)) setMegaOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => setMobileOpen(false), [location.pathname])

  const goRoute = (route) => {
    setMegaOpen(false)
    setMobileOpen(false)
    navigate(routePaths[route])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const topLinks = [
    ['Product', 'product'],
    ['Connection Freedom', 'freedoms'],
    ['Pricing', 'pricing'],
    ['Trust', 'trust'],
  ]

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-brand-line/90 bg-white/95 backdrop-blur-xl">
        <div className="container-k3 flex h-[78px] items-center gap-4 lg:gap-6">
          <button onClick={() => goRoute('home')} className="shrink-0 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-blue/10" aria-label="Konn3ct home">
            <Brand />
          </button>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {topLinks.slice(0, 2).map(([label, anchor]) => (
              <button key={anchor} onClick={() => navToAnchor(navigate, location, anchor)} className="rounded-lg px-3 py-2.5 text-[13px] font-extrabold text-brand-navy transition hover:bg-brand-blueTint hover:text-brand-blue">
                {label}
              </button>
            ))}
            <div className="relative" ref={megaRef}>
              <button onClick={() => setMegaOpen(v => !v)} className={`flex items-center gap-1 rounded-lg px-3 py-2.5 text-[13px] font-extrabold transition ${location.pathname !== '/' || megaOpen ? 'bg-brand-blueTint text-brand-blue' : 'text-brand-navy hover:bg-brand-blueTint hover:text-brand-blue'}`}>
                Solutions <ChevronDown className={`h-3.5 w-3.5 transition ${megaOpen ? 'rotate-180' : ''}`} />
              </button>
              {megaOpen && (
                <div className="absolute left-1/2 top-[50px] w-[760px] max-w-[82vw] -translate-x-1/3 rounded-[22px] border border-brand-line bg-white p-3 shadow-float">
                  <div className="mb-2 flex items-center justify-between border-b border-brand-line px-2 pb-3 pt-1">
                    <div>
                      <p className="font-display text-sm font-extrabold text-brand-navy">Solutions for every way people gather</p>
                      <p className="mt-1 text-[11px] text-slate-500">One Konn3ct experience, adapted to each mission.</p>
                    </div>
                    <button onClick={() => navToAnchor(navigate, location, 'solutions')} className="text-xs font-extrabold text-brand-blue">View all solutions</button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {solutionOrder.map(route => (
                      <button key={route} onClick={() => goRoute(route)} className="group flex gap-3 rounded-xl p-3 text-left transition hover:bg-brand-cloud">
                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-green shadow-[0_0_0_5px_#EAF6EF]" />
                        <span>
                          <strong className="block text-xs font-extrabold text-brand-navy group-hover:text-brand-blue">{solutionMeta[route].label}</strong>
                          <small className="mt-1 block text-[10.5px] leading-4 text-slate-500">{solutionMeta[route].description}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {topLinks.slice(2).map(([label, anchor]) => (
              <button key={anchor} onClick={() => navToAnchor(navigate, location, anchor)} className="rounded-lg px-3 py-2.5 text-[13px] font-extrabold text-brand-navy transition hover:bg-brand-blueTint hover:text-brand-blue">
                {label}
              </button>
            ))}
          </nav>

          <div className="flex-1" />
          <a href={LOGIN_URL} className="hidden px-2 py-2 text-[13px] font-extrabold text-brand-navy lg:block">Log in</a>
          <a href={REGISTER_URL} className="btn-primary min-h-[42px] px-4">Start free</a>
          <button onClick={() => setMobileOpen(v => !v)} className="grid h-10 w-10 place-items-center rounded-xl border border-brand-line text-brand-navy lg:hidden" aria-label="Open menu">
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-x-0 bottom-0 top-[78px] z-50 overflow-y-auto bg-white px-5 py-5 lg:hidden">
          <div className="mx-auto max-w-xl">
            <div className="grid">
              <button onClick={() => goRoute('home')} className="border-b border-brand-line py-4 text-left font-extrabold text-brand-navy">Home</button>
              {topLinks.map(([label, anchor]) => (
                <button key={anchor} onClick={() => { setMobileOpen(false); navToAnchor(navigate, location, anchor) }} className="border-b border-brand-line py-4 text-left font-extrabold text-brand-navy">{label}</button>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-brand-cloud p-3">
              <p className="px-2 pb-2 font-display text-sm font-extrabold text-brand-navy">Solutions</p>
              {solutionOrder.map(route => (
                <button key={route} onClick={() => goRoute(route)} className="flex w-full gap-3 rounded-xl p-3 text-left hover:bg-white">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-green" />
                  <span><strong className="block text-xs font-extrabold text-brand-navy">{solutionMeta[route].label}</strong><small className="mt-1 block text-[10.5px] leading-4 text-slate-500">{solutionMeta[route].description}</small></span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
