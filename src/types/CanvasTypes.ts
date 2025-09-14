// /app/types/canvasTypes.ts
export interface Node {
  id: string;
  type: "rect" | "circle" | "text";
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
}
