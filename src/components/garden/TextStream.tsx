"use client";

import type { GardenNode } from "@/types/garden";
import { getCategoryEmoji } from "@/lib/garden-config";

interface TextStreamProps {
  nodes: GardenNode[];
  onNodeClick: (node: GardenNode) => void;
}

export function TextStream({ nodes, onNodeClick }: TextStreamProps) {
  // Show last 40 nodes as scrolling labels
  const visibleNodes = nodes.slice(-40).reverse();

  return (
    <div className="text-stream">
      <div className="stream-labels">
        {visibleNodes.map((node) => (
          <div
            key={node.id}
            className="stream-label"
            onClick={() => onNodeClick(node)}
            title={`${getCategoryEmoji(node.category)} ${node.title}`}
          >
            {getCategoryEmoji(node.category)} {node.title.slice(0, 40)}
          </div>
        ))}
      </div>
    </div>
  );
}
