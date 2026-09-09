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
  cluster: <><circle cx="5.2" cy="5.6" r="2.1" /><circle cx="10.9" cy="6.4" r="1.7" /><circle cx="7.4" cy="11" r="2.4" /></>,
  ring: <><circle cx="8" cy="8" r="5.6" /><circle cx="8" cy="8" r="2.6" /></>,
  column: <><path d="M4 3.4h8M4.8 6.2h6.4M4 9h8M4.8 11.8h6.4" /></>,
  span: <><path d="M2.4 8h11.2M2.4 5.6v4.8M13.6 5.6v4.8" /></>,
  pole: <><circle cx="8" cy="8" r="5.6" /><path d="M2.9 5.6h10.2" /><path d="M8 2.4v3.2" /></>,
  sun: <><circle cx="8" cy="8" r="3" /><path d="M8 1.6v1.6M8 12.8v1.6M1.6 8h1.6M12.8 8h1.6M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M12.5 3.5l-1.1 1.1M4.6 11.4l-1.1 1.1" /></>,
  drift: <><path d="M2.6 11.2c3-4.6 6.4-6.6 10.6-7" /><path d="m10.2 2.6 3 1.6-1.4 3" /></>,
  ledger: <><rect x="3" y="2.6" width="10" height="10.8" rx="1" /><path d="M5.4 5.6h5.2M5.4 8h5.2M5.4 10.4h3.2" /></>,
  thin: <><rect x="3" y="2.6" width="10" height="10.8" rx="1" /><path d="M5.4 6.4h3.4M5.4 9.6h1.8" /></>,
  break: <><path d="M2.2 5.4h4.6l1.5 5.2 1.5-5.2h4" /><path d="M2.2 10.6h4.4M9.6 10.6h4.2" /></>,
  day: <><circle cx="8" cy="9.4" r="2.8" /><path d="M1.8 12.6h12.4M8 3.2v1.6M3.6 4.9l1.1 1.1M12.4 4.9l-1.1 1.1" /></>,
  calendar: <><rect x="2.6" y="3.6" width="10.8" height="9.8" rx="1" /><path d="M2.6 6.6h10.8M5.4 2.4v2.4M10.6 2.4v2.4" /></>,
  globe: <><circle cx="8" cy="8" r="5.6" /><path d="M2.4 8h11.2" /><ellipse cx="8" cy="8" rx="2.5" ry="5.6" /></>,
  // 知っている顔 — abstract, because the mark is visible before the discovery
  // is earned and is meant to read as a riddle rather than as a portrait.
  grasp: <><path d="M4 3.6c-.6 4 1 6.8 4 8.4M12 3.6c.6 4-1 6.8-4 8.4" /><path d="M4.5 6.2h1.5M11.5 6.2H10M5.5 8.6h1.4M10.5 8.6H9.1" /></>,
  after: <><path d="M2.4 8h1.4M5 8h1.4M7.6 8h.9" /><circle cx="11.9" cy="8" r="2.2" /></>,
  origin: <><circle cx="4.4" cy="8" r="2" /><path d="M7.2 8h6.2M9.8 5.6 12.4 8l-2.6 2.4" /></>,
  feather: <><path d="M11.8 3.2 4.6 12.6" /><path d="m10.4 5-2.8-.5M9.1 6.7 6.2 6.3M7.8 8.4 5 8.2M6.5 10.1 4.4 10" /></>,
  reach: <><path d="M6.2 13.2V6.4c0-2 1.2-3.3 3-3.3 1.4 0 2.4.6 3 1.7" /><path d="M3.6 13.2h5.2" /></>,
  sail: <><path d="M4 8.6c1-3.8 2.6-5.6 4.4-5.6 1.6 0 2.9 1.1 3.6 2.8" /><path d="M2.2 8.6h11.6" /><path d="M2.8 11.6c1.2-1 2.4-1 3.6 0s2.4 1 3.6 0 2.2-1 3-.4" /></>,
  sickle: <><path d="M4 12.4c5-1.2 8-4.6 8.6-9.2" /><path d="m12.6 3.2-2.7 1.1M12.6 3.2l.5 2.7" /></>,
  stripes: <><path d="M4.4 4v8M7 4.6v6.8M9.6 5.2v5.6M12.2 5.8v4.4" /></>,
  tusk: <><path d="M5.4 3.4c-2 3.6-1.3 6.8 1.9 9M10.6 3.4c2 3.6 1.3 6.8-1.9 9" /></>,
  ice: <><path d="M8 2.2 13 8l-5 5.8L3 8Z" /><path d="M8 2.2v11.6M3 8h10" /></>,
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
