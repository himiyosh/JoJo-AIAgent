---
theme: default
title: AIエージェント、いま何が起きている?
titleTemplate: '%s — JoJo'
info: |
  ## 情報強者までいかずとも、情報弱者にならないためのコンテンツ シリーズ #01
  AIエージェント入門 — by himiyosh
colorSchema: dark
fonts:
  sans: Noto Sans JP
  mono: JetBrains Mono
  weights: '400,500,700,800,900'
highlighter: shiki
lineNumbers: false
transition: slide-left
mdc: true
drawings:
  persist: false
---

<div class="cover">
  <HeroLoop />
  <div class="cover__top">
    <BrandLogo size="md" />
    <span class="cover__num">#01 · AI AGENTS · AS OF 2026.07</span>
  </div>

  <div class="cover__series">
    <span class="tag">SERIES</span>
    <span class="cs-hang"><span class="grad">「情報強者までいかずとも、<br>情報弱者にならないためのコンテンツ」</span>シリーズ</span>
  </div>

  <h1 class="cover__title">AIエージェント、いま<br><span class="grad glow-a">何が起きている?</span></h1>
  <p class="cover__sub">〜 はじめての人のための AI エージェント入門 〜</p>

  <div class="cover__foot">
    <AuthorBadge />
    <span class="cover__url">himiyosh.github.io</span>
  </div>
</div>

<!--
このシリーズ「情報強者までいかずとも、情報弱者にならないためのコンテンツ」の第1弾です。テーマは、いま急速に注目を集めている〈AIエージェント〉。この資料のねらいは、専門用語やコードにいきなり踏み込むのではなく、まず“全体像”をつかむことです。エージェントとは何か・どんな仕組みで動くのか・作り方はどう進化してきたのか、を たとえ話と図 でやさしく整理していきます。右上の「AS OF 2026.07」は、内容がこの時点でのスナップショットであることを示します（AIは動きが速い分野なので、あえて時期を明記しています）。表紙の右で回っている4つの輪 Prompt→Context→Harness→Loop が資料全体を貫く骨組みで、いちばん外側の ④Loop＝“反復の設計” が、今回いちばんの主役になります。
-->

---

# <span class="kome">※</span> 免責事項 <span class="grad">Disclaimer</span>

<div class="eyebrow">DISCLAIMER · 全シリーズ共通</div>

<div class="stack mt-6">

<div class="row accent ac-am">
<div class="row__head">
<span class="row__ico"><Ico name="warning"/></span>
<span class="row__title">誤りがある可能性</span>
</div>
<div class="row__body">

- **かみ砕いた説明**のため、正確さより**分かりやすさ**を優先しています
- AI 分野は**進化が速く**、内容は **2026年7月時点** の**スナップショット**です

</div>
</div>

<div class="row accent">
<div class="row__head">
<span class="row__ico"><Ico name="search"/></span>
<span class="row__title">一次情報で確認を</span>
</div>
<div class="row__body">

- 重要な判断の前に、**公式ドキュメント・論文**などの**出典**で確認を
- 各スライドに**出典**、巻末に **References** を用意しています

</div>
</div>

</div>

<div class="tk concl">このシリーズは <strong>迷子にならないための地図</strong>。正確な現在地は <strong>一次情報</strong> で確かめてください。</div>

<!--
この資料は、全シリーズ共通の「免責事項」から始まります。ポイントは2つ。ひとつは、内容を“かみ砕く”ために、厳密な正確さよりも分かりやすさを優先していること。そしてAIは進化がとても速いため、ここに書かれているのは2026年7月時点のスナップショット（ある瞬間の切り取り）だということです。もうひとつは、大事な判断をするときは、必ず公式ドキュメントや論文などの一次情報で裏を取ってほしいということ。各スライドには出典を、巻末には References（参考リンク集）を用意しています。この資料は“迷子にならないための地図”であって、正確な現在地は一次情報で確かめる——という姿勢を、最初に共有しておきます。
-->

---

# このスライドのゴール <Ico name="target" class="h1ico"/>

<div class="eyebrow">INTRO · ねらいと対象</div>

<div class="stack mt-6">

<div class="row accent">
<div class="row__head">
<span class="row__ico"><Ico name="help"/></span>
<span class="row__title">こんな人向け</span>
</div>
<div class="row__body">

- 「AIエージェント」をよく聞くが、**ふわっとしか分からない**
- ニュースや用語に**置いていかれたくない**
- まず**全体像**をつかみたい（実装は後でいい）

</div>
</div>

<div class="row accent ac-pu">
<div class="row__head">
<span class="row__ico"><Ico name="gift"/></span>
<span class="row__title">持ち帰れること</span>
</div>
<div class="row__body">

- エージェントが **何で・どう動くか** の地図
- 作り方が **どう進化してきたか**（プロンプト→ループ）
- 「一体で作る? 分ける?」の**判断軸**

</div>
</div>

</div>

<div class="tk concl">
むずかしい数式やコードは最小限。<strong>たとえ話と図</strong>で、ゆっくり進みます。
</div>

<!--
このページは、この資料が「誰のための、何を目指したものか」を示します。想定している読者は——「AIエージェント」という言葉はよく聞くけれど中身はふわっとしか分からない人、ニュースや専門用語に置いていかれたくない人、そして細かい実装より先に、まず全体像をつかみたい人です。読み終えたときに持ち帰ってほしいのは3つ。①エージェントが“何で・どう動くのか”という地図、②その作り方が“どう進化してきたか”（プロンプトの工夫からループ設計へ）、③実際に作るとき「一体で作るか・分けるか」を決める判断軸。むずかしい数式やコードは最小限に抑え、たとえ話と図で、ゆっくり進めていきます。
-->

---

# 目次 <span class="grad">Contents</span>

<div class="eyebrow">AGENDA · 全5章 + イントロ</div>

<div class="agenda mt-6">

<div class="agenda__item">
<span class="agenda__no">01</span>
<span class="agenda__txt"><span class="agenda__t">そもそも AIエージェントとは?</span><span class="agenda__d">「賢いチャット」と何が違う?</span></span>
</div>

<div class="agenda__item">
<span class="agenda__no">02</span>
<span class="agenda__txt"><span class="agenda__t">「指示・文脈」の時代</span><span class="agenda__d">Prompt → Context Engineering</span></span>
</div>

<div class="agenda__item">
<span class="agenda__no">03</span>
<span class="agenda__txt"><span class="agenda__t">「足場・ループ」の時代</span><span class="agenda__d">Harness → Loop Engineering（+ Graphの兆し）</span></span>
</div>

<div class="agenda__item">
<span class="agenda__no">04</span>
<span class="agenda__txt"><span class="agenda__t">一体で作る? 分ける?</span><span class="agenda__d">単一 vs マルチエージェント</span></span>
</div>

<div class="agenda__item">
<span class="agenda__no">05</span>
<span class="agenda__txt"><span class="agenda__t">勘所とまとめ</span><span class="agenda__d">評価・落とし穴 → 要点・次の一歩</span></span>
</div>

<div class="agenda__item agenda__item--now">
<span class="agenda__no">★</span>
<span class="agenda__txt"><span class="agenda__t">今回の主役は <span class="grad">Loop</span></span><span class="agenda__d">Prompt → Context → Harness → <strong>Loop</strong></span></span>
</div>

</div>

