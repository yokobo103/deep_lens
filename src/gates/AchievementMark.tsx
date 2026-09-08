import type { ReactNode } from "react";
import type { AchievementMark as MarkName } from "./AchievementCatalog";

const marks: Record<MarkName, ReactNode> = {
  spark: <><path d="M8 2.3v11.4M2.3 8h11.4" /><circle cx="8" cy="8" r="2.7" /></>,
  depth: <><path d="M3 4.2h10M4.4 7.1h7.2M5.8 10h4.4M8 12.8v-9" /></>,
  layers: <><path d="m2.5 5 5.5-2.6L13.5 5 8 7.6 2.5 5Z" /><path d="m3.2 8 4.8 2.3L12.8 8M3.2 10.8 8 13.1l4.8-2.3" /></>,
  echo: <><circle cx="5.1" cy="8" r="2.7" /><circle cx="10.9" cy="8" r="2.7" /><path d="M7.8 5.4v5.2" /></>,
  well: <><ellipse cx="8" cy="4" rx="4.5" ry="1.8" /><path d="M3.5 4v6.6c0 1 2 1.9 4.5 1.9s4.5-.9 4.5-1.9V4M8 5.8v4.4" /></>,
  horizon: <><path d="M2.2 8h11.6M4 5.5h8M4 10.5h8" /><circle cx="8" cy="8" r="1.5" /></>,
  tide: <><path d="M2 6.2c1.5-1.3 2.7-1.3 4.2 0s2.8 1.3 4.3 0 2.5-1.3 3.5-.5M2 9.7c1.5-1.3 2.7-1.3 4.2 0s2.8 1.3 4.3 0 2.5-1.3 3.5-.5" /></>,
  compass: <><circle cx="8" cy="8" r="5.6" /><path d="m9.8 5.2-1.1 3.5-3.5 2.1 2.1-3.5 2.5-2.1Z" /></>,
};

export function AchievementMark({ name, hidden = false }: { name: MarkName; hidden?: boolean }) {
  return (
    <span className={`achievement-mark${hidden ? " is-hidden" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" strokeLinejoin="round">
        {hidden ? <circle cx="8" cy="8" r="5.3" strokeDasharray="1.5 2.4" /> : marks[name]}
      </svg>
    </span>
  );
}
