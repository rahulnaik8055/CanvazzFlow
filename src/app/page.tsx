"use client";

import { useEffect, useState } from "react";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { NumberTicker } from "@/components/ui/number-ticker";
import { BlurFade } from "@/components/ui/blur-fade";
import { MagicCard } from "@/components/ui/magic-card";
import { Particles } from "@/components/ui/particles";
import { ShineBorder } from "@/components/ui/shine-border";
import { DotPattern } from "@/components/ui/dot-pattern";
import { Meteors } from "@/components/ui/meteors";
import { SparklesText } from "@/components/ui/sparkles-text";
import { HyperText } from "@/components/ui/hyper-text";
import { Marquee } from "@/components/ui/marquee";

// ─── Animated Logo ────────────────────────────────────────────────────────────
function AnimatedLogo({ size = 56 }: { size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-2xl border border-gray-200" />
      <div className="absolute inset-[14.3%] grid grid-cols-2 gap-[7%]">
        <div className="rounded-sm bg-blue-500 animate-[pulse_1s_ease-in-out_0s_infinite]" />
        <div className="rounded-sm bg-violet-400 animate-[pulse_1s_ease-in-out_0.2s_infinite]" />
        <div className="rounded-sm bg-pink-400 animate-[pulse_1s_ease-in-out_0.4s_infinite]" />
        <div className="rounded-sm bg-indigo-400 animate-[pulse_1s_ease-in-out_0.6s_infinite]" />
      </div>
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-blue-500 animate-spin" />
    </div>
  );
}

// ─── Gradient Text wrapper ────────────────────────────────────────────────────
function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <AnimatedGradientText className="inline px-0 py-0 text-[length:inherit] font-[inherit] leading-[inherit]">
      <span
        className={cn(
          "inline animate-gradient bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500",
          "bg-[length:var(--bg-size)_auto] bg-clip-text text-transparent",
        )}
      >
        {children}
      </span>
    </AnimatedGradientText>
  );
}

// ─── Marquee items (only what the app actually has) ───────────────────────────
const MARQUEE_ITEMS = [
  { label: "Canvas", icon: "◻" },
  { label: "Design Tools", icon: "✦" },
  { label: "Collaborative", icon: "⬡" },
  { label: "Rooms & Spaces", icon: "◈" },
  { label: "Demo Video", icon: "▶" },
  { label: "Real-time Sync", icon: "❋" },
];

function MarqueeChip({ label, icon }: { label: string; icon: string }) {
  return (
    <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-600 shadow-sm mx-2">
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">
        {icon}
      </span>
      {label}
    </span>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: "✦",
    color: "from-blue-500 to-cyan-400",
    bg: "bg-blue-50",
    gradientColor: "#DBEAFE",
    title: "Infinite Canvas",
    desc: "An endless workspace that scales with your vision — zoom from bird's eye to pixel-precise in a single scroll.",
  },
  {
    icon: "◈",
    color: "from-violet-500 to-purple-400",
    bg: "bg-violet-50",
    gradientColor: "#EDE9FE",
    title: "Design Tools",
    desc: "Shapes, text, freehand pen, connectors, and images — every primitive you need, snapping perfectly into place.",
  },
  {
    icon: "⬡",
    color: "from-pink-500 to-rose-400",
    bg: "bg-pink-50",
    gradientColor: "#FCE7F3",
    title: "Real-time Collaboration",
    desc: "See teammates' cursors and strokes as they happen. Zero lag. Every change synced across all participants instantly.",
  },
  {
    icon: "❋",
    color: "from-indigo-500 to-blue-400",
    bg: "bg-indigo-50",
    gradientColor: "#E0E7FF",
    title: "Rooms & Spaces",
    desc: "Organise work into named rooms. Each room is an isolated collaborative space with its own canvas and members.",
  },
  {
    icon: "⊕",
    color: "from-orange-400 to-pink-400",
    bg: "bg-orange-50",
    gradientColor: "#FFEDD5",
    title: "Multiplayer Presence",
    desc: "Named live cursors, selection highlights, and active-user avatars make remote design feel like the same table.",
  },
  {
    icon: "◉",
    color: "from-teal-500 to-cyan-400",
    bg: "bg-teal-50",
    gradientColor: "#CCFBF1",
    title: "Export & Share",
    desc: "Export your canvas as PNG or SVG in one click. Or share a live link — no account needed for viewers.",
  },
];

