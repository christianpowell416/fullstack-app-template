'use client'

export default function CostsPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="bg-dark-card rounded-2xl border border-dark-border p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Cost Analytics</h2>
        <p className="text-dark-text-secondary text-sm">
          Track AI API costs (OpenAI, Gemini), per-user cost breakdown, daily spend trends,
          and revenue vs. costs. Query your <code className="text-accent">user_daily_usage</code> table here.
        </p>
      </div>
    </div>
  )
}
