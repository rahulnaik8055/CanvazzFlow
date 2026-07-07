"use client";

import { Server, Shield, Database, Radio, Wifi, Pen, Globe, Workflow } from "lucide-react";

interface ArchNode {
  name: string;
  short: string;
  icon: typeof Server;
  desc: string;
  color: string;
  badge: string;
}

const NODES: ArchNode[] = [
  { name: "Next.js Frontend", short: "Client", icon: Globe, desc: "App Router, server components, React 19, streaming SSR", color: "bg-black", badge: "UI" },
  { name: "Clerk Auth", short: "Auth", icon: Shield, desc: "Sign-up, sign-in, session mgmt, protected routes & middleware", color: "bg-rose-600", badge: "Auth" },
  { name: "NestJS API", short: "Backend", icon: Server, desc: "RESTful controllers, guards, services, WebSocket gateway", color: "bg-red-700", badge: "API" },
  { name: "Prisma ORM", short: "ORM", icon: Database, desc: "Type-safe client, auto-migrations, relation queries, pagination", color: "bg-indigo-600", badge: "Data" },
  { name: "PostgreSQL (Neon)", short: "DB", icon: Database, desc: "Serverless Postgres, branching, auto-scaling, PITR", color: "bg-blue-800", badge: "Storage" },
  { name: "Liveblocks", short: "Realtime", icon: Radio, desc: "Storage sync, presence, conflict resolution, room management", color: "bg-purple-600", badge: "Sync" },
  { name: "Socket.IO", short: "Socket", icon: Wifi, desc: "Real-time events: cursor positions, access requests, notifications", color: "bg-gray-800", badge: "Events" },
  { name: "Konva Canvas", short: "Canvas", icon: Pen, desc: "Shape rendering, transformer, zoom, pan, grid & snap-to-grid", color: "bg-teal-600", badge: "Render" },
];

const LAYERS_MAP = [
  { label: "Presentation", items: ["Next.js Frontend", "Konva Canvas"], color: "border-blue-200 bg-blue-50/30" },
  { label: "Authentication", items: ["Clerk Auth"], color: "border-rose-200 bg-rose-50/30" },
  { label: "Application", items: ["NestJS API", "Liveblocks", "Socket.IO"], color: "border-gray-200 bg-gray-50/30" },
  { label: "Data", items: ["Prisma ORM", "PostgreSQL (Neon)"], color: "border-indigo-200 bg-indigo-50/30" },
];

function getNode(name: string): ArchNode {
  return NODES.find((n) => n.name === name)!;
}

export default function ArchitectureSection() {
  return (
    <section id="architecture" className="border-t border-gray-100 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Architecture</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            How CanvasFlow works
          </h2>
          <p className="mt-3 text-sm text-gray-500">
            A layered architecture designed for real-time, collaborative design.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="relative max-w-5xl mx-auto">
          {/* Vertical connecting line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 -translate-x-1/2 hidden lg:block" />

          {LAYERS_MAP.map((layer, li) => (
            <div key={layer.label} className="relative mb-8 last:mb-0">
              {/* Layer label */}
              <div className="flex items-center justify-center mb-4">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${layer.color} text-gray-600`}>
                  {layer.label}
                </span>
              </div>

              {/* Nodes in this layer */}
              <div className="flex flex-wrap justify-center gap-4">
                {layer.items.map((name) => {
                  const node = getNode(name);
                  const Icon = node.icon;
                  return (
                    <div
                      key={node.name}
                      className="group relative w-56 rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                    >
                      {/* Badge */}
                      <span className="absolute -top-2 right-3 rounded-full border border-gray-100 bg-white px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                        {node.badge}
                      </span>

                      <div className="flex items-center gap-3 mb-2">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${node.color} text-white`}>
                          <Icon size={15} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{node.short}</div>
                          <div className="text-[10px] text-gray-400 mt-px">{node.name}</div>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{node.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Down arrow between layers */}
              {li < LAYERS_MAP.length - 1 && (
                <div className="flex items-center justify-center h-8 text-gray-300 my-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-300">
                    <path d="M8 3v10M8 13l4-4M8 13l-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
