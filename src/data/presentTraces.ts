export type PresentTraceRecord = {
  id: string;
  regionId: string;
  name: string;
  placeLabel: string;
  formationLabel: string;
  presentLat: number;
  presentLng: number;
  paleoLat: number;
  paleoLng: number;
  occurrenceCount: number;
  siteCount: number;
  description: string;
  sourceLabel: string;
  sourceUrl: string;
  coordinateNote: string;
  featured?: boolean;
};

const PBDB_NOTE = "Modern marker is the occurrence-weighted centroid of the named PBDB formation records in the local Deep Lens dataset; it is a regional trace, not an excavation pin.";

/**
 * A quiet Present-day counterpart to the four 95 Ma worlds. These are not
 * extra species claims: each marker summarizes the modern location of the
 * same rock-record selection used by the ancient exploration layer.
 */
export const presentTraceRecords: readonly PresentTraceRecord[] = [
  {
    id: "kem-kem-trace",
    regionId: "kem-kem",
    name: "Kem Kem fossil record",
    placeLabel: "Morocco",
    formationLabel: "Kem Kem Group",
    presentLat: 31.04,
    presentLng: -4.44,
    paleoLat: 17.98,
    paleoLng: -4.46,
    occurrenceCount: 160,
    siteCount: 31,
    description: "Rocks now exposed in southeastern Morocco preserve the river-and-delta world represented on the 95 Ma globe.",
    sourceLabel: "Paleobiology Database · Kem Kem Group",
    sourceUrl: "https://paleobiodb.org/data1.2/occs/list.json?strat=Kem%20Kem&interval=Cenomanian&show=class,ident,phylo,loc,paleoloc,strat,env,time&pgm=scotese&limit=1000&datainfo",
    coordinateNote: PBDB_NOTE,
    featured: true,
  },
  {
    id: "huincul-trace",
    regionId: "huincul",
    name: "Huincul fossil record",
    placeLabel: "Argentina",
    formationLabel: "Huincul Formation",
    presentLat: -38.99,
    presentLng: -69.1,
    paleoLat: -44.78,
    paleoLng: -46.06,
    occurrenceCount: 96,
    siteCount: 18,
    description: "Patagonian outcrops preserve the remains of the southern floodplain ecosystem shown on the ancient globe.",
    sourceLabel: "Paleobiology Database · Huincul Formation",
    sourceUrl: "https://paleobiodb.org/data1.2/occs/list.json?strat=Huincul&interval=Cenomanian&show=class,ident,phylo,loc,paleoloc,strat,env,time&pgm=scotese&limit=1000&datainfo",
    coordinateNote: PBDB_NOTE,
  },
  {
    id: "winton-trace",
    regionId: "winton",
    name: "Winton fossil record",
    placeLabel: "Australia",
    formationLabel: "Winton Formation",
    presentLat: -23.08,
    presentLng: 142.81,
    paleoLat: -54.17,
    paleoLng: 132.38,
    occurrenceCount: 149,
    siteCount: 44,
    description: "Outcrops in Queensland preserve evidence of the high-latitude river forest represented at 95 Ma.",
    sourceLabel: "Paleobiology Database · Winton Formation",
    sourceUrl: "https://paleobiodb.org/data1.2/occs/list.json?strat=Winton&interval=Cenomanian&show=class,ident,phylo,loc,paleoloc,strat,env,time&pgm=scotese&limit=1000&datainfo",
    coordinateNote: PBDB_NOTE,
  },
  {
    id: "greenhorn-trace",
    regionId: "greenhorn",
    name: "Greenhorn fossil record",
    placeLabel: "United States",
    formationLabel: "Greenhorn Limestone",
    presentLat: 39.11,
    presentLng: -102.97,
    paleoLat: 37.54,
    paleoLng: -62.01,
    occurrenceCount: 861,
    siteCount: 166,
    description: "Marine limestone now exposed across the central United States records the inland sea visible on the 95 Ma globe.",
    sourceLabel: "Paleobiology Database · Greenhorn Limestone",
    sourceUrl: "https://paleobiodb.org/data1.2/occs/list.json?strat=Greenhorn&interval=Cenomanian&show=class,ident,phylo,loc,paleoloc,strat,env,time&pgm=scotese&limit=1000&datainfo",
    coordinateNote: PBDB_NOTE,
  },
] as const;

export const featuredPresentTrace = presentTraceRecords.find((trace) => trace.featured) ?? presentTraceRecords[0]!;
