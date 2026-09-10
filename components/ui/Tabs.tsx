"use client";

import { ReactNode, useState } from "react";

interface Tab {
  key: string;
  label: string;
  icon?: ReactNode;
}

interface Props {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (key: string) => void;
  children: (activeTab: string) => ReactNode;
}

export function Tabs({ tabs, defaultTab, onChange, children }: Props) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.key ?? "");

  const handleChange = (key: string) => {
    setActive(key);
    onChange?.(key);
  };

  return (
    <div>
      {/* Tab bar */}
      <div className="flex rounded-xl border border-white/10 bg-white/[0.02] p-1 w-fit mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleChange(tab.key)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              active === tab.key
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {children(active)}
    </div>
  );
}

export default Tabs;
