# Deep Lens agent guide

## 最初に読む

実装判断をする前に、必ず [`docs/PRODUCT_VISION.md`](docs/PRODUCT_VISION.md) を読むこと。
Deep Lensの主役・4軸・避ける方向・Earth Lensとの境界はこの文書を正本とする。

## 判断原則

- 迷ったら問う: **これは問いを残すか、答えを閉じるか**。
- 地球を見ながら使うUIは地球を隠さない。情報は必要になった時だけ開く。
- 出てくる場所は、押した場所とつながっていること。
- 表示はサポートであり代行ではない。`EVIDENCE ONLY · NO AI INTERPRETATION` の線を越えない。
- Earth Lensは参照元。明示指示がない限り、Earth Lensのrepoや履歴を変更しない。

## データ上のガードレール

- Deep Lensは現代座標を古座標へ動かす。
- `paleo-coastlines-*.json` は大陸の輪郭であり汀線ではない。海陸判定には使わない。
- 95 Ma PoCの海陸は`paleodem-95.png`を正本とし、重ねる古座標はPBDBの`pgm=scotese`へ統一する。
- provenance（source / URL / license / updated / confidence / demo・real）を失わない。
- illustrativeなハードコードと実データを混同しない。

## 検証

```text
npm ci
npm run lint
npm run typecheck
npm run verify:separation
npm run build
```

UI変更は実ブラウザでも確認する。
