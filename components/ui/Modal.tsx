"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg";
}

const widths = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Modal({ open, onClose, title, children, maxWidth = "md" }: Props) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`relative w-full ${widths[maxWidth]} rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl`}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition rounded-lg p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {!title && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-white transition rounded-lg p-1"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {children}
      </div>
    </div>
  );
}

export default Modal;
