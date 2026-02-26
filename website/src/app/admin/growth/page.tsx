'use client'

export default function GrowthPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="bg-dark-card rounded-2xl border border-dark-border p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Growth Analytics</h2>
        <p className="text-dark-text-secondary text-sm">
          Add signup charts, retention metrics (D1/D7/D30), funnel analysis, and growth KPIs here.
          Use the <code className="text-accent">recharts</code> library (already included in dependencies).
        </p>
      </div>
    </div>
  )
}
