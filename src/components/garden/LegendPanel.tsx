"use client";

import { CATEGORIES, getCategoryGradient, getCategoryEmoji } from "@/lib/garden-config";

interface LegendPanelProps {
  highlightedCategory: string | null;
  onCategoryClick: (category: string | null) => void;
}

export function LegendPanel({
  highlightedCategory,
  onCategoryClick,
}: LegendPanelProps) {
  return (
    <div className="legend-panel">
      <h4>Garden Guide</h4>
      <div className="legend-items">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.label}
            className={`legend-item ${
              highlightedCategory && highlightedCategory !== cat.label
                ? "dimmed"
                : ""
            }`}
            onClick={() =>
              onCategoryClick(
                highlightedCategory === cat.label ? null : cat.label
              )
            }
          >
            <span
              className="legend-color"
              style={{
                background: getCategoryGradient(cat.label),
                color: "transparent",
                textShadow: "0 0 0 white",
              }}
            >
              {cat.emoji}
            </span>
            <span>{cat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
