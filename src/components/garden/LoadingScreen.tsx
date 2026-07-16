"use client";

import { useState, useEffect } from "react";

interface LoadingScreenProps {
  onLoaded?: () => void;
}

export function LoadingScreen({ onLoaded }: LoadingScreenProps) {
  const [hidden, setHidden] = useState(false);
  const [progress, setProgress] = useState(0);

  // Simulate loading progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setHidden(true);
            onLoaded?.();
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [onLoaded]);

  return (
    <div
      className={`loading-screen ${hidden ? "hidden" : ""}`}
      role="status"
      aria-label="Loading garden visualization"
    >
      <div className="loader-rings">
        <div className="loader-ring" />
        <div className="loader-ring" />
        <div className="loader-ring" />
      </div>
      <p className="loader-text">Planting Seeds...</p>
      <p className="loader-subtext">Watch positivity bloom over time</p>

      {/* Progress bar */}
      <div
        style={{
          marginTop: "20px",
          width: "120px",
          height: "3px",
          background: "rgba(158, 200, 158, 0.15)",
          borderRadius: "9999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(progress, 100)}%`,
            background:
              "linear-gradient(90deg, var(--accent-leaf), var(--accent-blossom))",
            borderRadius: "9999px",
            transition: "width 0.3s ease-out",
          }}
        />
      </div>
    </div>
  );
}
