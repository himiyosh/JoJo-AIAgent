# 変更履歴

このページでは、利用者に影響する主な変更をバージョンごとに記録します。
バージョン番号は [Semantic Versioning](https://semver.org/lang/ja/) に準拠します。

## [Unreleased]

### Highlights

- 完成済みの16:9スライド全31枚を、スマートフォンで最大400%まで拡大・移動できるReader Viewを追加
- 章扉、高密度スライド、タブ、出典表示の構成とアクセシビリティを改善

### Added

- Reader Viewに全31枚のサムネイル目次、全文検索、補足・出典、対応ブラウザでの全画面表示、キーボード操作を追加
- 旧縦向けReaderと検証用pilotを比較用URLとして保持

### Changed

- 全5章の章扉を、装飾・タイトル・案内を含む中央軸の構成へ統一
- MCP図にREST APIとの役割比較を追加し、置き換えではなく併用できる関係を明示
- MCP、単一／マルチエージェント、4つの構成パターンに、主体・境界・処理方向を比較できる図解を追加
- スマホReaderをiframe方式から通常Slidevへの直接統合へ変更し、閲覧面が入れ子に見える構造を解消
- GitHub Pagesのbase path、deep reload、hash/history navigationへの対応を強化

### Fixed

- タブ切替時にタイトルや外枠がわずかに動く問題と、MCP図の枠外へ文字がはみ出す問題を修正
- 表紙に残っていた旧「スマホで拡大」ボタンを削除し、Readerへの公開導線をREADMEへ整理
- Readerの全画面操作を機能対応時だけ表示し、判別しにくい記号を「全画面」／「終了」ラベルへ変更
- Reader目次を折返しの多い2列カードから、サムネイルとタイトルを横に並べた1列リストへ変更
- 拡大リセットの「全体」を「全体表示」＋現在倍率へ分け、操作の意味を明確化

## [v1.0.0] - 2026-07-10

### Highlights

- JoJo「情報強者までいかずとも、情報弱者にならないためのコンテンツ」シリーズ #01
  **「AIエージェント、いま何が起きている?」**を公開
- AIエージェントの定義から、MCP、Prompt → Context → Harness → Loop、
  単一・マルチエージェント、評価・安全・コストまでを全31枚で解説

### Added

- クリック式リビール、用語集、参考・出典、発表者ノートを収録
- Slidevによる16:9 HTMLプレゼンテーションとPDF・配布用ハンドアウト出力に対応
- GitHub ActionsによるGitHub Pagesへの自動公開を開始

[Unreleased]: https://github.com/himiyosh/JoJo-AIAgent/compare/afd2b24...HEAD
[v1.0.0]: https://github.com/himiyosh/JoJo-AIAgent/commit/afd2b24
