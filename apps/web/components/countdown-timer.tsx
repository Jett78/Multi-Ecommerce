"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  endsAt: string;
  className?: string;
  onEnd?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(endsAt: string): TimeLeft | null {
  const difference = new Date(endsAt).getTime() - Date.now();
  if (difference <= 0) return null;
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

export default function CountdownTimer({ endsAt, className = "", onEnd }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => calculateTimeLeft(endsAt));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft(endsAt);
      setTimeLeft(remaining);
      if (!remaining) {
        clearInterval(timer);
        onEnd?.();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endsAt, onEnd]);

  if (!timeLeft) {
    return (
      <span className={`text-sm font-bold text-gray-400 ${className}`}>
        Sale Ended
      </span>
    );
  }

  const blocks = [
    { value: timeLeft.days, label: "D" },
    { value: timeLeft.hours, label: "H" },
    { value: timeLeft.minutes, label: "M" },
    { value: timeLeft.seconds, label: "S" },
  ];

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {blocks.map((block, i) => (
        <div key={block.label} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-white tabular-nums leading-none">
              {String(block.value).padStart(2, "0")}
            </span>
            <span className="text-[9px] font-medium text-white/60 uppercase tracking-wider">
              {block.label}
            </span>
          </div>
          {i < blocks.length - 1 && (
            <span className="text-lg font-bold text-white/40 mb-2">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
