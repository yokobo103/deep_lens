# Ancient Life Prototype

95 Ma前後のセノマニアンを固定し、地域差を探索する古代生命マップPoCです。

## コア体験

- 初期画面は95 Maの古地球。北アフリカ、パタゴニア、東部オーストラリア、北米内海の代表アイコンから探索を開始
- カメラ高度に応じて、Level 1（概要）→ Level 2（生態系）→ Level 3（名前付き生物）へ生命アイコンを展開
- 地域または生物を選ぶと、地層・記録環境・PBDB出典をカードに表示
- Spinosaurusの`SEE FOSSILS TODAY`から現代のMorocco · Kem Kem Bedsへ移動し、骨マーカーを表示
- 時代切り替えだけではカードを開かない

生命・環境・古座標はPBDBのCenomanian occurrence記録を静的に正規化した実データです。マーカー座標は分類群または地層のPBDB/GPlates古座標の重心で、生息域境界ではありません。95 Ma表示は100.5〜93.9 Maのセノマニアン窓を代表するPoCであり、全分類群が同じ年に同時存在したという意味ではありません。実行時の外部API接続は行いません。

## ズームレベル

`src/components/FossilGlobe.tsx` の`getAncientZoomLevel`がCesiumカメラ高度を変換します。

- Level 1: 8,000 kmより高い
- Level 2: 4,000〜8,000 km
- Level 3: 4,000 km以下

## 拡張ポイント

- データ更新: `src/data/ancientLife.ts` の地域別PBDB queryを再取得・正規化する生成スクリプトへ移す
- 複数年代: 年代ごとの地域・分類群セットとsnapshotを追加する
- 別時代: `src/temporal/`のsnapshot境界と年代別データを拡張する
- 正式アセット: `LifeIcon`、`AncientLifeMarker`、`FossilMarker`を差し替える
