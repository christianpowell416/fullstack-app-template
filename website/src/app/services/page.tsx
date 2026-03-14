'use client'

import Link from 'next/link'
import Nav from '@/components/public/Nav'
import Footer from '@/components/public/Footer'
import Reveal from '@/components/public/Reveal'

const SERVICES = [
  {
    title: 'Embedded Recruiting',
    description: 'Embed our technical and non-technical recruiters into your company as if they\'re full-time employees on your team. From sourcing, to recruiter screens to managing candidates throughout the process and to extending offers - our recruiters can run a full desk.',
  },
  {
    title: 'Diversity, Equity & Inclusion',
    description: 'We help by building intentionally diverse candidate pipelines from scratch and helping to remove bias from your interview process. We understand that creating a diverse and inclusive workplace is essential for success.',
  },
  {
    title: 'Executive Search',
    description: 'Our executive search services offer a customized and results-driven approach to finding top talent for your organization. Our team of experienced recruiters will work with you to understand your unique needs.',
  },
  {
    title: 'Embedded Sourcing',
    description: 'Our sourcers focus on building your candidate pipelines from scratch. We use the best tools to help find the best talent on the market as well as building intentionally diverse pipelines.',
  },
  {
    title: 'Embedded HR',
    description: 'We\'ve got you covered with day to day people operations, onboarding, team building, and wellness.',
  },
  {
    title: 'Embedded Coordination',
    description: 'Our coordinators are ready to take the scheduling load off of your plate and help with process improvement.',
  },
  {
    title: 'Compensation, Equity & Total Rewards',
    description: 'Need help with your compensation bands, advice on how much equity to grant new hires or a revamp on your total reward offering? We got you.',
  },
  {
    title: 'Talent Infrastructure Advisory',
    description: 'We\'ll help you setup your recruiting and talent infrastructure by recommending and implementing various HRIS\', ATS\', recruiting tools as well as build your capacity plan.',
  },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white text-[#1E1E24] font-sans overflow-x-hidden">
      <Nav />

      {/* Hero */}
      <section className="pt-28 lg:pt-36 pb-16 lg:pb-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
            <Reveal>
              <h1 className="font-display text-[40px] sm:text-[48px] lg:text-[56px] leading-[1.1] tracking-tight text-[#1E1E24] mb-6">
                High-impact recruiting to help your business grow
              </h1>
            </Reveal>
            <Reveal delay={100}>
              <p className="text-lg lg:text-xl text-[#6B6880] leading-relaxed mb-8">
                Companies of all sizes, from startups to Fortune 500s, use Maverick&apos;s recruiters and sourcers to build their teams, find their execs and help drive an inclusive and diverse workforce.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <Link
                href="/contact"
                className="inline-block bg-[#7052F5] hover:bg-[#5E3FE0] text-white font-semibold px-8 py-3.5 rounded-lg transition-all duration-200"
              >
                Start now
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 lg:py-28 bg-[#FAFAFA]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((service, i) => (
              <Reveal key={service.title} delay={i * 60}>
                <div className="group bg-white border border-gray-200 rounded-xl p-6 h-full transition-all duration-300 hover:border-[#7052F5]/30 hover:shadow-lg hover:shadow-[#7052F5]/5">
                  <h3 className="font-heading text-[17px] font-bold text-[#1E1E24] mb-3 group-hover:text-[#7052F5] transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-[14px] text-[#6B6880] leading-relaxed">{service.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
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
                className="inline-block bg-[#7052F5] hover:bg-[#5E3FE0] text-white font-semibold px-8 py-3.5 rounded-lg transition-all duration-200"
              >
                Get in touch
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  )
}
