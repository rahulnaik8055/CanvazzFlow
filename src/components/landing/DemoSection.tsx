"use client";

import { Play } from "lucide-react";
import { useState } from "react";

export default function DemoSection() {
  const [playing, setPlaying] = useState(false);

  return (
    <section id="demo" className="border-t border-gray-100 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Demo</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Watch CanvasFlow in action
          </h2>
          <p className="mt-3 text-sm text-gray-500">
            See how teams collaborate on designs in real time — from wireframes to final layouts.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-900 shadow-xl">
          {playing ? (
            <div className="aspect-video w-full bg-gray-800 flex items-center justify-center">
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="Demo"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          ) : (
            <button
              onClick={() => setPlaying(true)}
              className="group relative aspect-video w-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 cursor-pointer"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-colors ring-1 ring-white/20">
                  <Play size={28} className="text-white fill-white ml-0.5" />
                </div>
                <span className="text-sm font-medium text-white/70">Play demo video</span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[11px] text-white/30">
                <span>CanvasFlow Demo</span>
                <span>0:00 / 2:34</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
