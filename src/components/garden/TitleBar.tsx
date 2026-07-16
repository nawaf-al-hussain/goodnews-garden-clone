"use client";

interface TitleBarProps {
  nodeCount: number;
  linkCount: number;
}

export function TitleBar({ nodeCount, linkCount }: TitleBarProps) {
  return (
    <header className="title-bar">
      <div className="flex items-center gap-4">
        <a
          href="https://www.raihankalla.id/data"
          className="control-btn"
          style={{ border: "none", background: "transparent", padding: 0 }}
          data-tooltip="Back to Home"
        >
          <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        </a>
        <div className="title-content">
          <h1>Good News Garden</h1>
          <span className="subtitle">Watch Positivity Bloom Over Time</span>
        </div>
      </div>
      <div className="stats-container">
        <div className="stat-item">
          <span className="stat-value">{nodeCount}</span>
          <span className="stat-label">Blooms</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{linkCount}</span>
          <span className="stat-label">Vines</span>
        </div>
      </div>
    </header>
  );
}
