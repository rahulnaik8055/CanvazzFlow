"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { getInitials } from "@/lib/presence";
import { Node } from "@/types/CanvasTypes";

interface Props {
  others: { connectionId: number; presence: Record<string, any> }[];
  nodes: Node[];
  stageScale: number;
  stagePosition: { x: number; y: number };
}

const CURSOR_SIZE = 14;
const LERP_RATE = 0.12;

type CursorState = Map<number, { x: number; y: number }>;

export default function CollaboratorCursors({
  others,
  nodes,
  stageScale,
  stagePosition,
}: Props) {
  const cursorRef = useRef<CursorState>(new Map());
  const rafRef = useRef<number | null>(null);
  const [display, setDisplay] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      color: string;
      name: string;
      avatar: string;
      isIdle: boolean;
      selectedName: string;
    }>
  >([]);

  const othersKeyed = useMemo(() => {
    const map = new Map<number, { presence: Record<string, any> }>();
    others.forEach((o) => map.set(o.connectionId, o));
    return map;
  }, [others]);

  useEffect(() => {
    const targets = new Map<number, { x: number; y: number }>();
    others.forEach((user) => {
      const c = user.presence.cursor;
      if (c && typeof c.x === "number" && typeof c.y === "number") {
        targets.set(user.connectionId, {
          x: c.x * stageScale + stagePosition.x,
          y: c.y * stageScale + stagePosition.y,
        });
      }
    });

    const state = cursorRef.current;
    targets.forEach((t, id) => {
      if (!state.has(id)) {
        state.set(id, { x: t.x, y: t.y });
      }
    });
    state.forEach((_v, id) => {
      if (!targets.has(id)) state.delete(id);
    });

    if (!rafRef.current) {
      const animate = () => {
        const state = cursorRef.current;
        const othersMap = othersKeyed;

        const next: Array<{
          id: number;
          x: number;
          y: number;
          color: string;
          name: string;
          avatar: string;
          isIdle: boolean;
          selectedName: string;
        }> = [];

        state.forEach((pos, id) => {
          const target = targets.get(id);
          if (!target) return;

          const dx = target.x - pos.x;
          const dy = target.y - pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 0.5) {
            pos.x += dx * LERP_RATE;
            pos.y += dy * LERP_RATE;
          } else {
            pos.x = target.x;
            pos.y = target.y;
          }

          const user = othersMap.get(id);
          const p = user?.presence ?? {};
          const isIdle = !!p.isIdle;

          next.push({
            id,
            x: pos.x,
            y: pos.y,
            color: p.userColor || "#4B9CF5",
            name: p.userName || "Anonymous",
            avatar: p.userAvatar || "",
            isIdle,
            selectedName: p.selectedName || "",
          });
        });

        setDisplay(next);
        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [others, stageScale, stagePosition, othersKeyed]);

  return (
    <>
      {display.map((user) => {
        const opacity = user.isIdle ? 0.25 : 1;

        return (
          <div
            key={user.id}
            style={{
              position: "absolute",
              left: user.x,
              top: user.y,
              pointerEvents: "none",
              transform: "translate(-2px, -2px)",
              zIndex: 9999,
              opacity,
              transition: "opacity 0.3s ease",
            }}
          >
            <svg
              width={CURSOR_SIZE}
              height={CURSOR_SIZE}
              viewBox={`0 0 ${CURSOR_SIZE} ${CURSOR_SIZE}`}
              fill="none"
            >
              <path
                d="M0 0L0 12L3.5 9L6 14L8 13L5.5 8L9 8Z"
                fill={user.color}
                stroke="white"
                strokeWidth="1"
              />
            </svg>

            <div
              style={{
                background: user.color,
                color: "white",
                fontSize: 11,
                fontWeight: 500,
                padding: "2px 6px",
                borderRadius: 4,
                marginTop: 2,
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                maxWidth: 200,
              }}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.3)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 8,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {getInitials(user.name)}
                </span>
              )}
              <span className="truncate">{user.name}</span>
              {user.selectedName && (
                <>
                  <span style={{ opacity: 0.6 }}>&bull;</span>
                  <span style={{ opacity: 0.8, fontSize: 10 }}>
                    {user.selectedName}
                  </span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