<!--
資料全体の目次です。イントロに続いて全5章——①そもそもAIエージェントとは（賢いチャットとの違い）、②「指示・文脈」の時代（Prompt→Context Engineering）、③「足場・ループ」の時代（Harness→Loop Engineering、そして2026年7月に急浮上した「Graph Engineering」という兆しにも触れます）、④一体で作るか分けるか（単一 vs マルチ）、⑤勘所とまとめ（評価・落とし穴→要点・次の一歩）、という流れです。前半で土台（定義と仕組み）を固め、後半で“作り方の進化”と実践に進みます。そして今回いちばんの主役は、最後に出てくる Loop（反復の設計）。全体像を先に見せておくと、途中で新しい言葉が出てきても迷子になりません。
-->

---
layout: section
class: section
chapter: "01 · AIエージェントとは"
---

<span class="section__chno" aria-hidden="true" data-number="01"></span>

<div class="section__mark" aria-hidden="true"><span></span></div>

<p class="section__context">AIエージェント入門 · 最初の問い</p>

# そもそも<br><span class="section__accent">AIエージェント</span>とは?

<p class="section__lead">「賢いチャット」と何が違うの? という素朴な疑問から。</p>

<div class="section__route" aria-label="この章で扱う内容">
  <span>違いを知る</span><span>4つの性質</span><span>道具と記憶</span>
</div>

<!--
ここから第1章です。まずは素朴な疑問——「AIエージェントって、賢いチャットと何が違うの?」——から出発します。言葉の定義に入る前に、いちばん身近な“チャットAI”と比べることで、エージェントの正体を浮かび上がらせていきます。
-->

---

# チャットは「一発」、エージェントは「やり切る」

<div class="llm-vs mt-4">
<div class="stack">

<div class="row accent">
<div class="row__head">
<span class="row__ico"><Ico name="chat" /></span>
<span class="row__title">ふつうの LLM</span>
<span class="row__tag">チャット</span>
</div>
<div class="row__body">

- あなたが質問 → **1回答えて終わり**
- 道具は持たない・自分では動かない
- 例:「メール文を書いて」→ 文章を出す　<span class="muted whitespace-nowrap">＝ 受け身の“相談相手”</span>

</div>
</div>

<div class="vsbadge">VS</div>

<div class="row accent ac-pu">
<div class="row__head">
<span class="row__ico"><Ico name="agent" /></span>
<span class="row__title">AIエージェント</span>
<span class="row__tag">自分で動く</span>
</div>
<div class="row__body">

- 目標を与える → **自分で考え・<span class="whitespace-nowrap">道具を使い・繰り返す</span>**
- 必要なら検索・実行・確認して**やり遂げる**
- 例:「アポ取って」→ <span class="whitespace-nowrap">空き確認→送信→調整</span>　<span class="grad whitespace-nowrap" style="font-weight:700">＝ 動ける“有能なアシスタント”</span>

</div>
</div>

</div>
<div class="llm-vs__bot"><Assistant /></div>
</div>

<div class="tk concl">
ちがいは賢さより<strong>「自分で動くかどうか」</strong>。LLM は頭脳、エージェントは<strong>頭脳＋手足＋段取り</strong>。
</div>

<!--
AIエージェント理解の出発点が、ふつうのチャットAI（LLM）との違いです。ChatGPTのようなチャットは、あなたが質問すると1回答えて終わる“受け身の相談相手”。道具を持たず、自分から動くことはありません。「メール文を書いて」と頼めば文章は返してくれますが、実際に送信まではしてくれません。いっぽうAIエージェントは、“目標”を渡すと、自分で段取りを考え、必要な道具（検索・実行・確認など）を使い、うまくいくまで繰り返して最後までやり遂げます。「アポを取っておいて」と言えば、空き時間を確認し、メールを送り、相手と日程を調整するところまで自走します。つまり両者の違いは“頭の良さ”ではなく「自分で動くかどうか」。LLMが“頭脳”だとすれば、エージェントは“頭脳＋手足＋段取り”を備えた存在——これが、今日いちばんの土台になる考え方です。
-->

---

# エージェントの定義 ＝ 4つの性質

<div class="eyebrow">WHAT MAKES AN AGENT</div>

<FourTraits class="mt-6" />

<div class="tk muted">この4つ、とくに <span class="grad" style="font-weight:700">④ 繰り返し（ループ）</span> が後半のキーワードになります。</div>

<!--
前ページの違いを、もう少しきちんと“定義”として整理したページです。何かをAIエージェントと呼べるかどうかは、次の4つの性質で見分けられます。①自律性（人が逐一指示しなくても、自分で判断して進む）、②目標志向（ゴールを与えられ、それに向かって動く）、③ツール利用（検索やAPIなど外部の道具を使い、現実に働きかける）、④繰り返し＝ループ（一度で終わらず、結果を見て何度も試行する）。タブを切り替えると、各性質の説明を読めます。とくに④のループは、この資料の後半でくり返し出てくるキーワードなので、頭の片隅に置いておいてください。
-->

---

# ひとことで言うと

<div class="flex flex-col items-center justify-center" style="height: 70%">

<div class="text-center bigstate">
AIエージェント ＝<br>
<span class="grad glow-a">LLM ＋ ツール ＋ ループ</span>
</div>

<div class="chip-row mt-8 justify-center">
  <span class="chip"><Ico name="brain"/> LLM = 頭脳（考える）</span>
  <span class="chip"><Ico name="wrench"/> ツール = 手足（動く）</span>
  <span class="chip chip-now"><Ico name="loop"/> ループ = 段取り（やり遂げる）</span>
</div>

</div>

<!--
第1章の内容を、覚えやすいひとことの標語にまとめたページです。AIエージェント ＝ LLM ＋ ツール ＋ ループ。それぞれを体にたとえると、LLMは“頭脳”（考える）、ツールは“手足”（実際に動く）、ループは“段取り”（やり遂げるまで繰り返す）にあたります。チャットAIは頭脳だけの存在でしたが、エージェントはそこに手足と段取りが加わる——この3点セットこそがエージェントの正体です。むずかしくなったら、この式に立ち返れば大丈夫です。
-->

---

# なぜ「いま」これほど騒がれる?

<div class="flex flex-col items-center justify-center" style="height:76%">

<div class="eyebrow" style="text-align:center">これまで → いま</div>

<div class="bigstate mt-3">
「賢い文章生成」から<br>
<span class="grad glow-a">「実際に作業をこなす」</span>へ
</div>

<div class="chip-row mt-8 justify-center">
  <span class="chip"><Ico name="brain"/> モデルが賢く</span>
  <span class="chip"><Ico name="plug"/> 道具が標準化（<a class="gterm" data-term="mcp">MCP</a>）</span>
  <span class="chip chip-now"><Ico name="building"/> 実利用が本格化</span>
</div>

<div class="tk muted mt-6" style="text-align:center">3つの追い風が重なった。だから <strong style="color:#fff">“いま”</strong>。</div>

</div>

<!--
「エージェント自体は前からあったのに、なぜ“いま”これほど騒がれるの?」に答えるページです。理由は、3つの追い風が同時に重なったこと。①モデルそのものが賢くなった、②道具のつなぎ方が標準化された（後で出てくるMCP）、③実際の業務での利用が本格化した。この3つがそろったことで、AIの役割が“賢い文章を生成する”段階から、“実際に作業をこなす”段階へと移りました。技術が一段ずつ積み上がって臨界点を超えた——だからこそ、今が注目のタイミングなのです。
-->

---

# エージェントは「道具」と「記憶」でできている

