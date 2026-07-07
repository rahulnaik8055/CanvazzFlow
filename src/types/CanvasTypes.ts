export type ShapeType =
  | "rect"
  | "roundedRect"
  | "circle"
  | "ellipse"
  | "triangle"
  | "diamond"
  | "pentagon"
  | "hexagon"
  | "star"
  | "line"
  | "arrow"
  | "polyline"
  | "text"
  | "image"
  | "frame"
  | "stickyNote"
  | "codeBlock"
  | "divider";

export interface Node {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  name: string;
  parentId: string | null;

  // Fill & Stroke
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeStyle: "solid" | "dashed" | "dotted";

  // Shape-specific
  cornerRadius: number;
  sides: number;
  outerRadius: number;
  innerRadius: number;
  points: number[];

  // Text
  text: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: "normal" | "italic";
  fontWeight: "normal" | "bold";
  textDecoration: "none" | "underline" | "line-through";
  textAlign: "left" | "center" | "right";
  letterSpacing: number;
  lineHeight: number;

  // Image
  imageUrl: string;

  // Effects
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
  blurRadius: number;

  // Divider
  dividerOrientation: "horizontal" | "vertical";

  [key: string]: any;
}
