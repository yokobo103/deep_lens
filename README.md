# Deep Lens

現代の地点を地質時代ごとの環境と生態系に変換して見る装置です。

## 現在のPoC

95 Maの古地球を起点に、北アフリカ周辺の生命アイコンを探索します。Cesiumの地球儀を回し、ズームすると世界の中身がほどけ、Spinosaurusを選ぶと当時の環境と現代の化石地点を行き来できます。

- `95 Ma`：古地理画像と生命マーカー
- `Present`：現代地球と化石マーカー
- カメラ高度による3段階の生命表示
- `paleo-coastlines-*.json` による静的な古地理データ

古代座標・生命データはPoC用のillustrativeなハードコードです。正式な実データではありません。

## 実行

```bash
npm ci
npm run dev
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

- PBDB等の実データを`src/data/`の正規化層へ接続する
- 古座標をプレート復元モデルから供給する
- 年代ごとのsnapshotと生命データを追加する
- `LifeIcon`、`AncientLifeMarker`、`FossilMarker`を正式アセットへ差し替える
