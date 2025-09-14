"use client";

import React, { useMemo } from "react";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Text,
  Transformer,
  Line,
} from "react-konva";
import Konva from "konva";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

import { Node } from "@/types/CanvasTypes";
import { GRID_SIZE, MIN_SIZE } from "@/constants/CanvasConstants";

interface CanvasAreaProps {
  nodes: Node[];
  canvasSize: { width: number; height: number };
  stageScale: number;
  stagePosition: { x: number; y: number };
  showGrid: boolean;
  selectedId: string | null;
  tool: "select" | "pan";
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  stageRef: React.RefObject<Konva.Stage | null>;
  transformerRef: React.RefObject<Konva.Transformer | null>;
  handleSelect: (id: string | null) => void;
  handleDrag: (id: string, e: Konva.KonvaEventObject<DragEvent>) => void;
  handleTransform: (id: string, e: Konva.KonvaEventObject<Event>) => void;
  handleTransformEnd: () => void;
  handleWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  handleStageMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleStageMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleStageMouseUp: () => void;
}

export default function CanvasArea(props: CanvasAreaProps) {
  const GridLayerComponent = useMemo(() => {
    if (!props.showGrid) return null;

    const gridLines: React.JSX.Element[] = [];
    const stageWidth =
      props.canvasSize.width / props.stageScale +
      Math.abs(props.stagePosition.x / props.stageScale);
    const stageHeight =
      props.canvasSize.height / props.stageScale +
      Math.abs(props.stagePosition.y / props.stageScale);

    // Vertical lines
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
        />
      );
    }

    // Horizontal lines
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
        />
      );
    }

    return gridLines;
  }, [props.showGrid, props.canvasSize, props.stageScale, props.stagePosition]);

  // Sort nodes by zIndex to ensure correct rendering order
  const sortedNodes = useMemo(() => {
    return [...props.nodes].sort((a, b) => a.zIndex - b.zIndex);
  }, [props.nodes]);

  return (
    <div className="flex-1 relative bg-gray-50 mt-14 overflow-hidden">
      <Stage
        width={props.canvasSize.width}
        height={props.canvasSize.height}
        className="bg-white rounded-lg shadow-sm border border-gray-200"
        scaleX={props.stageScale}
        scaleY={props.stageScale}
        x={props.stagePosition.x}
        y={props.stagePosition.y}
        ref={props.stageRef}
        onWheel={props.handleWheel}
        onMouseDown={props.handleStageMouseDown}
        onMousemove={props.handleStageMouseMove}
        onMouseup={props.handleStageMouseUp}
      >
        {/* Grid Layer */}
        <Layer zIndex={0}>{GridLayerComponent}</Layer>

        {/* Shapes Layer */}
        <Layer zIndex={1}>
          {sortedNodes.map((node) => {
            const commonProps = {
              id: node.id,
              x: node.x,
              y: node.y,
              fill: node.fill,
              stroke: node.stroke,
              strokeWidth: node.strokeWidth,
              rotation: node.rotation,
              opacity: node.opacity,
              zIndex: node.zIndex,
              draggable: props.tool === "select",
              onClick: () => props.handleSelect(node.id),
              onTap: () => props.handleSelect(node.id),
              onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) =>
                props.handleDrag(node.id, e),
              onTransform: (e: Konva.KonvaEventObject<Event>) =>
                props.handleTransform(node.id, e),
              onTransformEnd: () => props.handleTransformEnd(),
            };

            if (node.type === "rect") {
              return (
                <Rect
                  key={node.id}
                  {...commonProps}
                  width={node.width}
                  height={node.height}
                  cornerRadius={4}
                />
              );
            }
            if (node.type === "circle") {
              return (
                <Circle key={node.id} {...commonProps} radius={node.radius} />
              );
            }
            if (node.type === "text") {
              return (
                <Text
                  key={node.id}
                  {...commonProps}
                  text={node.text}
                  fontSize={node.fontSize}
                  fontFamily={node.fontFamily}
                  width={node.width}
                  height={node.height}
                />
              );
            }
            return null;
          })}

          {props.selectedId && props.tool === "select" && (
            <Transformer
              ref={props.transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < MIN_SIZE || newBox.height < MIN_SIZE) {
                  return oldBox;
                }
                return newBox;
              }}
              rotateEnabled={true}
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
              ]}
            />
          )}
        </Layer>
      </Stage>

      {/* Canvas Controls */}
      <div className="absolute bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex flex-col gap-1">
        <button
          onClick={props.zoomIn}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={props.zoomOut}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </button>
        <button
          onClick={props.resetView}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
          title="Reset View"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
