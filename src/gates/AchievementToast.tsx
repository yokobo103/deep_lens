import { useEffect, useRef } from "react";
import type { AchievementDefinition } from "./AchievementCatalog";
import { hubCopy, type Locale } from "./copy";

interface AchievementToastProps {
  achievement: AchievementDefinition;
  locale: Locale;
  onDone: () => void;
}

/** Non-blocking by design: it leaves by itself and has no close affordance. */
export function AchievementToast({ achievement, locale, onDone }: AchievementToastProps) {
  const text = hubCopy[locale];
  const onDoneRef = useRef(onDone);

  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    const timer = window.setTimeout(() => onDoneRef.current(), 4600);
    return () => window.clearTimeout(timer);
  }, [achievement.id]);

  return (
    <aside className="achievement-toast" role="status" aria-live="polite">
      <span className="achievement-toast__sparks" aria-hidden="true"><i /><i /><i /></span>
      <span className="achievement-toast__trophy" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 4.5h10v3.2c0 4-2 6.3-5 6.3s-5-2.3-5-6.3V4.5Z" />
          <path d="M7 6H4.5v1.5c0 2.2 1.3 3.5 3.4 3.5M17 6h2.5v1.5c0 2.2-1.3 3.5-3.4 3.5M12 14v3.1M8.5 20h7M10 17.2h4" />
        </svg>
      </span>
      <div className="achievement-toast__copy">
        <small>{text.achievementNew}</small>
        <strong>{achievement.name[locale]}</strong>
      </div>
    </aside>
  );
}