<div class="eyebrow">BUILDING BLOCKS · 与えるもの</div>

<div class="stack mt-6">

<div class="row accent">
<div class="row__head">
<span class="row__ico"><Ico name="wrench"/></span>
<span class="row__title">ツール</span>
<span class="row__tag">Function Calling</span>
</div>
<div class="row__body">

LLM が「この道具を、この引数で使いたい」と**宣言**し、外側が実行して<span class="whitespace-nowrap">結果を返す</span>。<span class="muted">例: 検索・電卓・カレンダー・社内API</span>

ツールが“能力”なら、それを<strong><span class="grad whitespace-nowrap">つなぐ“規格”</span></strong>が <a class="gterm" data-term="mcp"><strong>MCP</strong></a>。<span class="muted">→ 次ページ</span>

</div>
</div>

<div class="row accent ac-in">
<div class="row__head">
<span class="row__ico"><Ico name="book"/></span>
<span class="row__title">メモリ ＆ RAG</span>
<span class="row__tag">Retrieval-Augmented</span>
</div>
<div class="row__body">

- **短期**: 会話の流れを覚える
- **長期**: 過去の知識を貯める
- <a class="gterm" data-term="rag"><strong>RAG</strong></a>: 必要な資料を**検索して文脈に足す**

</div>
</div>

</div>

<div class="tk concl">
これら “与えるもの” を、どう揃え・渡し・動かすか —— その <span class="mk">“作り方” 自体が進化</span>してきました。
</div>

<Cite :items="[
  { label: 'Lilian Weng — LLM Agents', url: 'https://lilianweng.github.io/posts/2023-06-23-agent/' },
  { label: 'Anthropic — Introducing MCP', url: 'https://www.anthropic.com/news/model-context-protocol' },
]" />

<!--
エージェントの“中身”、つまり動くために何を与えるのかを説明するページです。大きく2つあります。ひとつは「ツール（道具）」。これはLLMが「この道具を、この引数で使いたい」と宣言し、外側のシステムが実際に実行して結果を返す仕組み（Function Calling）で、検索・電卓・カレンダー・社内APIなどがこれにあたります。もうひとつは「メモリ＆RAG（記憶）」。会話の流れを覚える短期記憶、過去の知識を貯める長期記憶、そして必要な資料をその都度検索して文脈に足すRAGです。そして、この“道具をどうつなぐか”の共通規格が、次ページで出てくるMCP。こうした“与えるもの”を、どう揃え・渡し・動かすか——その作り方自体が進化してきた、というのが次章への橋渡しになります。
-->

---

# REST API と MCP は、役割が違う

<div class="eyebrow">SERVICE CONNECTION / AI CONNECTION · ボタンで切り替え</div>

<ApiMcpSwitch />

<div class="tk concl">どちらか一方ではありません。<span class="grad" style="font-weight:700">REST API と MCP は重ねて使えます。</span></div>

<Cite :items="[
  { label: 'MCP 公式 — Architecture', url: 'https://modelcontextprotocol.io/docs/learn/architecture' },
  { label: 'Anthropic — Introducing MCP', url: 'https://www.anthropic.com/news/model-context-protocol' },
  { label: 'Google Cloud Tech — How MCP actually works', url: 'https://www.youtube.com/watch?v=cGuyrANVi4A' },
  { label: 'Google Cloud Tech — MCP vs API', url: 'https://www.youtube.com/watch?v=185XGEMefgc' },
]" />

<!--
REST API と MCP を同時に詰め込まず、ボタンで片方ずつ見ます。まず REST API。図は、①AIアプリが HTTP で要求を送る、②endpoint が認証して処理先へ振り分ける、③サービスが処理やデータ取得を行う、④JSONなどで結果を返す、という一巡です。接続するサービスごとに、URL、認証、要求と応答のデータ形式を合わせます。次に MCP。アニメーション図は、MCP Host 内の Client が①要求し、Server が②受理、③ToolsやResourcesを利用し、④結果をClientへ戻す流れを示します。こちらが共通化するのは、サービスそのものの通信方法ではなく、AIと道具の会話ルールです。MCP Server の内側では、既存の REST API やローカル機能を使えます。役割の層が違うため、置き換えではなく重ねて使えます。
-->

---
layout: section
class: section
chapter: "02 · 作り方の全体像"
---

<span class="section__chno" aria-hidden="true" data-number="02"></span>

<div class="section__mark" aria-hidden="true"><span></span></div>

<p class="section__context">作り方の進化 · 全体地図</p>

# 作り方は「<span class="section__accent">外側</span>」へ<br><span class="whitespace-nowrap">進化した</span>

<p class="section__lead">Prompt → Context → Harness → Loop。地図と “入れ子” で全体像を。</p>

<div class="section__route" aria-label="この章で扱う内容">
  <span>外側へ</span><span>進化の地図</span><span>入れ子</span>
</div>

<!--
ここから第2章。テーマは「エージェントの作り方は、どう進化してきたか」です。結論を先取りすると、設計で工夫する対象がだんだん“外側”へ——モデルへの一言から、システム全体へ——と広がってきました。その流れを Prompt → Context → Harness → Loop という地図と、“入れ子”の図で見ていきます。
-->

---

# 全体地図：作り方は進化してきた

<div class="eyebrow">THE EVOLUTION</div>

<EvolutionMap class="mt-1" />

<div class="tk muted">
設計の対象が <strong>一言 → 知識 → 足場 → 反復</strong> と移ってきました。この4つ、実は<span class="grad" style="font-weight:700">“入れ子”</span>の関係です。
</div>

<!--
エージェントの作り方の進化を、1本の線で見せる全体地図です。設計で工夫する対象が、時代とともに次のように移ってきました。「①どう伝えるか（Prompt＝指示の工夫）」→「②何を知らせるか（Context＝文脈の設計）」→「③どう動かすか（Harness＝足場づくり）」→「④どう反復するか（Loop＝反復の制御）」。タブを切り替えると、それぞれの時代を掘り下げて読めます。ポイントは、これらが古いものを捨てて新しくなったのではなく、実は“入れ子”の関係になっていること。その意味は、次のスライドで回収します。
-->

---

# まとめ図：4つは「入れ子」になっている

<div class="eyebrow">PROMPT ⊂ CONTEXT ⊂ HARNESS ⊂ LOOP</div>

<div class="flex justify-center mt-4">
<div class="nest">
  <span class="lbl grad">④ LOOP — 反復をどう制御する?</span>
  <div class="nest-2">
    <span class="lbl">③ HARNESS — どう動かす?</span>
    <div class="nest-3">
      <span class="lbl">② CONTEXT — 何を知らせる?</span>
      <div class="nest-4">
        <span class="lbl">① PROMPT — どう伝える?</span>
      </div>
    </div>
  </div>
</div>
</div>

<div class="tk lead">
内側＝モデルへの一言、外側＝システム全体。<br>
この<strong>外側への広がり</strong>こそ、作り方の<span class="grad" style="font-weight:700">進化の歴史</span>そのもの。
</div>

<!--
前ページの4段階が“入れ子”になっている、という関係を1枚の図にしたページです。いちばん内側が①PROMPT（モデルへの一言）、その外を②CONTEXT（何を知らせるか）が包み、さらに③HARNESS（どう動かすか）、いちばん外を④LOOP（反復をどう制御するか）が包みます。内側ほどモデルに近い“一言”、外側ほどシステム全体の設計です。大事なのは、新しい考え方が古い考え方を否定したのではなく、外側へ外側へと関心が広がってきたということ。この“外側への広がり”こそが、作り方の進化の歴史そのものなのです。
-->

