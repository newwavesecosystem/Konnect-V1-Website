import React, { useEffect, useMemo, useState } from 'react'
import Footer from '../components/Footer'
import { ArrowRight, CheckIcon, DeviceIcon, GlobeIcon, ShieldIcon, SparkIcon, UsersIcon, WifiIcon } from '../components/Icons'

const featureOptions = [
  'Meetings & team collaboration',
  'Webinars & large events',
  'Training, learning & enablement',
  'AI meeting intelligence & productivity',
  'TrustLock™ governance & administration',
  'Low-bandwidth & mobile resilience',
  'Recording, replay & knowledge',
  'Community, member & customer engagement',
]

const featureCards = [
  {
    title: 'Meetings & collaboration',
    description: 'Run secure team, executive, customer and partner meetings across devices and locations.',
    Icon: UsersIcon,
  },
  {
    title: 'Webinars & large events',
    description: 'Host town halls, conferences, launches, public forums and large audience experiences.',
    Icon: GlobeIcon,
  },
  {
    title: 'AI productivity',
    description: 'Support captions, transcripts, summaries, Q&A and reusable meeting knowledge.',
    Icon: SparkIcon,
  },
  {
    title: 'TrustLock™ governance',
    description: 'Control participant roles, permissions, recording, moderation and institutional policies.',
    Icon: ShieldIcon,
  },
  {
    title: 'Resilient connection',
    description: 'Keep people connected across changing bandwidth conditions and real-world networks.',
    Icon: WifiIcon,
  },
  {
    title: 'Mobile-first access',
    description: 'Give people a consistent Konn3ct experience across desktop and mobile devices.',
    Icon: DeviceIcon,
  },
]

export default function ContactSales({ onToast }) {
  const [submitted, setSubmitted] = useState(false)
  const [interest, setInterest] = useState(featureOptions[0])
  const selectedFeature = useMemo(() => featureOptions.includes(interest) ? interest : featureOptions[0], [interest])

  useEffect(() => {
    document.title = 'Contact Sales | Konn3ct'
    window.scrollTo({ top: 0 })
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
    onToast?.(`Sales request captured: ${selectedFeature}`)
  }

  return (
    <div className="min-h-screen bg-white text-brand-ink">
      <main>
        <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fff_0%,#F7FAFF_78%,#fff_100%)] py-14 sm:py-20 lg:py-24">
          <div className="pointer-events-none absolute -right-40 top-12 h-[520px] w-[520px] rounded-full border border-brand-blue/5 shadow-[0_0_0_80px_rgba(0,40,130,.018),0_0_0_160px_rgba(34,116,81,.016)]" />
          <div className="container-k3 relative grid items-start gap-12 lg:grid-cols-[.88fr_1.12fr] lg:gap-16">
            <div className="lg:sticky lg:top-[118px]">
              <div className="eyebrow">Talk to Konn3ct</div>
              <h1 className="mt-5 max-w-[620px] font-display text-[42px] font-extrabold leading-[1.03] tracking-[-0.045em] text-brand-navy sm:text-[54px] lg:text-[64px]">
                Contact our Sales team
              </h1>
              <p className="mt-6 max-w-[610px] text-lg leading-8 text-slate-600">
                Tell us how your organisation connects today and what you want to improve. We will help you design the right Konn3ct setup for your people, use cases, scale, network conditions and governance needs.
              </p>
              <p className="mt-4 max-w-[590px] text-sm leading-7 text-slate-500">
                Complete the form and a member of the Konn3ct team can follow up on meetings, webinars, training, enterprise administration, AI productivity, TrustLock™ controls, resilient connection and deployment options.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {['Government & public institutions','Corporates & SMEs','Associations & membership','Education & training','Faith organisations','Events & communities'].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-brand-line bg-white px-4 py-3 shadow-soft">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-greenTint text-brand-green"><CheckIcon className="h-4 w-4" /></span>
                    <span className="text-xs font-extrabold leading-5 text-brand-navy">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="rounded-[28px] border border-brand-line bg-white p-6 shadow-float sm:p-8 lg:p-9">
              <div className="mb-7 border-b border-brand-line pb-6">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-brand-green">Sales enquiry</p>
                <h2 className="mt-2 font-display text-2xl font-extrabold text-brand-navy sm:text-3xl">Tell us about your organisation</h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">A few details help us route your request to the right Konn3ct team.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-extrabold text-slate-700">Full name</span>
                  <input required name="name" placeholder="Your full name" className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10" />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-extrabold text-slate-700">Organisation name</span>
                  <input required name="company" placeholder="Company / institution" className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10" />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-extrabold text-slate-700">Work email</span>
                  <input required name="email" type="email" placeholder="name@organisation.com" className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10" />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-extrabold text-slate-700">Phone number</span>
                  <input required name="phone" type="tel" placeholder="+234 ..." className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10" />
                </label>

                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-xs font-extrabold text-slate-700">Organisation type</span>
                  <select name="organisationType" className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10">
                    <option>Corporate / SME</option>
                    <option>Government / Public Institution</option>
                    <option>Professional Association / Membership Organisation</option>
                    <option>University / School / Training Organisation</option>
                    <option>Church / Faith Organisation</option>
                    <option>Event / Community Organisation</option>
                    <option>Other</option>
                  </select>
                </label>

                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-xs font-extrabold text-slate-700">What are you interested in?</span>
                  <select name="interest" value={interest} onChange={(e) => setInterest(e.target.value)} className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10">
                    {featureOptions.map(option => <option key={option}>{option}</option>)}
                  </select>
                </label>

                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-xs font-extrabold text-slate-700">Expected participant / user scale</span>
                  <select name="scale" className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10">
                    <option>Up to 100</option>
                    <option>101–500</option>
                    <option>501–2,000</option>
                    <option>2,001–10,000</option>
                    <option>10,000+</option>
                    <option>Not sure yet</option>
                  </select>
                </label>

                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-xs font-extrabold text-slate-700">Tell us what you want Konn3ct to help you achieve</span>
                  <textarea name="message" rows="5" placeholder="Share your current tools, audience, meeting or event needs, deployment requirements, governance concerns or network challenges." className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10" />
                </label>
              </div>

              <button type="submit" className="btn-primary mt-6 w-full gap-2">
                Contact sales <ArrowRight className="h-4 w-4" />
              </button>
              <p className={`mt-3 text-xs leading-5 ${submitted ? 'font-bold text-brand-green' : 'text-slate-500'}`}>
                {submitted
                  ? 'Thank you. This prototype submission is ready to be connected to Konn3ct / Odoo CRM.'
                  : 'By submitting this form, you agree that Konn3ct may use these details to respond to your sales enquiry.'}
              </p>
            </form>
          </div>
        </section>

        <section className="border-y border-brand-line bg-brand-cloud py-16 sm:py-20">
          <div className="container-k3">
            <div className="mx-auto max-w-3xl text-center">
              <div className="eyebrow">What we can design with you</div>
              <h2 className="section-title mt-3">One conversation. The right Konn3ct configuration.</h2>
              <p className="section-copy mx-auto mt-5">Your sales conversation can be shaped around the parts of Konn3ct that matter most to your organisation.</p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featureCards.map(({ title, description, Icon }, index) => (
                <article key={title} className="rounded-[20px] border border-brand-line bg-white p-6 shadow-soft">
                  <div className={`grid h-11 w-11 place-items-center rounded-xl ${index % 2 ? 'bg-brand-greenTint text-brand-green' : 'bg-brand-blueTint text-brand-blue'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-extrabold text-brand-navy">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
