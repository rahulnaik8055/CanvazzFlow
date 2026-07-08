"use client";

import React from "react";
import { Rect, Circle, Ellipse, Line, Text, Group } from "react-konva";
import Konva from "konva";
import { Node } from "@/types/CanvasTypes";

export function renderNode(
  node: Node,
  commonProps: Record<string, any>,
  isSelected: boolean,
) {
  const nodeProps = {
    ...commonProps,
    fill: node.fill,
    stroke: node.stroke,
    strokeWidth: node.strokeWidth,
    strokeScaleEnabled: false,
    opacity: node.opacity,
    rotation: node.rotation,
    visible: node.visible !== false,
    shadowColor: node.shadowColor !== "transparent" ? node.shadowColor : undefined,
    shadowBlur: node.shadowBlur || undefined,
    shadowOffsetX: node.shadowOffsetX || undefined,
    shadowOffsetY: node.shadowOffsetY || undefined,
    shadowOpacity: node.shadowOpacity || undefined,
    filters: node.blurRadius ? [Konva.Filters.Blur] : undefined,
    blurRadius: node.blurRadius || undefined,
  };

  switch (node.type) {
    case "rect":
      return (
        <Rect
          key={node.id}
          {...nodeProps}
          width={node.width}
          height={node.height}
          cornerRadius={node.cornerRadius || 4}
        />
      );

    case "roundedRect":
      return (
        <Rect
          key={node.id}
          {...nodeProps}
          width={node.width}
          height={node.height}
          cornerRadius={Math.min(node.cornerRadius || 12, node.width / 2, node.height / 2)}
        />
      );

    case "circle":
      return (
        <Circle
          key={node.id}
          {...nodeProps}
          radius={node.radius || 50}
        />
      );

    case "ellipse":
      return (
        <Ellipse
          key={node.id}
          {...nodeProps}
          radiusX={node.width / 2}
          radiusY={node.height / 2}
        />
      );

    case "triangle":
    case "diamond":
    case "pentagon":
    case "hexagon": {
      const cx = node.width / 2;
      const cy = node.height / 2;
      const sides = node.type === "triangle" ? 3 : node.type === "diamond" ? 4 : node.type === "pentagon" ? 5 : 6;
      const outerR = Math.min(node.width, node.height) / 2;
      const pts: number[] = [];
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        pts.push(cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle));
      }
      return (
        <Line
          key={node.id}
          {...nodeProps}
          points={pts}
          closed
          fill={node.fill}
          stroke={node.stroke}
          strokeWidth={commonProps.strokeWidth}
        />
      );
    }

    case "star": {
      const cx = node.width / 2;
      const cy = node.height / 2;
      const outerR = Math.min(node.width, node.height) / 2;
      const innerR = node.innerRadius || outerR * 0.4;
      const numPoints = 5;
      const pts: number[] = [];
      for (let i = 0; i < numPoints * 2; i++) {
        const angle = (i * Math.PI) / numPoints - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        pts.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
      }
      return (
        <Line
          key={node.id}
          {...nodeProps}
          points={pts}
          closed
          fill={node.fill}
          stroke={node.stroke}
          strokeWidth={commonProps.strokeWidth}
        />
      );
    }

    case "line":
    case "arrow":
    case "polyline": {
      const pts = node.points?.length ? node.points : [0, 0, node.width, 0];
      const lineDash =
        node.strokeStyle === "dashed" ? [6, 4] : node.strokeStyle === "dotted" ? [2, 3] : undefined;
      return (
        <Group
          key={node.id}
          x={node.x}
          y={node.y}
          rotation={node.rotation}
          opacity={node.opacity}
          visible={node.visible !== false}
          draggable={commonProps.draggable}
          onDragStart={commonProps.onDragStart}
          onDragMove={commonProps.onDragMove}
          onDragEnd={commonProps.onDragEnd}
          onClick={commonProps.onClick}
          onTap={commonProps.onTap}
          onTransform={commonProps.onTransform}
          onTransformEnd={commonProps.onTransformEnd}
        >
          <Line
            key={`${node.id}-line`}
            x={0} y={0}
            points={pts}
            fill="transparent"
            stroke={node.stroke}
            strokeWidth={node.strokeWidth || 2}
            dash={lineDash}
            strokeScaleEnabled={false}
            lineCap="round"
            lineJoin="round"
            shadowColor={node.shadowColor !== "transparent" ? node.shadowColor : undefined}
            shadowBlur={node.shadowBlur || undefined}
            shadowOffsetX={node.shadowOffsetX || undefined}
            shadowOffsetY={node.shadowOffsetY || undefined}
            shadowOpacity={node.shadowOpacity || undefined}
          />
          {node.type === "arrow" && pts.length >= 4 && (
            <ArrowHead
              key={`${node.id}-arrow`}
              fromX={pts[pts.length - 4]}
              fromY={pts[pts.length - 3]}
              toX={pts[pts.length - 2]}
              toY={pts[pts.length - 1]}
              stroke={node.stroke}
              strokeWidth={(node.strokeWidth || 2) * 2}
            />
          )}
        </Group>
      );
    }

    case "text":
      return (
        <Text
          key={node.id}
          {...nodeProps}
          text={node.text || "Text"}
          fontSize={node.fontSize || 20}
          fontFamily={node.fontFamily || "Inter, system-ui, sans-serif"}
          fontStyle={`${node.fontWeight === "bold" ? "bold " : ""}${node.fontStyle === "italic" ? "italic" : ""}`.trim() || undefined}
          textDecoration={node.textDecoration !== "none" ? node.textDecoration : undefined}
          align={node.textAlign || "left"}
          letterSpacing={node.letterSpacing || 0}
          lineHeight={node.lineHeight || 1.2}
          width={node.width}
          height={node.height}
          fill={node.fill}
          stroke="transparent"
          strokeWidth={0}
        />
      );

    case "image":
      return null;

    case "frame":
      return (
        <Rect
          key={node.id}
          {...nodeProps}
          width={node.width}
          height={node.height}
          cornerRadius={node.cornerRadius || 2}
          dash={node.strokeStyle === "dashed" ? [5, 5] : node.strokeStyle === "dotted" ? [2, 4] : undefined}
          fill={node.fill || "#ffffff"}
        />
      );

    case "stickyNote":
      return (
        <Group key={node.id}>
          <Rect
            {...nodeProps}
            width={node.width}
            height={node.height}
            cornerRadius={node.cornerRadius || 2}
            fill={node.fill || "#fef08a"}
            stroke={node.stroke || "#ca8a04"}
            strokeWidth={node.strokeWidth || 1}
          />
          <Text
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            padding={12}
            text={node.text || "Note"}
            fontSize={node.fontSize || 16}
            fontFamily={node.fontFamily || "Inter, system-ui, sans-serif"}
            fill="#1f2937"
            listening={false}
          />
        </Group>
      );

    case "codeBlock":
      return (
        <Group key={node.id}>
          <Rect
            {...nodeProps}
            width={node.width}
            height={node.height}
            cornerRadius={node.cornerRadius || 8}
            fill={node.fill || "#1e293b"}
            stroke={node.stroke || "#334155"}
            strokeWidth={node.strokeWidth || 1}
          />
          <Text
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            padding={16}
            text={node.text || "code();"}
            fontSize={node.fontSize || 14}
            fontFamily="JetBrains Mono, Fira Code, monospace"
            fill="#e2e8f0"
            listening={false}
          />
        </Group>
      );

    case "divider":
      return (
        <Line
          key={node.id}
          {...nodeProps}
          points={
            node.dividerOrientation === "vertical"
              ? [0, 0, 0, node.height || 200]
              : [0, 0, node.width || 200, 0]
          }
          fill="transparent"
          stroke={node.stroke || "#d1d5db"}
          strokeWidth={node.strokeWidth || 2}
          lineCap="round"
        />
      );

    default:
      return (
        <Rect
          key={node.id}
          {...nodeProps}
          width={node.width}
          height={node.height}
          cornerRadius={4}
        />
      );
  }
}

function ArrowHead({
  fromX,
  fromY,
  toX,
  toY,
  stroke,
  strokeWidth,
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  stroke: string;
  strokeWidth: number;
}) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const headLen = 12;
  const p1x = toX - headLen * Math.cos(angle - Math.PI / 6);
  const p1y = toY - headLen * Math.sin(angle - Math.PI / 6);
  const p2x = toX - headLen * Math.cos(angle + Math.PI / 6);
  const p2y = toY - headLen * Math.sin(angle + Math.PI / 6);
  return (
    <Line
      points={[toX, toY, p1x, p1y, p2x, p2y]}
      closed
      fill={stroke}
      stroke={stroke}
      strokeWidth={1}
    />
  );
}