---
layout: section
class: section
chapter: "03 · いまの動かし方"
---

<span class="section__chno" aria-hidden="true" data-number="03"></span>

<div class="section__mark" aria-hidden="true"><span></span></div>

<p class="section__context">現場の現在地 · 動かし方</p>

# 「<span class="section__accent">足場・ループ</span>」の時代

<p class="section__lead">いま大事なのは “動かし方”。Harness → Loop Engineering。</p>

<div class="section__route" aria-label="この章で扱う内容">
  <span>現場の転換</span><span>ReActループ</span><span>壁打ち</span><span>グラフの兆し</span>
</div>

<!--
ここから第3章。前章で見た進化のいちばん外側、つまり“いま最も大事なところ”に踏み込みます。キーワードは「足場（Harness）」と「ループ（Loop）」。うまい一言を考えることより、エージェントを“どう動かし続けるか”の設計が主役になる、という話です。最後には、2026年7月に急浮上した「Graph Engineering」という最新の兆しにも触れます。
-->

---
foot: false
---

# いま現場は「プロンプト」から「<span class="grad">ループ</span>」へ

<div class="eyebrow">TREND · 2026 · LOOP ENGINEERING</div>

<div class="xfeed">

<XPost name="Peter Steinberger" handle="steipete" accent="a" role="OpenClaw 開発者" date="2026-06-07">
<template #post>You shouldn't be prompting coding agents anymore. You should be <em>designing loops</em> that prompt your agents.</template>
<template #jp>もうコーディングエージェントに毎回プロンプトするな。エージェントにプロンプトする“ループ”を設計せよ。</template>
<template #deco><OpenClawLobster /><span class="xp__pun">“Open<b>Claw</b>” の主</span></template>
</XPost>

<XPost name="Boris Cherny" handle="bcherny" accent="b" role="Head of Claude Code · Anthropic" date="2026">
<template #post>I don't prompt Claude anymore. I have loops running that prompt Claude. My job is to <em>write loops</em>.</template>
<template #jp>もう Claude に直接プロンプトしない。プロンプトするのは走らせている“ループ”。私の仕事はループを書くことだ。</template>
</XPost>

</div>

<div class="tk concl"><span class="hot">主役</span>は「うまい指示」から、<span class="grad">自走する輪（ループ）の設計</span>へ。</div>

<Cite :items="[
  { label: 'The New Stack — Loop Engineering', url: 'https://thenewstack.io/loop-engineering/' },
  { label: 'Addy Osmani — Loop Engineering', url: 'https://addyosmani.com/blog/loop-engineering/' },
  { label: '解説（日本語）— Qiita', url: 'https://qiita.com/y-morimatsu/items/e8563a60c6a5cb94ffe7' },
  { label: '🦞 マスコット: OpenClaw（MIT）', url: 'https://github.com/openclaw/openclaw' },
]" />

<!--
いまの開発現場の空気を、第一線の開発者の言葉で伝えるページです。紹介しているのは、コーディングエージェントを日々使う実務家2人の発言。要約すると、どちらも「もうエージェントに毎回プロンプト（指示）を打つのではなく、エージェントに指示を出し続ける“ループ”の方を設計している」と言っています。かつては“いかにうまい一言を書くか”が腕の見せどころでしたが、主役はそこから“自走する輪（ループ）をどう設計するか”へと移ってきた——その変化を象徴する声です。（左のロブスターは開発者コミュニティのマスコットで、内容そのものとは直接関係ありません。）
-->

---

# 基本は「知覚→思考→行動→観察」の繰り返し

<div class="eyebrow">THE AGENT LOOP · ReAct</div>

<AgentLoop />

<div class="tk concl">
<strong><a class="gterm" data-term="react">ReAct</a></strong>（Reasoning + Acting）：<span class="whitespace-nowrap">考えて→動いて→見て→また考える</span>。<span class="whitespace-nowrap">毎回<strong>文脈が増えて</strong>賢くなり</span>、この<strong>輪を回し続ける</strong>のがエージェント。
</div>

<div class="nextcue"><span class="whitespace-nowrap">ただし、同じ頭ひとつでは<strong>“自己採点”が甘い</strong>。</span> <span class="whitespace-nowrap">次は<span class="go">別のAIに“壁打ち”</span>させて輪の質を上げる。</span></div>

<Cite :items="[
  { label: 'Yao et al. (2022) — ReAct: Synergizing Reasoning and Acting', url: 'https://arxiv.org/abs/2210.03629' },
]" />

<!--
エージェントのループが具体的にどう回るのかを図解したページです。基本形は「知覚（今どうなっている?）→思考（どうする?）→行動（道具を使って動く）→観察（結果を見る）」の繰り返しで、これはReAct（Reasoning＋Acting＝考えることと動くことの両立）と呼ばれる考え方です。輪を1周するたびに新しい情報が文脈に積み上がり、エージェントはだんだん賢く、目標へ近づきます。ただし弱点もあって、同じAIが一人で考えて一人で採点すると、“自己採点”が甘くなりがち。そこで次のページでは、別のAIに“壁打ち”させて、ループの質を上げる工夫を紹介します。
-->

---
foot: false
---

# <span class="grad">Rubberduck</span>：別のAIに“壁打ち”させる

<div class="eyebrow">ループの質を上げる · 複数モデルで壁打ち</div>

<div class="flex flex-col items-center justify-center" style="height:68%">

<div class="rd-intro__duck" style="position:static; width:140px; margin:0 auto"><DuckToy /></div>

<div class="bigstate mt-3" style="font-size:2.5rem">
1モデルで自問 → <span class="grad glow-a">別モデルに壁打ち</span>
</div>

<div class="tk concl mt-4" style="text-align:center">同じモデルの<span class="whitespace-nowrap">“自己採点”は甘い</span>。<strong>別のAIと組ませる</strong>ほど、ループは<strong>賢くなる</strong>。</div>

<div class="chip-row mt-7 justify-center">
  <span class="chip"><Ico name="scales"/> LLM-as-a-Judge</span>
  <span class="chip"><Ico name="swap"/> Architect / Editor</span>
  <span class="chip"><Ico name="layers"/> Mixture-of-Agents</span>
</div>

</div>

<Cite :items="[
  { label: 'LLM-as-a-Judge (Zheng+23)', url: 'https://arxiv.org/abs/2306.05685' },
  { label: 'Aider — Architect/Editor', url: 'https://aider.chat/2024/09/26/architect.html' },
  { label: 'Mixture-of-Agents (Wang+24)', url: 'https://arxiv.org/abs/2406.04692' },
]" />

<!--
前ページで触れた“自己採点が甘くなる”弱点への対策を説明するページです。タイトルのRubberduck（ラバーダック）は、プログラマーがアヒルのおもちゃに話しかけて考えを整理する、有名なデバッグ手法にちなんだ言葉。ここでは、1つのモデルだけで自問自答させるのではなく、別のモデルに“壁打ち”（チェックや反論）をさせる、という意味です。具体的な型として、答えを採点させるLLM-as-a-Judge、設計役と実装役を分けるArchitect/Editor、複数モデルの意見を重ねるMixture-of-Agentsなどがあります。ひとりで抱え込ませるより、別のAIと組ませるほど、ループは賢くなります。
-->

---
foot: false
---

# 「Loopの次はGraph」? <span class="whitespace-nowrap">まだ数日の</span><span class="grad">“暫定”ワード</span>

