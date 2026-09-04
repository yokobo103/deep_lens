# Deep Lens

現代の地点を地質時代ごとの環境と生態系に変換して見る装置です。

## 実データ（PBDB）

`npm run data:pbdb` で Paleobiology Database から静的JSONを焼きます（**実行時は外部へ接続しません**）。
後期ジュラ紀〜白亜紀の15ステージ、**45,829地点・3,194層**、約2.3 MB。ライセンスはPBDBの自己申告どおり **CC0**。

- `public/data/pbdb/sites-<stage>.json` — 化石地点（当時の位置・環境・記録数）。地球儀の点
- `public/data/pbdb/formations.json` — 層ごとの集計。層序カラム
- `public/data/pbdb/manifest.json` — ステージ一覧とprovenance

環境は `sea` / `coast` / `fresh` / `land` / `unknown` の5クラスへ畳んでいます。
**未分類の環境値が1つでも出たらビルド時のログに出す**ので、PBDB側の語彙が増えたら気づけます。

`記録数` は**発表された産出記録の数であって、生き物の数ではありません**。発掘と論文の偏りをそのまま反映します。

## 現在のPoC

95 Maの古地球を起点に、北アフリカ周辺の生命アイコンを探索します。Cesiumの地球儀を回し、ズームすると世界の中身がほどけ、Spinosaurusを選ぶと当時の環境と現代の化石地点を行き来できます。

- `95 Ma`：古地理画像と生命マーカー
- `Present`：現代地球と化石マーカー
- カメラ高度による3段階の生命表示
- `paleo-coastlines-*.json` による静的な古地理データ（**大陸の輪郭。汀線ではない** — `AGENTS.md` 参照）
- 95 Ma（セノマニアン）の化石地点4,875件を**当時の位置に、記録された環境の色で**表示
- Presentで地球を押すと、その地点の**層序カラム**（半径200 km以内の層を古い順に積んだもの）

古代座標・生命データはPoC用のillustrativeなハードコードです。正式な実データではありません。

## 実行

```bash
npm ci
npm run dev
```

データを焼き直す:

```bash
npm run data:pbdb
```

品質確認:

```bash
npm run lint
npm run typecheck
npm run verify:separation
npm run build
```

## 分離方針

このrepoは古代生命探索に必要な実行閉包だけを保持します。地政学レンズ、Mission、共有、i18n、ABOUTなどの別系統コードは持ち込みません。古地理プロバイダーは`src/temporal/`に差し替え口として残しています。

## 今後の拡張

- 任意の現代地点を任意の年代へ動かす（PBDBの古座標からプレート回転を逆算できる）
- 年代ごとのsnapshotと生命データを追加する
- `LifeIcon`、`AncientLifeMarker`、`FossilMarker`を正式アセットへ差し替える
