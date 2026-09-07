import { bandDefinitions } from "../data/gates";
import type { Locale } from "./copy";

import { ERAS, OLDEST_MA } from "../data/eras";

/**
 * Linear time, not log. A log scale would give the Cenozoic a fair share of the
 * bar and in doing so would say something false: the age of mammals really is a
 * sliver next to the Paleozoic, and a reader who notices that has learned the
 * thing this bar exists to show.
 */

interface TimeScaleProps {
  /** Where the reader is standing. null is the present. */
  ageMa: number | null;
  locale: Locale;
  label: string;
}

const position = (ma: number) => `${(1 - ma / OLDEST_MA) * 100}%`;

/**
 * Where the age being looked at sits in the whole of it.
 *
 * Optional, and quiet enough that leaving it on is not a decision. It carries
 * no numbers: the age banner already says which age this is, and repeating it
 * here would make two things to read where the question is only "roughly
 * where". Ticks mark the ages Deep Lens actually has, so the bar also says how
 * much of deep time is still empty.
 */
export function TimeScale({ ageMa, locale, label }: TimeScaleProps) {
  const ages = [...new Set(bandDefinitions.map((band) => band.terrainMa))].sort((a, b) => b - a);
  const here = ageMa ?? 0;

  return (
    <div className="timescale" role="img" aria-label={label}>
      <div className="timescale__eras" aria-hidden="true">
        {ERAS.map((era) => (
          <span key={era.id} style={{ flexGrow: era.from - era.to }}>{era[locale]}</span>
        ))}
      </div>
      <div className="timescale__track" aria-hidden="true">
        {ERAS.map((era) => (
          <i key={era.id} className={`timescale__era is-${era.id}`} style={{ flexGrow: era.from - era.to }} />
        ))}
        {ages.map((ma) => (
          <b
            key={ma}
            className={`timescale__tick${ageMa === ma ? " is-here" : ""}`}
            style={{ left: position(ma) }}
          />
        ))}
        <span className="timescale__here" style={{ left: position(here) }} />
      </div>
    </div>
  );
}
