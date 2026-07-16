"use client";

import type { GardenNode } from "@/types/garden";
import { getCategoryEmoji } from "@/lib/garden-config";

interface TextStreamProps {
  nodes: GardenNode[];
  onNodeClick: (node: GardenNode) => void;
}

export function TextStream({ nodes, onNodeClick }: TextStreamProps) {
  // Show last 40 nodes as scrolling labels, duplicated for seamless loop
  const visibleNodes = nodes.slice(-40).reverse();
  // Duplicate items for seamless infinite scroll animation
  const scrollItems = [...visibleNodes, ...visibleNodes];

  return (
    <div className="text-stream">
      <div className="stream-labels">
        {scrollItems.map((node, i) => (
          <div
            key={`${node.id}-${i}`}
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
