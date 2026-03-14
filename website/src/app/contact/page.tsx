'use client'

import { useState } from 'react'
import Image from 'next/image'
import Nav from '@/components/public/Nav'
import Footer from '@/components/public/Footer'
import Reveal from '@/components/public/Reveal'

const FEATURED_LOGOS = [
  { name: 'Figma', src: '/clients/figma.svg' },
  { name: 'Opendoor', src: '/clients/opendoor.svg' },
  { name: 'Plaid', src: '/clients/plaid.svg' },
  { name: 'Ashby', src: '/clients/ashby.svg' },
  { name: 'SeatGeek', src: '/clients/seatgeek.svg' },
  { name: 'GoFundMe', src: '/clients/gofundme.svg' },
  { name: 'Venmo', src: '/clients/venmo.svg' },
  { name: 'Finch', src: '/clients/finch.svg' },
]

const TESTIMONIALS = [
  {
    quote: 'I have had the pleasure of working with Mavericks, Kyle, and his team for several years and as a trusted recruiting partner for product and technology needs. Their team is incredibly professional and dedicated, and they are always willing to go the extra mile to ensure that we find the right fit for our organization.',
    name: 'Juan Benitez',
    title: 'Former President',
    company: 'GoFundMe',
  },
  {
    quote: 'Mavericks takes a genuine embedded approach. They adapt to your recruiting team\'s culture, operating methods, gain an in-depth understanding of your business, and develop strong stakeholder relationships. Kyle and the team have a proven track record of working on anything from Go-To-Market roles at an early-stage startup to senior technical leadership positions at mature tech firms.',
    name: 'Frank Cebek',
    title: 'Sr. Director of People',
    company: 'SeatGeek',
  },
  {
    quote: 'Kyle and Mavericks on Demand have been invaluable partners and are the first call I make when above capacity. The Team Lead handles everything and provides insightful and real-time analytics. I have complete faith in Mavericks that their staff is highly trained and can ramp quickly.',
    name: 'Amanda Yates',
    title: 'Head of Global Talent',
    company: 'Boomi',
  },
  {
    quote: 'Kyle and his team are the real deal! I had the pleasure of working with him as I was scaling up my company. They\'re go-getters who work hard to deliver with polish and professionalism. They add a personable touch to their expertise in recruiting, making the experience more like working with a good friend who really knows what he\'s doing.',
    name: 'Roberto Ortiz',
    title: 'CEO & Co-Founder',
    company: 'Welcome',
  },
  {
    quote: 'In 2020 I was lucky enough to meet the Mavericks team and employ their services as a Premier RPO partner. We started out our relationship with a small team (3) and Mavericks very own founder Kyle Barbato working alongside us. We quickly grew and scaled our relationship to over 16 Mavericks focusing on Technical Recruitment by the end of 2022.',
    name: 'Matthew Welch',
    title: 'Head of Tech Recruiting',
    company: 'Ripple',
  },
  {
    quote: 'One of the most important aspects to building and growing successful early and mid-stage companies centers around talent. I\'ve worked with Kyle for years and immediately sought out a partnership with Mavericks just after we raised our seed round. Kyle\'s team was immediately effective in attracting and hiring 20-25 full time engineers, product leads, infrastructure leads that helped accelerate our company\'s growth. They get it!',
    name: 'John MacIlwaine',
    title: 'President & Co-Founder',
    company: 'HighNote',
  },
]

const STATS = [
  { value: '50%', label: 'Average cost savings vs. agencies' },
  { value: '96+', label: 'Clients served' },
  { value: '2x', label: 'Faster time-to-hire' },
]

