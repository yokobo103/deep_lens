# Ancient Life Prototype

95 Maの北アフリカを探索する古代生命マップPoCです。

## コア体験

- 初期画面は95 Maの古地球。北アフリカ周辺の代表アイコンから探索を開始
- カメラ高度に応じて、Level 1（概要）→ Level 2（生態系）→ Level 3（名前付き生物）へ生命アイコンを展開
- Spinosaurusを選ぶと、環境・共存カテゴリをカードに表示
- `SEE FOSSILS TODAY` で現代のMorocco · Kem Kem Bedsへ移動し、骨マーカーを表示
- 時代切り替えだけではカードを開かない

古代位置と生命データは、動作確認を優先したillustrativeなハードコードです。古地理データは静的GeoJSONを使い、実行時の外部API接続は行いません。

## ズームレベル

`src/components/FossilGlobe.tsx` の`getAncientZoomLevel`がCesiumカメラ高度を変換します。

- Level 1: 8,000 kmより高い
- Level 2: 4,000〜8,000 km
- Level 3: 4,000 km以下

## 拡張ポイント

- 複数種対応: `AncientLifeRecord` / `FossilRecord`、選択状態、詳細カードを共通化する
- 実データ化: `src/data/ancientLife.ts` と `src/data/fossils.ts`をPBDB等の取得・正規化層へ差し替える
- 別時代: `src/temporal/`のsnapshot境界と年代別データを拡張する
- 正式アセット: `LifeIcon`、`AncientLifeMarker`、`FossilMarker`を差し替える