<div class="eyebrow">TREND · 2026-07 · GRAPH ENGINEERING（未確定）</div>

<div class="xfeed">

<XPost name="Peter Steinberger" handle="steipete" accent="a" role="OpenClaw 開発者" date="2026-07-18">
<template #post>Are we still talking loops or did we shift to graphs yet?</template>
<template #jp>まだ<span class="whitespace-nowrap">“ループ”</span>の話をしてる? それとも、もう<span class="whitespace-nowrap">“グラフ”</span>に移った?</template>
</XPost>

<XPost name="Hamel Husain" handle="HamelHusain" accent="b" role="LLM Evals 専門家" date="2026-07-18">
<template #post>New: <em>"Loop Engineering Is Dead. Enter Graph Engineering."</em></template>
<template #jp>新記事:「<span class="whitespace-nowrap">Loop Engineeringは終わった</span>。<span class="whitespace-nowrap">Graph Engineeringの時代へ</span>」</template>
</XPost>

</div>

<div class="note mt-3">
きっかけは<strong>1行の問いかけ</strong>→その<strong class="hot">約4時間半後</strong>に出た“死亡宣告”記事。<span class="whitespace-nowrap">標準化された定義・比較検証はまだ無い</span>（2026-07時点）。
</div>

<div class="tk concl">新語は鵜呑みにも無視もせず、<span class="whitespace-nowrap">「誰が・いつ・何を根拠に」</span>を先に見る＝<span class="grad" style="font-weight:700">それが「情報弱者にならない」姿勢</span>。</div>

<Cite :items="[
  { label: 'Peter Steinberger — X post (2026-07-18)', url: 'https://x.com/steipete/status/2078277297791189132' },
  { label: 'Hamel Husain — “Loop Engineering Is Dead. Enter Graph Engineering” (X, 2026-07-18)', url: 'https://x.com/HamelHusain/status/2078346425621237935' },
]" />

<!--
2026年7月に入って急速に広がった新語「Graph Engineering」の、実際の発端を示すページです。きっかけは2026年7月18日朝、OpenClaw開発者のPeter Steinberger氏が投げた「まだループの話をしてる? もうグラフに移った?」という1行の問いかけ。その約4時間半後、LLM評価（Evals）を専門とするHamel Husain氏が「Loop Engineeringは終わった。Graph Engineeringの時代へ」という記事を公開し、翌日にかけて同種の“死亡宣告”フレーズが他のアカウントでも反復されました。ただしこの資料の基準日（2026年7月時点）でも、標準化された定義や比較検証はまだ存在しません。大事なのは、新語が出た瞬間に鵜呑みにも無視もせず、「誰が・いつ・何を根拠に言ったか」を確認する姿勢——それこそがこのシリーズの目指す「情報弱者にならない」態度です。次のページで、この言葉がいま指している中身を、暫定的に図解します。
-->

---

# 「Graph」は複数の<span class="grad">Loop</span>をつなぐ配線

<div class="eyebrow">GRAPH ENGINEERING（暫定）· NODE / EDGE / STATE</div>

<LoopGraph class="mt-2" />

<div class="tk concl mt-2">
<a class="gterm" data-term="graph-engineering"><strong>Graph Engineering</strong></a> は Loop を<span class="hot">置き換える</span>のではなく、複数の Loop を束ねる<span class="grad" style="font-weight:700">“上位の配線”</span>（現時点の暫定的な整理）。
</div>

<Cite :items="[
  { label: 'LangGraph — Graph API overview', url: 'https://docs.langchain.com/oss/python/langgraph/graph-api' },
  { label: 'Anthropic — Building Effective Agents', url: 'https://www.anthropic.com/engineering/building-effective-agents' },
]" />

<!--
前ページの“暫定ワード”が、具体的に何を指しているのかを図解するページです。①（紫のバッジ）が付いたLoopノードは、前ページ・前々ページで見たReActループそのもの——つまり「知覚→思考→行動→観察」の反復です。Graph Engineeringが加えるのは、その前後・周辺の配線だと暫定的に整理されています：Plannerが仕事を割り振り、Loopの結果はEvaluator（検証ゲート）で合流・判定され、OKなら統合完了、NGならLoopへ差し戻し（再試行）、人の判断が要るときはHumanへエスカレーションしてから完了へ合流します。点線の枠は、これらのノードが同じState（進捗・チェックポイント）を共有していることを示します。実は、こうしたnode／edge／stateによる実行グラフの仕組み自体はLangGraphなど既存フレームワークにすでにあり、目新しい技術ではありません。新しいのは「複数のLoopをどう束ねるか」という設計対象への注目そのもの——次章「一体で作る? 分ける?」で扱う、単一 vs マルチエージェントの話と地続きです。
-->

---
layout: section
class: section
chapter: "04 · 一体で作る? 分ける?"
---

<span class="section__chno" aria-hidden="true" data-number="04"></span>

<div class="section__mark" aria-hidden="true"><span></span></div>

<p class="section__context">設計判断 · 一体か分業か</p>

# 一体で作る? <span class="section__accent">分ける?</span>

<p class="section__lead">単一エージェント vs マルチ（サブエージェント／オーケストレーション）。</p>

<div class="section__route" aria-label="この章で扱う内容">
  <span>単一 vs マルチ</span><span>分ける判断</span><span>4つの型</span>
</div>

<!--
ここから第4章。話は“仕組み”から“実際に作るときの判断”へ移ります。分かれ道は「1体のエージェントにまとめて作るか（単一）」、それとも「役割ごとに複数に分けて連携させるか（マルチ）」。この選び方を、次のページから具体的に見ていきます。
-->

---

# 単一 vs マルチエージェント

<SingleVsMulti class="mt-1" />

<div class="tk muted">「オーケストレーション」＝ 指揮役が複数のサブエージェントをまとめる構成。</div>

<!--
単一エージェントとマルチエージェント、それぞれの特徴を対比するページです。単一エージェントは、1体に多くの道具を持たせて全部を任せる作り方。マルチエージェントは、役割ごとに複数のエージェントへ分け、それらを連携させる作り方です。マルチの代表が「オーケストレーション」——指揮役（オーケストレーター）が、複数のサブエージェントをまとめて動かす構成です。大事な原則は、“最初から複雑にしない”こと。いきなり分けると調整が大変になるので、基本はまず単一から始めるのがおすすめです。
-->

---

# 判断ガイド：分けるべき? <Ico name="help" class="h1ico"/>

<div class="eyebrow">DECISION GUIDE</div>

<blockquote class="mt-4">
原則 ▸ <strong>まず単一エージェントから始める</strong>。問題が出てから分割する（“最初から複雑にしない”）。
</blockquote>

<div class="stack mt-4">

<div class="row accent ac-pu">
<div class="row__head">
<span class="row__ico"><Ico name="split"/></span>
<span class="row__title">分けるサイン</span>
</div>
<div class="row__body">

- スキル領域が**明確に違う** ／ それぞれ**専用の文脈・道具**が要る
- **並列**で進められる ／ 道具が多すぎて**混乱**している
- 別オーナー／別モデルにしたい

</div>
</div>

<div class="row accent">
<div class="row__head">
<span class="row__ico"><Ico name="user"/></span>
<span class="row__title">単一で十分なサイン</span>
</div>
<div class="row__body">

- タスクが**ひとまとまり** ／ 道具が**少ない**
- **速さ・コスト**を重視 ／ **文脈の共有**が大事

