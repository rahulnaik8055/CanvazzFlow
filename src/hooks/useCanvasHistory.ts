import { useState, useCallback } from "react";
import { Node } from "@/types/CanvasTypes";

export const useCanvasHistory = (initialNodes: Node[] = []) => {
  const [history, setHistory] = useState<Node[][]>([initialNodes]);
  const [historyStep, setHistoryStep] = useState<number>(0);

  const saveToHistory = useCallback(
    (newNodes: Node[]) => {
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push(newNodes);
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    },
    [history, historyStep]
  );

  const undo = useCallback(
    (
      setNodes: (nodes: Node[]) => void,
      setSelectedIds: (ids: string[]) => void
    ) => {
      if (historyStep > 0) {
        setHistoryStep(historyStep - 1);
        setNodes(history[historyStep - 1]);
        setSelectedIds([]);
      }
    },
    [history, historyStep]
  );

  const redo = useCallback(
    (
      setNodes: (nodes: Node[]) => void,
      setSelectedIds: (ids: string[]) => void
    ) => {
      if (historyStep < history.length - 1) {
        setHistoryStep(historyStep + 1);
        setNodes(history[historyStep + 1]);
        setSelectedIds([]);
      }
    },
    [history, historyStep]
  );

  return { history, historyStep, saveToHistory, undo, redo };
};
