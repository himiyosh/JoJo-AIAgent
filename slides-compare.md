---
theme: default
title: 比較用 · 1枚1メッセージ A/B
colorSchema: dark
fonts:
  sans: Noto Sans JP
  mono: JetBrains Mono
  weights: '400,500,700,800,900'
highlighter: shiki
lineNumbers: false
transition: slide-left
mdc: true
---

<div class="flex flex-col items-center justify-center text-center" style="height:82%">

<div class="eyebrow">COMPARISON · A/B</div>

<h1 style="font-size:2.7rem; font-weight:900; line-height:1.2; margin-top:.7rem">
1枚1メッセージ 再構成の<br><span class="grad glow-a">比較デッキ</span>
</h1>

<p class="lead mt-5" style="max-width:36em">
各テーマを <strong style="color:#fff">現行版 → 変更案（ヒーロー化）</strong> の順に並べています。<br>
<strong style="color:#fff">→ キー</strong>で送ると、同じ内容の Before / After を直接見比べられます。
</p>

<p class="soft mt-5" style="font-size:.9rem">本編 p1–31 は変更していません（別デッキ・別ポート :3031）。</p>

</div>

---

# なぜ「いま」これほど騒がれる? <span style="font-family:'JetBrains Mono',monospace;font-size:.9rem;letter-spacing:.06em;color:var(--muted);position:absolute;top:.5rem;right:0">現行 · p9</span>

<div class="cols cols-3 mt-6">

<div class="card">

### <Ico name="brain" /> モデルが賢く
推論・長文・コードが向上。<br>**任せられる**範囲が拡大
</div>

<div class="card">

### <Ico name="plug" /> 道具が標準化
<a class="gterm" data-term="mcp"><strong>MCP</strong></a> でツール接続が共通化。<br>エコシステムが急拡大
</div>

<div class="card">

### <Ico name="building" /> 実利用が本格化
試作から**本番運用**へ。<br>業務を“やってくれる”段階に
</div>

</div>

<div class="tk concl">
つまり「賢い文章生成」から、<strong>「実際に作業をこなす」</strong>へ。だから注目されています。
</div>

---

# なぜ「いま」これほど騒がれる? <span style="font-family:'JetBrains Mono',monospace;font-size:.9rem;letter-spacing:.06em;color:var(--brand-b);position:absolute;top:.5rem;right:0">変更案 · HERO</span>

<div class="flex flex-col items-center justify-center" style="height:76%">

<div class="eyebrow" style="text-align:center">これまで → いま</div>

<div class="bigstate mt-3">
「賢い文章生成」から<br>
<span class="grad glow-a">「実際に作業をこなす」</span>へ
</div>

<div class="chip-row mt-8 justify-center">
  <span class="chip"><Ico name="brain"/> モデルが賢く</span>
  <span class="chip"><Ico name="plug"/> 道具が標準化（MCP）</span>
  <span class="chip chip-now"><Ico name="building"/> 実利用が本格化</span>
</div>

<div class="tk muted mt-6" style="text-align:center">3つの追い風が重なった。だから <strong style="color:#fff">“いま”</strong>。</div>

</div>

---

# 今日の要点 <span style="font-family:'JetBrains Mono',monospace;font-size:.9rem;letter-spacing:.06em;color:var(--muted);position:absolute;top:.5rem;right:0">現行 · RECAP</span>

<div class="eyebrow">RECAP</div>

<div class="tl mt-5">
  <div class="tl-step"><span class="k">Prompt</span><span class="d">どう伝える</span></div>
  <div class="tl-arrow">›</div>
  <div class="tl-step"><span class="k">Context</span><span class="d">何を知らせる</span></div>
  <div class="tl-arrow">›</div>
  <div class="tl-step"><span class="k">Harness</span><span class="d">どう動かす</span></div>
  <div class="tl-arrow">›</div>
  <div class="tl-step active"><span class="k">Loop</span><span class="d">どう反復する <span class="nowpill">いま</span></span></div>
</div>

<div class="now-label">いまの主流は、この3つ</div>

<div class="pillars">
  <div class="pillar">
    <span class="pillar__k">MCP<small>道具をつなぐ</small></span>
    <span class="pillar__d"><strong>道具は MCP で標準接続。</strong>「共通プラグ」化が定着し、後から付け替え自在。</span>
  </div>
  <div class="pillar">
    <span class="pillar__k">Orchestration<small>複数を編成する</small></span>
    <span class="pillar__d"><strong>複数化はオーケストレーション。</strong>まず単一、伸ばすときは役割分担で束ねる。</span>
  </div>
  <div class="pillar b">
    <span class="pillar__k">Loop<small>反復を制御 <span class="hot">← いま</span></small></span>
    <span class="pillar__d"><strong>主役は Loop Engineering。</strong><br>反復を制御＝<strong>終了条件・ログ・ガードレール・評価</strong>を組み込むのが勘所。</span>
  </div>
</div>

<div class="tk concl">むかしは「指示」を変えるだけ。<span class="hot">いま</span>大事なのは <span class="grad" style="font-weight:700">ループを回し切ること</span>。</div>

---

