import { useMemo, useState, type MouseEvent } from "react";
import { drawnIn } from "../data/drawn";
import { gateById } from "../data/gates";
import { sceneHighlightsFor, type SceneHighlight } from "../data/sceneHighlights";
import { sceneSource } from "../gates/scenes";
import "./SceneHighlightLab.css";

interface SceneHighlightLabProps {
  gateId: string;
}

/** Development-only coordinate sampler. It is removed from production builds. */
export function SceneHighlightLab({ gateId }: SceneHighlightLabProps) {
  const gate = gateById(gateId);
  const scene = sceneSource(gateId);
  const species = useMemo(() => [...drawnIn(gateId)], [gateId]);
  const configured = sceneHighlightsFor(gateId);
  const [points, setPoints] = useState<Record<string, SceneHighlight>>(() => ({ ...configured }));
  const [selected, setSelected] = useState<string | null>(() => species.find((name) => !configured[name]) ?? species[0] ?? null);

  if (!gate || !scene || species.length === 0) {
    return (
      <main className="highlight-lab highlight-lab--error">
        <h1>Scene highlight lab</h1>
        <p><code>{gateId}</code> has no complete gate, scene, and drawn-species entry.</p>
      </main>
    );
  }

  const capture = (event: MouseEvent<HTMLImageElement>) => {
    if (!selected) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = {
      x: Number(((event.clientX - bounds.left) / bounds.width).toFixed(3)),
      y: Number(((event.clientY - bounds.top) / bounds.height).toFixed(3)),
    };
    setPoints((current) => ({ ...current, [selected]: point }));
    const nextIndex = species.findIndex((name) => name === selected) + 1;
    setSelected(species[nextIndex] ?? selected);
  };

  const output = [
    `  "${gateId}": {`,
    ...species.map((name) => {
      const point = points[name];
      return point
        ? `    "${name}": { x: ${point.x.toFixed(3)}, y: ${point.y.toFixed(3)} },`
        : `    // MISSING: "${name}"`;
    }),
    "  },",
  ].join("\n");

  return (
    <main className="highlight-lab">
      <header>
        <p>DEEP LENS · DEVELOPMENT TOOL</p>
        <h1>{gate.name.en} <small>{gateId}</small></h1>
        <ol>
          <li>学名を選ぶ</li>
          <li>画像に印字された同じ学名の中央を押す</li>
          <li>5種が揃ったら出力を <code>sceneHighlights.ts</code> へ移す</li>
        </ol>
      </header>

      <section className="highlight-lab__workspace">
        <div className="highlight-lab__scene">
          <img src={scene} alt={`${gate.name.en} reconstruction`} onClick={capture} />
          {species.flatMap((name, index) => {
            const point = points[name];
            return point ? [(
              <span
                key={name}
                className={`highlight-lab__point${selected === name ? " is-selected" : ""}`}
                style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
                title={name}
              >{index + 1}</span>
            )] : [];
          })}
        </div>

        <div className="highlight-lab__species">
          {species.map((name, index) => (
            <button
              key={name}
              type="button"
              className={selected === name ? "is-selected" : ""}
              onClick={() => setSelected(name)}
            >
              <b>{index + 1}</b>
              <span>{name}</span>
              <i>{points[name] ? `${points[name].x.toFixed(3)}, ${points[name].y.toFixed(3)}` : "未採取"}</i>
            </button>
          ))}
        </div>
      </section>

      <section className="highlight-lab__output">
        <h2>貼り付ける座標</h2>
        <pre data-testid="scene-highlight-output">{output}</pre>
        <p>この画面はファイルを自動更新しません。座標の正否を画像で確認してから反映してください。</p>
      </section>
    </main>
  );
}
