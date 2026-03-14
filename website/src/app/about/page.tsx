'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Nav from '@/components/public/Nav'
import Footer from '@/components/public/Footer'
import Reveal from '@/components/public/Reveal'

const STATS = [
  { value: '50+', label: 'Team members', image: '/photos/team-1.jpg' },
  { value: '17', label: 'States across the US', image: '/photos/team-2.jpg' },
  { value: '3', label: 'Countries across the globe', image: '/photos/team-3.jpg' },
]

const VALUES = [
  {
    name: 'Loyalty',
    description: 'Building long-lasting relationships with both clients and employees. Being trustworthy and dedicated to providing exceptional service.',
  },
  {
    name: 'Togetherness',
    description: 'Teamwork and collaboration in delivering outstanding results. Fostering a positive and supportive work environment where everyone works together towards common goals.',
  },
  {
    name: 'Perseverance',
    description: 'Determination to overcome challenges and achieve success. Unwavering commitment to delivering results, no matter what obstacles may arise.',
  },
  {
    name: 'Execution',
    description: 'Delivering results through effective planning and implementation. Taking decisive action to achieve desired outcomes and following through on commitments.',
  },
]

export default function AboutPage() {
  const [expandedValue, setExpandedValue] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white text-[#1E1E24] font-sans overflow-x-hidden">
      <Nav />

      {/* Hero */}
      <section className="pt-28 lg:pt-36 pb-16 lg:pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <Reveal>
                <h1 className="font-display text-[40px] sm:text-[48px] lg:text-[56px] leading-[1.1] tracking-tight text-[#1E1E24] mb-6">
                  The recruiting team behind hyper-growth companies
                </h1>
              </Reveal>
              <Reveal delay={100}>
                <p className="text-lg lg:text-xl text-[#6B6880] leading-relaxed mb-8 max-w-xl">
                  Companies of all sizes, from startups to Fortune 500s, use Maverick&apos;s recruiters and sourcers to build their teams, find their execs and help drive an inclusive and diverse workforce.
                </p>
              </Reveal>
              <Reveal delay={200}>
                <Link
                  href="/contact"
                  className="inline-block bg-[#7052F5] hover:bg-[#5E3FE0] text-white font-semibold px-8 py-3.5 rounded-lg transition-all duration-200"
                >
                  Join Us
                </Link>
              </Reveal>
            </div>
            <Reveal delay={150}>
              <div className="rounded-2xl overflow-hidden">
                <Image src="/photos/mission.jpg" alt="Mavericks founders" width={700} height={500} className="w-full h-auto object-cover" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Stats with Photos */}
      <section className="py-20 lg:py-28 bg-[#FAFAFA]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="font-display text-[32px] lg:text-[40px] tracking-tight text-[#1E1E24] mb-3">
                We&apos;re Mavs
              </h2>
              <p className="text-lg text-[#6B6880]">Learn a little about us</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {STATS.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 120}>
                <div className="group">
                  <div className="rounded-2xl overflow-hidden aspect-[4/3] mb-6">
                    <Image src={stat.image} alt={stat.label} width={500} height={375} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="text-center">
                    <div className="text-[48px] font-display text-[#7052F5] leading-none mb-1">{stat.value}</div>
                    <div className="text-[15px] text-[#6B6880] font-medium">{stat.label}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 lg:py-28">
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

      {/* Values Accordion */}
      <section className="py-20 lg:py-28 bg-[#FAFAFA]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <Reveal>
              <div>
                <p className="text-sm font-semibold text-[#7052F5] uppercase tracking-widest mb-4">Our Values</p>
                <h2 className="font-display text-[32px] lg:text-[40px] tracking-tight text-[#1E1E24] mb-4">
                  What drives us every day
                </h2>
                <p className="text-lg text-[#6B6880] mb-8">
                  These values reflect our commitment to providing white glove service to clients, and they are a testament to our culture of excellence and dedication to delivering outstanding results.
                </p>
                <Link
                  href="/contact"
                  className="inline-block bg-[#7052F5] hover:bg-[#5E3FE0] text-white font-semibold px-8 py-3.5 rounded-lg transition-all duration-200"
                >
                  Join Us
                </Link>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
                {VALUES.map((value, i) => (
                  <div key={value.name}>
                    <button
                      onClick={() => setExpandedValue(expandedValue === i ? null : i)}
                      className="w-full flex items-center justify-between py-5 text-left group"
                    >
                      <span className="font-heading text-lg font-bold text-[#1E1E24] group-hover:text-[#7052F5] transition-colors">
                        {value.name}
                      </span>
                      <svg
                        className={`w-5 h-5 text-[#6B6880] transition-transform duration-300 ${expandedValue === i ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${expandedValue === i ? 'max-h-40 pb-5' : 'max-h-0'}`}>
                      <p className="text-[15px] text-[#6B6880] leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