export default function ContactPage() {
  const [formSubmitted, setFormSubmitted] = useState(false)

  return (
    <div className="min-h-screen bg-white text-[#1E1E24] font-sans overflow-x-hidden">
      <Nav />

      {/* ── Hero + Form (Purple Background) ─────────────────────── */}
      <section className="pt-20 lg:pt-20">
        <div className="bg-[#7052F5] rounded-b-[40px] lg:rounded-b-[56px] pt-16 lg:pt-24 pb-16 lg:pb-24">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              {/* Left: Text + Logos */}
              <Reveal>
                <div>
                  <h1 className="font-display text-[36px] sm:text-[44px] lg:text-[52px] leading-[1.1] tracking-tight text-white mb-5">
                    Get in touch
                  </h1>
                  <p className="text-lg text-white/80 leading-relaxed mb-10 max-w-md">
                    Fill out the form and we&apos;ll be sure to get back to you within 48 hours.
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-6 mb-12">
                    {STATS.map(stat => (
                      <div key={stat.label}>
                        <div className="text-2xl lg:text-3xl font-display text-white leading-none mb-1">{stat.value}</div>
                        <div className="text-xs text-white/60 leading-snug">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Client logos */}
                  <p className="text-xs text-white/50 uppercase tracking-widest font-medium mb-4">Trusted by</p>
                  <div className="grid grid-cols-4 gap-5 items-center">
                    {FEATURED_LOGOS.slice(0, 4).map(logo => (
                      <div key={logo.name} className="h-5 opacity-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logo.src} alt={logo.name} className="h-full object-contain brightness-0 invert" />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-5 items-center mt-4">
                    {FEATURED_LOGOS.slice(4).map(logo => (
                      <div key={logo.name} className="h-5 opacity-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logo.src} alt={logo.name} className="h-full object-contain brightness-0 invert" />
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* Right: Form */}
              <Reveal delay={150}>
                <div className="bg-white rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-xl">
                  {formSubmitted ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-[#76E59F]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-[#76E59F]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </div>
                      <h3 className="font-heading text-xl font-bold text-[#1E1E24] mb-2">Thanks for reaching out!</h3>
                      <p className="text-[#6B6880]">We&apos;ll get back to you within 48 hours.</p>
                    </div>
                  ) : (
                    <form
                      className="space-y-4"
                      onSubmit={(e) => {
                        e.preventDefault()
                        setFormSubmitted(true)
                      }}
                    >
                      <h2 className="font-heading text-lg font-bold text-[#1E1E24] mb-1">Talk to our team</h2>
                      <p className="text-sm text-[#6B6880] mb-4">Tell us about your hiring needs and we&apos;ll find the right solution.</p>

                      {/* Name + Email side by side */}
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Name"
                          required
                          className="w-full px-4 py-3 bg-[#F5F5F7] rounded-lg text-[#1E1E24] placeholder-[#A29DB7] focus:outline-none focus:ring-2 focus:ring-[#7052F5]/40 transition-all text-sm"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          required
                          className="w-full px-4 py-3 bg-[#F5F5F7] rounded-lg text-[#1E1E24] placeholder-[#A29DB7] focus:outline-none focus:ring-2 focus:ring-[#7052F5]/40 transition-all text-sm"
                        />
                      </div>

                      {/* Company + Role side by side */}
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Company"
                          className="w-full px-4 py-3 bg-[#F5F5F7] rounded-lg text-[#1E1E24] placeholder-[#A29DB7] focus:outline-none focus:ring-2 focus:ring-[#7052F5]/40 transition-all text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Your role"
                          className="w-full px-4 py-3 bg-[#F5F5F7] rounded-lg text-[#1E1E24] placeholder-[#A29DB7] focus:outline-none focus:ring-2 focus:ring-[#7052F5]/40 transition-all text-sm"
                        />
                      </div>

                      {/* Hires + Priority side by side */}
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          className="w-full px-4 py-3 bg-[#F5F5F7] rounded-lg text-[#A29DB7] focus:outline-none focus:ring-2 focus:ring-[#7052F5]/40 transition-all text-sm appearance-none"
                          defaultValue=""
                        >
                          <option value="" disabled>How many hires?</option>
                          <option value="1-5">1-5 hires</option>
                          <option value="6-15">6-15 hires</option>
                          <option value="16-50">16-50 hires</option>
                          <option value="50+">50+ hires</option>
                        </select>
                        <select
                          className="w-full px-4 py-3 bg-[#F5F5F7] rounded-lg text-[#A29DB7] focus:outline-none focus:ring-2 focus:ring-[#7052F5]/40 transition-all text-sm appearance-none"
                          defaultValue=""
                        >
                          <option value="" disabled>How urgent?</option>
                          <option value="immediate">Immediate - this month</option>
                          <option value="soon">Soon - this quarter</option>
                          <option value="planning">Planning ahead</option>
                          <option value="exploring">Just exploring</option>
                        </select>
                      </div>

                      {/* Message */}
                      <textarea
                        placeholder="Tell us about your hiring needs..."
                        rows={4}
                        className="w-full px-4 py-3 bg-[#F5F5F7] rounded-lg text-[#1E1E24] placeholder-[#A29DB7] focus:outline-none focus:ring-2 focus:ring-[#7052F5]/40 transition-all text-sm resize-none"
                      />

                      {/* How did you hear */}
                      <select
                        className="w-full px-4 py-3 bg-[#F5F5F7] rounded-lg text-[#A29DB7] focus:outline-none focus:ring-2 focus:ring-[#7052F5]/40 transition-all text-sm appearance-none"
                        defaultValue=""
                      >
                        <option value="" disabled>How did you hear about us?</option>
                        <option value="referral">Referral</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="google">Google Search</option>
                        <option value="event">Event / Conference</option>
                        <option value="other">Other</option>
                      </select>

                      <button
                        type="submit"
                        className="w-full bg-[#1E1E24] hover:bg-[#2E2D35] text-white font-semibold py-3.5 rounded-lg transition-all duration-200 text-sm"
                      >
                        Submit
                      </button>
                    </form>
                  )}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials Grid (Lavender Background) ──────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="bg-[#F2EFFF] rounded-[32px] lg:rounded-[56px] p-8 lg:p-16">
            <Reveal>
              <div className="text-center mb-12">
                <h2 className="font-display text-[28px] lg:text-[36px] tracking-tight text-[#1E1E24]">
                  Don&apos;t just take our word for it
                </h2>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <Reveal key={t.name} delay={i * 80}>
                  <div className="bg-white rounded-[24px] lg:rounded-[32px] p-6 lg:p-8 h-full flex flex-col justify-between">
                    <p className="text-[14px] lg:text-[15px] text-[#1E1E24] leading-relaxed mb-6">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#7052F5]/10 flex items-center justify-center text-[#7052F5] font-heading font-bold text-sm shrink-0">
                        {t.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-heading font-bold text-[13px] text-[#1E1E24]">{t.name}</div>
                        <div className="text-[12px] text-[#6B6880]">{t.title}, {t.company}</div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Mavericks (trust signals) ────────────────────────── */}
      <section className="pb-20 lg:pb-28">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-[#7052F5] uppercase tracking-widest mb-4">Why companies choose us</p>
              <h2 className="font-display text-[28px] lg:text-[36px] tracking-tight text-[#1E1E24]">
                The embedded recruiting advantage
              </h2>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                  </svg>
                ),
                title: 'Dedicated team',
                desc: 'Recruiters who work exclusively for you, embedded into your culture and processes.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                  </svg>
                ),
                title: 'Ramp in days, not months',
                desc: 'Our recruiters are trained and ready to go. Most are fully ramped within the first week.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                ),
                title: 'Real-time analytics',
                desc: 'Full visibility into pipeline metrics, recruiter performance, and hiring progress.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                ),
                title: '50% cost savings',
                desc: 'Save significantly compared to traditional contingency agencies while getting better results.',
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <div className="border border-gray-200 rounded-xl p-6 h-full hover:border-[#7052F5]/30 transition-colors">
                  <div className="w-10 h-10 bg-[#7052F5]/10 rounded-lg flex items-center justify-center text-[#7052F5] mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-heading text-[15px] font-bold text-[#1E1E24] mb-2">{item.title}</h3>
                  <p className="text-[13px] text-[#6B6880] leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
