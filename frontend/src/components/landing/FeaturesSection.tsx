import {
  Users, Grid3X3, FolderKanban, Shield, UserPlus, Radio,
  Pen, Files, Search, Bell, Image, LayoutPanelLeft,
} from "lucide-react";

const FEATURES = [
  { icon: Users, title: "Real-time Collaboration", desc: "Multiple users edit the same canvas simultaneously with instant sync via Liveblocks." },
  { icon: Grid3X3, title: "Infinite Canvas", desc: "Zoom, pan, and create without boundaries. The canvas extends as far as you need." },
  { icon: FolderKanban, title: "Project Management", desc: "Organize designs into projects and pages. Keep everything structured." },
  { icon: Shield, title: "Role-based Access", desc: "Granular permissions — owner, editor, and viewer roles for every project." },
  { icon: UserPlus, title: "Team Invitations", desc: "Invite teammates by email. Manage pending and active members." },
  { icon: Radio, title: "Live Presence", desc: "See who is viewing the canvas, what they select, and where their cursor is." },
  { icon: Pen, title: "Canvas Editor", desc: "Rectangles, circles, text, frames, stars, arrows — a full shape library." },
  { icon: Files, title: "Page Management", desc: "Create and switch between multiple pages within a project." },
  { icon: Search, title: "Universal Search", desc: "Search across projects, pages, and members from a single command palette." },
  { icon: Bell, title: "Notifications", desc: "Access requests, role changes, and invites — stay informed." },
  { icon: Image, title: "Asset Support", desc: "Drag and drop images, sticky notes, code blocks, and dividers onto the canvas." },
  { icon: LayoutPanelLeft, title: "Inspector Panel", desc: "Fine-tune every property — position, size, color, typography, and effects." },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="border-t border-gray-100 bg-gray-50/50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Features</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Everything you need to design
          </h2>
          <p className="mt-3 text-sm text-gray-500">
            A complete set of tools for creating wireframes, mockups, and layouts with your team.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-gray-100 bg-white p-5 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 group-hover:bg-blue-50 transition-colors mb-3">
                <feature.icon size={18} className="text-gray-500 group-hover:text-blue-600 transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
