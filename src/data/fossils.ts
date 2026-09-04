export type FossilRecord = {
  id: string;
  taxon: string;
  periodLabel: string;
  ageLabel: string;
  presentLat: number;
  presentLng: number;
  paleoLat: number;
  paleoLng: number;
  presentPlaceLabel: string;
  paleoPlaceLabel: string;
  summary: string;
  sourceLabel: string;
  sourceUrl: string;
  coordinateNote: string;
};

/**
 * The ancient point is the centroid of PBDB PALEOMAP paleocoordinates for
 * Spinosaurus aegyptiacus occurrences in the Cenomanian Kem Kem Group.
 */
export const fossilRecords: readonly FossilRecord[] = [
  {
    id: "spinosaurus-kem-kem",
    taxon: "Spinosaurus",
    periodLabel: "Cenomanian",
    ageLabel: "~95–100 Ma",
    presentLat: 31.2,
    presentLng: -5.6,
    paleoLat: 17.96,
    paleoLng: -4.24,
    presentPlaceLabel: "Morocco · Kem Kem Beds",
    paleoPlaceLabel: "Kem Kem Group · PBDB reconstruction",
    summary: "Spinosaurus aegyptiacus is recorded from the Cenomanian Kem Kem Group of Morocco. The ancient marker and 95 Ma surface now use the same PALEOMAP reconstruction family.",
    sourceLabel: "Paleobiology Database · Kem Kem Group occurrences",
    sourceUrl: "https://paleobiodb.org/data1.2/occs/list.json?strat=Kem%20Kem&interval=Cenomanian&show=class,ident,phylo,loc,paleoloc,strat,env,time&pgm=scotese&limit=1000&datainfo",
    coordinateNote: "PBDB PALEOMAP (Scotese) paleocoordinate centroid for 17 Spinosaurus aegyptiacus occurrence records; accessed 2026-09-04.",
  },
] as const;
