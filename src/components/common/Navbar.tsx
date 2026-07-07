"use client";

import { UserButton } from "@clerk/nextjs";
import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Bell,
  LayoutDashboard,
  Search,
  Command,
  Send,
  User,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { UniversalSearch } from "@/components/search/UniversalSearch";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/project", icon: FolderOpen },
  { label: "Requests", href: "/requests", icon: Bell },
  { label: "Invitations", href: "/invitations", icon: Send },
];

const BOTTOM_ITEMS = [
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
];

function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <aside
        className={`relative flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 shrink-0 ${
          collapsed ? "w-15" : "w-55"
        }`}
      >
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

        <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
          <button
            onClick={() => setSearchOpen(true)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-gray-400 hover:bg-gray-100 hover:text-gray-600 ${
              collapsed ? "justify-center" : ""
            }`}
            title={collapsed ? "Search (Ctrl+K)" : undefined}
          >
            <Search size={18} className="shrink-0" />
            {!collapsed && (
              <span className="flex-1 text-left">Search</span>
            )}
            {!collapsed && (
              <kbd className="text-[10px] text-gray-300 bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <Command size={10} />
                K
              </kbd>
            )}
          </button>

          <div className="h-px bg-gray-100 my-1" />

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

        {/* Bottom nav items */}
        <div className="py-2 px-2 flex flex-col gap-1 border-t border-gray-100 mt-auto">
          {BOTTOM_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href;
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
        </div>

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

      <UniversalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

export default Sidebar;
