const TECHNOLOGIES = [
  { name: "Next.js 15", desc: "React framework with server components, streaming, and App Router", color: "bg-black" },
  { name: "NestJS", desc: "Progressive Node.js framework for scalable server-side applications", color: "bg-red-700" },
  { name: "PostgreSQL", desc: "Relational database with advanced querying and JSON support", color: "bg-blue-800" },
  { name: "Prisma", desc: "Type-safe ORM with auto-generated queries and migrations", color: "bg-indigo-600" },
  { name: "Liveblocks", desc: "Real-time infrastructure for collaborative experiences", color: "bg-purple-600" },
  { name: "Socket.IO", desc: "Bi-directional event-based communication layer", color: "bg-gray-800" },
  { name: "Clerk", desc: "Authentication and user management with pre-built UI", color: "bg-rose-600" },
  { name: "React Konva", desc: "Canvas rendering with declarative React components", color: "bg-teal-600" },
  { name: "Tailwind CSS", desc: "Utility-first CSS framework for rapid UI development", color: "bg-sky-600" },
  { name: "shadcn/ui", desc: "Reusable component library built with Radix and Tailwind", color: "bg-gray-900" },
  { name: "Magic UI", desc: "Animated React components for modern interfaces", color: "bg-violet-600" },
  { name: "TypeScript", desc: "Typed superset of JavaScript for safer code", color: "bg-blue-600" },
];

export default function TechStackSection() {
  return (
    <section className="border-t border-gray-100 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Technology</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Built on modern foundations
          </h2>
          <p className="mt-3 text-sm text-gray-500">
            Every layer of CanvasFlow is powered by battle-tested open-source technologies.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {TECHNOLOGIES.map((tech) => (
            <div
              key={tech.name}
              className="group rounded-xl border border-gray-100 bg-white p-4 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${tech.color}`} />
                <span className="text-sm font-semibold text-gray-900">{tech.name}</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{tech.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
