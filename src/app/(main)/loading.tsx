"use client";

import { useState } from "react";
import Sidebar from "@/components/common/Navbar";

export default function MainLoading() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="space-y-6 animate-pulse">
            <div className="h-7 bg-gray-100 rounded w-48" />
            <div className="flex items-center gap-3">
              <div className="h-9 bg-gray-100 rounded-lg w-64" />
              <div className="h-9 bg-gray-100 rounded-lg w-24" />
              <div className="flex-1" />
              <div className="h-9 bg-gray-100 rounded-lg w-28" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden"
                >
                  <div className="w-full aspect-[16/10] bg-gray-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-4/5" />
                    <div className="flex items-center gap-3 pt-2">
                      <div className="h-3 bg-gray-100 rounded w-12" />
                      <div className="h-3 bg-gray-100 rounded w-12" />
                      <div className="flex-1" />
                      <div className="h-3 bg-gray-100 rounded w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
