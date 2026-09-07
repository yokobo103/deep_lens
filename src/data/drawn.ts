/**
 * Who is actually in the picture.
 *
 * Each scene has five species painted into it with their names lettered on.
 * Until now those five lived only in the pixels: the app could show the picture
 * and could show the record, but could not say that this animal in that picture
 * is this row in that record.
 *
 * Written down here, three things become possible at once — the card can list
 * the five the reader is looking at, the bake can check every one of them
 * against the gate's own records, and a later pass can crop each one out of the
 * artwork for a thumbnail without guessing what it is looking at.
 *
 * Order is as the eye meets them, roughly left to right and top to bottom.
 * Names are as the record spells them, not as the artwork letters them: the
 * Chinle scene reads "Macheroprosopus" and the record says Machaeroprosopus,
 * and the record is what a name has to match.
 */

export const DRAWN_IN_SCENE: Record<string, readonly string[]> = {
  "hell-creek": [
    "Dryophyllum subfalcatum", "Brachychampsa montana", "Meniscoessus robustus",
    "Lepisosteus occidentalis", "Compsemys victa",
  ],
  "dinosaur-park": [
    "Centrosaurus apertus", "Saurornitholestes langstoni", "Myledaphus bipartitus",
    "Paralbula casei", "Scapherpeton tectum",
  ],
  nemegt: [
    "Tarbosaurus bataar", "Gallimimus bullatus", "Saurolophus angustirostris",
    "Deinocheirus mirificus", "Mongolochelys efremovi",
  ],
  maevarano: [
    "Rapetosaurus krausei", "Majungasaurus crenatissimus", "Masiakasaurus knopfleri",
    "Beelzebufo ampinga", "Lavanify miolaka",
  ],
  "kem-kem": [
    "Spinosaurus aegyptiacus", "Carcharodontosaurus saharicus", "Rebbachisaurus garasbae",
    "Onchopristis numidus", "Oumtkoutia anae",
  ],
  "western-interior": [
    "Cretoxyrhina mantelli", "Ptychodus anonymus", "Pachyrhizodus minimus",
    "Calycoceras (Calycoceras) naviculare", "Inoceramus (Inoceramus) pictus",
  ],
  fezouata: [
    "Asaphellus jujuanus", "Ampyx priscus", "Thoralispira laevis",
    "Carcassonnella courtessolei", "Redonia michelae",
  ],
  chinle: [
    "Coelophysis bauri", "Typothorax coccinarum", "Machaeroprosopus buceros",
    "Anaschisma browni", "Chinlea sorenseni",
  ],
  morrison: [
    "Allosaurus fragilis", "Camarasaurus supremus", "Dryosaurus altus",
    "Stegosaurus stenops", "Ceratodus guentheri",
  ],
  "green-river": [
    "Archimyrmex rostratus", "Eoformica pinguis", "Eotetrix unicornis",
    "Ectobius kohlsi", "Cuterebra ascarides",
  ],
  sarka: [
    "Lesueurilla prima", "Ribeiria apusoides", "Babinka prima",
    "Sagittacystis prima", "Plasiacystis mobilis",
  ],
  elliot: [
    "Melanorosaurus readi", "Eucnemesaurus fortis", "Blikanasaurus cromptoni",
    "Plateosauravus cullingworthi", "Scalenodontoides macrodontes",
  ],
  tendaguru: [
    "Giraffatitan brancai", "Kentrosaurus aethiopicus", "Dicraeosaurus sattleri",
    "Elaphrosaurus bambergi", "Falcimytilus dietrichi",
  ],
  solnhofen: [
    "Archaeopteryx lithographica", "Rhamphorhynchus muensteri", "Cymatophlebia longialata",
    "Chresmoda obscura", "Mesolimulus walchi",
  ],
  "london-clay": [
    "Otodus obliquus", "Carcharias macrotus", "Cimomia imperialis",
    "Dinochelus steeplensis", "Nypa fruticans",
  ],

  chengjiang: [
    "Eoredlichia intermediata", "Naraoia spinosa", "Leanchoilia illecebrosa",
    "Cricocosmia jinningensis", "Isoxys auritus",
  ],
  "burgess-shale": [
    "Marrella splendens", "Wiwaxia corrugata", "Ottoia prolifica",
    "Canadaspis perfecta", "Waptia fieldensis",
  ],
  "anti-atlas": [
    "Agoniatites expansus", "Anarcestes lateseptatus", "Chotecops breviceps",
    "Pedinopariops degener", "Aulacopleura beyrichi",
  ],
  gogo: [
    "Gogosardina coatesi", "Mimipiscis toombsi", "Moythomasia durgaringa",
    "Manticoceras guppyi", "Ponticeras discoidale",
  ],
  "mazon-creek": [
    "Euphoberia armigera", "Eoscorpius carbonarius", "Euproops danae",
    "Eucaenus ovalis", "Architarbus rotundatus",
  ],
  "bear-gulch": [
    "Falcatus falcatus", "Harpagofututor volsellorhinus", "Discoserra pectinodon",
    "Wendyichthys dicksoni", "Caridosuctor populosum",
  ],
  beaufort: [
    "Oudenodon bainii", "Diictodon feliceps", "Aelurognathus tigriceps",
    "Pareiasaurus serridens", "Phyllotheca australis",
  ],
  zechstein: [
    "Weigeltisaurus jaekeli", "Horridonia horrida", "Calophyllum columnare",
    "Spinofenestella geinitzi", "Schizodus schlotheimi",
  ],
  katberg: [
    "Lystrosaurus declivis", "Proterosuchus fergusi", "Procolophon trigoniceps",
    "Micropholis stowi", "Moschorhinus kitchingi",
  ],
  moenkopi: [
    "Protogusarella smithi", "Eumorphotis multiformis", "Lenticidaris utahensis",
    "Naticopsis (Naticopsis) utahensis", "Piarorhynchella triassica",
  ],
  yixian: [
    "Confuciusornis sanctus", "Psittacosaurus lujiatunensis", "Monjurosuchus splendens",
    "Dalinghosaurus longidigitus", "Ephemeropsis trisetalis",
  ],
  wealden: [
    "Iguanodon bernissartensis", "Hylaeosaurus armatus", "Ornithopsis hulkei",
    "Goniopholis crassidens", "Loxaulax valdensis",
  ],
  "lopez-de-bertodano": [
    "Diplomoceras cylindraceum", "Maorites densicostatus", "Pachydiscus riccardi",
    "Gaudryceras seymouriense", "Eutrephoceras dorbignyanum",
  ],
  "la-meseta": [
    "Cucullaea raea", "Ostrea antarctica", "Struthioptera camachoi",
    "Ctenophoraster downeyae", "Eoscaphella fordycei",
  ],
  ischigualasto: [
    "Herrerasaurus ischigualastensis", "Eoraptor lunensis", "Saurosuchus galilei",
    "Exaeretodon argentinus", "Ischigualastia jenseni",
  ],
};

export function drawnIn(gateId: string): readonly string[] {
  return DRAWN_IN_SCENE[gateId] ?? [];
}
