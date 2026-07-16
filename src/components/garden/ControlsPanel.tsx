"use client";

interface ControlsPanelProps {
  isPlaying: boolean;
  speed: number;
  autoOrbit: boolean;
  autoZoom: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onToggleOrbit: () => void;
  onToggleZoom: () => void;
  onFitView: () => void;
}

export function ControlsPanel({
  isPlaying,
  speed,
  autoOrbit,
  autoZoom,
  onPlayPause,
  onReset,
  onSpeedChange,
  onToggleOrbit,
  onToggleZoom,
  onFitView,
}: ControlsPanelProps) {
  return (
    <div className="controls-panel">
      <div className="control-group">
        <button
          className="control-btn"
          onClick={onPlayPause}
          data-tooltip="Play / Pause"
        >
          {isPlaying ? (
            <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <button
          className="control-btn"
          onClick={onReset}
          data-tooltip="Reset"
        >
          <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
          </svg>
        </button>
      </div>

      <div className="control-group speed-control">
        <label>speed</label>
        <input
          type="range"
          min={0.5}
          max={5}
          step={0.5}
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
        />
        <span className="speed-value">{speed}x</span>
      </div>

      <div className="control-group">
        <button
          className={`control-btn ${autoOrbit ? "active-control" : ""}`}
          onClick={onToggleOrbit}
          data-tooltip="Toggle Auto-Orbit"
        >
          <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        </button>
        <button
          className={`control-btn ${autoZoom ? "active-control" : ""}`}
          onClick={onToggleZoom}
          data-tooltip="Toggle Auto-Zoom"
        >
          <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z" />
          </svg>
        </button>
        <button
          className="control-btn"
          onClick={onFitView}
          data-tooltip="Center View"
        >
          <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 5h5v2H7v3H5V5zm9 0h5v5h-2V7h-3V5zm0 14h5v-5h-2v3h-3v2zM5 19h5v-2H7v-3H5v5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