</div>
</div>

</div>

<Cite :items="[
  { label: 'Anthropic — Building Effective Agents', url: 'https://www.anthropic.com/engineering/building-effective-agents' },
  { label: 'OpenAI — A Practical Guide to Building Agents', url: 'https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf' },
]" />

<!--
「分けるべきか、単一のままでいいか」を実際に判断するためのガイドです。大原則は、まず単一エージェントから始めて、問題が出てきてから分割すること（最初から複雑にしない）。そのうえで、“分けるサイン”は——扱うスキル領域が明確に違う／それぞれ専用の文脈や道具が要る／作業を並列で進められる／道具が多すぎて混乱している／別の担当者や別モデルに任せたい、など。逆に“単一で十分なサイン”は——タスクがひとまとまり／道具が少ない／速さやコストを重視したい／文脈の共有が大事、など。迷ったら単一から、と覚えておけば大丈夫です。
-->

---

# 組み方は4つの型に集約できる

<div class="eyebrow">COMMON PATTERNS</div>

<div class="ptn-grid mt-5">

<div class="ptn">
<div class="ptn__h"><span class="ptn__ico"><Ico name="split"/></span><span class="ptn__name">ルーティング<span class="ptn__en">Routing</span></span></div>
<div class="ptn__foot"><div class="ptn__d">入力を見て<strong>得意な担当へ振り分け</strong>。<span class="ptn__ex">例: 問い合わせを種類で仕分け</span></div><PatternGlyph type="routing" /></div>
</div>

<div class="ptn">
<div class="ptn__h"><span class="ptn__ico"><Ico name="compass"/></span><span class="ptn__name">オーケストレーター–ワーカー<span class="ptn__en">Orchestrator–Workers</span></span></div>
<div class="ptn__foot"><div class="ptn__d">親が<strong>計画して割り振り→集約</strong>。<span class="ptn__ex">例: 調査・執筆・校正を分担</span></div><PatternGlyph type="orchestrator" /></div>
</div>

<div class="ptn">
<div class="ptn__h"><span class="ptn__ico"><Ico name="swap"/></span><span class="ptn__name">ハンドオフ<span class="ptn__en">Handoff</span></span></div>
<div class="ptn__foot"><div class="ptn__d">担当を<strong>順に引き継ぐ</strong>。<span class="ptn__ex">例: 一次受付 → 専門担当へ</span></div><PatternGlyph type="handoff" /></div>
</div>

<div class="ptn">
<div class="ptn__h"><span class="ptn__ico"><Ico name="loop"/></span><span class="ptn__name">評価–改善ループ<span class="ptn__en">Evaluator–Optimizer</span></span></div>
<div class="ptn__foot"><div class="ptn__d"><strong>作る役と直す役</strong>で品質を上げる。<span class="ptn__ex">例: 生成 → 批評 → 修正</span></div><PatternGlyph type="evaluator" /></div>
</div>

</div>

<div class="tk concl">
どれも<strong>「役割で分けて、つなぐ」</strong>形。まずは1つから始め、<span class="whitespace-nowrap">必要になったら組み合わせる</span>。
</div>

<Cite :items="[
  { label: 'Anthropic — Building Effective Agents', url: 'https://www.anthropic.com/engineering/building-effective-agents' },
  { label: 'OpenAI Agents SDK（Handoff）', url: 'https://openai.github.io/openai-agents-python/' },
]" />

<!--
エージェントを複数に分けて組む場合でも、その構成は大きく4つの型に集約できる、と整理したページです。①ルーティング（入力を見て、得意な担当へ振り分ける。例：問い合わせを種類で仕分け）、②オーケストレーター–ワーカー（親が計画して各担当に割り振り、結果を集約する。例：調査・執筆・校正を分担）、③ハンドオフ（担当を順に引き継ぐ。例：一次受付から専門担当へ）、④評価–改善ループ（作る役と直す役に分けて品質を上げる。例：生成→批評→修正）。どれも本質は“役割で分けて、つなぐ”こと。まずは1つの型から始め、必要になったら組み合わせます。
-->

---

# 具体例：カスタマーサポートを作るなら

<div class="eyebrow">EXAMPLE · before / after</div>

<div class="stack mt-4">

<div class="row accent">
<div class="row__head">
<span class="row__ico"><Ico name="check"/></span>
<span class="row__title">まずは単一で</span>
<span class="row__tag">出発点</span>
</div>
<div class="row__body">

1体のサポート係に道具を持たせる

<div class="chip-row mt-2">
  <span class="chip">FAQ検索</span>
  <span class="chip">注文照会</span>
  <span class="chip">返金API</span>
</div>

<div class="muted mt-2" style="font-size:.82rem">道具が数個・一体的な対応ならこれで十分。速くて安く、デバッグも簡単。</div>

</div>
</div>

<div class="vsbadge">増えてきたら ↓</div>

<div class="row accent ac-pu">
<div class="row__head">
<span class="row__ico"><Ico name="split"/></span>
<span class="row__title">分割する</span>
<span class="row__tag">scale-out</span>
</div>
<div class="row__body">

オーケストレーターが内容で振り分け

<div class="chip-row mt-2">
  <span class="chip"><Ico name="help"/> 一次対応</span>
  <span class="chip"><Ico name="package"/> 注文・配送</span>
  <span class="chip"><Ico name="coin"/> 返金・課金</span>
</div>

<div class="muted mt-2" style="font-size:.82rem">各サブが専用ツール・専用の文脈を持ち、並列でも捌ける。</div>

</div>
</div>

</div>

<blockquote class="sink">
分割の見極め ▸ <strong>ツールが増えて選択を誤り始めた／領域が明確に分かれた／並列で捌きたい</strong>、と感じたとき。
</blockquote>

<!--
これまでの話を、カスタマーサポート（問い合わせ対応）を作る例で具体的にイメージするページです。出発点は“まず単一で”——1体のサポート係に、FAQ検索・注文照会・返金APIといった道具を持たせます。道具が数個で、対応が一体的ならこれで十分。速くて安く、うまく動かないときの原因追跡（デバッグ）も簡単です。やがて扱う範囲が増えてきたら“分割”へ——オーケストレーターが内容を見て、一次対応・注文/配送・返金/課金といった専門のサブエージェントに振り分けます。分割の見極めは、ツールが増えて選択を誤り始めた／領域が明確に分かれた／並列でさばきたい、と感じたときです。
-->

---
layout: section
class: section
chapter: "05 · 勘所とまとめ"
---

<span class="section__chno" aria-hidden="true" data-number="05"></span>

<div class="section__mark" aria-hidden="true"><span></span></div>

<p class="section__context">実装前後の勘所 · まとめ</p>

# 勘所と <span class="section__accent">まとめ</span>

<p class="section__lead">評価・安全・コスト・落とし穴を押さえ、<span class="whitespace-nowrap">要点と次の一歩へ</span>。<span class="whitespace-nowrap">“動くもの”</span> を <span class="whitespace-nowrap">“使えるもの”</span> にして締めくくる。</p>

<div class="section__route" aria-label="この章で扱う内容">
  <span>評価・安全・コスト</span><span>落とし穴</span><span>次の一歩</span>
</div>

<!--
最終章となる第5章です。ここまでは“作り方”の話でしたが、ここからは、実際に使えるものにするための“勘所”をまとめます。評価・安全・コスト・よくある落とし穴を押さえ、最後に今日の要点と次の一歩へ——“動くもの”を“使えるもの”に仕上げて、締めくくります。
-->

