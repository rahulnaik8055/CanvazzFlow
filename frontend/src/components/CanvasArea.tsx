"use client";

import React, { useMemo } from "react";
import {
  Stage,
  Layer,
  Rect,
  Line,
  Transformer,
} from "react-konva";
import Konva from "konva";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Star as StarIcon,
  Diamond,
  Layout,
  Type,
  Square,
  Circle as CircleIcon,
  Minus,
} from "lucide-react";

import { Node, ShapeType } from "@/types/CanvasTypes";
import { GRID_SIZE, MIN_SIZE } from "@/constants/CanvasConstants";
import { renderNode } from "./NodeRenderer";
import { SnapGuide } from "@/hooks/useSnapping";
import { SelectionRect } from "@/hooks/useCanvasInteractions";

interface CollaboratorSelection {
  connectionId: number;
  color: string;
  selectedId: string | null;
}

interface CanvasAreaProps {
  addShape: (type: ShapeType) => void;
  nodes: Node[];
  canvasSize: { width: number; height: number };
  stageScale: number;
  stagePosition: { x: number; y: number };
  showGrid: boolean;
  selectedIds: string[];
  tool: "select" | "pan";
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  stageRef: React.RefObject<Konva.Stage>;
  transformerRef: React.RefObject<Konva.Transformer | null>;
  handleSelect: (
    id: string | null,
    metaKey?: boolean,
    shiftKey?: boolean,
  ) => void;
  handleDrag: (id: string, e: Konva.KonvaEventObject<DragEvent>) => void;
  handleDragStart: (id: string) => void;
  handleDragMove: (id: string, e: Konva.KonvaEventObject<DragEvent>) => void;
  handleTransform: (id: string, e: Konva.KonvaEventObject<Event>) => void;
  handleTransformEnd: () => void;
  handleWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  handleStageMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleStageMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleStageMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseLeave: () => void;
  guides: SnapGuide[];
  selectionRect: SelectionRect | null;
  collaboratorSelections?: CollaboratorSelection[];
  canEdit?: boolean;
}

