import { useRef, useCallback } from "react";
import { Node } from "@/types/CanvasTypes";

export function useDebouncedSave(
  saveNodes: (nodes: Node[]) => Promise<void>,
  delay = 800,
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (nodes: Node[]) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => saveNodes(nodes), delay);
    },
    [saveNodes, delay],
  );
}
