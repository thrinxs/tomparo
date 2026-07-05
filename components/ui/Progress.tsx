"use client";

import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  color?: "blue" | "green" | "amber" | "red";
}

const colors = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};

function getColor(value: number): "green" | "amber" | "red" | "blue" {
  if (value >= 80) return "green";
  if (value >= 60) return "blue";
  if (value >= 40) return "amber";
  return "red";
}

export function Progress({
  value,
  max = 100,
  className,
  showLabel = false,
  color,
}: ProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const autoColor = color || getColor(value);

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            colors[autoColor]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}