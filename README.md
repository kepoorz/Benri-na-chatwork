# Benri-na-chatwork

![CleanShot 20260219_011334](https://github.com/user-attachments/assets/c115c2a6-6008-48a1-9a10-7afb5b14eff1)


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

### リリース版（簡単）

1. [Releases](https://github.com/kepoorz/Benri-na-chatwork/releases) から最新の `benri-na-chatwork.zip` をダウンロード
2. zipを解凍
3. `chrome://extensions` → デベロッパーモードON
4. 「パッケージ化されていない拡張機能を読み込む」→ 解凍したフォルダを選択

### ソースからビルド

1. クローン & ビルド:
   ```
   git clone https://github.com/kepoorz/Benri-na-chatwork.git
   cd Benri-na-chatwork
   npm install
   npm run build
   ```

2. `chrome://extensions` → デベロッパーモードON → `dist/data` を読み込む

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
