'use client'

export default function SettingsPage() {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="bg-dark-card rounded-2xl border border-dark-border p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
        <p className="text-dark-text-secondary text-sm">
          Add your app settings here — cron job management, feature flags, system configuration, etc.
        </p>
      </div>
    </div>
  )
}
