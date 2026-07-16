"use client";

import type { GardenNode } from "@/types/garden";
import { getCategoryEmoji, getFlowerPalette } from "@/lib/garden-config";

interface InfoPanelProps {
  node: GardenNode | null;
  onClose: () => void;
}

export function InfoPanel({ node, onClose }: InfoPanelProps) {
  if (!node) return null;

  const palette = getFlowerPalette(node.category);

  return (
    <div className="info-panel">
      <button className="close-btn" onClick={onClose}>
        ×
      </button>

      <div
        className="info-category"
        style={{
          background: `${palette.petal}22`,
          color: palette.petal,
          border: `1px solid ${palette.petal}33`,
        }}
      >
        <span>{getCategoryEmoji(node.category)}</span>
        <span>{node.category}</span>
      </div>

      <h3 className="info-title">{node.title}</h3>
      <div className="info-date">{node.date}</div>

      <div className="info-keywords">
        {node.keywords.slice(0, 6).map((kw) => (
          <span key={kw} className="keyword-tag">
            {kw}
          </span>
        ))}
      </div>

      <div className="info-preview">
        {node.narasi_preview.slice(0, 200)}...
      </div>
    </div>
  );
}