// ─── Tech Stack ───────────────────────────────────────────────────────────────
const STACK = [
  {
    name: "Next.js",
    role: "Frontend Framework",
    desc: "App Router, Server Components, and edge-optimised rendering power the canvas UI.",
    color: "from-gray-800 to-gray-600",
    logo: (
      <svg viewBox="0 0 180 180" fill="none" className="w-8 h-8">
        <mask
          id="nm"
          style={{ maskType: "alpha" }}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="180"
          height="180"
        >
          <circle cx="90" cy="90" r="90" fill="black" />
        </mask>
        <g mask="url(#nm)">
          <circle cx="90" cy="90" r="90" fill="black" />
          <path
            d="M149.508 157.52L69.142 54H54V125.97H66.1872V69.3836L139.012 164.101C142.581 162.047 146.004 159.783 149.508 157.52Z"
            fill="url(#ng1)"
          />
          <rect x="115" y="54" width="12" height="72" fill="url(#ng2)" />
        </g>
        <defs>
          <linearGradient
            id="ng1"
            x1="109"
            y1="116.5"
            x2="144.5"
            y2="160.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="ng2"
            x1="121"
            y1="54"
            x2="120.799"
            y2="106.875"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    name: "NestJS",
    role: "Backend API",
    desc: "TypeScript-first REST & WebSocket API with modules, guards, and clean architecture.",
    color: "from-red-600 to-red-400",
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white">
        <path d="M14.131.047c-.473 0-.946.121-1.37.371L10.478 1.88a2.555 2.555 0 00-1.294 2.205v.74a2.555 2.555 0 001.294 2.205l2.283 1.462a2.555 2.555 0 002.74 0l2.283-1.462A2.555 2.555 0 0019.078 4.825v-.74A2.555 2.555 0 0017.784 1.88L15.501.418A2.555 2.555 0 0014.131.047zM9.867 5.134L7.584 3.672A2.555 2.555 0 004.845 3.672L2.562 5.134A2.555 2.555 0 001.268 7.339v.74a2.555 2.555 0 001.294 2.205l2.283 1.462a2.555 2.555 0 002.74 0l2.283-1.462A2.555 2.555 0 0010.862 8.079v-.74A2.555 2.555 0 009.867 5.134z" />
      </svg>
    ),
  },
  {
    name: "PostgreSQL",
    role: "Database",
    desc: "Persistent storage for users, rooms, canvas state, and version history with full ACID guarantees.",
    color: "from-blue-700 to-blue-500",
    logo: (
      <svg viewBox="0 0 32 32" className="w-8 h-8" fill="white">
        <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 3c3.18 0 6.07 1.18 8.28 3.12C22.1 9.5 19.22 10 16 10s-6.1-.5-8.28-1.88A10.97 10.97 0 0116 5zm0 22c-5.13 0-9.48-3.5-10.67-8.24C7.4 20.22 11.5 21 16 21s8.6-.78 10.67-2.24C25.48 23.5 21.13 27 16 27z" />
      </svg>
    ),
  },
  {
    name: "Liveblocks",
    role: "Real-time Engine",
    desc: "Presence, storage, and conflict-free collaboration primitives that make multiplayer canvas feel effortless.",
    color: "from-violet-600 to-indigo-500",
    logo: (
      <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
        <path d="M6 26L16 8L26 26H6Z" fill="white" fillOpacity="0.9" />
      </svg>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { isSignedIn } = useUser();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,500;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: 'Instrument Sans', sans-serif; background: #fff; }
        h1,h2,h3,h4 { font-family: 'Bricolage Grotesque', sans-serif; }

        @keyframes heroReveal {
          from { opacity:0; transform:translateY(28px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes meshDrift {
          0%,100% { transform:translate(0,0) scale(1); }
          50%     { transform:translate(30px,-20px) scale(1.05); }
        }
        @keyframes blobPulse {
          0%,100% { border-radius:60% 40% 30% 70%/60% 30% 70% 40%; }
          50%     { border-radius:30% 60% 70% 40%/50% 60% 30% 60%; }
        }
        .hero-1 { animation: heroReveal .8s cubic-bezier(.16,1,.3,1) .1s  both; }
        .hero-2 { animation: heroReveal .8s cubic-bezier(.16,1,.3,1) .25s both; }
        .hero-3 { animation: heroReveal .8s cubic-bezier(.16,1,.3,1) .4s  both; }
        .hero-4 { animation: heroReveal .8s cubic-bezier(.16,1,.3,1) .55s both; }
        .hero-5 { animation: heroReveal .8s cubic-bezier(.16,1,.3,1) .7s  both; }
        .blob1 { animation: meshDrift 8s ease-in-out infinite, blobPulse 10s ease-in-out infinite; }
        .blob2 { animation: meshDrift 10s ease-in-out 3s infinite reverse, blobPulse 12s ease-in-out 2s infinite reverse; }
        .blob3 { animation: meshDrift 12s ease-in-out 6s infinite, blobPulse 14s ease-in-out 4s infinite; }
        .grid-bg {
          background-image:
            linear-gradient(rgba(99,102,241,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>

      <div className="relative min-h-screen bg-white overflow-x-hidden">
        {/* ── Background ── */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0 grid-bg" />
          <div className="blob1 absolute -top-40 -left-40 w-[620px] h-[620px] bg-gradient-to-br from-blue-200/50 via-violet-200/30 to-transparent rounded-full blur-3xl" />
          <div className="blob2 absolute -top-10 right-0   w-[500px] h-[500px] bg-gradient-to-bl from-pink-200/40 via-violet-200/20 to-transparent rounded-full blur-3xl" />
          <div className="blob3 absolute top-[60vh] left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-r from-indigo-200/30 via-cyan-200/20 to-pink-200/30 rounded-full blur-3xl" />
        </div>

        {/* ══ NAVBAR ══════════════════════════════════════ */}
        <nav
          className={cn(
            "fixed top-0 inset-x-0 z-50 transition-all duration-300",
            scrolled
              ? "bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm"
              : "bg-transparent",
          )}
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <AnimatedLogo size={38} />
              <span
                className="font-bold text-lg tracking-tight text-gray-900"
                style={{ fontFamily: "'Bricolage Grotesque',sans-serif" }}
              >
                Canvas<GradientText>Flow</GradientText>
              </span>
            </div>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
              <a
                href="#features"
                className="hover:text-gray-900 transition-colors"
              >
                Features
              </a>
              <a href="#demo" className="hover:text-gray-900 transition-colors">
                Demo
              </a>
              <a
                href="#built-with"
                className="hover:text-gray-900 transition-colors"
              >
                Built With
              </a>
            </div>

            {/* Auth */}
            <div className="flex items-center gap-3">
              <SignInButton mode="modal" fallbackRedirectUrl="/project">
                <button className="rounded-xl px-5 py-2.5 text-sm font-semibold border border-gray-200 bg-white/80 text-gray-700 hover:bg-white hover:border-blue-300 hover:scale-[1.02] transition-all">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton
                mode="modal"
                fallbackRedirectUrl="/sync"
                signInFallbackRedirectUrl="/sync"
              >
                <ShimmerButton className="rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg">
                  Get Started Free
                </ShimmerButton>
              </SignUpButton>
            </div>
          </div>
        </nav>

        {/* ══ HERO ════════════════════════════════════════ */}
        <section className="relative z-10 pt-32 pb-16 px-6 flex flex-col items-center text-center min-h-screen justify-center">
          <Particles
            className="absolute inset-0 pointer-events-none"
            quantity={60}
            color="#8B5CF6"
          />

          {/* Badge */}
          <div className="hero-1 mb-8">
            <AnimatedGradientText>
              <span className="text-xs font-bold tracking-widest uppercase">
                ✦ Now in Public Beta · Free Forever
              </span>
            </AnimatedGradientText>
          </div>

          {/* Logo large */}
          <div className="hero-2 mb-10 relative">
            <div className="absolute -inset-8 rounded-3xl bg-gradient-to-r from-blue-100 via-violet-100 to-pink-100 blur-2xl opacity-60 animate-pulse" />
            <AnimatedLogo size={96} />
          </div>

          {/* Headline */}
          <h1 className="hero-3 text-5xl md:text-7xl font-black tracking-tight text-gray-900 leading-[1.05] mb-6 max-w-4xl">
            Design Together, <br className="hidden md:block" />
            <GradientText>In Real Time</GradientText>
          </h1>

          {/* CTAs */}
          <div className="hero-5 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-semibold border border-gray-200 bg-white/80 text-gray-700 hover:bg-white hover:border-violet-300 hover:scale-[1.03] transition-all shadow-sm backdrop-blur"
            >
              <span className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs">
                ▶
              </span>
              Watch Demo
            </a>
          </div>

          {/* Social proof */}
          <div className="hero-5 mt-12 flex flex-wrap justify-center gap-8 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="text-yellow-400">★★★★★</span> 4.9/5 rating
            </span>
            <span>· 2,000+ teams onboard</span>
            <span>· No credit card required</span>
          </div>

          {/* Scroll cue */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-300 animate-bounce">
            <div className="w-5 h-8 rounded-full border-2 border-gray-200 flex items-start justify-center pt-1">
              <div className="w-1 h-2 bg-gray-300 rounded-full animate-pulse" />
            </div>
          </div>
        </section>

        {/* ══ MARQUEE ═════════════════════════════════════ */}
        <div className="relative z-10 border-y border-gray-100 bg-white/60 backdrop-blur py-4 overflow-hidden">
          <Marquee pauseOnHover className="[--duration:18s]">
            {MARQUEE_ITEMS.map((item) => (
              <MarqueeChip key={item.label} {...item} />
            ))}
          </Marquee>
        </div>

        {/* ══ STATS ════════════════════════════════════════ */}
        <section className="relative z-10 py-20 px-6">
          <BlurFade inView delay={0.1}>
            <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 bg-white/70 backdrop-blur-md rounded-3xl border border-gray-100 shadow-lg p-10">
              {[
                { value: 10, suffix: "ms", label: "Sync Latency" },
                { value: 100, suffix: "+", label: "Concurrent Users" },
                { value: 2000, suffix: "+", label: "Teams Onboard" },
                { value: 99, suffix: ".9%", label: "Uptime" },
              ].map(({ value, suffix, label }) => (
                <div key={label} className="text-center">
                  <div className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br from-blue-500 to-violet-600 flex items-baseline justify-center gap-0.5">
                    <NumberTicker value={value} />
                    <span>{suffix}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1 font-medium">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </BlurFade>
        </section>

        {/* ══ FEATURES ════════════════════════════════════ */}
        <section id="features" className="relative z-10 py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <BlurFade inView delay={0.05} className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full border border-violet-200 bg-violet-50 text-violet-600 text-xs font-bold tracking-widest uppercase mb-4">
                Everything You Need
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight">
                Built for{" "}
                <SparklesText className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500">
                  Creative Teams
                </SparklesText>
              </h2>
              <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
                Every feature is designed to eliminate friction and let your
                team focus on what matters — great design.
              </p>
            </BlurFade>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f, i) => (
                <BlurFade key={i} inView delay={0.05 + i * 0.07}>
                  <MagicCard
                    className="rounded-2xl border border-gray-100 bg-white p-6 h-full cursor-default"
                    gradientColor={f.gradientColor}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                        f.bg,
                      )}
                    >
                      <span
                        className={cn(
                          "text-2xl bg-clip-text text-transparent bg-gradient-to-br",
                          f.color,
                        )}
                      >
                        {f.icon}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {f.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {f.desc}
                    </p>
                    <div
                      className={cn(
                        "mt-4 h-0.5 w-10 rounded-full bg-gradient-to-r",
                        f.color,
                      )}
                    />
                  </MagicCard>
                </BlurFade>
              ))}
            </div>
          </div>
        </section>

        {/* ══ DEMO VIDEO ══════════════════════════════════ */}
        <section id="demo" className="relative z-10 py-24 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-violet-50/50 pointer-events-none" />
          <div className="relative max-w-5xl mx-auto">
            <BlurFade inView delay={0.05} className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 rounded-full border border-pink-200 bg-pink-50 text-pink-600 text-xs font-bold tracking-widest uppercase mb-4">
                See It Live
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
                Watch the <GradientText>Magic Unfold</GradientText>
              </h2>
              <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
                Real-time collaboration, infinite canvas, and smart tools — in
                action.
              </p>
            </BlurFade>

            <BlurFade inView delay={0.15}>
              {/* ShineBorder wraps the video card */}
              <ShineBorder
                className="rounded-3xl overflow-hidden bg-white p-0"
                borderWidth={2}
              >
                {/* Browser chrome */}
                <div className="bg-gray-900 px-4 py-3 flex items-center gap-2 border-b border-gray-700">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4 rounded-md bg-gray-800 text-gray-400 text-xs px-3 py-1 font-mono">
                    {/* ← update with your app URL */}
                    canvasflow.app/canvas/demo
                  </div>
                </div>

                {/* Video — drop your file at /public/demo.mp4 */}
                <div className="relative bg-gray-950 aspect-video flex items-center justify-center group">
                  <video
                    className="w-full h-full object-cover"
                    controls
                    preload="metadata"
                  >
                    <source src="/demo.mp4" type="video/mp4" />
                  </video>
                  {/* Placeholder until video loads */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                    <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-3xl ml-1 text-gray-800">▶</span>
                    </div>
                    <p className="mt-4 text-white/60 text-xs font-mono bg-black/30 px-4 py-1.5 rounded-full backdrop-blur">
                      /public/demo.mp4
                    </p>
                  </div>
                </div>
              </ShineBorder>
            </BlurFade>
          </div>
        </section>

        {/* ══ BUILT WITH ══════════════════════════════════ */}
        <section
          id="built-with"
          className="relative z-10 py-24 px-6 overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none">
            <DotPattern
              className={cn(
                "opacity-25",
                "[mask-image:radial-gradient(ellipse_at_center,white_30%,transparent_80%)]",
              )}
            />
          </div>

          <div className="relative max-w-5xl mx-auto">
            <BlurFade inView delay={0.05} className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 text-xs font-bold tracking-widest uppercase mb-4">
                Under the Hood
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                Engineered with <GradientText>battle-tested</GradientText> tech
              </h2>
              <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
                Every layer of the stack was chosen for performance, developer
                experience, and scale.
              </p>
            </BlurFade>

            <div className="grid md:grid-cols-2 gap-5">
              {STACK.map((item, i) => (
                <BlurFade key={item.name} inView delay={0.08 + i * 0.08}>
                  <div className="relative rounded-2xl border border-gray-100 bg-white p-6 overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                    <BorderBeam size={200} duration={10} delay={i * 2} />
                    <Meteors number={4} />
                    <div className="relative z-10 flex items-start gap-4">
                      {/* Logo pill */}
                      <div
                        className={cn(
                          "w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br shadow-lg",
                          item.color,
                        )}
                      >
                        {item.logo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <HyperText className="text-lg font-bold text-gray-900 tracking-tight">
                            {item.name}
                          </HyperText>
                          <span className="text-xs font-semibold text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full shrink-0">
                            {item.role}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </BlurFade>
              ))}
            </div>

            {/* Extra tech chips */}
            <BlurFade
              inView
              delay={0.4}
              className="mt-8 flex flex-wrap justify-center gap-3"
            >
              {[
                "TypeScript",
                "Clerk Auth",
                "Tailwind CSS",
                "shadcn/ui",
                "Prisma ORM",
                "Docker",
                "WebSockets",
                "Magic UI",
              ].map((t) => (
                <span
                  key={t}
                  className="px-4 py-2 rounded-full border border-gray-200 bg-white text-xs font-semibold text-gray-500 shadow-sm"
                >
                  {t}
                </span>
              ))}
            </BlurFade>
          </div>
        </section>

        {/* ══ CTA BANNER ══════════════════════════════════ */}
        <section className="relative z-10 py-16 px-6">
          <BlurFade inView delay={0.1}>
            <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden relative">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg,#3B82F6 0%,#8B5CF6 50%,#EC4899 100%)",
                }}
              />
              <div className="absolute inset-0 grid-bg opacity-20" />
              <Particles
                className="absolute inset-0"
                quantity={40}
                color="#ffffff"
              />
              <div className="relative z-10 py-16 px-10 text-center">
                <div className="flex justify-center mb-6">
                  <AnimatedLogo size={64} />
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                  Your canvas awaits.
                </h2>
                <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto">
                  Join thousands of designers and teams building together in
                  real time. Free forever. No credit card.
                </p>
              </div>
            </div>
          </BlurFade>
        </section>

        {/* ══ FOOTER ══════════════════════════════════════ */}
        <footer className="relative z-10 border-t border-gray-100 bg-white/60 backdrop-blur py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex flex-col items-center md:items-start gap-3">
                <div className="flex items-center gap-3">
                  <AnimatedLogo size={36} />
                  <span
                    className="font-bold text-lg text-gray-900"
                    style={{ fontFamily: "'Bricolage Grotesque',sans-serif" }}
                  >
                    Canvas<GradientText>Flow</GradientText>
                  </span>
                </div>
                <p className="text-sm text-gray-400 max-w-xs text-center md:text-left">
                  Real-time collaborative design canvas for modern creative
                  teams.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
                <a
                  href="#features"
                  className="hover:text-blue-600 transition-colors font-medium"
                >
                  Features
                </a>
                <a
                  href="#demo"
                  className="hover:text-blue-600 transition-colors font-medium"
                >
                  Demo
                </a>
                <a
                  href="#built-with"
                  className="hover:text-blue-600 transition-colors font-medium"
                >
                  Built With
                </a>
                {/* ↓ Replace with your real links */}
                <a
                  href="https://github.com/yourusername/canvasflow"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-600 transition-colors font-medium"
                >
                  GitHub
                </a>
                <a
                  href="https://twitter.com/yourhandle"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-600 transition-colors font-medium"
                >
                  Twitter
                </a>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-400">
              <span>
                © {new Date().getFullYear()} CanvasFlow. All rights reserved.
              </span>
              <span className="flex items-center gap-1">
                Built with <span className="text-red-400 mx-1">♥</span> using
                Next.js · NestJS · PostgreSQL · Liveblocks · Clerk
              </span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
