"use client";

import { SignUpButton } from "@clerk/nextjs";
import { ArrowRight, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";

const WORDS = [
  "wireframes",
  "mockups",
  "dashboards",
  "posters",
  "UI layouts",
  "sitemaps",
];

export default function HeroSection() {
  const [wordIdx, setWordIdx] = useState(0);
  const [videoOpen, setVideoOpen] = useState(false);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const t = setInterval(
      () => setWordIdx((i) => (i + 1) % WORDS.length),
      2200,
    );
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (videoOpen && modalVideoRef.current) {
      modalVideoRef.current.currentTime = 0;
      modalVideoRef.current.play();
    }
    if (!videoOpen && modalVideoRef.current) {
      modalVideoRef.current.pause();
    }
  }, [videoOpen]);

  return (
    <section className="relative overflow-hidden bg-white pt-24 pb-16 sm:pt-32 sm:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Text */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Real-time collaboration
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.08]">
              Design together,
              <br />
              <span className="text-blue-600">in real time.</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-gray-500 leading-relaxed max-w-md">
              CanvasFlow is a collaborative design platform built for teams.
              Create{" "}
              <span className="text-gray-700 font-medium border-b border-dashed border-gray-300 transition-all duration-700">
                {WORDS[wordIdx]}
              </span>{" "}
              together in your browser. No setup required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <SignUpButton mode="modal" fallbackRedirectUrl="/sync">
                <Button
                  size="lg"
                  className="h-11 px-6 text-sm bg-gray-900 text-white hover:bg-gray-800 shadow-sm"
                >
                  Launch App
                  <ArrowRight size={15} className="ml-1.5" />
                </Button>
              </SignUpButton>
            </div>
            <div className="mt-8 flex items-center gap-5 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-[10px] text-green-700 font-semibold">
                  10
                </span>
                ms sync
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-700 font-semibold">
                  99
                </span>
                % uptime
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center text-[10px] text-purple-700 font-semibold">
                  2k
                </span>
                + teams
              </span>
            </div>
          </div>

          {/* Right: Demo video */}
          <div className="relative">
            <button
              onClick={() => setVideoOpen(true)}
              className="group relative rounded-xl border border-gray-200 bg-gray-50 shadow-sm overflow-hidden cursor-pointer w-full"
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full aspect-video object-cover"
              >
                <source src="/canvazz-flow-video.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Play size={22} className="text-gray-900 ml-0.5" fill="currentColor" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {videoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:p-8"
          onClick={() => setVideoOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setVideoOpen(false)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 shadow-sm cursor-pointer"
            >
              <X size={16} />
            </button>
            <div className="rounded-xl overflow-hidden bg-black shadow-2xl">
              <video
                ref={modalVideoRef}
                controls
                playsInline
                className="w-full aspect-video object-contain"
              >
                <source src="/canvazz-flow-video.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
