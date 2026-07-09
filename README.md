<a href="https://himiyosh.github.io/JoJo-AIAgent/">
  <img src="./public/series-banner.jpg" alt="JoJo「情報強者までいかずとも、情報弱者にならないためのコンテンツ」シリーズ" width="100%">
</a>

# 🎤 AIエージェント、いま何が起きている?

> **JoJo「情報強者までいかずとも、情報弱者にならないためのコンテンツ」シリーズ #01**
> AIエージェント構築の“いま”を、初心者向けに **概念・全体像** からやさしくキャッチアップする HTML プレゼンテーション。

<a href="https://himiyosh.github.io/JoJo-AIAgent/">
  <img src="./public/cover.jpg" alt="AIエージェント、いま何が起きている? — 表紙" width="100%">
</a>

<p align="center">
  <a href="https://himiyosh.github.io/JoJo-AIAgent/"><b>▶ ブラウザで見る（GitHub Pages）</b></a>
</p>

---

## ▶︎ プレゼンを見る

### 🔗 公開 URL 👉 **<https://himiyosh.github.io/JoJo-AIAgent/>**

インストール不要。ブラウザで開くだけで見られます。

- **← →** キー、または画面クリックでスライドを送る
- **`f`** で全画面 / **`o`** でスライド一覧（オーバービュー）
- 一部スライドは **クリックで段階的に内容が現れます**（クリック式リビール）
- ダーク背景前提のデザインです（明るい環境なら画面を暗めに）

---

## 📚 シリーズ

「**情報強者までいかずとも、情報弱者にならないためのコンテンツ**」──
むずかしいテーマを、コードや専門用語にいきなり踏み込む前に **“全体像”から** つかむための入門プレゼン集です。

| # | タイトル | 見る | ソース |
|:--:|---|:--:|---|
| **#01** | 🎤 AIエージェント、いま何が起きている?（**このリポジトリ**） | [**🔗 見る**](https://himiyosh.github.io/JoJo-AIAgent/) | [himiyosh/JoJo-AIAgent](https://github.com/himiyosh/JoJo-AIAgent) |
| **#02** | 🌿 Git、こわくない | 🚧 近日公開 | JoJo-Git |

> 各回は独立して読めます。共通のブランド（JoJo＋ダイヤ印）とダーク・テック系デザインで揃えています。

---

## 🧭 この回で話すこと

軸となるストーリーは **「作り方の進化史」**＝ **Prompt → Context → Harness → Loop**。
> むかしは “指示（プロンプト）” を変えるだけでよかった。**いまは “ループ” の設計が主役。**

| 章 | テーマ |
|:--:|---|
| **00** | イントロ（ゴール・対象・免責） |
| **01** | そもそも AI エージェントとは?（「賢いチャット」と何が違う?） |
| **02** | 作り方の全体像（Prompt → Context → Harness → Loop の地図） |
| **03** | いまの“動かし方”（ReAct → Harness → **Loop Engineering**） |
| **04** | 一体で作る? 分ける?（単一 vs マルチ／サブエージェント・オーケストレーション） |
| **05** | 作るときの勘所（MCP・評価・ガードレール・コスト・落とし穴）＋ まとめ・次の一歩 |

- 言語: **日本語**（技術用語は英語併記）
- 基準日: **2026年7月時点**のスナップショット（AI は動きが速いため、あえて時期を明記しています）

---

## 🛠 開発・自分で公開する

<details>
<summary>ローカルで動かす／ビルド／GitHub Pages 公開の手順</summary>

必要環境: **Node.js 20 以上** / npm

```bash
npm install          # 依存関係をインストール
npm run dev          # 開発サーバー（http://localhost:3030）— slides.md 保存で即反映

npm run build            # 静的サイトを dist/ に生成
npm run export           # PDF などにエクスポート（要 playwright-chromium）
npm run export:handout   # 配布用ハンドアウト PDF（クリック式タブの全状態を1ページずつ）→ handout.pdf
```

### GitHub Pages で公開する

`.github/workflows/deploy.yml`（自動デプロイ）が含まれています。

1. **Settings → Pages → Build and deployment → Source** を **「GitHub Actions」** に設定（初回のみ）
2. `main` に push すると Actions が自動でビルド＆デプロイ（手動実行も可）
3. 公開 URL: `https://<owner>.github.io/<repo>/`

> base パス（サブディレクトリ）はワークフローが**リポジトリ名を自動注入**します。

### さわる場所

| やりたいこと | 編集する場所 |
|---|---|
| スライドの内容 | `slides.md` |
| 配色・見た目 | `style.css`（CSS 変数 `--brand-a` / `--brand-b` ほか）／方針は `DESIGN.md` |
| ロゴ（JoJo＋ダイヤ印） | `components/BrandLogo.vue` |
| 執筆者・アバター | `components/AuthorBadge.vue` ／ `public/author-avatar.jpg` |
| ページ番号フッター | `global-bottom.vue` |
| 図表 | [Mermaid](https://mermaid.js.org/) コードブロック＋`style.css` のユーティリティクラス |

**技術スタック**: [Slidev](https://sli.dev/) (`@slidev/cli`) · Vue 3 · UnoCSS · Mermaid · GitHub Actions

</details>

---

<sub>© JoJo シリーズ / himiyosh ・ Built with <a href="https://sli.dev/">Slidev</a></sub>
