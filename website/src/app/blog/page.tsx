'use client'

import Link from 'next/link'
import Nav from '@/components/public/Nav'
import Footer from '@/components/public/Footer'
import Reveal from '@/components/public/Reveal'

const BLOG_POSTS = [
  {
    title: 'Removing Bias from the Tech Interview Process: Why it Matters and How to Do It',
    excerpt: 'Creating a fair and inclusive hiring process is essential for building diverse, high-performing teams. Learn practical strategies to identify and eliminate bias at every stage of your technical interviews.',
    date: 'March 2025',
    category: 'DEI',
  },
  {
    title: 'The Rise of Embedded Recruiting: Why More Companies Are Ditching Agencies',
    excerpt: 'Traditional recruiting agencies charge 20-30% per hire. Embedded recruiting offers a better model - dedicated recruiters who become part of your team at a fraction of the cost.',
    date: 'February 2025',
    category: 'Recruiting',
  },
  {
    title: 'How to Build a Recruiting Infrastructure from Scratch',
    excerpt: 'From choosing the right ATS to building your capacity plan, here is everything you need to know about setting up a world-class talent acquisition function.',
    date: 'January 2025',
    category: 'Strategy',
  },
  {
    title: 'Scaling Your Engineering Team: Lessons from Hyper-Growth Companies',
    excerpt: 'We have helped companies go from 10 to 200+ engineers. Here are the patterns that work and the pitfalls to avoid when scaling technical teams rapidly.',
    date: 'December 2024',
    category: 'Engineering',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white text-[#1E1E24] font-sans overflow-x-hidden">
      <Nav />

      {/* Hero */}
      <section className="pt-28 lg:pt-36 pb-16 lg:pb-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
            <Reveal>
              <h1 className="font-display text-[40px] sm:text-[48px] lg:text-[56px] leading-[1.1] tracking-tight text-[#1E1E24] mb-6">
                Blog
              </h1>
            </Reveal>
            <Reveal delay={100}>
              <p className="text-lg lg:text-xl text-[#6B6880] leading-relaxed">
                Insights on recruiting, talent acquisition, and building high-performing teams.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="pb-20 lg:pb-28">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 gap-8">
            {BLOG_POSTS.map((post, i) => (
              <Reveal key={post.title} delay={i * 80}>
                <article className="group border border-gray-200 rounded-xl p-8 h-full transition-all duration-300 hover:border-[#7052F5]/30 hover:shadow-lg hover:shadow-[#7052F5]/5 bg-white">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-semibold text-[#7052F5] bg-[#7052F5]/10 px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                    <span className="text-xs text-[#6B6880]">{post.date}</span>
                  </div>
                  <h2 className="font-heading text-xl font-bold text-[#1E1E24] mb-3 group-hover:text-[#7052F5] transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-[15px] text-[#6B6880] leading-relaxed mb-6">{post.excerpt}</p>
                  <span className="text-sm font-semibold text-[#7052F5] group-hover:underline">
                    Read more &rarr;
                  </span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
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
