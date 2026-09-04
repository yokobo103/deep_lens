export type FossilTimeMode = "present" | "ancient";

interface TimeModeToggleProps {
  mode: FossilTimeMode;
  onChange: (mode: FossilTimeMode) => void;
}

export function TimeModeToggle({ mode, onChange }: TimeModeToggleProps) {
  return (
    <nav className="fossil-time-toggle" aria-label="Time mode">
      <button type="button" aria-pressed={mode === "present"} onClick={() => onChange("present")}>
        <span>NOW</span> Present
      </button>
      <span className="fossil-time-toggle__arrow" aria-hidden="true">→</span>
      <button type="button" aria-pressed={mode === "ancient"} onClick={() => onChange("ancient")}>
        <span>THEN</span> 95 Ma
      </button>
    </nav>
  );
}
