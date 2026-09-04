# Deep Lens

## 役割

Deep Lensは、地質時代・場所・環境・生物を重ねて見るための探索装置です。
迷ったら1つだけ問う: **これは問いを残すか、答えを閉じるか**。

地球を見ながら使うものは地球を隠してはいけません。たまに開くものだけが覆ってよい。
出てくる場所は、押した場所と繋がっていること。
表示はサポートであり代行ではありません。`EVIDENCE ONLY · NO AI INTERPRETATION` の線を越えないこと。

## Deep Lens固有の方針

- Deep Lensは現代座標を古座標へ動かす。場所が動かないなら、この装置の中心体験にならない。
- `paleo-coastlines-*.json` は大陸の輪郭であって汀線ではない。この上に「当時ここは海」と載せない。
  海だったか陸だったかは、将来の環境データの分布で示す。
- 古地理モデルにはsource / URL / license / updated / confidence / demo・realを保持する。
- illustrativeなハードコードデータを実測値として表示しない。

## 実行

```text
npm ci
npm run dev
npm run lint
npm run typecheck
npm run verify:separation
npm run build
```

新機能や実データ化は別タスクで扱います。今回の分離では、既存の95 Ma PoCデータを改変しません。