---

# 作る前に「評価・安全・コスト」を決めておく

<div class="flex flex-col items-center justify-center" style="height:74%">

<div class="bigstate" style="font-size:2.5rem">
「なんとなく動く」で止めない。<br>
小さく作って <span class="grad glow-a">測る → 直す</span>
</div>

<div class="chip-row mt-8 justify-center">
  <span class="chip"><Ico name="gauge"/> 評価 ＝ 測る物差し</span>
  <span class="chip"><Ico name="shield"/> 安全 ＝ ガードレール</span>
  <span class="chip"><Ico name="coin"/> コスト ＝ 青天井を防ぐ</span>
</div>

<div class="tk muted mt-6" style="text-align:center">エージェント自身のループと同じ発想で、作る<strong>“前”</strong>に決める。</div>

</div>

<Cite :items="[
  { label: 'OpenAI — A Practical Guide to Building Agents', url: 'https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf' },
  { label: 'Anthropic — Building Effective Agents', url: 'https://www.anthropic.com/engineering/building-effective-agents' },
]" />

<!--
エージェントを作るとき、“作り始める前”に決めておくべき3つの土台を説明するページです。「なんとなく動く」で満足せず、小さく作って測る→直すを回すのがコツで、そのために先に次を決めておきます。①評価（うまくいったかを測る物差し。これがないと、良くなったのか分からない）、②安全（危険な操作を止めるガードレール）、③コスト（使うほど費用がかさむので、青天井を防ぐ上限や設計）。面白いのは、これがエージェント自身のループ（試して→測って→直す）と、まったく同じ発想だということ。作る側も、同じ姿勢で臨みます。
-->

---

# 落とし穴は、<span class="solid-a">3つの工程</span>で塞ぐ <Ico name="warning" class="h1ico"/>

<p class="risk-intro">よくある8項目を、発生しやすいタイミングで確認します。</p>

<div class="risk-stacks">

<section class="risk-stage risk-stage--design">
  <h2 class="risk-stage__title"><span>設計前</span><small>複雑さを増やす前に</small></h2>
  <ul>
    <li><strong>道具を盛りすぎ</strong><span>どれを使うか迷う</span></li>
    <li><strong>いきなりマルチ</strong><span>調整地獄・高コスト</span></li>
    <li><strong>文脈を詰めすぎ</strong><span>精度もコストも悪化</span></li>
  </ul>
</section>

<section class="risk-stage risk-stage--run">
  <h2 class="risk-stage__title"><span>実行中</span><small>止める仕組みを先に</small></h2>
  <ul>
    <li><strong>終了条件なし</strong><span>無限ループ・暴走</span></li>
    <li><strong>ガードレール無し</strong><span>危険操作を素通り</span></li>
  </ul>
</section>

<section class="risk-stage risk-stage--operate">
  <h2 class="risk-stage__title"><span>運用</span><small>観測して直し続ける</small></h2>
  <ul>
    <li><strong>ログ無し</strong><span>失敗の原因が追えない</span></li>
    <li><strong>評価が無い</strong><span>良くなったか分からない</span></li>
    <li><strong>MCP 非対応</strong><span>後で乗り換え困難</span></li>
  </ul>
</section>

</div>

<div class="tk muted risk-takeaway">チェックする順番も、<strong>設計 → 実行 → 運用</strong>。</div>

<!--
実際に作るときにハマりがちな失敗を、8つ並べたページです。道具を盛りすぎてどれを使うか迷う／いきなりマルチにして調整地獄・高コストになる／文脈を詰め込みすぎて精度もコストも悪化する／ログを残さず失敗の原因を追えない／終了条件を決めず無限ループ・暴走する／ガードレールがなく危険な操作を素通りさせる／評価がなく良くなったか分からない／MCPに非対応で後から乗り換えづらい。よく見ると、その多くは“足場・ループの設計”（この資料の主役）を軽視すると起きるものばかり。自分の状況に当てはめながら読むと、チェックリストとして役立ちます。
-->

---

# 今日の要点

<div class="tl mt-4">
  <div class="tl-step"><span class="k">Prompt</span><span class="d">どう伝える</span></div>
  <div class="tl-arrow">›</div>
  <div class="tl-step"><span class="k">Context</span><span class="d">何を知らせる</span></div>
  <div class="tl-arrow">›</div>
  <div class="tl-step"><span class="k">Harness</span><span class="d">どう動かす</span></div>
  <div class="tl-arrow">›</div>
  <div class="tl-step active"><span class="k">Loop</span><span class="d">どう反復する <span class="nowpill">いま</span></span></div>
</div>

<div class="bigstate mt-8" style="font-size:2.5rem">
むかしは「指示」を変えるだけ。<br>
いまは<span class="grad glow-a">「仕組み」を設計する</span>時代。
</div>

<div class="tk muted" style="margin-top:1rem">
その最前線が <strong>Loop</strong>（反復の設計）。
</div>

<div class="chip-row mt-8 justify-center">
  <span class="chip">MCP ＝ 道具をつなぐ</span>
  <span class="chip">Orchestration ＝ 複数を編成</span>
  <span class="chip chip-now"><Ico name="loop"/> Loop ＝ 反復を制御（いま）</span>
</div>

<!--
今日の内容をひとつの流れに束ねる、まとめのページです。作り方は Prompt（どう伝える）→ Context（何を知らせる）→ Harness（どう動かす）→ Loop（どう反復する）と“外側”へ進化してきました。ひとことで言えば、“むかしは「指示」ひとつを工夫すればよかったが、いまは「仕組み」全体（文脈・足場・反復）を設計する時代”——その最前線が、いちばん外の Loop（反復の設計）です。あわせて、道具をつなぐMCP、複数を編成するオーケストレーション、反復を制御するループという重要キーワードも再確認します。これが今回いちばん持ち帰ってほしいメッセージで、次のページの“では何から始めるか”へと続きます。
-->

---

# 次の一歩 & 情報弱者にならないために

<div class="stack mt-4">

<div class="row accent ac-pu">
<div class="row__head">
<span class="row__ico"><Ico name="rocket"/></span>
<span class="row__title">まず試すなら</span>
</div>
<div class="row__body">

- まずは**単一エージェント**を1つ、小さく動かす
- **MCP サーバ**を1つ繋いでみる
- ループに**終了条件**と**ログ**を入れる

</div>
</div>

<div class="row accent">
<div class="row__head">
<span class="row__ico"><Ico name="rss"/></span>
<span class="row__title">追うべきデータソース</span>
</div>
<div class="row__body">

- **一次情報**: <a href="https://www.anthropic.com/engineering" target="_blank" class="doc">Anthropic Engineering</a> ／ <a href="https://openai.com/news/" target="_blank" class="doc">OpenAI</a> の技術記事
- **プロトコル**: <a href="https://modelcontextprotocol.io/" target="_blank" class="doc">MCP 公式</a>（modelcontextprotocol.io）
- **研究→要点**: <a href="https://arxiv.org/list/cs.AI/recent" target="_blank" class="doc">arXiv</a> ＋ <a href="https://lilianweng.github.io/" target="_blank" class="doc">Lil'Log</a>（英語でも追う）

</div>
</div>

</div>

<blockquote class="sink">
全部を追わなくていい。<strong>地図（全体像）</strong>さえ持っていれば、新しい話題も迷子になりません。<br>
—— それが「情報弱者にならない」ということ。
</blockquote>

