import React from 'react'
import { CheckIcon, ShieldIcon, UsersIcon, WifiIcon } from './Icons'

export default function MediaPlaceholder({ variant = 'meeting', dark = false, label = 'Visual placeholder' }) {
  const shell = dark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
  return (
    <div className={`relative min-h-[340px] overflow-hidden rounded-[28px] border p-4 shadow-float ${shell}`}>
      <div className={`absolute inset-0 ${dark ? 'bg-[radial-gradient(circle_at_80%_10%,rgba(34,116,81,.35),transparent_28%)]' : 'bg-[radial-gradient(circle_at_80%_10%,rgba(132,193,255,.42),transparent_30%)]'}`} />
      <div className="relative flex h-full min-h-[308px] flex-col rounded-[22px] bg-brand-navy p-3 text-white">
        <div className="mb-3 flex items-center justify-between px-1 text-[10px] font-bold text-slate-300">
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-brand-green" /> Konn3ct live</span>
          <span>{label}</span>
        </div>
        <div className="grid flex-1 grid-cols-[1.35fr_.65fr] gap-2.5">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-blue to-[#0f4eb8] p-5">
            <div className="absolute -right-12 -top-10 h-40 w-40 rounded-full border border-white/15" />
            <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white p-4 text-brand-navy shadow-xl">
              <div className="mb-3 h-2.5 w-2/5 rounded bg-brand-blue" />
              <div className="space-y-2"><div className="h-2 rounded bg-slate-200"/><div className="h-2 w-4/5 rounded bg-slate-200"/><div className="h-2 w-3/5 rounded bg-slate-200"/></div>
              <div className="mt-4 grid grid-cols-3 gap-2"><div className="h-12 rounded-lg bg-brand-blueTint"/><div className="h-12 rounded-lg bg-brand-greenTint"/><div className="h-12 rounded-lg bg-slate-100"/></div>
            </div>
          </div>
          <div className="grid gap-2.5">
            {[UsersIcon, ShieldIcon, WifiIcon].map((Icon, i) => (
              <div key={i} className="grid place-items-center rounded-2xl bg-white/10 text-white/90">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-white/10"><Icon className="h-5 w-5" /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          {[0,1,2,3,4].map(i => <span key={i} className={`h-8 w-8 rounded-xl ${i === 4 ? 'bg-red-500/80' : 'bg-white/10'}`} />)}
        </div>
      </div>
      <div className={`absolute bottom-8 -left-1 hidden rounded-2xl border px-4 py-3 shadow-soft sm:block ${dark ? 'border-white/10 bg-brand-navy text-white' : 'border-slate-200 bg-white text-brand-navy'}`}>
        <div className="flex items-center gap-2 text-xs font-extrabold"><CheckIcon className="h-4 w-4 text-brand-green" /> Connection protected</div>
      </div>
    </div>
  )
}
