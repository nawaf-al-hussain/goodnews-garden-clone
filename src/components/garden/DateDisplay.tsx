"use client";

interface DateDisplayProps {
  currentDate: string;
  progress: number;
}

export function DateDisplay({ currentDate, progress }: DateDisplayProps) {
  return (
    <div className="date-display">
      <div className="date-value">{currentDate}</div>
      <div className="date-progress">
        <div
          className="progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
