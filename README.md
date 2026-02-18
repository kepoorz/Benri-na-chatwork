# Benri-na-chatwork

## これはなに

ChatWorkの右カラム（サイドバー）にスレッドビューを追加するChrome拡張機能です。
メッセージの返信チェーンをツリー表示し、返信・引用・該当メッセージへのジャンプができます。

## 機能

### スレッドパネル

- REボタンクリックで右カラムにスレッドビューを表示
- 返信チェーンをツリー形式で一覧表示
- メッセージごとのアクション:
  - **返信** — `[返信 aid=xxx]` タグを入力欄に挿入
  - **引用** — `[qt]` タグを入力欄に挿入
  - **→ここに移動** — メインタイムラインの該当メッセージへスクロール

## 対応サイト

- https://www.chatwork.com

## インストール

1. クローン & ビルド:
   ```
   git clone https://github.com/kepoorz/Benri-na-chatwork.git
   cd Benri-na-chatwork
   npm install
   npm run build
   ```

2. Chromeにインストール:
   - `chrome://extensions` → デベロッパーモードON
   - 「パッケージ化されていない拡張機能を読み込む」→ `dist/data` を選択

## 開発

- Node.js 24 LTS (`.nvmrc` で管理)

| コマンド | 説明 |
|----------|------|
| `npm run build` | lint → format → webpack → zip |
| `npm run lint` | ESLint チェック |
| `npm run format` | Prettier フォーマット |

### CI/CD

- **master** へのpushで GitHub Actions が自動リリース（zip添付 + コミットメッセージからリリースノート生成）
- **Dependabot** が npm / GitHub Actions の依存を週次で更新

## ライセンス

MIT
