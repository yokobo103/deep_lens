# Deep Lens agent guide

## 最初に読む

実装判断をする前に、必ず [`docs/PRODUCT_VISION.md`](docs/PRODUCT_VISION.md) を読むこと。
Deep Lensの主役・4軸・避ける方向・Earth Lensとの境界はこの文書を正本とする。

## 判断原則

- 迷ったら問う: **これは問いを残すか、答えを閉じるか**。
- 地球を見ながら使うUIは地球を隠さない。情報は必要になった時だけ開く。
- 出てくる場所は、押した場所とつながっていること。
- 表示はサポートであり代行ではない。読んだあとに自分で見に行きたくなるか、で判断する。
- **解釈は載せてよい。ただし誰の解釈かを言い、記録で確かめられる部分は必ず確かめる。**
  Earth Lensから受け継いだ `EVIDENCE ONLY · NO AI INTERPRETATION` は、この装置には合わない
  （2026-09-06 よこぼ判断）。Earth Lensは現代を見るので証拠だけで立てるが、Deep Lensは
  **画面に出るものがほぼ全部すでに解釈**である。古座標はGPlatesのモデル、地形はScoteseの推定標高、
  ゲートの年代は論文の推論、PBDBの `env` は元論文の著者が下した判断。
  それらを毎画面で描いておきながら生きものの姿だけ止めるのは、一貫していない。
  **守る線は「解釈しない」ではなく「解釈を無記名にしない」。**
- Earth Lensは参照元。明示指示がない限り、Earth Lensのrepoや履歴を変更しない。

## データ上のガードレール

- Deep Lensは現代座標を古座標へ動かす。
- ゲートは `src/data/gates.ts` が正本。**追加は定義1件＋`npm run data:gates`**でコード変更ゼロ。
- **ゲートには必ず年代の窓を持たせる。** 層名は一意ではない（`Hell Creek` で引くと無関係な103 Maの
  記録が、`Kem Kem` では8 Maの記録が混ざる）。窓でヘルクリークは597→309地点になる。
- 古地形は**帯ごとに1枚**（ゲートごとではない）。`public/geo/paleodem-<age>.webp`。
  Scoteseの配布は0–540 Maを5 Myr刻みで109枚あるので、どの帯でも取れる。
- 古座標はPBDBの `pgm=scotese` で統一し、地形の復元系と揃える。
- provenance（source / URL / license / updated / confidence / demo・real）を失わない。
- **絵に描く生きものは、そのゲートの記録に実在することを確かめてから描く。**
  姿・色・構図は描き手の解釈でよいが、**誰がそこにいたかは記録が決める**。
  同じ層から出ていることと、同時に同じ場所にいたことは別。画面でそう言わない。

## 検証

```text
npm ci
npm run lint
npm run typecheck
npm run verify:separation
npm run build
```

UI変更は実ブラウザでも確認する。
