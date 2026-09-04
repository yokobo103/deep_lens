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
};

/** PoC coordinates: the paleo point is an illustrative point placed on the local 100 Ma land proxy. */
export const fossilRecords: readonly FossilRecord[] = [
  {
    id: "spinosaurus-kem-kem",
    taxon: "Spinosaurus",
    periodLabel: "Late Cretaceous",
    ageLabel: "95 Ma",
    presentLat: 31.2,
    presentLng: -5.6,
    paleoLat: 19.5,
    paleoLng: -5.5,
    presentPlaceLabel: "Morocco · Kem Kem Beds",
    paleoPlaceLabel: "North Africa · reconstructed land",
    summary: "A large semi-aquatic predator known from fossil-bearing rocks in Morocco. This prototype compares the discovery point today with the approximate position of that land at 95 Ma.",
  },
] as const;
