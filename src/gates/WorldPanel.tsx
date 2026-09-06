import { useEffect, useState } from "react";
import type { GateDefinition } from "../data/gates";
import type { GateDetail } from "../data/gateData";
import { bandById } from "../data/gates";
import { dominantEnvironment, ENV_COLOR, ENV_LABEL } from "../data/environment";
import type { Locale } from "./copy";
import { hubCopy } from "./copy";
import { GateScene } from "./GateScene";

interface WorldPanelProps {
  gate: GateDefinition;
  detail: GateDetail;
  locale: Locale;
  /** The other ages of this same place. Empty when the place has only one. */
  alsoHere: readonly GateDefinition[];
  onGoTo: (gateId: string) => void;
  /** Puts the panel away. Does not leave the world — that is the age banner's. */
  onDismiss: () => void;
}

/** PBDB's class names, as a reader would say them. */
const GROUP_LABEL: Record<string, { ja: string; en: string }> = {
  Reptilia: { ja: "爬虫類", en: "Reptiles" },
  Saurischia: { ja: "竜盤類", en: "Saurischians" },
  Ornithischia: { ja: "鳥盤類", en: "Ornithischians" },
  Mammalia: { ja: "哺乳類", en: "Mammals" },
  Amphibia: { ja: "両生類", en: "Amphibians" },
  Aves: { ja: "鳥類", en: "Birds" },
  Chondrichthyes: { ja: "軟骨魚類", en: "Sharks and rays" },
  Osteichthyes: { ja: "硬骨魚類", en: "Bony fish" },
  Actinopterygii: { ja: "条鰭類", en: "Ray-finned fish" },
  Insecta: { ja: "昆虫", en: "Insects" },
  Malacostraca: { ja: "軟甲類", en: "Crabs and shrimps" },
  Anthozoa: { ja: "花虫類", en: "Corals and anemones" },
  Rostroconchia: { ja: "喙殻類", en: "Rostroconchs" },
  Stylophora: { ja: "柄海果類", en: "Stylophorans" },
  Trilobita: { ja: "三葉虫", en: "Trilobites" },
  Cephalopoda: { ja: "頭足類", en: "Cephalopods" },
  Bivalvia: { ja: "二枚貝", en: "Bivalves" },
  Gastropoda: { ja: "腹足類", en: "Gastropods" },
  Tergomya: { ja: "単板類", en: "Tergomyans" },
  Eocrinoidea: { ja: "始海百合類", en: "Eocrinoids" },
  Demospongiae: { ja: "普通海綿類", en: "Demosponges" },
  Soluta: { ja: "ソルタ類", en: "Solutans" },
  NO_CLASS_SPECIFIED: { ja: "分類の記録なし", en: "Class not recorded" },
};

function groupName(group: string | null, locale: Locale): string {
  if (!group) return GROUP_LABEL.NO_CLASS_SPECIFIED![locale];
  return GROUP_LABEL[group]?.[locale] ?? group;
}

/**
 * What is inside a world: what it looked like, the kind of place it was, and
 * who is recorded there.
 *
 * The cast list carries no pictures. The icon set was drawn for a handful of
 * hand-picked Cretaceous animals, and what these gates actually contain is
 * classes — reptiles, sharks, trilobites, bony fish. Only a third of the
 * entries could be given an honest icon from that set, and a trilobite drawn
 * as a fish is worse than a trilobite drawn as nothing.
 */
export function WorldPanel({ gate, detail, locale, alsoHere, onGoTo, onDismiss }: WorldPanelProps) {
  const text = hubCopy[locale];
  // On a phone this panel would cover the globe, and the globe is the thing it
  // is describing — pulling back to see the rest of the age is half the point
  // of being in a world. So the cast folds away, and only the name and the kind
  // of place stay on screen.
  const compact = useCompactLayout();
  const [openOnPhone, setOpenOnPhone] = useState(false);
  const showCast = !compact || openOnPhone;
  const kind = dominantEnvironment(detail.environments);

  const grouped = new Map<string, typeof detail.cast>();
  for (const member of detail.cast) {
    const key = member.group ?? "NO_CLASS_SPECIFIED";
    grouped.set(key, [...(grouped.get(key) ?? []), member]);
  }
  const groups = [...grouped.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <aside className={`world-panel${compact ? " is-compact" : ""}${showCast ? " is-open" : ""}`} aria-label={gate.name[locale]}>
      {/* Closes the card, and only the card. Leaving the age is a different
          size of action and lives on the age banner instead: from in here the
          globe is the reconstructed Earth, and wanting to see it unobstructed
          is not the same as wanting to go back to the present. */}
      <button type="button" className="world-panel__close" onClick={onDismiss} aria-label={text.close} title={text.close}>×</button>

      <GateScene gateId={gate.id} title={gate.name[locale]} locale={locale} />

      <h2>{gate.name[locale]}</h2>
      <p className="world-panel__world">{gate.world[locale]}</p>

      <p className="world-panel__kind">
        <span className="world-panel__swatch" style={{ background: ENV_COLOR[kind] }} aria-hidden="true" />
        {ENV_LABEL[kind][locale]}
      </p>

      {/* The move the app exists for, offered from inside rather than from the
          front door: leaving to the present and coming back in through the
          same marker is the long way round to say "this place, but then".
          Above the fold on a phone, because it is worth doing while the globe
          is still the thing being looked at. */}
      {alsoHere.length > 0 && (
        <div className="world-ages" role="group" aria-label={text.downTo}>
          <span>{text.downTo}</span>
          {alsoHere.map((other) => (
            <button key={other.id} type="button" onClick={() => onGoTo(other.id)}>
              <b>{bandById(other.band)?.label[locale].split(" · ")[1] ?? `${other.ageMa.from} Ma`}</b>
              <span>{other.name[locale]}</span>
            </button>
          ))}
        </div>
      )}

      {compact && (
        <button type="button" className="world-panel__fold" aria-expanded={showCast} onClick={() => setOpenOnPhone((open) => !open)}>
          {showCast ? text.hideCast : text.showCast}
        </button>
      )}

      {showCast && <div className="world-cast">
        <h3>{text.cast(detail.castTotal)}</h3>
        {groups.map(([group, members]) => (
          <div key={group} className="world-cast__group">
            <span>{groupName(group === "NO_CLASS_SPECIFIED" ? null : group, locale)}</span>
            <ul>
              {members.map((member) => (
                <li key={member.name}>
                  <em>{member.name}</em>
                  <b>{member.count}</b>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <small>{text.castNote}</small>
      </div>}
    </aside>
  );
}

/** True on screens where a panel and the globe cannot both have the room. */
function useCompactLayout(): boolean {
  const [compact, setCompact] = useState(() => window.matchMedia("(max-width: 720px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 720px)");
    const update = () => setCompact(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return compact;
}
