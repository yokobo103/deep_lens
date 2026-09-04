export type AncientZoomLevel = 1 | 2 | 3;

export type AncientLifeRecord = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  minZoomLevel: AncientZoomLevel;
  iconType: string;
  featured?: boolean;
  environment?: string;
  description?: string;
};

/** Small, intentionally local dataset for the North Africa exploration PoC. */
export const ancientLifeRecords: readonly AncientLifeRecord[] = [
  {
    id: "north-africa-life",
    name: "North Africa ecosystem",
    category: "ecosystem",
    lat: 20,
    lng: -5,
    minZoomLevel: 1,
    iconType: "cluster",
  },
  {
    id: "ancient-river-life",
    name: "River life",
    category: "ecosystem",
    lat: 15,
    lng: -10,
    minZoomLevel: 1,
    iconType: "water",
  },
  {
    id: "spinosaurus",
    name: "Spinosaurus",
    category: "large predator",
    lat: 19.5,
    lng: -5.5,
    minZoomLevel: 2,
    iconType: "spinosaurus",
    featured: true,
    environment: "Rivers, lagoons, and coastal wetlands",
    description: "A sail-backed semi-aquatic predator living around the waterways of a warm Cretaceous North Africa.",
  },
  {
    id: "crocodilian",
    name: "Crocodilian",
    category: "aquatic predator",
    lat: 18,
    lng: -2.5,
    minZoomLevel: 2,
    iconType: "crocodilian",
  },
  {
    id: "large-fish",
    name: "Large fish",
    category: "aquatic life",
    lat: 16,
    lng: -7.5,
    minZoomLevel: 2,
    iconType: "fish",
  },
  {
    id: "pterosaur",
    name: "Pterosaur",
    category: "flying reptile",
    lat: 22.5,
    lng: -5,
    minZoomLevel: 2,
    iconType: "pterosaur",
  },
  {
    id: "large-theropod",
    name: "Large theropod",
    category: "predator",
    lat: 25,
    lng: 0,
    minZoomLevel: 2,
    iconType: "theropod",
  },
  {
    id: "fern-and-conifer",
    name: "Fern and conifer",
    category: "plant life",
    lat: 20,
    lng: 2.5,
    minZoomLevel: 3,
    iconType: "plant",
  },
  {
    id: "herbivore",
    name: "Plant-eating dinosaur",
    category: "herbivore",
    lat: 17.5,
    lng: 5,
    minZoomLevel: 3,
    iconType: "herbivore",
  },
] as const;

export const featuredAncientLife = ancientLifeRecords.find((record) => record.featured) ?? ancientLifeRecords[0];