<!--
読み終えたあと、実際に何から始めればいいかを示すページです。まず試すなら——①単一エージェントを1つ、小さく動かしてみる、②MCPサーバを1つ繋いでみる、③ループに“終了条件”と“ログ”を入れる。そして継続的に追うべき一次情報として、Anthropic EngineeringやOpenAIの技術記事、MCP公式サイト、arXivやLil'Log（英語でも追う価値あり）を挙げています。大切なのは、全部を追いかけようとしないこと。全体像という“地図”さえ持っていれば、新しい話題が出てきても迷子になりません——それこそが、このシリーズの目指す「情報弱者にならない」という状態です。
-->

---

# 参考・出典 <span class="grad">References</span>

<div class="eyebrow">SOURCES · すべて一次情報リンク</div>

<div class="refs">

<div class="refgrp">
<h4>指示・文脈（Prompt → Context）</h4>

- <a href="https://platform.openai.com/docs/guides/prompt-engineering" target="_blank">OpenAI — Prompt Engineering</a> <span class="u">platform.openai.com</span>
- <a href="https://arxiv.org/abs/2201.11903" target="_blank">Chain-of-Thought</a> ／ <a href="https://arxiv.org/abs/2005.14165" target="_blank">Few-Shot Learners</a> <span class="u">arxiv · Wei+22 / Brown+20</span>
- <a href="https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents" target="_blank">Effective Context Engineering</a> <span class="u">anthropic.com</span>
- <a href="https://blog.langchain.com/context-engineering-for-agents/" target="_blank">LangChain</a> ／ <a href="https://www.philschmid.de/context-engineering" target="_blank">Phil Schmid</a> <span class="u">Context Engineering</span>

</div>

<div class="refgrp">
<h4>足場・反復（Harness → Loop）</h4>

- <a href="https://www.anthropic.com/engineering/building-effective-agents" target="_blank">Building Effective Agents</a> <span class="u">anthropic.com</span>
- <a href="https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents" target="_blank">Effective Harnesses for Long-running Agents</a> <span class="u">anthropic.com</span>
- <a href="https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf" target="_blank">OpenAI — A Practical Guide to Building Agents</a> <span class="u">openai.com · PDF</span>
- <a href="https://arxiv.org/abs/2210.03629" target="_blank">ReAct</a> ／ <a href="https://arxiv.org/abs/2303.11366" target="_blank">Reflexion</a> <span class="u">arxiv · Yao+22 / Shinn+23</span>
- <a href="https://lilianweng.github.io/posts/2023-06-23-agent/" target="_blank">LLM Powered Autonomous Agents</a> <span class="u">Lil'Log</span>

</div>

<div class="refgrp">
<h4>グラフの兆し（Graph Engineering・未確定・2026-07）</h4>

- <a href="https://x.com/steipete/status/2078277297791189132" target="_blank">Peter Steinberger — X post</a> <span class="u">x.com · 2026-07-18</span>
- <a href="https://x.com/HamelHusain/status/2078346425621237935" target="_blank">Hamel Husain — “Loop Engineering Is Dead. Enter Graph Engineering”</a> <span class="u">x.com · 2026-07-18</span>
- <BrandMark name="langchain" class="refbm"/> <a href="https://docs.langchain.com/oss/python/langgraph/graph-api" target="_blank">LangGraph — Graph API overview</a> <span class="u">docs.langchain.com</span>

</div>

<div class="refgrp">
<h4>プロトコル · MCP / マルチ</h4>

- <a href="https://www.anthropic.com/news/model-context-protocol" target="_blank">Introducing MCP</a> <span class="u">anthropic.com</span>
- <BrandMark name="mcp" class="refbm"/> <a href="https://modelcontextprotocol.io/" target="_blank">MCP 公式ドキュメント</a> <span class="u">modelcontextprotocol.io</span>
- <a href="https://www.anthropic.com/engineering/multi-agent-research-system" target="_blank">Multi-agent Research System</a> <span class="u">anthropic.com</span>

</div>

<div class="refgrp">
<h4>フレームワーク</h4>

- <BrandMark name="langchain" class="refbm"/> <a href="https://docs.langchain.com/oss/python/langgraph/overview" target="_blank">LangGraph</a> ／ <a href="https://crewai.com/" target="_blank">CrewAI</a>
- <BrandMark name="openai" class="refbm"/> <a href="https://openai.github.io/openai-agents-python/" target="_blank">OpenAI Agents SDK</a>
- <BrandMark name="microsoft" class="refbm"/> <a href="https://learn.microsoft.com/en-us/semantic-kernel/frameworks/agent/" target="_blank">Microsoft Agent Framework</a> ／ <BrandMark name="anthropic" class="refbm"/> <a href="https://code.claude.com/docs/en/agent-sdk/overview" target="_blank">Claude Agent SDK</a>

</div>

</div>

<div class="tk muted">クリックで各公式サイトへ。<strong>一次情報</strong>を起点に追うのがキャッチアップの近道です。</div>

<!--
本文で触れた内容の出典（参考リンク集）をまとめたページです。「指示・文脈（Prompt→Context）」「足場・反復（Harness→Loop）」「グラフの兆し（Graph Engineering・未確定）」「プロトコル・MCP／マルチ」「フレームワーク」の5グループに整理してあり、それぞれ公式ドキュメントや代表的な論文、本人の投稿へのリンクになっています。すべて一次情報なので、気になったテーマは、ここを起点に深掘りするのがいちばんの近道です。「グラフの兆し」は名前のとおりまだ確定していない話題なので、リンク先の日付にも注目してください。最初は飛ばして、あとでゆっくり見返す使い方でも構いません。
-->

---
routeAlias: glossary
chapter: "付録 · 用語集"
foot: false
---

# 用語集 <span class="grad">Glossary</span>

<div class="eyebrow">GLOSSARY · 本文の<span style="color:var(--brand-a)">点線の用語</span>をクリックするとここへジャンプ</div>

<Glossary />

<!--
付録の用語集です。本文中に出てきた点線付きの用語（MCP・RAG・ReActなど）をクリックすると、このページの該当項目へジャンプできるようになっています。用語の意味を思い出したいときの“辞書”として使ってください。最初から全部を覚える必要はなく、ざっと眺めておくだけで十分です。
-->

---
layout: center
class: section
chapter: クロージング
---

<div class="flex flex-col items-center text-center closing-in">

<BrandLogo size="lg" />

<div class="closing__thanks">ありがとうございました <Ico name="sparkles" class="h1ico"/></div>

<p class="closing__thesis">むかしは「指示」を変えるだけ。<br>いまは<span class="grad">「仕組み」を設計する</span>時代。</p>

<div class="cover__series mt-6 is-1line" style="justify-content:center">
  <span class="tag">SERIES</span>
  <span class="cs-nowrap">「情報強者までいかずとも、情報弱者にならないためのコンテンツ」シリーズ #01</span>
</div>

<div class="mt-8">
  <AuthorBadge />
</div>

</div>

<!--
結びのページです。ここまで読んでいただき、ありがとうございました。「情報強者までいかずとも、情報弱者にならないためのコンテンツ」シリーズの第1弾は、以上です。最後にもう一度だけ、今回いちばんのメッセージを——“むかしは「指示」ひとつを工夫すればよかった。いまは「仕組み」全体を設計する時代で、その最前線が Loop（反復の設計）”。この資料が、これからAIエージェントの話題に触れるときの“地図”になれば幸いです。
-->
