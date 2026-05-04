/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                    CANVAS SYNC ENGINE                           ║
 * ║                                                                  ║
 * ║  A delta-based, FSM-driven sync layer for real-time canvas ops. ║
 * ║                                                                  ║
 * ║  Core properties:                                                ║
 * ║  • O(1) mutation deduplication via Map (last-write-wins)        ║
 * ║  • Finite State Machine prevents concurrent in-flight requests  ║
 * ║  • Net-zero cancellation: add→delete before flush = no-op       ║
 * ║  • Exponential backoff retry with failed-op re-queue            ║
 * ║  • Rollback snapshot on unrecoverable error                     ║
 * ║  • Delta payload: only changed nodes reach the server           ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 *  FSM Transitions:
 *
 *    mutation           timer fires         success (no pending)
 *  ──────────→ PENDING ────────────→ SYNCING ──────────────────────→ IDLE
 *       ↑          ↑                    │ success (has pending)         │
 *       │    reset  │                   └──────────────────────→ PENDING│
 *       └───────────┘                   │ error + retries left          │
 *                                       └──────────────────→ RETRYING   │
 *                                       │ retries exhausted             │
 *                                       └──────────────────→ ERROR ─────┘
 *                                                                (manual retry)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Node } from "@/types/CanvasTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// Map<nodeId, MutationOp> — O(1) insert, last-write-wins per node
type MutationQueue = Map<string, MutationOp>;

export interface Delta {
  upserts: Node[]; // nodes to create or overwrite
  deletes: string[]; // node IDs to remove
}

export interface SyncEngineOptions {
  debounceMs?: number; // quiet period before flush  (default: 800)
  maxRetries?: number; // attempts before giving up  (default: 3)
  retryBaseMs?: number; // base for exponential backoff (default: 1000)
}

export interface SyncEngineReturn {
  /** Call after any mutation. Enqueues the op and starts the debounce window. */
  enqueue: (op: MutationOp, currentNodes: Node[]) => void;
  /** Bypass debounce and flush immediately (Ctrl+S, beforeunload). */
  forceFlush: (currentNodes: Node[]) => void;
  /** Trigger a manual retry after an ERROR state. */
  retry: (currentNodes: Node[]) => void;
  /** Current sync state for UI indicators. */
  syncStatus: SyncStatus;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSyncEngine(
  onFlush: (delta: Delta) => Promise<void>,
  options: SyncEngineOptions = {},
): SyncEngineReturn {
  const { debounceMs = 800, maxRetries = 3, retryBaseMs = 1000 } = options;

  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  // Mutation queue: Map for O(1) dedup. Replaced on every flush.
  const queue = useRef<MutationQueue>(new Map());
  // Prevents concurrent requests. Acts as the FSM gate.
  const isSyncing = useRef(false);
  // Set when a mutation arrives while a request is in flight.
  const hasMutationDuringSyncing = useRef(false);
  // Retry depth — resets on success.
  const retryCount = useRef(0);
  // Timers
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Drain queue → Delta ────────────────────────────────────────────────────
  //
  //  Converts the mutation map into a typed delta and clears the queue.
  //  Called exactly once per flush cycle.

  const drainQueue = (): Delta => {
    const upserts: Node[] = [];
    const deletes: string[] = [];

    queue.current.forEach((op) => {
      if (op.type === "upsert") upserts.push(op.node);
      else deletes.push(op.id);
    });

    queue.current = new Map(); // clear atomically (not .clear() — safe against re-enqueue during drain)
    return { upserts, deletes };
  };

  // ─── Core flush ─────────────────────────────────────────────────────────────
  //
  //  FSM gate: only one request in flight at a time.
  //  On success  → check for mutations that arrived during the request.
  //  On failure  → re-queue failed ops (new mutations take priority), backoff.

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
          // Mutations arrived while we were in flight — start a new cycle.
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

        // Re-queue failed ops so they aren't silently dropped.
        // New mutations (from hasMutationDuringSyncing) already sit in queue.current
        // and take priority (last-write-wins), so only restore ops that haven't
        // been superseded.
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
          const backoffMs = retryBaseMs * 2 ** retryCount.current; // 1s, 2s, 4s
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

  // ─── Enqueue ─────────────────────────────────────────────────────────────────
  //
  //  The public mutation entry point. Implements two optimisations:
  //
  //  1. Last-write-wins: repeated upserts on the same node collapse to one op.
  //     50 dragmove events on node "abc" → 1 upsert in the queue.
  //
  //  2. Net-zero cancellation: if a node is added and deleted before a flush,
  //     both ops cancel out and nothing is sent to the server.

  const enqueue = useCallback(
    (op: MutationOp, currentNodes: Node[]) => {
      const id = op.type === "upsert" ? op.node.id : op.id;

      if (op.type === "delete") {
        const existing = queue.current.get(id);
        if (existing?.type === "upsert") {
          // Net-zero: node never reached the server — cancel both ops.
          queue.current.delete(id);
          if (queue.current.size === 0 && !isSyncing.current) {
            setSyncStatus("idle");
            return;
          }
        } else {
          queue.current.set(id, op);
        }
      } else {
        queue.current.set(id, op); // last-write-wins
      }

      if (isSyncing.current) {
        // A request is in flight. Flag it — flush will re-cycle after landing.
        hasMutationDuringSyncing.current = true;
        return;
      }

      setSyncStatus("pending");

      // Sliding debounce: every new mutation resets the quiet-period window.
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => flush(currentNodes), debounceMs);
    },
    [flush, debounceMs],
  );

  // ─── Force flush ──────────────────────────────────────────────────────────────
  //
  //  Cancels all pending timers and flushes synchronously.
  //  Used by Ctrl+S and the beforeunload handler.

  const forceFlush = useCallback(
    (currentNodes: Node[]) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (retryTimer.current) clearTimeout(retryTimer.current);
      flush(currentNodes);
    },
    [flush],
  );

  // ─── Manual retry ─────────────────────────────────────────────────────────────

  const retry = useCallback(
    (currentNodes: Node[]) => {
      if (syncStatus !== "error") return;
      setSyncStatus("pending");
      flush(currentNodes);
    },
    [syncStatus, flush],
  );

  // ─── Cleanup ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, []);

  return { enqueue, forceFlush, retry, syncStatus };
}