export default function CanvasArea(props: CanvasAreaProps) {
  const { addShape } = props;

  const GridLayerComponent = useMemo(() => {
    if (!props.showGrid) return null;

    const gridLines: React.JSX.Element[] = [];
    const stageWidth =
      props.canvasSize.width / props.stageScale +
      Math.abs(props.stagePosition.x / props.stageScale);
    const stageHeight =
      props.canvasSize.height / props.stageScale +
      Math.abs(props.stagePosition.y / props.stageScale);

    for (let i = 0; i < stageWidth / GRID_SIZE + 10; i++) {
      gridLines.push(
        <Line
          key={`v-${i}`}
          points={[
            i * GRID_SIZE,
            -props.stagePosition.y / props.stageScale,
            i * GRID_SIZE,
            stageHeight,
          ]}
          stroke="#e5e7eb"
          strokeWidth={0.5}
          opacity={0.8}
        />,
      );
    }

    for (let i = 0; i < stageHeight / GRID_SIZE + 10; i++) {
      gridLines.push(
        <Line
          key={`h-${i}`}
          points={[
            -props.stagePosition.x / props.stageScale,
            i * GRID_SIZE,
            stageWidth,
            i * GRID_SIZE,
          ]}
          stroke="#e5e7eb"
          strokeWidth={0.5}
          opacity={0.8}
        />,
      );
    }

    return gridLines;
  }, [props.showGrid, props.canvasSize, props.stageScale, props.stagePosition]);

  const sortedNodes = useMemo(() => {
    return [...props.nodes]
      .filter((n) => n.visible !== false)
      .sort((a, b) => a.zIndex - b.zIndex);
  }, [props.nodes]);

  const guideLines = useMemo(() => {
    if (props.guides.length === 0) return null;
    const INF = 100000;
    return props.guides.map((guide, i) => {
      if (guide.orientation === "vertical") {
        return (
          <Line
            key={`guide-v-${i}`}
            points={[guide.position, -INF, guide.position, INF]}
            stroke="#3b82f6"
            strokeWidth={1}
            dash={[4, 4]}
          />
        );
      }
      return (
        <Line
          key={`guide-h-${i}`}
          points={[-INF, guide.position, INF, guide.position]}
          stroke="#3b82f6"
          strokeWidth={1}
          dash={[4, 4]}
        />
      );
    });
  }, [props.guides]);

  const selectionRectNode = useMemo(() => {
    if (!props.selectionRect) return null;
    return (
      <Rect
        x={props.selectionRect.x}
        y={props.selectionRect.y}
        width={props.selectionRect.width}
        height={props.selectionRect.height}
        fill="rgba(59,130,246,0.1)"
        stroke="#3b82f6"
        strokeWidth={1 / props.stageScale}
        dash={[4 / props.stageScale, 4 / props.stageScale]}
      />
    );
  }, [props.selectionRect, props.stageScale]);

  return (
    <div className="flex-1 relative bg-gray-50 mt-14 overflow-hidden">
      <Stage
        width={props.canvasSize.width}
        height={props.canvasSize.height}
        className="bg-white shadow-sm border border-gray-200"
        scaleX={props.stageScale}
        scaleY={props.stageScale}
        x={props.stagePosition.x}
        y={props.stagePosition.y}
        ref={props.stageRef}
        onWheel={props.handleWheel}
        onMouseDown={props.handleStageMouseDown}
        onMousemove={props.handleStageMouseMove}
        onMouseup={props.handleStageMouseUp}
        onMouseLeave={props.onMouseLeave}
      >
        <Layer zIndex={0}>{GridLayerComponent}</Layer>

        <Layer zIndex={1}>
          {sortedNodes.map((node) => {
            const commonProps = {
              id: node.id,
              x: node.x,
              y: node.y,
              rotation: node.rotation,
              opacity: node.opacity,
              draggable:
                props.canEdit !== false &&
                props.tool === "select" &&
                !node.locked,
              onClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
                props.handleSelect(node.id, e.evt.metaKey, e.evt.shiftKey);
              },
              onTap: () => props.handleSelect(node.id),
              onDragStart: () => props.handleDragStart(node.id),
              onDragMove: (e: Konva.KonvaEventObject<DragEvent>) =>
                props.handleDragMove(node.id, e),
              onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) =>
                props.handleDrag(node.id, e),
              onTransform: (e: Konva.KonvaEventObject<Event>) =>
                props.handleTransform(node.id, e),
              onTransformEnd: () => props.handleTransformEnd(),
              strokeWidth: node.strokeWidth,
            };

            return renderNode(
              node,
              commonProps,
              props.selectedIds.includes(node.id),
            );
          })}

          {props.selectedIds.length > 0 && props.tool === "select" && (
            <Transformer
              ref={props.transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < MIN_SIZE || newBox.height < MIN_SIZE) {
                  return oldBox;
                }
                return newBox;
              }}
              rotateEnabled={props.canEdit !== false}
              enabledAnchors={
                props.canEdit !== false
                  ? [
                      "top-left",
                      "top-center",
                      "top-right",
                      "middle-left",
                      "middle-right",
                      "bottom-left",
                      "bottom-center",
                      "bottom-right",
                    ]
                  : []
              }
            />
          )}
        </Layer>

        <Layer zIndex={2} listening={false}>
          {props.collaboratorSelections?.map((cs) => {
            if (!cs.selectedId) return null;
            const node = props.nodes.find((n) => n.id === cs.selectedId);
            if (!node) return null;
            const w = node.type === "circle" ? (node.radius || 50) * 2 : node.width;
            const h = node.type === "circle" ? (node.radius || 50) * 2 : node.height;
            return (
              <Rect
                key={`sel-${cs.connectionId}`}
                x={node.x - 2}
                y={node.y - 2}
                width={w + 4}
                height={h + 4}
                stroke={cs.color}
                strokeWidth={2 / props.stageScale}
                dash={[4 / props.stageScale, 2 / props.stageScale]}
                listening={false}
              />
            );
          })}
        </Layer>

        <Layer zIndex={3} listening={false}>
          {guideLines}
        </Layer>

        <Layer zIndex={4} listening={false}>
          {selectionRectNode}
        </Layer>
      </Stage>

      {/* Zoom controls */}
      <div className="absolute bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 p-1.5 flex flex-col gap-1">
        <button
          onClick={props.zoomIn}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <div className="text-center text-[10px] font-mono text-gray-400 py-0.5 select-none">
          {Math.round(props.stageScale * 100)}%
        </div>
        <button
          onClick={props.zoomOut}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <div className="w-full h-px bg-gray-100" />
        <button
          onClick={props.resetView}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900"
          title="Reset View"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Shape toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-1.5">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => addShape("rect")}
            className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
            title="Rectangle"
          >
            <Square className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => addShape("circle")}
            className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
            title="Circle"
          >
            <CircleIcon className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => addShape("text")}
            className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
            title="Text"
          >
            <Type className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => addShape("frame")}
            className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
            title="Frame"
          >
            <Layout className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => addShape("star")}
            className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
            title="Star"
          >
            <StarIcon className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => addShape("diamond")}
            className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
            title="Diamond"
          >
            <Diamond className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => addShape("arrow")}
            className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
            title="Arrow"
          >
            <Minus className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
