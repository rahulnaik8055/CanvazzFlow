"use client";

import { type ReactNode } from "react";
import { Plus, RefreshCw } from "lucide-react";

// Custom SVG illustrations for each empty state context
const Illustrations = {
  projects: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="18" width="80" height="84" rx="10" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1.5" />
      <rect x="32" y="34" width="56" height="4" rx="2" fill="#D1D5DB" />
      <rect x="32" y="44" width="40" height="4" rx="2" fill="#E5E7EB" />
      <rect x="32" y="54" width="48" height="4" rx="2" fill="#E5E7EB" />
      <rect x="32" y="64" width="28" height="4" rx="2" fill="#E5E7EB" />
      <circle cx="98" cy="28" r="14" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.5" />
      <path d="M98 22v12M92 28h12" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  requests: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="24" y="22" width="72" height="76" rx="10" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1.5" />
      <path d="M24 46h72" stroke="#E5E7EB" strokeWidth="1.5" />
      <rect x="36" y="56" width="20" height="20" rx="4" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.5" />
      <path d="M46 62v8M42 66h8" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="64" y="56" width="20" height="20" rx="4" fill="#FEF3C7" stroke="#FCD34D" strokeWidth="1.5" />
      <path d="M74 62v8M70 66h8" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="36" y="82" width="20" height="4" rx="2" fill="#E5E7EB" />
      <rect x="64" y="82" width="20" height="4" rx="2" fill="#E5E7EB" />
    </svg>
  ),

  members: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="48" cy="42" r="14" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1.5" />
      <path d="M24 86c0-13.3 10.7-24 24-24s24 10.7 24 24" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="82" cy="50" r="12" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1.5" strokeDasharray="3 2" />
      <path d="M68 86c0-11 8.3-19.7 19-20" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1.5" strokeDasharray="3 2" strokeLinecap="round" />
      <circle cx="96" cy="36" r="10" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.5" />
      <path d="M96 32v8M92 36h8" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  search: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="52" cy="52" r="22" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1.5" />
      <path d="M68 68l16 16" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="52" y1="42" x2="52" y2="62" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />
      <line x1="42" y1="52" x2="62" y2="52" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />
      <circle cx="94" cy="40" r="8" fill="#FEE2E2" stroke="#FCA5A5" strokeWidth="1.5" opacity="0.8" />
      <path d="M94 37v6M91 40h6" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  notifications: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 22c-11 0-20 9-20 20v6c0 4-1.5 8-4 11l-3 4c-1 1.5-.5 3.5 1 4.5 6 3.5 15.5 6 26 6s20-2.5 26-6c1.5-1 2-3 1-4.5l-3-4c-2.5-3-4-7-4-11v-6c0-11-9-20-20-20z" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1.5" />
      <path d="M50 72c0 5.5 4.5 10 10 10s10-4.5 10-10" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="80" cy="40" r="8" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.5" />
      <path d="M80 37v6M77 40h6" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  pages: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="28" y="16" width="64" height="88" rx="8" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1.5" />
      <rect x="36" y="30" width="48" height="2" rx="1" fill="#D1D5DB" />
      <rect x="36" y="38" width="36" height="2" rx="1" fill="#E5E7EB" />
      <rect x="36" y="46" width="42" height="2" rx="1" fill="#E5E7EB" />
      <rect x="36" y="54" width="24" height="2" rx="1" fill="#E5E7EB" />
      <circle cx="88" cy="28" r="12" fill="#E0E7FF" stroke="#A5B4FC" strokeWidth="1.5" />
      <path d="M88 24v8M84 28h8" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  generic: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="24" width="60" height="72" rx="10" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1.5" />
      <circle cx="60" cy="56" r="14" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.5" />
      <path d="M60 50v12M54 56h12" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

type IllustrationKey = keyof typeof Illustrations;

interface ActionButton {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: "primary" | "secondary";
}

interface EmptyStateProps {
  illustration?: IllustrationKey | ReactNode;
  title: string;
  description?: string;
  action?: ActionButton | ActionButton[];
}

function isActionArray(a: ActionButton | ActionButton[] | undefined): a is ActionButton[] {
  return Array.isArray(a);
}

function EmptyStateAction({ action, className }: { action: ActionButton; className?: string }) {
  const base =
    action.variant === "secondary"
      ? "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
      : "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors";

  return (
    <button onClick={action.onClick} className={`${base} ${className ?? ""}`}>
      {action.icon ?? (action.variant === "secondary" ? <RefreshCw size={14} /> : <Plus size={14} />)}
      {action.label}
    </button>
  );
}

export function EmptyState({
  illustration = "generic",
  title,
  description,
  action,
}: EmptyStateProps) {
  const illustrationNode =
    typeof illustration === "string" ? Illustrations[illustration as IllustrationKey] ?? Illustrations.generic : illustration;

  const actions = action ? (isActionArray(action) ? action : [action]) : [];

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <div className="mb-6">{illustrationNode}</div>
      <h3 className="text-base font-semibold text-gray-900 text-center mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-400 text-center max-w-xs leading-relaxed">{description}</p>
      )}
      {actions.length > 0 && (
        <div className={`flex items-center gap-3 mt-6 ${actions.length > 1 ? "flex-col sm:flex-row" : ""}`}>
          {actions.map((a, i) => (
            <EmptyStateAction key={i} action={a} />
          ))}
        </div>
      )}
    </div>
  );
}
