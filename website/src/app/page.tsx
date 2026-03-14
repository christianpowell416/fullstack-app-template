'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Nav from '@/components/public/Nav'
import Footer from '@/components/public/Footer'
import Reveal from '@/components/public/Reveal'

// ─── Data ─────────────────────────────────────────────────────────────
const CLIENT_LOGOS = [
  { name: 'Figma', src: '/clients/figma.svg' },
  { name: 'Plaid', src: '/clients/plaid.svg' },
  { name: 'Opendoor', src: '/clients/opendoor.svg' },
  { name: 'SeatGeek', src: '/clients/seatgeek.svg' },
  { name: 'GoFundMe', src: '/clients/gofundme.svg' },
  { name: 'Venmo', src: '/clients/venmo.svg' },
  { name: 'Finch', src: '/clients/finch.svg' },
  { name: 'Ashby', src: '/clients/ashby.svg' },
  { name: 'Ripple', src: '/clients/ripple.svg' },
  { name: 'PayPal', src: '/clients/paypal.svg' },
  { name: 'Vercel', src: '/clients/vercel.svg' },
  { name: 'Chime', src: '/clients/chime.svg' },
  { name: 'Solana Labs', src: '/clients/solana.svg' },
  { name: 'Magic Eden', src: '/clients/magic-eden.svg' },
  { name: 'VSCO', src: '/clients/vsco.svg' },
  { name: 'Boomi', src: '/clients/boomi.svg' },
  { name: 'Hims', src: '/clients/hims.svg' },
  { name: 'Signal', src: '/clients/signal.svg' },
  { name: 'Replit', src: '/clients/replit.svg' },
]

