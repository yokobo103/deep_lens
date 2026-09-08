import { useEffect, useRef } from "react";
import { AchievementMark } from "./AchievementMark";
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
      <AchievementMark name={achievement.mark} />
      <div>
        <small>{text.achievementNew}</small>
        <strong>{achievement.name[locale]}</strong>
      </div>
    </aside>
  );
}
