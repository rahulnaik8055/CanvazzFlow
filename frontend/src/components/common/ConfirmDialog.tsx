"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  loading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const iconBg =
    variant === "danger"
      ? "bg-red-100"
      : variant === "warning"
        ? "bg-amber-100"
        : "bg-gray-100";

  const iconColor =
    variant === "danger"
      ? "text-red-600"
      : variant === "warning"
        ? "text-amber-600"
        : "text-gray-600";

  const confirmBg =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : variant === "warning"
        ? "bg-amber-600 hover:bg-amber-700"
        : "bg-gray-900 hover:bg-gray-800";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-xl shadow-xl border border-gray-200 p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
              {variant === "danger" ? (
                <Trash2 size={18} className={iconColor} />
              ) : (
                <AlertTriangle size={18} className={iconColor} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Dialog.Title className="text-sm font-semibold text-gray-900">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                {description}
              </Dialog.Description>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-5">
            <Dialog.Close asChild>
              <button
                disabled={loading}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                {cancelLabel}
              </button>
            </Dialog.Close>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-3 py-1.5 text-xs font-medium text-white ${confirmBg} rounded-lg transition-colors disabled:opacity-50`}
            >
              {loading ? "Processing..." : confirmLabel}
            </button>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              disabled={loading}
            >
              <X size={14} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