# 今日の要点 <span style="font-family:'JetBrains Mono',monospace;font-size:.9rem;letter-spacing:.06em;color:var(--brand-b);position:absolute;top:.5rem;right:0">変更案 · HERO</span>

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
いま大事なのは、<span class="grad glow-a">ループを回し切る</span>こと。
</div>

<div class="chip-row mt-8 justify-center">
  <span class="chip">MCP ＝ 道具をつなぐ</span>
  <span class="chip">Orchestration ＝ 複数を編成</span>
  <span class="chip chip-now"><Ico name="loop"/> Loop ＝ 反復を制御（いま）</span>
</div>

---

# <span class="grad">Rubberduck</span>：別のAIに“壁打ち”させる <span style="font-family:'JetBrains Mono',monospace;font-size:.9rem;letter-spacing:.06em;color:var(--muted);position:absolute;top:.5rem;right:0">現行 · p18</span>

<div class="eyebrow">ループの質を上げる · 複数モデルで壁打ち</div>

<div class="rd-intro mt-4">

<div class="note">
<strong>いまの弱点</strong>＝ひとつのループは、同じモデルの<strong><span class="whitespace-nowrap">“自己採点”が甘い</span></strong>。<br><strong><span class="whitespace-nowrap">ラバーダック・デバッグ</span></strong>＝アヒルに<strong>説明</strong>すると自分で気づくように、その<strong><span class="whitespace-nowrap">“壁打ち”役を別のAI</span></strong>に任せる。<br>別モデルが<strong>レビュー・採点・反論</strong>し、<span class="mk">ループの質を上げる</span>。
</div>

<div class="rd-intro__duck"><DuckToy /></div>

</div>

<div class="cols cols-3 eq-title mt-2">

<div class="card ac-cy">

### <Ico name="scales"/> LLM-as-a-Judge
別モデルが<strong>採点・レビュー</strong>。<span class="whitespace-nowrap"><strong>生成と審判</strong>を分ける</span>。

</div>

<div class="card ac-in">

### <Ico name="swap"/> Architect / Editor
<strong>推論担当</strong>と<strong>編集担当</strong>を<span class="whitespace-nowrap">別モデルに分業</span>（Aider）。

</div>

<div class="card ac-pu">

### <Ico name="layers"/> Mixture-of-Agents
複数モデルを<strong>層</strong>で重ね、<span class="whitespace-nowrap">互いの回答で<strong>精錬</strong></span>。

</div>

</div>

<div class="tk concl"><span class="whitespace-nowrap">1モデルで自問 → <strong>別モデルに壁打ち</strong></span>。組み合わせるほど、ループは<strong>賢くなる</strong>。</div>

---

# <span class="grad">Rubberduck</span>：別のAIに“壁打ち”させる <span style="font-family:'JetBrains Mono',monospace;font-size:.9rem;letter-spacing:.06em;color:var(--brand-b);position:absolute;top:.5rem;right:0">変更案 · HERO</span>

<div class="eyebrow">ループの質を上げる · 複数モデルで壁打ち</div>

<div class="flex flex-col items-center justify-center" style="height:70%">

<div class="rd-intro__duck" style="position:static; width:150px; margin:0 auto"><DuckToy /></div>

<div class="bigstate mt-4" style="font-size:2.5rem">
1モデルで自問 → <span class="grad glow-a">別モデルに壁打ち</span>
</div>

<div class="tk concl" style="text-align:center;margin-top:.9rem">組み合わせるほど、ループは<strong>賢くなる</strong>。</div>

<div class="chip-row mt-6 justify-center">
  <span class="chip"><Ico name="scales"/> LLM-as-a-Judge</span>
  <span class="chip"><Ico name="swap"/> Architect / Editor</span>
  <span class="chip"><Ico name="layers"/> Mixture-of-Agents</span>
</div>

</div>

---

# 作る前に「評価・安全・コスト」を決めておく <span style="font-family:'JetBrains Mono',monospace;font-size:.9rem;letter-spacing:.06em;color:var(--muted);position:absolute;top:.5rem;right:0">現行 · p25</span>

<div class="cols cols-3 mt-6">

<div class="card">

### <Ico name="gauge"/> 評価 & 観測
- **Evaluation**: 良し悪しを測る物差し
- **Observability**: ログ・トレースで**中身を見る**
- 「なんとなく動く」で止めない

</div>

<div class="card">

### <Ico name="shield"/> ガードレール
- 危険な操作に**歯止め**
- 入出力の**検証**
- 人の**承認**を挟む（human-in-the-loop）

</div>

<div class="card">

### <Ico name="coin"/> コスト & 速度
- ループ＝**呼び出し回数**が増える
- **ステップ予算**で青天井を防ぐ
- 速さ⇔賢さの**バランス**

</div>

</div>

<div class="tk concl">小さく作って <strong>測る → 直す</strong>。エージェント自身のループと同じ発想で改善します。</div>

---

# 作る前に「評価・安全・コスト」を決めておく <span style="font-family:'JetBrains Mono',monospace;font-size:.9rem;letter-spacing:.06em;color:var(--brand-b);position:absolute;top:.5rem;right:0">変更案 · HERO</span>

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

