export type ConfidenceLevel = "high" | "medium" | "low" | "unknown";
export type DataClassification = "real" | "demo" | "derived" | "schematic";

export interface DataProvenance {
  source: string;
  sourceUrl?: string;
  license: string;
  updatedAt: string;
  confidence: ConfidenceLevel;
  dataKind: "demo" | "real";
  classifications?: DataClassification[];
  note?: string;
}

export interface GeographicPoint {
  latitude: number;
  longitude: number;
}
