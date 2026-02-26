import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">My App</h1>
        <p className="text-dark-text-secondary mb-8">Your landing page goes here.</p>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-2xl font-semibold hover:bg-accent-hover transition-colors"
        >
          Go to Admin Dashboard
        </Link>
      </div>
    </div>
  )
}
