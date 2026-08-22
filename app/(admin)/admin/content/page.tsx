export default function AdminContentPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Content</h1>
        <p className="mt-1 text-sm text-slate-400">Manage platform announcements and content</p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center space-y-3">
        <p className="text-slate-400 text-sm">
          Content management (FAQs, announcements, blog posts) coming in the next release.
        </p>
        <p className="text-xs text-slate-600">
          For now, update content directly in the codebase under <code className="text-slate-400">app/faq</code>, <code className="text-slate-400">app/about</code> etc.
        </p>
      </div>
    </div>
  );
}
