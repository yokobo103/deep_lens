import { ENV_COLOR, ENV_LABEL, type ColumnBand } from "../data/pbdb";
import { environmentLabel, fossilCopy, type Locale } from "../fossil/localization";

interface StrataColumnProps {
  lat: number;
  lng: number;
  locale: Locale;
  radiusKm: number;
  bands: ColumnBand[];
  loading: boolean;
  onClose: () => void;
}

/** A gap worth naming. Below this, consecutive bands read as one sequence. */
const GAP_MA = 8;

function formatCoordinate(value: number, positive: string, negative: string) {
  return `${Math.abs(value).toFixed(1)}°${value >= 0 ? positive : negative}`;
}

export function StrataColumn({ lat, lng, locale, radiusKm, bands, loading, onClose }: StrataColumnProps) {
  // `bands` arrives youngest first, which stacks the oldest at the bottom —
  // the way a real column is read.
  const stacked = bands;
  const copy = fossilCopy[locale];

  return (
    <aside className="strata-column" aria-label={copy.strataThroughTime}>
      <button type="button" className="fossil-info-panel__close" onClick={onClose} aria-label={copy.closeInfo}>×</button>
      <p className="fossil-eyebrow">{copy.strataThroughTime}</p>
      <h2 className="strata-column__place">
        {formatCoordinate(lat, "N", "S")} {formatCoordinate(lng, "E", "W")}
      </h2>

      {loading && <p className="strata-column__state">{copy.readingRecord}</p>}

      {!loading && stacked.length === 0 && (
        <p className="strata-column__state">
          {copy.noFormation(radiusKm)}
        </p>
      )}

      {!loading && stacked.length > 0 && (
        <>
          <p className="strata-column__count">
            {copy.formationsNearby(stacked.length, radiusKm)}
          </p>
          <ol className="strata-column__bands">
            {stacked.map((band, index) => {
              const older = stacked[index + 1];
              const gap = older ? older.midMa - band.midMa : 0;
              return (
                <li key={`${band.formation}-${band.midMa}`}>
                  <div className="strata-band">
                    <span className="strata-band__age">{band.midMa.toFixed(0)} Ma</span>
                    <span className="strata-band__swatch" style={{ background: ENV_COLOR[band.dominantEnv] }} aria-hidden="true" />
                    <span className="strata-band__body">
                      <strong>{band.formation}</strong>
                      {band.group && <em>{band.group} {copy.group}</em>}
                      <small>{environmentLabel(locale, ENV_LABEL[band.dominantEnv])}</small>
                    </span>
                    <span className="strata-band__meta">
                      <b>{band.count}</b>
                      <i>{copy.records}</i>
                      <u>{formatCoordinate(band.paleoLat, "N", "S")} {copy.thenShort}</u>
                    </span>
                  </div>
                  {gap >= GAP_MA && (
                    <div className="strata-gap">{copy.noRecordFor(Math.round(gap))}</div>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="strata-column__note">
            {copy.evidenceOnly}
          </p>
        </>
      )}
    </aside>
  );
}
