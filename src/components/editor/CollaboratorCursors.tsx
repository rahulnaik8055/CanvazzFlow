import React from "react";
import { useOthers } from "@/liveblocks.config";

const COLORS = ["#E85D75", "#4B9CF5", "#F5A623", "#7ED321", "#9B59B6"];

interface Props {
  others: ReturnType<typeof useOthers>;
  stageScale: number;
  stagePosition: { x: number; y: number };
}

export default function CollaboratorCursors({
  others,
  stageScale,
  stagePosition,
}: Props) {
  return (
    <>
      {(others as any[]).map((user, index) => {
        const cursor = user.presence.cursor;
        if (!cursor) return null;

        const color = COLORS[index % COLORS.length];

        const screenX = cursor.x * stageScale + stagePosition.x;
        const screenY = cursor.y * stageScale + stagePosition.y;

        return (
          <div
            key={user.connectionId}
            style={{
              position: "absolute",
              left: screenX,
              top: screenY,
              pointerEvents: "none",
              transform: "translate(-2px, -2px)",
              zIndex: 9999,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M0 0L0 12L3.5 9L6 14L8 13L5.5 8L9 8Z"
                fill={color}
                stroke="white"
                strokeWidth="1"
              />
            </svg>

            <div
              style={{
                background: color,
                color: "white",
                fontSize: 11,
                fontWeight: 500,
                padding: "2px 6px",
                borderRadius: 4,
                marginTop: 2,
                whiteSpace: "nowrap",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            >
              {user.presence.userName || "Anonymous"}
            </div>
          </div>
        );
      })}
    </>
  );
}
