"use client";

interface LoadingScreenProps {
  onLoaded?: () => void;
}

export function LoadingScreen({ onLoaded }: LoadingScreenProps) {
  return (
    <div
      className="loading-screen"
      role="status"
      aria-label="Loading garden visualization"
    >
      <div className="loader-rings">
        <div className="loader-ring" />
        <div className="loader-ring" />
        <div className="loader-ring" />
      </div>
      <p className="loader-text">Growing the Garden</p>
      <p className="loader-subtext">Planting Seeds of Positive News...</p>
    </div>
  );
}
