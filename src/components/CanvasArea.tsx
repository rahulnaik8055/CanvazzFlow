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
  Image,
  Star,
} from "react-konva";
import Konva from "konva";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Frame,
  Star as StarIcon,
  Minus,
  Diamond,
  Layout,
  Type,
  Square,
  Circle as CircleIcon,
  ImageIcon,
} from "lucide-react";

import { Node } from "@/types/CanvasTypes";
import { GRID_SIZE, MIN_SIZE } from "@/constants/CanvasConstants";

interface CanvasAreaProps {
  addShape: (
    type: "rect" | "circle" | "text" | "frame" | "image" | "star" | "diamond",
    file?: File,
  ) => void;
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
  stageRef: React.RefObject<Konva.Stage>;
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

const ImageNode = ({ node, commonProps }: { node: Node; commonProps: any }) => {
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);

  React.useEffect(() => {
    if (node.imageUrl) {
      const img = new window.Image();
      img.src = node.imageUrl;
      img.onload = () => setImage(img);
      img.onerror = () => console.error("Failed to load image:", node.imageUrl);
    }
  }, [node.imageUrl]);

  if (!image) return null;

  return (
    <Image
      key={node.id}
      {...commonProps}
      image={image}
      width={node.width}
      height={node.height}
    />
  );
};

export default function CanvasArea(props: CanvasAreaProps) {
  const { addShape } = props;

  console.log("Rendering CanvasArea with nodes:", props.nodes);

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
        />,
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
        />,
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
        className="bg-white rounded-lg shadow-sm border border-gray-200 "
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
            if (node.type === "frame") {
              return (
                <Rect
                  key={node.id}
                  {...commonProps}
                  width={node.width}
                  height={node.height}
                  dash={node.strokeStyle === "dashed" ? [5, 5] : undefined}
                />
              );
            }
            if (node.type === "star") {
              return (
                <Star
                  key={node.id}
                  {...commonProps}
                  numPoints={5}
                  innerRadius={node.width * 0.4}
                  outerRadius={node.width * 0.6}
                />
              );
            }
            if (node.type === "diamond") {
              const points = [
                node.width / 2,
                0,
                node.width,
                node.height / 2,
                node.width / 2,
                node.height,
                0,
                node.height / 2,
              ];
              return (
                <Line
                  key={node.id}
                  {...commonProps}
                  points={points}
                  closed={true}
                  fill={node.fill}
                  stroke={node.stroke}
                  strokeWidth={node.strokeWidth}
                />
              );
            }

            if (node.type === "image") {
              return (
                <ImageNode
                  key={node.id}
                  node={node}
                  commonProps={commonProps}
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

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg p-2">
        <div className="flex items-center gap-1">
          {/* Rectangle */}
          <button
            onClick={() => addShape("rect")}
            className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
            title="Add Rectangle"
          >
            <Square className="w-5 h-5 text-gray-700" />
          </button>

          {/* Circle */}
          <button
            onClick={() => addShape("circle")}
            className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
            title="Add Circle"
          >
            <CircleIcon className="w-5 h-5 text-gray-700" />
          </button>

          {/* Text */}
          <button
            onClick={() => addShape("text")}
            className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
            title="Add Text"
          >
            <Type className="w-5 h-5 text-gray-700" />
          </button>

          {/* Frame */}
          <button
            onClick={() => addShape("frame")}
            className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
            title="Add Frame"
          >
            <Frame className="w-5 h-5 text-gray-700" />
          </button>

          {/* Star */}
          <button
            onClick={() => addShape("star")}
            className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
            title="Add Star"
          >
            <StarIcon className="w-5 h-5 text-gray-700" />
          </button>

          {/* Diamond */}
          <button
            onClick={() => addShape("diamond")}
            className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
            title="Add Diamond"
          >
            <Diamond className="w-5 h-5 text-gray-700" />
          </button>

          {/* Image */}
          <button
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (e: Event) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  addShape("image", file);
                }
              };
              input.click();
            }}
            className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
            title="Add Image"
          >
            <ImageIcon className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>
    </div>
  );
}
