import { ENV_COLOR, ENV_LABEL, type ColumnBand } from "../data/pbdb";

interface StrataColumnProps {
  lat: number;
  lng: number;
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

export function StrataColumn({ lat, lng, radiusKm, bands, loading, onClose }: StrataColumnProps) {
  // `bands` arrives youngest first, which stacks the oldest at the bottom —
  // the way a real column is read.
  const stacked = bands;

  return (
    <aside className="strata-column" aria-label="Stratigraphic column for the selected place">
      <button type="button" className="fossil-info-panel__close" onClick={onClose} aria-label="Close column">×</button>
      <p className="fossil-eyebrow">THIS PLACE, THROUGH TIME</p>
      <h2 className="strata-column__place">
        {formatCoordinate(lat, "N", "S")} {formatCoordinate(lng, "E", "W")}
      </h2>

      {loading && <p className="strata-column__state">Reading the record…</p>}

      {!loading && stacked.length === 0 && (
        <p className="strata-column__state">
          No fossil-bearing formation is recorded within {radiusKm} km of this point, in the Late Jurassic
          to Cretaceous. That is a gap in the record, not an empty world.
        </p>
      )}

      {!loading && stacked.length > 0 && (
        <>
          <p className="strata-column__count">
            <strong>{stacked.length}</strong> formations with recorded fossils within {radiusKm} km
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
                      {band.group && <em>{band.group} Group</em>}
                      <small>{ENV_LABEL[band.dominantEnv]}</small>
                    </span>
                    <span className="strata-band__meta">
                      <b>{band.count}</b>
                      <i>records</i>
                      <u>{formatCoordinate(band.paleoLat, "N", "S")} then</u>
                    </span>
                  </div>
                  {gap >= GAP_MA && (
                    <div className="strata-gap">no record here for about {Math.round(gap)} Myr</div>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="strata-column__note">
            EVIDENCE ONLY · NO AI INTERPRETATION. Each band is a formation that someone dug and published.
            <strong>Records</strong> counts published occurrences, not animals — it follows collecting effort
            as much as it follows life. Environments are the ones recorded with the fossils.
            Positions are placed by the centre of each formation's recorded sites.
          </p>
        </>
      )}
    </aside>
  );
}
