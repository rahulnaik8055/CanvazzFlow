"use client";

import { useAccessRequests } from "@/hooks/useAccessRequests";
import { UserButton } from "@clerk/nextjs";
import { ChevronLeft, ChevronRight, FolderOpen, Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { RequestsPanel } from "../requests/RequestsPanel";

const NAV_ITEMS = [{ label: "Projects", href: "/project", icon: FolderOpen }];

function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <>
      <aside
        className={`relative flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 shrink-0 ${
          collapsed ? "w-15" : "w-55"
        }`}
      >
        {/* Logo */}
        <div
          className={`flex items-center h-16 border-b border-gray-100 px-4 ${
            collapsed ? "justify-center" : "gap-2"
          }`}
        >
          <UserButton afterSwitchSessionUrl="/" />
          {!collapsed && (
            <span className="font-semibold text-gray-900 text-sm">
              Design Tool
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive =
              pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Toggle button */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors z-10"
        >
          {collapsed ? (
            <ChevronRight size={12} className="text-gray-500" />
          ) : (
            <ChevronLeft size={12} className="text-gray-500" />
          )}
        </button>
      </aside>
    </>
  );
}

export default Sidebar;
