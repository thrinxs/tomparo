export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Platform configuration and feature flags</p>
      </div>

      <div className="grid gap-4">
        {[
          { label: "Platform Name", value: "TomParo", description: "The public name of the platform" },
          { label: "Support Email", value: "support@tomparo.com", description: "Email shown on contact page" },
          { label: "Paystack Mode", value: "Live", description: "Current payment mode" },
          { label: "AI Model", value: "gemini-2.5-flash", description: "Active Gemini model" },
          { label: "Database", value: "Supabase PostgreSQL (eu-central-1)", description: "Active database region" },
          { label: "Deployment", value: "Vercel (auto-deploy from GitHub main)", description: "Deployment configuration" },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4">
            <div>
              <p className="text-sm font-medium text-white">{item.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
            </div>
            <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-400">
        Dynamic settings management (feature flags, maintenance mode, limits) coming in the next release.
      </div>
    </div>
  );
}
