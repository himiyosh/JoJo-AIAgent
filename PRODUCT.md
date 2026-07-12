# Product

## Register

brand

## Users

日本語でAIエージェントの全体像を学びたい初学者と、専門実装へ進む前に現在地を短時間で把握したい読者。通常の16:9プレゼンに加え、390px前後のスマホで横型スライド全体を確認し、必要な箇所を拡大・パンして読む利用を想定する。

## Product Purpose

変化の速いAIエージェント領域を、Prompt → Context → Harness → Loopという進化軸と具体例で整理し、「情報強者までいかずとも、情報弱者にならない」ための概念地図を提供する。成功は、専門語を削らずに初心者が重要な差分・判断軸・リスクを迷わず追えること。

## Brand Personality

明快、技術的、親しみやすい。夜の技術展示のようなダーク基調にcyan/purpleを効かせ、難しい内容を案内板のように順序立てて示す。

## Anti-references

- 同じカードグリッドを繰り返す汎用AIテンプレート
- 狭い列へ文章を押し込み、語句を何行にも分断するレイアウト
- 意味より大きさを優先した図解や、装飾だけのvisual
- 情報を分ける必要がない箇所まで罫線で区切る誌面風レイアウト
- 文字数切り詰め、ellipsis、line-clampで網羅性を偽装するUI
- 完成済みの意味構造を崩してまで縦型へ再編集し、原稿・図・視線順を劣化させること

## Design Principles

1. 原稿を欠落させず、意味単位で分割・再配置する。
2. 1ページの主役を一つ決め、図と文章の面積を内容量に合わせる。
3. 改行は読みのリズムを守り、狭い列や過剰な枠を作らない。
4. 区切りは構造を伝える時だけ使い、近接と余白を優先する。
5. 自動QAに加え、実寸contact sheetで全ページを比較する。
6. 画面比率の変換で品質が落ちる場合は、canonicalを再編集せず閲覧操作を端末へ適応する。

## Accessibility & Inclusion

検索可能な実テキスト、semantic headings、keyboard/hash/history navigation、44px以上のtouch target、明確なfocus、native dialog、reduced motionを維持する。正式な`/reader/`はiframeや内側の閲覧面を作らず、通常Slidevと同じDOMへ操作UIを直接統合する。canonical HTML全31枚を980×552のまま保持し、全体表示、最大400%拡大、パン、全画面、目次・全文検索、補足dialogをtouch／keyboardの両方で操作可能にする。旧portrait版は比較用`/reader-legacy/`へ分離する。390×844、430×932、844×390でviewer chromeをoverflowさせず、色コントラストはWCAG AAを基準とする。
