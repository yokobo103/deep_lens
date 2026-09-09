export interface SceneHighlight {
  /** Position of the printed species label within the uncropped scene. */
  x: number;
  y: number;
}

/**
 * Hand-measured label positions in reconstruction art.
 *
 * This starts deliberately with one scene. Keeping the coordinates beside the
 * gate id lets another scene opt in later without teaching the viewer about a
 * specific gate or pretending unsupported names can be located.
 */
const SCENE_HIGHLIGHTS: Readonly<Record<string, Readonly<Record<string, SceneHighlight>>>> = {
  "kem-kem": {
    "Spinosaurus aegyptiacus": { x: 0.505, y: 0.089 },
    "Carcharodontosaurus saharicus": { x: 0.865, y: 0.124 },
    "Rebbachisaurus garasbae": { x: 0.112, y: 0.234 },
    "Onchopristis numidus": { x: 0.333, y: 0.843 },
    "Oumtkoutia anae": { x: 0.855, y: 0.909 },
  },
};

export function sceneHighlight(gateId: string, species: string): SceneHighlight | undefined {
  return SCENE_HIGHLIGHTS[gateId]?.[species];
}
