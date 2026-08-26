"use client";

import { X, ArrowRight, CheckCircle } from "lucide-react";

export type BubblePosition = {
  top: number;
  left: number;
  pointerSide: "top" | "bottom" | "left" | "right" | "none";
  pointerOffset: number;
};

interface Props {
  step: number;
  total: number;
  title: string;
  description: string;
  feature: string;
  position: BubblePosition;
  onNext: () => void;
  onClose: () => void;
  isLast: boolean;
}

export default function TourBubble({
  step, total, title, description, feature,
  position, onNext, onClose, isLast,
}: Props) {
  const { top, left, pointerSide, pointerOffset } = position;

  const pointerClass: Record<string, string> = {
    top: "bottom-full left-0 w-full h-3 flex items-end",
    bottom: "top-full left-0 w-full h-3 flex items-start",
    left: "right-full top-0 h-full w-3 flex items-center justify-end",
    right: "left-full top-0 h-full w-3 flex items-center justify-start",
    none: "hidden",
  };

  const pointerTriangle: Record<string, string> = {
    top: "border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-purple-600",
    bottom: "border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-purple-600",
    left: "border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-purple-600",
    right: "border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-purple-600",
    none: "hidden",
  };

  const pointerStyle: Record<string, React.CSSProperties> = {
    top: { marginLeft: pointerOffset },
    bottom: { marginLeft: pointerOffset },
    left: { marginTop: pointerOffset },
    right: { marginTop: pointerOffset },
    none: {},
  };

  return (
    <div
      className="fixed z-[9999] w-72"
      style={{ top, left }}
    >
      {/* Pointer — top */}
      {pointerSide === "top" && (
        <div className="flex h-3 items-end" style={{ paddingLeft: pointerOffset }}>
          <div className={`w-0 h-0 ${pointerTriangle.top}`} />
        </div>
      )}

      {/* Main bubble */}
      <div className="relative rounded-2xl border border-purple-500/30 bg-slate-900 shadow-2xl shadow-purple-900/40">

        {/* Left pointer */}
        {pointerSide === "left" && (
          <div className="absolute -left-3 top-0 h-full flex items-center" style={{ marginTop: pointerOffset }}>
            <div className={`w-0 h-0 ${pointerTriangle.left}`} />
          </div>
        )}

        {/* Right pointer */}
        {pointerSide === "right" && (
          <div className="absolute -right-3 top-0 h-full flex items-center" style={{ marginTop: pointerOffset }}>
            <div className={`w-0 h-0 ${pointerTriangle.right}`} />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400">
              {feature}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition rounded-lg p-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-4 space-y-3">
          <h3 className="text-sm font-semibold text-white leading-snug">{title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{description}</p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            {/* Step dots */}
            <div className="flex items-center gap-1">
              {Array.from({ length: total }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all ${
                    i === step - 1
                      ? "w-4 h-1.5 bg-purple-500"
                      : i < step - 1
                      ? "w-1.5 h-1.5 bg-purple-800"
                      : "w-1.5 h-1.5 bg-slate-700"
                  }`}
                />
              ))}
            </div>

            {/* Button */}
            <button
              onClick={onNext}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                isLast
                  ? "bg-emerald-600 text-white hover:bg-emerald-500"
                  : "bg-purple-600 text-white hover:bg-purple-500"
              }`}
            >
              {isLast ? (
                <><CheckCircle className="h-3.5 w-3.5" />Finish</>
              ) : (
                <>Next<ArrowRight className="h-3.5 w-3.5" /></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Pointer — bottom */}
      {pointerSide === "bottom" && (
        <div className="flex h-3 items-start" style={{ paddingLeft: pointerOffset }}>
          <div className={`w-0 h-0 ${pointerTriangle.bottom}`} />
        </div>
      )}
    </div>
  );
}
