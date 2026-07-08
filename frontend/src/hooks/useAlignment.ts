import { useCallback } from "react";
import { Node } from "@/types/CanvasTypes";

function effW(n: Node) {
  return n.type === "circle" ? n.radius * 2 : n.width;
}

function effH(n: Node) {
  return n.type === "circle" ? n.radius * 2 : n.height;
}

function getBounds(n: Node) {
  const w = effW(n);
  const h = effH(n);
  return {
    left: n.x,
    right: n.x + w,
    centerX: n.x + w / 2,
    top: n.y,
    bottom: n.y + h,
    centerY: n.y + h / 2,
  };
}

export function useAlignment(
  nodes: Node[],
  setNodes: (nodes: Node[]) => void,
  saveToHistory: (nodes: Node[]) => void,
) {
  const align = useCallback(
    (selectedIds: string[], getPos: (n: Node) => number, getRef: (values: number[]) => number, keepOffset: boolean) => {
      const selected = nodes.filter((n) => selectedIds.includes(n.id));
      if (selected.length < 2) return;

      const vals = selected.map((n) => ({ id: n.id, val: getPos(n) }));
      const reference = getRef(vals.map((v) => v.val));

      const newNodes = nodes.map((n) => {
        const v = vals.find((x) => x.id === n.id);
        if (!v) return n;
        const offset = keepOffset ? n.x - v.val : 0;
        return { ...n, x: reference + offset };
      });

      setNodes(newNodes);
      saveToHistory(newNodes);
    },
    [nodes, setNodes, saveToHistory],
  );

  const alignVertical = useCallback(
    (selectedIds: string[], getPos: (n: Node) => number, getRef: (values: number[]) => number, keepOffset: boolean) => {
      const selected = nodes.filter((n) => selectedIds.includes(n.id));
      if (selected.length < 2) return;

      const vals = selected.map((n) => ({ id: n.id, val: getPos(n) }));
      const reference = getRef(vals.map((v) => v.val));

      const newNodes = nodes.map((n) => {
        const v = vals.find((x) => x.id === n.id);
        if (!v) return n;
        const offset = keepOffset ? n.y - v.val : 0;
        return { ...n, y: reference + offset };
      });

      setNodes(newNodes);
      saveToHistory(newNodes);
    },
    [nodes, setNodes, saveToHistory],
  );

  const minOf = (vals: number[]) => Math.min(...vals);
  const maxOf = (vals: number[]) => Math.max(...vals);
  const avgOf = (vals: number[]) => vals.reduce((a, b) => a + b, 0) / vals.length;

  const alignLeft = useCallback(
    (selectedIds: string[]) => {
      align(selectedIds, (n) => n.x, minOf, false);
    },
    [align],
  );

  const alignCenterX = useCallback(
    (selectedIds: string[]) => {
      align(selectedIds, (n) => n.x + n.width / 2, avgOf, true);
    },
    [align],
  );

  const alignRight = useCallback(
    (selectedIds: string[]) => {
      align(selectedIds, (n) => n.x + n.width, maxOf, true);
    },
    [align],
  );

  const alignTop = useCallback(
    (selectedIds: string[]) => {
      alignVertical(selectedIds, (n) => n.y, minOf, false);
    },
    [alignVertical],
  );

  const alignCenterY = useCallback(
    (selectedIds: string[]) => {
      alignVertical(selectedIds, (n) => n.y + n.height / 2, avgOf, true);
    },
    [alignVertical],
  );

  const alignBottom = useCallback(
    (selectedIds: string[]) => {
      alignVertical(selectedIds, (n) => n.y + n.height, maxOf, true);
    },
    [alignVertical],
  );

  const distributeFn = useCallback(
    (selectedIds: string[], axis: "x" | "y") => {
      const selected = nodes.filter((n) => selectedIds.includes(n.id));
      if (selected.length < 3) return;

      const sorted = [...selected].sort((a, b) => {
        const aVal = axis === "x"
          ? a.x + effW(a) / 2
          : a.y + effH(a) / 2;
        const bVal = axis === "x"
          ? b.x + effW(b) / 2
          : b.y + effH(b) / 2;
        return aVal - bVal;
      });

      const first = sorted[0];
      const last = sorted[sorted.length - 1];

      const firstCenter =
        axis === "x"
          ? first.x + effW(first) / 2
          : first.y + effH(first) / 2;
      const lastCenter =
        axis === "x"
          ? last.x + effW(last) / 2
          : last.y + effH(last) / 2;

      const totalSpace = lastCenter - firstCenter;
      const gap = totalSpace / (sorted.length - 1);

      const idOffsetMap = new Map<string, number>();

      sorted.forEach((node, i) => {
        const centerOffset =
          axis === "x" ? node.x + effW(node) / 2 : node.y + effH(node) / 2;
        idOffsetMap.set(node.id, centerOffset - (firstCenter + gap * i));
      });

      const newNodes = nodes.map((n) => {
        const offset = idOffsetMap.get(n.id);
        if (offset === undefined) return n;
        return { ...n, [axis]: n[axis] - offset };
      });

      setNodes(newNodes);
      saveToHistory(newNodes);
    },
    [nodes, setNodes, saveToHistory],
  );

  const distributeHorizontally = useCallback(
    (selectedIds: string[]) => {
      distributeFn(selectedIds, "x");
    },
    [distributeFn],
  );

  const distributeVertically = useCallback(
    (selectedIds: string[]) => {
      distributeFn(selectedIds, "y");
    },
    [distributeFn],
  );

  return {
    alignLeft,
    alignCenterX,
    alignRight,
    alignTop,
    alignCenterY,
    alignBottom,
    distributeHorizontally,
    distributeVertically,
  };
}
