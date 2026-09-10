import { ReactNode } from "react";

type BadgeVariant = "default" | "premium" | "success" | "warning" | "danger" | "info";

const variants: Record<BadgeVariant, string> = {
  default: "border-white/10 bg-white/5 text-slate-400",
  premium: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  danger:  "border-red-500/20 bg-red-500/10 text-red-400",
  info:    "border-blue-500/20 bg-blue-500/10 text-blue-400",
};

interface Props {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export default Badge;
