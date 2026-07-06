"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/requests/ConfirmationDialog";

interface BulkActionsToolbarProps {
  selectedCount: number;
  onApproveAll: () => Promise<void>;
  onRejectAll: () => Promise<void>;
  onClear: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  onApproveAll,
  onRejectAll,
  onClear,
}: BulkActionsToolbarProps) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  if (selectedCount === 0) return null;

  const handleApprove = async () => {
    setApproving(true);
    try {
      await onApproveAll();
      setApproveOpen(false);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await onRejectAll();
      setRejectOpen(false);
    } finally {
      setRejecting(false);
    }
  };

  return (
    <>
      <div className="sticky bottom-4 z-30 mx-auto flex w-fit items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
        <span className="text-sm font-medium text-gray-700">
          {selectedCount} {selectedCount === 1 ? "request" : "requests"} selected
        </span>
        <div className="h-5 w-px bg-gray-200" />
        <Button
          variant="default"
          size="sm"
          onClick={() => setApproveOpen(true)}
        >
          <CheckCircle2 size={14} />
          Approve all
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setRejectOpen(true)}
        >
          <XCircle size={14} />
          Reject all
        </Button>
        <button
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Clear
        </button>
      </div>

      <ConfirmationDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve requests"
        description={`Are you sure you want to approve ${selectedCount} ${selectedCount === 1 ? "request" : "requests"}?`}
        confirmLabel={approving ? "Approving..." : "Approve"}
        onConfirm={handleApprove}
        loading={approving}
      />

      <ConfirmationDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject requests"
        description={`Are you sure you want to reject ${selectedCount} ${selectedCount === 1 ? "request" : "requests"}?`}
        confirmLabel={rejecting ? "Rejecting..." : "Reject"}
        variant="danger"
        onConfirm={handleReject}
        loading={rejecting}
      />
    </>
  );
}
