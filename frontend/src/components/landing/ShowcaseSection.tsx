const SHOWCASE_ITEMS = [
  {
    label: "Editor",
    desc: "Full-featured canvas with shape tools, layers panel, properties inspector, and real-time collaboration.",
    gradient: "from-blue-50 to-indigo-50",
    border: "border-blue-100",
  },
  {
    label: "Dashboard",
    desc: "Project overview with search, recent activity, and quick-access to all your canvases.",
    gradient: "from-gray-50 to-slate-50",
    border: "border-gray-200",
  },
  {
    label: "Members & Roles",
    desc: "Manage team members, assign roles, and review access requests — all from one panel.",
    gradient: "from-purple-50 to-pink-50",
    border: "border-purple-100",
  },
  {
    label: "Access Requests",
    desc: "Review and approve or decline access requests. Full audit trail for every request.",
    gradient: "from-amber-50 to-orange-50",
    border: "border-amber-100",
  },
];

export default function ShowcaseSection() {
  return (
    <section className="border-t border-gray-100 bg-gray-50/50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Showcase</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            See it in action
          </h2>
          <p className="mt-3 text-sm text-gray-500">
            A closer look at the interfaces that power CanvasFlow.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {SHOWCASE_ITEMS.map((item) => (
            <div
              key={item.label}
              className={`group relative overflow-hidden rounded-xl border ${item.border} bg-gradient-to-br ${item.gradient} p-6 hover:shadow-md transition-all duration-200 cursor-default`}
            >
              <div className="relative">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/80 text-[10px] font-bold text-gray-400 border border-gray-200">
                    {item.label[0]}
                  </div>
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{item.label}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed max-w-md">{item.desc}</p>
                <div className="mt-4 flex gap-1.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-1.5 flex-1 rounded-full bg-gray-200/60" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
