"use client";

import { useState } from "react";

export function LoadingScreen() {
  const [hidden, setHidden] = useState(false);

  return (
    <div className={`loading-screen ${hidden ? "hidden" : ""}`}>
      <div className="loader-rings">
        <div className="loader-ring" />
        <div className="loader-ring" />
        <div className="loader-ring" />
      </div>
      <p className="loader-text">Planting Seeds...</p>
      <p className="loader-subtext">Watch positivity bloom over time</p>
    </div>
  );
}