const STATS = [
  { value: '50+', label: 'Team members' },
  { value: '17', label: 'States across the US' },
  { value: '3', label: 'Countries across the globe' },
  { value: '96+', label: 'Clients served' },
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

// ─── Video Player ─────────────────────────────────────────────────────
function VideoPlayer() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [muted, setMuted] = useState(true)

  const toggleMute = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    const next = !muted
    iframe.contentWindow.postMessage(
      JSON.stringify({ method: 'setVolume', value: next ? 0 : 1 }),
      '*'
    )
    setMuted(next)
  }, [muted])

  return (
    <div className="relative rounded-2xl overflow-hidden aspect-video shadow-2xl shadow-black/20 bg-black">
      <iframe
        ref={iframeRef}
        src="https://player.vimeo.com/video/797526051?background=1&autoplay=1&loop=1&muted=1&app_id=122963"
        className="absolute border-0 pointer-events-none"
        style={{ top: '-10%', left: '-10%', width: '120%', height: '120%' }}
        allow="autoplay; fullscreen"
        allowFullScreen
        title="Mavs Fly Together"
      />
      {/* Unmute button */}
      <button
        onClick={toggleMute}
        className="absolute bottom-3 right-3 w-9 h-9 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center transition-all text-white/80 hover:text-white z-10"
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-3.15a.75.75 0 0 1 1.28.53v13.74a.75.75 0 0 1-1.28.53L6.75 14.25H3.75a.75.75 0 0 1-.75-.75v-3a.75.75 0 0 1 .75-.75h3Z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-3.15a.75.75 0 0 1 1.28.53v12.74a.75.75 0 0 1-1.28.53L6.75 15.75H3.75a.75.75 0 0 1-.75-.75v-6a.75.75 0 0 1 .75-.75h3Z" />
          </svg>
        )}
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function Home() {
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  const nextTestimonial = useCallback(() => {
    setActiveTestimonial(prev => (prev + 1) % TESTIMONIALS.length)
  }, [])

  const prevTestimonial = useCallback(() => {
    setActiveTestimonial(prev => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(nextTestimonial, 7000)
    return () => clearInterval(timer)
  }, [nextTestimonial])

  return (
    <div className="min-h-screen bg-white text-[#1E1E24] font-sans overflow-x-hidden">
      <Nav />

      {/* ── Hero Section (Purple Background with Video) ──────────── */}
      <section>
        <div className="bg-[#7052F5] rounded-b-[40px] lg:rounded-b-[56px]">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-28 lg:pt-36 pb-16 lg:pb-24">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* Text */}
              <div>
                <Reveal>
                  <h1 className="font-display text-[36px] sm:text-[44px] lg:text-[52px] leading-[1.1] tracking-tight text-white mb-6">
                    The recruiting team behind hyper-growth companies
                  </h1>
                </Reveal>
                <Reveal delay={100}>
                  <p className="text-lg lg:text-xl text-white/80 leading-relaxed mb-8 max-w-xl">
                    Companies of all sizes, from startups to Fortune 500s, use Maverick&apos;s recruiters and sourcers to build their teams, find their execs and help drive an inclusive and diverse workforce.
                  </p>
                </Reveal>
                <Reveal delay={200}>
                  <Link
                    href="/contact"
                    className="inline-block bg-white text-[#7052F5] font-semibold px-8 py-3.5 rounded-lg transition-all duration-200 hover:bg-white/90 text-base"
                  >
                    Join Us
                  </Link>
                </Reveal>
              </div>

              {/* Video */}
              <Reveal delay={150}>
                <VideoPlayer />
              </Reveal>
            </div>
          </div>

          {/* Client Logos inside purple section */}
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pb-12 lg:pb-16">
            <div className="relative overflow-hidden">
              <div className="flex gap-12 items-center animate-marquee">
                {[...CLIENT_LOGOS, ...CLIENT_LOGOS].map((logo, i) => (
                  <div key={`${logo.name}-${i}`} className="flex-shrink-0 h-6 w-20 relative opacity-40 hover:opacity-70 transition-opacity">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logo.src} alt={logo.name} className="h-full w-full object-contain brightness-0 invert" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Section ───────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="font-display text-[32px] lg:text-[40px] tracking-tight text-[#1E1E24] mb-3">
                We&apos;re Mavs
              </h2>
              <p className="text-lg text-[#6B6880]">Learn a little about us</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 100}>
                <div className="text-center">
                  <div className="text-[48px] lg:text-[64px] font-display text-[#7052F5] leading-none mb-2">
                    {stat.value}
                  </div>
                  <div className="text-[15px] text-[#6B6880] font-medium">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              <div className="rounded-2xl overflow-hidden aspect-[4/3]">
                <Image src="/photos/team-2.jpg" alt="Mavericks team" width={500} height={375} className="w-full h-full object-cover" />
              </div>
              <div className="rounded-2xl overflow-hidden aspect-[4/3]">
                <Image src="/photos/mission.jpg" alt="Mavericks team" width={500} height={375} className="w-full h-full object-cover" />
              </div>
              <div className="rounded-2xl overflow-hidden aspect-[4/3]">
                <Image src="/photos/team-1.jpg" alt="Mavericks team" width={500} height={375} className="w-full h-full object-cover" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Mission ──────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-[#FAFAFA]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mx-auto text-center">
            <Reveal>
              <p className="text-sm font-semibold text-[#7052F5] uppercase tracking-widest mb-4">Our Mission</p>
              <h2 className="font-display text-[28px] lg:text-[40px] tracking-tight text-[#1E1E24] leading-tight mb-8">
                To do amazing work and positively impact our clients one hire at a time!
              </h2>
              <Link
                href="/contact"
                className="inline-block bg-[#7052F5] hover:bg-[#5E3FE0] text-white font-semibold px-8 py-3.5 rounded-lg transition-all duration-200"
              >
                Join Us
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-[#7052F5] uppercase tracking-widest mb-4">Testimonials</p>
              <h2 className="font-display text-[32px] lg:text-[40px] tracking-tight text-[#1E1E24]">
                See the impact we deliver
              </h2>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="relative max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl border border-gray-200 p-8 lg:p-12 min-h-[280px] flex flex-col justify-between shadow-sm">
                <div>
                  <svg className="w-10 h-10 text-[#7052F5]/20 mb-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179Zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179Z" />
                  </svg>
                  <p className="text-[17px] lg:text-[19px] text-[#1E1E24] leading-relaxed mb-8">
                    &ldquo;{TESTIMONIALS[activeTestimonial].quote}&rdquo;
                  </p>
                </div>
                <div>
                  <div className="font-heading font-bold text-[#1E1E24]">{TESTIMONIALS[activeTestimonial].name}</div>
                  <div className="text-sm text-[#6B6880]">
                    {TESTIMONIALS[activeTestimonial].title}, {TESTIMONIALS[activeTestimonial].company}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={prevTestimonial}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#7052F5] hover:text-[#7052F5] transition-colors text-[#6B6880]"
                  aria-label="Previous testimonial"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <div className="flex gap-2">
                  {TESTIMONIALS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTestimonial(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${i === activeTestimonial ? 'w-6 bg-[#7052F5]' : 'w-2 bg-gray-300'}`}
                      aria-label={`View testimonial ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  onClick={nextTestimonial}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#7052F5] hover:text-[#7052F5] transition-colors text-[#6B6880]"
                  aria-label="Next testimonial"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-[#FAFAFA]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <Reveal>
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-display text-[32px] lg:text-[40px] tracking-tight text-[#1E1E24] mb-4">
                Ready to scale your team?
              </h2>
              <p className="text-lg text-[#6B6880] mb-8">
                Fill out the form and we&apos;ll be sure to get back to you within 48 hours.
              </p>
              <Link
                href="/contact"
                className="inline-block bg-[#7052F5] hover:bg-[#5E3FE0] text-white font-semibold px-8 py-3.5 rounded-lg transition-all duration-200 text-base"
              >
                Get in touch
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
