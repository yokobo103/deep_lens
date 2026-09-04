import { fossilCopy, type Locale } from "../fossil/localization";

export type FossilTimeMode = "present" | "ancient";

interface TimeModeToggleProps {
  mode: FossilTimeMode;
  locale: Locale;
  onChange: (mode: FossilTimeMode) => void;
}

export function TimeModeToggle({ mode, locale, onChange }: TimeModeToggleProps) {
  const copy = fossilCopy[locale];
  return (
    <nav className="fossil-time-toggle" aria-label={copy.timeMode}>
      <button type="button" aria-pressed={mode === "present"} onClick={() => onChange("present")}>
        <span>{copy.now}</span> {copy.present}
      </button>
      <span className="fossil-time-toggle__arrow" aria-hidden="true">→</span>
      <button type="button" aria-pressed={mode === "ancient"} onClick={() => onChange("ancient")}>
        <span>{copy.then}</span> 95 Ma
      </button>
    </nav>
  );
}
