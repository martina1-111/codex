# AI Battle Sanctuary (MVP)

`https://smoothiestudio.co.jp/AIBattleSanctuary` を参考にした、固定キャラクター版のプロトタイプです。

## できること
- 2対2の自動バトルをシミュレーション
- 戦場ごとのバフ（火力/回復）
- ターン制ログ表示
- 必殺技・回復行動を含むシンプルな AI 行動

## 起動方法
依存関係は不要です。`index.html` をブラウザで直接開くだけで動作します。

簡易サーバーで確認する場合:

```bash
python3 -m http.server 8000
```

その後 `http://localhost:8000` を開いてください。
