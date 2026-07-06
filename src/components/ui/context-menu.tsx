"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Item {
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

interface ContextMenuProps {
  items: Item[];
  children: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export function ContextMenu({ items, children, onOpenChange }: ContextMenuProps) {
  const [state, setState] = useState<{ open: boolean; x: number; y: number }>({
    open: false,
    x: 0,
    y: 0,
  });
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setState((prev) => {
      if (prev.open) onOpenChange?.(false);
      return { ...prev, open: false };
    });
  }, [onOpenChange]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [close]);

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 180);
    const y = Math.min(e.clientY, window.innerHeight - 200);
    setState({ open: true, x, y });
    onOpenChange?.(true);
  }

  return (
    <div ref={ref} onContextMenu={handleContextMenu}>
      {children}
      {state.open && (
        <div
          className="fixed z-[100] min-w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
          style={{ left: state.x, top: state.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  close();
                }
              }}
              disabled={item.disabled}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                item.danger
                  ? "text-red-600 hover:bg-red-50"
                  : "text-gray-700 hover:bg-gray-50"
              } ${item.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {item.icon && <span className="w-3.5 h-3.5 shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
