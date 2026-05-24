"use client";

import React, { useState, useEffect } from "react";

const MESSAGES = [
  "Good things take a moment...",
  "Creativity is loading...",
  "Crafting your workspace...",
  "Every great design starts here...",
  "Your canvas awaits...",
  "Making room for your ideas...",
  "Pixels are falling into place...",
  "Inspiration is on its way...",
  "The blank page is full of possibilities...",
  "Preparing something beautiful...",
];

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
}

export default function LoadingOverlay({
  isLoading,
  text,
}: LoadingOverlayProps) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/50">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-2xl border border-gray-200" />
          <div className="absolute inset-2 grid grid-cols-2 gap-1">
            <div className="rounded-sm bg-blue-500 animate-[pulse_1s_ease-in-out_0s_infinite]" />
            <div className="rounded-sm bg-violet-400 animate-[pulse_1s_ease-in-out_0.2s_infinite]" />
            <div className="rounded-sm bg-pink-400 animate-[pulse_1s_ease-in-out_0.4s_infinite]" />
            <div className="rounded-sm bg-indigo-400 animate-[pulse_1s_ease-in-out_0.6s_infinite]" />
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-blue-500 animate-spin" />
        </div>

        {text ? (
          <p className="text-sm font-medium text-gray-700">{text}</p>
        ) : (
          <p className="text-sm font-medium text-gray-700">{message}</p>
        )}
      </div>
    </div>
  );
}
