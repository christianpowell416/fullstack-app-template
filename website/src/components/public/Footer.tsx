'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#1E1E24] text-white py-12 lg:py-16">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mavericks-mark.svg" alt="" className="h-5 w-auto" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mavericks-wordmark.svg" alt="Mavericks" className="h-3 w-auto invert brightness-0" style={{ filter: 'invert(1)' }} />
          </Link>

          <div className="flex flex-wrap gap-6">
            <Link href="/about" className="text-sm text-[#A29DB7] hover:text-white transition-colors">About</Link>
            <Link href="/services" className="text-sm text-[#A29DB7] hover:text-white transition-colors">Services</Link>
            <Link href="/clients" className="text-sm text-[#A29DB7] hover:text-white transition-colors">Our clients</Link>
            <Link href="/blog" className="text-sm text-[#A29DB7] hover:text-white transition-colors">Blog</Link>
            <Link href="/contact" className="text-sm text-[#A29DB7] hover:text-white transition-colors">Contact</Link>
            <Link href="/admin/login" className="text-sm text-[#A29DB7] hover:text-white transition-colors">Team Login</Link>
          </div>
        </div>

        <div className="border-t border-[#2E2D35] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#A29DB7]">
            Copyright &copy; {new Date().getFullYear()} Mavericks Recruiting
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-[#A29DB7] hover:text-white transition-colors" aria-label="LinkedIn">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
