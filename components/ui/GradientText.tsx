import { cn } from "@/lib/utils";

interface GradientTextProps {
  className?: string;
  children: React.ReactNode;
}

export function GradientText({ className, children }: GradientTextProps) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent",
        className
      )}
    >
      {children}
    </span>
  );
}