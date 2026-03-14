'use client'

import Link from 'next/link'
import Nav from '@/components/public/Nav'
import Footer from '@/components/public/Footer'
import Reveal from '@/components/public/Reveal'

const ALL_CLIENTS = [
  '1910 Genetics', 'A to B', 'Airbyte', 'Alto Pharmacy', 'Aptos Labs', 'Arena AI',
  'Ashby', 'At-Bay', 'Beam Benefits', 'Beeper', 'Boomi', 'Braintree Payments',
  'BridgingTech', 'Brilliant', 'Caribou', 'Cartwheel', 'Census', 'Ceridian',
  'Cherry', 'Chime', 'Classy', 'Climate Club', 'CodeSignal', 'Color',
  'Compass', 'Coperniq', 'CrunchLabs', 'DataWorks', 'DonorDrive', 'dYdX',
  'Eaglebrook Advisors', 'EliseAI', 'EngageSmart', 'ExactPay', 'FastSpring', 'FedEx',
  'Figma', 'Finch', 'GiveCampus', 'GoFundMe', 'Harmonic', 'HealthPay24',
  'Highnote', 'Hims', 'Immuna', 'InvoiceCloud', 'Kargo', 'Komaza',
  'LiftOff', 'Liquifi', 'Lovevery', 'Luna Care', 'Lytx', 'Magic Eden',
  'Merge', 'Mesos', 'Metronome', 'Mothership', 'Motive', 'Narrative',
  'NovaLaw', 'Numa', 'OkCoin', 'Opendoor', 'PayPal', 'PG&E',
  'Plaid', 'Protectli', 'Pulley', 'Ready.net', 'Repl.it', 'Rimon Law',
  'Ripple', 'Root Insurance', 'Rugiet', 'SeatGeek', 'Security Scorecard', 'ShopRunner',
  'Signal Messenger', 'SimplePractice', 'Smile Identity', 'Solana Labs', 'Solid', 'Swinerton',
  'Tarro', 'Terrace', 'Thoughtful', 'Till Financial', 'TipLink', 'Twelve Labs',
  'Venmo', 'Vercel', 'VSCO', 'WeedMaps', 'Welcome', 'XP Health', 'Yahoo',
]

const LOGO_CLIENTS = [
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

export default function ClientsPage() {
  return (
    <div className="min-h-screen bg-white text-[#1E1E24] font-sans overflow-x-hidden">
      <Nav />

      {/* Hero */}
      <section className="pt-28 lg:pt-36 pb-16 lg:pb-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mx-auto text-center">
            <Reveal>
              <h1 className="font-display text-[40px] sm:text-[48px] lg:text-[56px] leading-[1.1] tracking-tight text-[#1E1E24] mb-6">
                Our clients
              </h1>
            </Reveal>
            <Reveal delay={100}>
              <p className="text-lg lg:text-xl text-[#6B6880] leading-relaxed mb-8">
                We work with some of the biggest names in the industry
              </p>
            </Reveal>
            <Reveal delay={200}>
              <Link
                href="/contact"
                className="inline-block bg-[#7052F5] hover:bg-[#5E3FE0] text-white font-semibold px-8 py-3.5 rounded-lg transition-all duration-200"
              >
                Contact us
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Logo Grid */}
      <section className="py-12 bg-[#FAFAFA] border-y border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <Reveal>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-8 items-center justify-items-center">
              {LOGO_CLIENTS.map((logo) => (
                <div key={logo.name} className="h-8 w-full max-w-[100px] relative opacity-50 hover:opacity-100 transition-opacity duration-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo.src} alt={logo.name} className="h-full w-full object-contain" />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Full Client List */}
      <section className="py-20 lg:py-28">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="font-display text-[28px] lg:text-[32px] tracking-tight text-[#1E1E24]">
                96+ companies trust Mavericks
              </h2>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {ALL_CLIENTS.map((client) => (
                <div
                  key={client}
                  className="border border-gray-200 rounded-lg px-4 py-3 text-center text-[14px] text-[#6B6880] font-medium hover:border-[#7052F5]/30 hover:text-[#1E1E24] transition-all duration-200"
                >
                  {client}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-[#FAFAFA]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <Reveal>
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-display text-[32px] lg:text-[40px] tracking-tight text-[#1E1E24] mb-4">
                Join our growing client list
              </h2>
              <p className="text-lg text-[#6B6880] mb-8">
                See how Mavericks can help your team scale.
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
