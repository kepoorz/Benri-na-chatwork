# Benri-na-chatwork

ChatWorkをより便利にするChrome拡張機能です。

## 機能

### フィルタータイル機能

チャットルームリストの上部に **4行×3列＝12個のフィルタータイルボタン** を表示し、ワンクリックでチャットルームを絞り込めます。

| 行 | ボタン1 | ボタン2 | ボタン3 |
|----|---------|---------|---------|
| 未読 | 📩 未読 | 🔔 TO | 🆕 新着 |
| ブクマ | ⭐ ブクマ1 | 📌 ブクマ2 | 🔖 ブクマ3 |
| 保存1 | 📁 保存1 | 📂 保存2 | 💼 保存3 |
| 保存2 | 🏷️ 保存4 | 📋 保存5 | 🗂️ 保存6 |

**操作方法:**
- **クリック** → フィルターのON/OFF切替
- **右クリック** → ラベル名の編集（ブクマ・保存タイプのみ）
- **絵文字クリック** → 絵文字ピッカーでアイコン変更（ブクマ・保存タイプのみ）
- **ルームの☆ボタン** → ブクマ/保存フィルターにルームを追加・削除

**フィルター種別:**
- **未読**: 未読バッジのあるルームを自動検出
- **TO**: メンション付きの未読ルームを自動検出
- **新着**: 新着メッセージのあるルームを自動検出
- **ブクマ**: 手動でルームを登録して絞り込み
- **保存**: 手動でルームを登録して絞り込み（ラベル名変更可能）

設定は `chrome.storage.sync` で自動保存されます。

## 対応サイト

- https://www.chatwork.com
- https://kcw.kddi.ne.jp (KDDI Chatwork)

## インストール方法

### 開発版をインストール

1. このリポジトリをクローン:
   ```
   git clone https://github.com/yourusername/Benri-na-chatwork.git
   cd Benri-na-chatwork
   ```

2. 依存パッケージをインストール:
   ```
   npm install
   ```

3. ビルド:
   ```
   npm run build       # 開発用ビルド
   npm run build:prod  # 本番用ビルド（難読化あり）
   ```

4. Chromeで拡張機能をインストール:
   - `chrome://extensions` を開く
   - 「デベロッパーモード」をON
   - 「パッケージ化されていない拡張機能を読み込む」→ `dist/data` フォルダを選択

### リリース版をインストール

1. [Releases](https://github.com/yourusername/Benri-na-chatwork/releases) から最新の `.zip` をダウンロード
2. `chrome://extensions` → デベロッパーモードON → ZIPをドラッグ＆ドロップ

## 開発

### 必要環境

- Node.js 24 LTS (`.nvmrc` で管理)

### プロジェクト構造

```
src/
├── manifest.json                    # Chrome拡張マニフェスト (Manifest V3)
├── css/styles.css                   # フィルタータイル・絵文字ピッカーのスタイル
├── html/popup.html                  # ポップアップUI
├── images/                          # アイコン
└── js/
    ├── content.js                   # コンテンツスクリプト エントリーポイント
    ├── popup.js                     # ポップアップ制御
    ├── core/
    │   ├── init.js                  # 初期化・メッセージリスナー
    │   └── state.js                 # 全体状態管理
    ├── features/filter/
    │   ├── index.js                 # フィルター機能 エントリーポイント
    │   ├── constants.js             # ボタン定義・絵文字リスト・セレクタ
    │   ├── state.js                 # フィルター状態管理 (chrome.storage.sync)
    │   ├── tiles.js                 # タイルグリッドUI・イベント処理
    │   ├── emoji-picker.js          # 絵文字ピッカー
    │   └── filter-logic.js          # フィルタリングロジック・MutationObserver
    └── utils/
        ├── common.js                # sleep, debounce, throttle, deepCopy等
        ├── logging/logger.js        # 高機能デバッグロガー
        └── dom/
            ├── elements.js          # DOM要素操作・waitForDomReady
            └── styles.js            # スタイル注入
```

### デバッグロガー

`logger.js` は以下の機能を提供:

| 機能 | 使い方 |
|------|--------|
| ログレベル | `TRACE` / `DEBUG` / `INFO` / `WARN` / `ERROR` / `SILENT` |
| カラー出力 | レベル別に色分け＋アイコン |
| コンテキスト | `logger.withContext('Filter')` でモジュール名付きロガー |
| グループ化 | `logger.group()` / `groupCollapsed()` / `groupEnd()` |
| テーブル | `logger.table(data)` で表形式出力 |
| 計測 | `logger.time('x')` / `timeEnd('x')` |
| DOM検査 | `logger.inspectElement(el)` / `inspectElements(selector)` |
| 履歴 | `logger.getHistory({level, search})` / `printHistory()` |
| アサーション | `logger.assert(condition, message)` |

### 開発コマンド

| コマンド | 説明 |
|----------|------|
| `npm run build` | 開発用ビルド（ソースマップあり） |
| `npm run build:prod` | 本番用ビルド（難読化・console除去） |
| `npm run dev` | 開発用ビルド |
| `npm run zip` | 本番ビルド＋ZIPパッケージ作成 |
| `npm run lint` | ESLintチェック |
| `npm run format` | Prettierフォーマット |
| `npm run build:complete` | lint→format→build:prod→zip を一括実行 |

## ライセンス

MIT
