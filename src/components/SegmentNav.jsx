import React from 'react'
import { useNavigate } from 'react-router-dom'
import { routePaths, solutionMeta } from '../data/metadata'

export default function SegmentNav({ route, links = [] }) {
  const navigate = useNavigate()
  if (route === 'home') return null

  const jump = (anchor) => {
    const el = document.getElementById(anchor)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="sticky top-[78px] z-40 bg-brand-navy text-white shadow-sm">
      <div className="container-k3 flex h-12 items-center gap-4 overflow-hidden">
        <div className="hidden shrink-0 items-center gap-2 text-[11px] text-slate-400 md:flex">
          <button onClick={() => navigate(routePaths.home)} className="hover:text-white">Home</button><span>›</span><span>Solutions</span><span>›</span><strong className="text-white">{solutionMeta[route].short}</strong>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:justify-end">
          {links.map(link => (
            <button key={link.anchor} onClick={() => jump(link.anchor)} className="shrink-0 rounded-lg px-2.5 py-2 text-[10.5px] font-extrabold text-slate-300 transition hover:bg-white/10 hover:text-white" dangerouslySetInnerHTML={{ __html: link.label }} />
          ))}
        </div>
      </div>
    </div>
  )
}
