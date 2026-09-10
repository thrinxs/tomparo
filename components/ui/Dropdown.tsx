"use client";

import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";

interface DropdownItem {
  key: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  onClick: () => void;
}

interface Props {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
}

export function Dropdown({ trigger, items, align = "right" }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className={`absolute top-full z-20 mt-2 w-48 rounded-2xl border border-white/10 bg-slate-900 p-1.5 shadow-xl ${align === "right" ? "right-0" : "left-0"}`}>
            {items.map((item) => (
              <button
                key={item.key}
                onClick={() => { item.onClick(); setOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-white/5 ${item.danger ? "text-red-400" : "text-slate-300 hover:text-white"}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Dropdown;
