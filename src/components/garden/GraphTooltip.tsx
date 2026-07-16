"use client";

import { useState, useEffect, useRef } from "react";
import type { GardenNode } from "@/types/garden";
import { getCategoryEmoji } from "@/lib/garden-config";

interface GraphTooltipProps {
  node: GardenNode | null;
  x: number;
  y: number;
}

export function GraphTooltip({ node, x, y }: GraphTooltipProps) {
  if (!node) return null;

  return (
    <div
      className="graph-tooltip"
      style={{
        left: `${x + 10}px`,
        top: `${y + 10}px`,
        position: "fixed",
        padding: "6px 10px",
        borderRadius: "8px",
        fontSize: "12px",
        color: "#5d5347",
        background: "rgba(255, 252, 248, 0.95)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(158, 200, 158, 0.2)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        pointerEvents: "none",
        zIndex: 200,
        maxWidth: "250px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" }}>
        <span>{getCategoryEmoji(node.category)}</span>
        <span style={{ fontWeight: 600, fontSize: "11px", color: "#8a7e72" }}>
          {node.category}
        </span>
      </div>
      <div style={{ fontWeight: 500, lineHeight: 1.3 }}>{node.title.slice(0, 60)}...</div>
    </div>
  );
}

export function useTooltip() {
  const [tooltipNode, setTooltipNode] = useState<GardenNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showTooltip = (node: GardenNode | null, x?: number, y?: number) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (node && x !== undefined && y !== undefined) {
      setTooltipNode(node);
      setTooltipPos({ x, y });
    } else {
      // Small delay before hiding to prevent flicker
      hideTimerRef.current = setTimeout(() => {
        setTooltipNode(null);
      }, 100);
    }
  };

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  return { tooltipNode, tooltipPos, showTooltip };
}
