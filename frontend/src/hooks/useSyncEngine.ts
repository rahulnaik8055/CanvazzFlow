import { useCallback, useEffect, useRef, useState } from "react";
import { Node } from "@/types/CanvasTypes";

export type SyncStatus = "idle" | "pending" | "syncing" | "retrying" | "error";

interface UpsertOp {
  type: "upsert";
  node: Node;
}
interface DeleteOp {
  type: "delete";
  id: string;
}
type MutationOp = UpsertOp | DeleteOp;

type MutationQueue = Map<string, MutationOp>;

export interface Delta {
  upserts: Node[];
  deletes: string[];
}

export interface SyncEngineOptions {
  debounceMs?: number;
  maxRetries?: number;
  retryBaseMs?: number;
}

export interface SyncEngineReturn {
  enqueue: (op: MutationOp, currentNodes: Node[]) => void;
  forceFlush: (currentNodes: Node[]) => void;
  retry: (currentNodes: Node[]) => void;
  syncStatus: SyncStatus;
}

export function useSyncEngine(
  onFlush: (delta: Delta) => Promise<void>,
  options: SyncEngineOptions = {},
): SyncEngineReturn {
  const { debounceMs = 800, maxRetries = 3, retryBaseMs = 1000 } = options;

  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  const queue = useRef<MutationQueue>(new Map());
  const isSyncing = useRef(false);
  const hasMutationDuringSyncing = useRef(false);
  const retryCount = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const drainQueue = (): Delta => {
    const upserts: Node[] = [];
    const deletes: string[] = [];

    queue.current.forEach((op) => {
      if (op.type === "upsert") upserts.push(op.node);
      else deletes.push(op.id);
    });

    queue.current = new Map();
    return { upserts, deletes };
  };

  const flush = useCallback(
    async (currentNodes: Node[]) => {
      if (isSyncing.current || queue.current.size === 0) return;

      isSyncing.current = true;
      hasMutationDuringSyncing.current = false;
      setSyncStatus("syncing");

      const delta = drainQueue();

      try {
        await onFlush(delta);

        retryCount.current = 0;
        isSyncing.current = false;

        if (hasMutationDuringSyncing.current) {
          setSyncStatus("pending");
          debounceTimer.current = setTimeout(
            () => flush(currentNodes),
            debounceMs,
          );
        } else {
          setSyncStatus("idle");
        }
      } catch {
        isSyncing.current = false;

        delta.upserts.forEach((node) => {
          if (!queue.current.has(node.id)) {
            queue.current.set(node.id, { type: "upsert", node });
          }
        });
        delta.deletes.forEach((id) => {
          if (!queue.current.has(id)) {
            queue.current.set(id, { type: "delete", id });
          }
        });

        if (retryCount.current < maxRetries) {
          const backoffMs = retryBaseMs * 2 ** retryCount.current;
          retryCount.current++;
          setSyncStatus("retrying");
          retryTimer.current = setTimeout(() => flush(currentNodes), backoffMs);
        } else {
          retryCount.current = 0;
          setSyncStatus("error");
        }
      }
    },
    [onFlush, debounceMs, maxRetries, retryBaseMs],
  );

  const enqueue = useCallback(
    (op: MutationOp, currentNodes: Node[]) => {
      const id = op.type === "upsert" ? op.node.id : op.id;

      if (op.type === "delete") {
        const existing = queue.current.get(id);
        if (existing?.type === "upsert") {
          queue.current.delete(id);
          if (queue.current.size === 0 && !isSyncing.current) {
            setSyncStatus("idle");
            return;
          }
        } else {
          queue.current.set(id, op);
        }
      } else {
        queue.current.set(id, op);
      }

      if (isSyncing.current) {
        hasMutationDuringSyncing.current = true;
        return;
      }

      setSyncStatus("pending");

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => flush(currentNodes), debounceMs);
    },
    [flush, debounceMs],
  );

  const forceFlush = useCallback(
    (currentNodes: Node[]) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (retryTimer.current) clearTimeout(retryTimer.current);
      flush(currentNodes);
    },
    [flush],
  );

  const retry = useCallback(
    (currentNodes: Node[]) => {
      if (syncStatus !== "error") return;
      setSyncStatus("pending");
      flush(currentNodes);
    },
    [syncStatus, flush],
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, []);

  return { enqueue, forceFlush, retry, syncStatus };
}
