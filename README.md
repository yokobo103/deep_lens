# Deep Lens

場所・時間・生命・環境を行き来しながら、古代の地球を探索するインタラクティブ地球儀です。

プロダクト判断の正本は[`docs/PRODUCT_VISION.md`](docs/PRODUCT_VISION.md)です。

## データ基盤（PBDB）

`npm run data:pbdb` で Paleobiology Database から静的JSONを焼きます（**実行時は外部へ接続しません**）。
後期ジュラ紀〜白亜紀の15ステージ、**45,829地点・3,194層**、約2.3 MB。ライセンスはPBDBの自己申告どおり **CC0**。

- `public/data/pbdb/sites-<stage>.json` — 化石地点（当時の位置・環境・記録数）。地球儀の点
- `public/data/pbdb/formations.json` — 層ごとの集計。層序カラム
- `public/data/pbdb/manifest.json` — ステージ一覧とprovenance

環境は `sea` / `coast` / `fresh` / `land` / `unknown` の5クラスへ畳んでいます。
**未分類の環境値が1つでも出たらビルド時のログに出す**ので、PBDB側の語彙が増えたら気づけます。

`記録数` は**発表された産出記録の数であって、生き物の数ではありません**。発掘と論文の偏りをそのまま反映します。

## 現在のPoC

95 Maの古地球を起点に、北アフリカ、パタゴニア、東部オーストラリア、北米内海を探索します。地球を回すと同じ時間窓でも地域ごとに河川デルタ、氾濫原、河川林、内海が現れ、ズームすると実在分類群へほどけます。Spinosaurusからは当時の環境と現代の化石地点を行き来できます。

- `95 Ma`：古地理画像と生命マーカー
- `Present`：現代地球と化石マーカー
- カメラ高度による3段階の生命表示
- Scotese & Wright (2018) PALEOMAP PaleoDEMによる95 Ma古地理テクスチャ（深海・浅海・陸地・標高を区別）
- 95 Ma（セノマニアン）の化石地点は、任意の**証拠レイヤー**として当時の位置に表示
- Presentで場所を選んだ後、必要な場合だけ**層序カラム**を開く

地域・分類群・記録環境・古座標はPBDBのCenomanian occurrence記録を静的に正規化した実データです。95 Ma表示は100.5〜93.9 Maの時間窓を代表し、背景とマーカーはPALEOMAP/Scotese復元系へ統一しています。陸上地域は古座標の重心、北米内海はPaleoDEMの水没セルと一致する実在PBDB地点を代表点にしています。記録数は個体数ではなく、同時存在や生息域の広がりを直接示すものでもありません。

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
