import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = "", hover = false }: Props) {
  return (
    <div className={`rounded-2xl border border-white/5 bg-white/[0.02] ${hover ? "transition hover:border-white/10 hover:bg-white/[0.04]" : ""} ${className}`}>
      {children}
    </div>
  );
}

export default Card;
