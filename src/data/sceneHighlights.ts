export interface SceneHighlight {
  /** Position of the printed species label within the uncropped scene. */
  x: number;
  y: number;
}

/**
 * Hand-measured label positions in reconstruction art.
 *
 * Each gate opts in independently. Keeping coordinates beside the gate id
 * lets a reviewed scene join later without teaching the viewer about a
 * specific gate or pretending unsupported names can be located.
 */
export const SCENE_HIGHLIGHTS: Readonly<Record<string, Readonly<Record<string, SceneHighlight>>>> = {
  "kem-kem": {
    "Spinosaurus aegyptiacus": { x: 0.505, y: 0.089 },
    "Carcharodontosaurus saharicus": { x: 0.865, y: 0.124 },
    "Rebbachisaurus garasbae": { x: 0.112, y: 0.234 },
    "Onchopristis numidus": { x: 0.333, y: 0.843 },
    "Oumtkoutia anae": { x: 0.855, y: 0.909 },
  },
  fezouata: {
    "Asaphellus jujuanus": { x: 0.172, y: 0.220 },
    "Ampyx priscus": { x: 0.862, y: 0.560 },
    "Thoralispira laevis": { x: 0.125, y: 0.826 },
    "Carcassonnella courtessolei": { x: 0.572, y: 0.686 },
    "Redonia michelae": { x: 0.928, y: 0.721 },
  },
  "anti-atlas": {
    "Agoniatites expansus": { x: 0.469, y: 0.085 },
    "Anarcestes lateseptatus": { x: 0.734, y: 0.156 },
    "Chotecops breviceps": { x: 0.134, y: 0.826 },
    "Pedinopariops degener": { x: 0.686, y: 0.560 },
    "Aulacopleura beyrichi": { x: 0.886, y: 0.881 },
  },
  chinle: {
    "Coelophysis bauri": { x: 0.180, y: 0.165 },
    "Typothorax coccinarum": { x: 0.456, y: 0.269 },
    "Machaeroprosopus buceros": { x: 0.895, y: 0.349 },
    "Anaschisma browni": { x: 0.172, y: 0.884 },
    "Chinlea sorenseni": { x: 0.792, y: 0.833 },
  },
  morrison: {
    "Allosaurus fragilis": { x: 0.190, y: 0.158 },
    "Camarasaurus supremus": { x: 0.599, y: 0.188 },
    "Dryosaurus altus": { x: 0.469, y: 0.388 },
    "Stegosaurus stenops": { x: 0.921, y: 0.296 },
    "Ceratodus guentheri": { x: 0.810, y: 0.803 },
  },
  "green-river": {
    "Archimyrmex rostratus": { x: 0.224, y: 0.191 },
    "Eoformica pinguis": { x: 0.428, y: 0.358 },
    "Eotetrix unicornis": { x: 0.572, y: 0.404 },
    "Ectobius kohlsi": { x: 0.863, y: 0.404 },
    "Cuterebra ascarides": { x: 0.893, y: 0.218 },
  },
  moenkopi: {
    "Protogusarella smithi": { x: 0.116, y: 0.666 },
    "Eumorphotis multiformis": { x: 0.355, y: 0.500 },
    "Lenticidaris utahensis": { x: 0.683, y: 0.457 },
    "Naticopsis (Naticopsis) utahensis": { x: 0.890, y: 0.572 },
    "Piarorhynchella triassica": { x: 0.867, y: 0.932 },
  },
};

export function sceneHighlight(gateId: string, species: string): SceneHighlight | undefined {
  return SCENE_HIGHLIGHTS[gateId]?.[species];
}

export function sceneHighlightsFor(gateId: string): Readonly<Record<string, SceneHighlight>> {
  return SCENE_HIGHLIGHTS[gateId] ?? {};
}
