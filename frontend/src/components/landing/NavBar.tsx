"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Architecture", href: "#architecture" },
  { label: "Demo", href: "#demo" },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-[10px] font-bold text-white tracking-tight">
            CF
          </div>
          <span className="text-base font-semibold text-gray-900">
            Canvazz Flow
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <SignInButton mode="modal">
            <Button variant="ghost" size="sm" className="text-sm text-gray-600">
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton mode="modal" fallbackRedirectUrl="/sync">
            <Button
              size="sm"
              className="text-sm bg-gray-900 text-white hover:bg-gray-800"
            >
              Get Started Free
            </Button>
          </SignUpButton>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-gray-500 hover:text-gray-900"
          aria-label="Menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block text-sm text-gray-600 hover:text-gray-900 py-1"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <SignInButton mode="modal">
              <Button variant="outline" size="sm" className="w-full">
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal" fallbackRedirectUrl="/sync">
              <Button
                size="sm"
                className="w-full bg-gray-900 text-white hover:bg-gray-800"
              >
                Get Started Free
              </Button>
            </SignUpButton>
          </div>
        </div>
      )}
    </header>
  );
}
