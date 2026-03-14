'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { label: 'About us', href: '/about' },
  { label: 'What we do', href: '/services' },
  { label: 'Our clients', href: '/clients' },
  { label: 'Blog', href: '/blog' },
]

export default function Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [visible, setVisible] = useState(true)
  const [atTop, setAtTop] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY
      setAtTop(y < 20)
      setVisible(y < 20 || y < lastScrollY.current)
      lastScrollY.current = y
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
        visible ? 'top-0' : '-top-24'
      } ${
        atTop
          ? 'bg-[#7052F5]'
          : 'bg-white/95 backdrop-blur-md shadow-sm'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mavericks-mark.svg" alt="" className="h-6 w-auto" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mavericks-wordmark.svg"
              alt="Mavericks"
              className="h-3.5 w-auto transition-all duration-300"
              style={atTop ? { filter: 'brightness(0) invert(1)' } : {}}
            />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[15px] font-medium transition-colors duration-200 ${
                  atTop
                    ? 'text-white/70 hover:text-white'
                    : 'text-[#6B6880] hover:text-[#1E1E24]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/admin/login"
              className={`text-sm transition-colors ${
                atTop ? 'text-white/70 hover:text-white' : 'text-[#6B6880] hover:text-[#1E1E24]'
              }`}
            >
              Team Login
            </Link>
            <Link
              href="/contact"
              className={`text-sm font-semibold px-6 py-2.5 rounded-lg transition-all duration-200 ${
                atTop
                  ? 'bg-white text-[#7052F5] hover:bg-white/90'
                  : 'bg-[#7052F5] hover:bg-[#5E3FE0] text-white'
              }`}
            >
              Start now
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 ${atTop ? 'text-white/80' : 'text-[#6B6880]'}`}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className={`md:hidden border-t ${atTop ? 'bg-[#7052F5] border-white/10' : 'bg-white border-gray-100'}`}>
          <div className="px-6 py-4 space-y-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2.5 font-medium transition-colors ${
                  atTop ? 'text-white/70 hover:text-white' : 'text-[#6B6880] hover:text-[#1E1E24]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin/login"
              className={`block py-2.5 ${atTop ? 'text-white/70 hover:text-white' : 'text-[#6B6880] hover:text-[#1E1E24]'}`}
            >
              Team Login
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-center font-semibold px-5 py-2.5 rounded-lg mt-2 ${
                atTop ? 'bg-white text-[#7052F5]' : 'bg-[#7052F5] text-white'
              }`}
            >
              Start now
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
