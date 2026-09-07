/**
 * What to call a creature when Latin is not the point.
 *
 * Keyed by genus, because that is the level a reader recognises: nobody has
 * heard of Tyrannosaurus rex and not of Tyrannosaurus. Deliberately partial —
 * the whole value of this file is the jolt of "I know that one", and inventing
 * a katakana spelling for Barrandicellopsis produces no jolt and a new claim to
 * be wrong about. Where there is no entry the card shows the Latin alone, which
 * is what it showed before.
 *
 * Two kinds of entry, and they are different claims:
 *
 *   a transliteration  ティラノサウルス — how the name is said in Japanese.
 *   a common name      始祖鳥, カブトガニ — what the thing is called.
 *
 * The second is the one that carries risk, so it is only used where the animal
 * really is the thing named: Mesolimulus is a horseshoe crab (Limulidae),
 * Archaeopteryx is what 始祖鳥 means. `npm run data:gates` prints which cast
 * genera have no entry, so the gap stays visible instead of quietly staying
 * empty.
 */

export const JAPANESE_NAME: Record<string, string> = {
  // Hell Creek / Dinosaur Park / Nemegt / Maevarano — Late Cretaceous
  Tyrannosaurus: "ティラノサウルス",
  Triceratops: "トリケラトプス",
  Centrosaurus: "セントロサウルス",
  Corythosaurus: "コリトサウルス",
  Parasaurolophus: "パラサウロロフス",
  Saurornitholestes: "サウロルニトレステス",
  Troodon: "トロオドン",
  Gorgosaurus: "ゴルゴサウルス",
  Champsosaurus: "カンプソサウルス",
  Leidyosuchus: "レイディオスクス",
  Brachychampsa: "ブラキカンプサ",
  Borealosuchus: "ボレアロスクス",
  Didelphodon: "ディデルフォドン",
  Meniscoessus: "メニスコエスス",
  Lepisosteus: "ガー",
  Compsemys: "コンプセミス",
  Myledaphus: "ミレダフス",
  Scapherpeton: "スカフェルペトン",
  Tarbosaurus: "タルボサウルス",
  Gallimimus: "ガリミムス",
  Saurolophus: "サウロロフス",
  Deinocheirus: "デイノケイルス",
  Mongolochelys: "モンゴロケリス",
  Avimimus: "アヴィミムス",
  Oksoko: "オクソコ",
  Elmisaurus: "エルミサウルス",
  Majungasaurus: "マジュンガサウルス",
  Masiakasaurus: "マシアカサウルス",
  Rapetosaurus: "ラペトサウルス",
  Beelzebufo: "ベールゼブフォ",
  Simosuchus: "シモスクス",
  Lavanify: "ラヴァニフィ",
  Vorona: "ヴォロナ",

  // Kem Kem / Western Interior — mid Cretaceous
  Spinosaurus: "スピノサウルス",
  Carcharodontosaurus: "カルカロドントサウルス",
  Rebbachisaurus: "レッバキサウルス",
  Deltadromeus: "デルタドロメウス",
  Alanqa: "アランカ",
  Onchopristis: "オンコプリスティス",
  Elosuchus: "エロスクス",
  Neoceratodus: "ネオケラトドゥス",
  Cretoxyrhina: "クレトキシリナ",
  Squalicorax: "スクアリコラックス",
  Ptychodus: "プティコドゥス",
  Cretalamna: "クレタラムナ",
  Inoceramus: "イノセラムス",
  Calycoceras: "アンモナイト",
  Enchodus: "エンコダス",

  // Morrison / Tendaguru / Solnhofen — Late Jurassic
  Allosaurus: "アロサウルス",
  Stegosaurus: "ステゴサウルス",
  Camarasaurus: "カマラサウルス",
  Apatosaurus: "アパトサウルス",
  Diplodocus: "ディプロドクス",
  Ceratosaurus: "ケラトサウルス",
  Dryosaurus: "ドリオサウルス",
  Camptosaurus: "カンプトサウルス",
  Nanosaurus: "ナノサウルス",
  Ceratodus: "ハイギョ",
  Giraffatitan: "ギラファティタン",
  Kentrosaurus: "ケントロサウルス",
  Dicraeosaurus: "ディクラエオサウルス",
  Elaphrosaurus: "エラフロサウルス",
  Tornieria: "トルニエリア",
  Janenschia: "ヤーネンシア",
  Archaeopteryx: "始祖鳥",
  Rhamphorhynchus: "ランフォリンクス",
  Pterodactylus: "プテロダクティルス",
  Mesolimulus: "カブトガニ",
  Chresmoda: "クレスモダ",
  Cymatophlebia: "トンボの仲間",

  // Chinle / Elliot — Late Triassic
  Coelophysis: "コエロフィシス",
  Typothorax: "ティポトラクス",
  Machaeroprosopus: "フィトサウルス",
  Anaschisma: "アナスキスマ",
  Chinlea: "シーラカンスの仲間",
  Tawa: "タワ",
  Vancleavea: "ヴァンクリーヴェア",
  Melanorosaurus: "メラノロサウルス",
  Eucnemesaurus: "エウクネメサウルス",
  Blikanasaurus: "ブリカナサウルス",
  Plateosauravus: "プラテオサウラヴス",
  Scalenodontoides: "スカレノドントイデス",

  // Green River / London Clay — Eocene
  Archimyrmex: "アリの仲間",
  Eoformica: "アリの仲間",
  Ectobius: "ゴキブリの仲間",
  Cuterebra: "ハエの仲間",
  Otodus: "オトドゥス",
  Carcharias: "シロワニの仲間",
  Odontaspis: "オオワニザメの仲間",
  Cimomia: "オウムガイの仲間",
  Nypa: "ニッパヤシ",
  Dinochelus: "ロブスターの仲間",

  // Fezouata / Sarka — Ordovician
  Asaphellus: "三葉虫",
  Ampyx: "三葉虫",
  Parabathycheilus: "三葉虫",
  Thoralispira: "巻貝の仲間",
  Redonia: "二枚貝の仲間",
  Lesueurilla: "巻貝の仲間",
  Babinka: "二枚貝の仲間",
  Ribeiria: "喙殻類",
  Sagittacystis: "棘皮動物",
  Plasiacystis: "棘皮動物",
};

/** The genus half of a binomial, with PBDB's subgenus brackets removed. */
export function genusOf(species: string): string {
  return species.split(" ")[0]!.replace(/[()]/g, "");
}

export function japaneseName(species: string): string | undefined {
  return JAPANESE_NAME[genusOf(species)];
}
