export interface Node {
  id: string;
  type: "rect" | "circle" | "text" | "frame" | "star" | "diamond" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  text: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation: number;
  opacity: number;
  fontSize: number;
  fontFamily: string;
  zIndex: number;
  strokeStyle?: "solid" | "dashed";
  imageUrl?: string;
  points?: number[]; // For line shapes
  [key: string]: any;
}
