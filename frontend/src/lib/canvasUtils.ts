import { Node, ShapeType } from "@/types/CanvasTypes";

export const generateId = (): string =>
  `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const calculateShapeCenter = (
  stagePosition: { x: number; y: number },
  canvasSize: { width: number; height: number },
  stageScale: number,
): { x: number; y: number } => {
  const centerX = (-stagePosition.x + canvasSize.width / 2) / stageScale;
  const centerY = (-stagePosition.y + canvasSize.height / 2) / stageScale;
  return { x: centerX - 60, y: centerY - 40 };
};

const labelMap: Record<string, string> = {
  rect: "Rectangle",
  roundedRect: "Rounded Rectangle",
  circle: "Circle",
  ellipse: "Ellipse",
  triangle: "Triangle",
  diamond: "Diamond",
  pentagon: "Pentagon",
  hexagon: "Hexagon",
  star: "Star",
  line: "Line",
  arrow: "Arrow",
  polyline: "Polyline",
  text: "Text",
  image: "Image",
  frame: "Frame",
  stickyNote: "Sticky Note",
  codeBlock: "Code Block",
  divider: "Divider",
};

export function getShapeLabel(type: ShapeType): string {
  return labelMap[type] || type;
}

export interface Defaults {
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  radius: number;
  cornerRadius: number;
  text: string;
  fontSize: number;
  sides: number;
  outerRadius: number;
  innerRadius: number;
  points: number[];
  imageUrl: string;
  dividerOrientation: "horizontal" | "vertical";
}

export function getShapeDefaults(type: ShapeType): Defaults {
  switch (type) {
    case "rect":
      return { width: 120, height: 80, fill: "#3b82f6", stroke: "#1e40af", strokeWidth: 2, radius: 0, cornerRadius: 0, text: "", fontSize: 16, sides: 0, outerRadius: 0, innerRadius: 0, points: [], imageUrl: "", dividerOrientation: "horizontal" };
    case "roundedRect":
      return { width: 120, height: 80, fill: "#3b82f6", stroke: "#1e40af", strokeWidth: 2, radius: 0, cornerRadius: 12, text: "", fontSize: 16, sides: 0, outerRadius: 0, innerRadius: 0, points: [], imageUrl: "", dividerOrientation: "horizontal" };
    case "circle":
      return { width: 100, height: 100, fill: "#3b82f6", stroke: "#1e40af", strokeWidth: 2, radius: 50, cornerRadius: 0, text: "", fontSize: 16, sides: 0, outerRadius: 0, innerRadius: 0, points: [], imageUrl: "", dividerOrientation: "horizontal" };
    case "ellipse":
      return { width: 140, height: 90, fill: "#3b82f6", stroke: "#1e40af", strokeWidth: 2, radius: 0, cornerRadius: 0, text: "", fontSize: 16, sides: 0, outerRadius: 0, innerRadius: 0, points: [], imageUrl: "", dividerOrientation: "horizontal" };
    case "triangle":
      return { width: 100, height: 100, fill: "#8b5cf6", stroke: "#6d28d9", strokeWidth: 2, radius: 0, cornerRadius: 0, text: "", fontSize: 16, sides: 3, outerRadius: 50, innerRadius: 0, points: [], imageUrl: "", dividerOrientation: "horizontal" };
    case "diamond":
      return { width: 100, height: 100, fill: "#ec4899", stroke: "#be185d", strokeWidth: 2, radius: 0, cornerRadius: 0, text: "", fontSize: 16, sides: 4, outerRadius: 50, innerRadius: 0, points: [], imageUrl: "", dividerOrientation: "horizontal" };
    case "pentagon":
      return { width: 100, height: 100, fill: "#f59e0b", stroke: "#d97706", strokeWidth: 2, radius: 0, cornerRadius: 0, text: "", fontSize: 16, sides: 5, outerRadius: 50, innerRadius: 0, points: [], imageUrl: "", dividerOrientation: "horizontal" };
    case "hexagon":
      return { width: 100, height: 100, fill: "#10b981", stroke: "#059669", strokeWidth: 2, radius: 0, cornerRadius: 0, text: "", fontSize: 16, sides: 6, outerRadius: 50, innerRadius: 0, points: [], imageUrl: "", dividerOrientation: "horizontal" };
    case "star":
      return { width: 100, height: 100, fill: "#f59e0b", stroke: "#d97706", strokeWidth: 2, radius: 0, cornerRadius: 0, text: "", fontSize: 16, sides: 0, outerRadius: 50, innerRadius: 20, points: [], imageUrl: "", dividerOrientation: "horizontal" };
    case "line":
      return { width: 200, height: 2, fill: "transparent", stroke: "#6b7280", strokeWidth: 2, radius: 0, cornerRadius: 0, text: "", fontSize: 16, sides: 0, outerRadius: 0, innerRadius: 0, points: [0, 0, 200, 0], imageUrl: "", dividerOrientation: "horizontal" };
    case "arrow":
      return { width: 200, height: 2, fill: "transparent", stroke: "#6b7280", strokeWidth: 2, radius: 0, cornerRadius: 0, text: "", fontSize: 16, sides: 0, outerRadius: 0, innerRadius: 0, points: [0, 0, 200, 0], imageUrl: "", dividerOrientation: "horizontal" };
    case "polyline":
      return { width: 200, height: 100, fill: "transparent", stroke: "#6b7280", strokeWidth: 2, radius: 0, cornerRadius: 0, text: "", fontSize: 16, sides: 0, outerRadius: 0, innerRadius: 0, points: [0, 0, 100, 50, 200, 0], imageUrl: "", dividerOrientation: "horizontal" };
    case "text":
      return { width: 120, height: 40, fill: "#1f2937", stroke: "transparent", strokeWidth: 0, radius: 0, cornerRadius: 0, text: "Type here", fontSize: 20, sides: 0, outerRadius: 0, innerRadius: 0, points: [], imageUrl: "", dividerOrientation: "horizontal" };
    case "image":
      return { width: 200, height: 200, fill: "transparent", stroke: "#e5e7eb", strokeWidth: 1, radius: 0, cornerRadius: 0, text: "", fontSize: 16, sides: 0, outerRadius: 0, innerRadius: 0, points: [], imageUrl: "", dividerOrientation: "horizontal" };
    case "frame":
      return { width: 150, height: 100, fill: "#ffffff", stroke: "#d1d5db", strokeWidth: 1, radius: 0, cornerRadius: 0, text: "", fontSize: 16, sides: 0, outerRadius: 0, innerRadius: 0, points: [], imageUrl: "", dividerOrientation: "horizontal" };
    case "stickyNote":
      return { width: 140, height: 140, fill: "#fef08a", stroke: "#ca8a04", strokeWidth: 1, radius: 0, cornerRadius: 2, text: "Note", fontSize: 16, sides: 0, outerRadius: 0, innerRadius: 0, points: [], imageUrl: "", dividerOrientation: "horizontal" };
    case "codeBlock":
      return { width: 240, height: 120, fill: "#1e293b", stroke: "#334155", strokeWidth: 1, radius: 0, cornerRadius: 8, text: "code();", fontSize: 14, sides: 0, outerRadius: 0, innerRadius: 0, points: [], imageUrl: "", dividerOrientation: "horizontal" };
    case "divider":
      return { width: 200, height: 2, fill: "transparent", stroke: "#d1d5db", strokeWidth: 2, radius: 0, cornerRadius: 0, text: "", fontSize: 16, sides: 0, outerRadius: 0, innerRadius: 0, points: [], imageUrl: "", dividerOrientation: "horizontal" };
    default:
      return { width: 100, height: 100, fill: "#3b82f6", stroke: "#1e40af", strokeWidth: 2, radius: 0, cornerRadius: 0, text: "", fontSize: 16, sides: 0, outerRadius: 0, innerRadius: 0, points: [], imageUrl: "", dividerOrientation: "horizontal" };
  }
}

export function createDefaultNode(
  type: ShapeType,
  x: number,
  y: number,
  maxZIndex: number,
  overrides?: Partial<Node>,
): Node {
  const d = getShapeDefaults(type);
  return {
    id: generateId(),
    type,
    x,
    y,
    width: d.width,
    height: d.height,
    radius: d.radius,
    rotation: 0,
    opacity: 1,
    zIndex: maxZIndex + 1,
    visible: true,
    locked: false,
    name: getShapeLabel(type),
    parentId: null,
    fill: d.fill,
    stroke: d.stroke,
    strokeWidth: d.strokeWidth,
    strokeStyle: "solid",
    cornerRadius: d.cornerRadius,
    sides: d.sides,
    outerRadius: d.outerRadius,
    innerRadius: d.innerRadius,
    points: d.points,
    text: d.text,
    fontSize: d.fontSize,
    fontFamily: "Inter, system-ui, sans-serif",
    fontStyle: "normal",
    fontWeight: "normal",
    textDecoration: "none",
    textAlign: "left",
    letterSpacing: 0,
    lineHeight: 1.2,
    imageUrl: d.imageUrl,
    shadowColor: "transparent",
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowOpacity: 0,
    blurRadius: 0,
    dividerOrientation: d.dividerOrientation,
    ...overrides,
  };
}
