export const MOBILE_PILOT_SLIDE_NUMBERS = Object.freeze([6, 16, 28])

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function deckHref(number, routerMode) {
  return routerMode === 'hash' ? `../#/${number}` : `../${number}`
}

function embeddedDeckHref(number, routerMode) {
  return routerMode === 'hash'
    ? `../?embedded=true#/${number}`
    : `../${number}?embedded=true`
}

function blockText(block) {
  if (block.type === 'list')
    return block.items
  if (block.type === 'table')
    return block.rows.flat()
  return block.text ? [block.text] : []
}

function searchText(slide) {
  return [
    slide.title,
    slide.chapter,
    ...slide.blocks.flatMap(blockText),
    ...slide.tabs.flatMap(tab => [
      tab.label,
      ...tab.blocks.flatMap(blockText),
      ...Object.values(tab.full ?? {}).flatMap(value => typeof value === 'string'
        ? [value]
        : Array.isArray(value)
          ? value
          : value && typeof value === 'object'
            ? Object.values(value)
            : []),
    ]),
    slide.note,
    ...slide.links.flatMap(link => [link.label, link.href]),
  ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

export function directReaderThumbnailPath(number) {
  return `thumbnails/slide-${String(number).padStart(2, '0')}.jpg`
}

export function buildDirectReaderData({
  title,
  slides,
  routerMode = 'history',
}) {
  return {
    version: 2,
    title,
    routerMode,
    slides: slides.map(slide => ({
      number: slide.number,
      title: slide.title,
      chapter: slide.chapter,
      note: slide.note,
      links: slide.links,
      search: searchText(slide),
      thumbnail: directReaderThumbnailPath(slide.number),
    })),
  }
}

export function renderDirectReaderEntry({
  title,
  routerMode = 'history',
}) {
  const fallback = routerMode === 'hash'
    ? '../#/1?reader=true&embedded=true'
    : '../1?reader=true&embedded=true'
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#07080d">
  <meta name="description" content="${escapeHtml(title)} · direct canonical mobile Reader">
  <title>${escapeHtml(title)} · スマホReader</title>
</head>
<body style="margin:0;background:#07080d;color:#f4f7fb;font-family:system-ui,sans-serif">
  <main style="display:grid;min-height:100svh;place-content:center;padding:1.5rem;text-align:center">
    <p>Reader Viewを開いています…</p>
    <p><a style="color:#67e8f9" href="${fallback}">自動的に移動しない場合はこちら</a></p>
  </main>
  <script>
    (() => {
      const match = location.hash.match(/^#slide-(\\d+)$/)
      const number = match ? Math.max(1, Math.min(33, Number(match[1]))) : 1
      const target = ${JSON.stringify(routerMode)} === 'hash'
        ? new URL(\`../#/\${number}?reader=true&embedded=true\`, location.href)
        : new URL(\`../\${number}?reader=true&embedded=true\`, location.href)
      location.replace(target.href)
    })()
  </script>
</body>
</html>`
}

function renderSources(slide) {
  if (!slide.links.length)
    return '<p class="mobile-dialog__empty">このスライドに外部出典はありません。</p>'

  return `
    <ul class="mobile-dialog__sources">
      ${slide.links.map(link => `
        <li><a href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a></li>
      `).join('')}
    </ul>`
}

function renderDetailPanel(slide) {
  const number = String(slide.number).padStart(2, '0')
  return `
    <section class="mobile-dialog__panel" data-mobile-detail-panel="${slide.number}" hidden>
      <p class="mobile-dialog__source">SOURCE SLIDE ${number}</p>
      <h3>${escapeHtml(slide.title)}</h3>
      <h4>補足</h4>
      ${slide.note
        ? `<p class="mobile-dialog__note">${escapeHtml(slide.note)}</p>`
        : '<p class="mobile-dialog__empty">このbuildには発表者ノートが含まれていません。</p>'}
      <h4>出典</h4>
      ${renderSources(slide)}
      <a class="mobile-dialog__deck-link" data-mobile-dialog-deck-link="${slide.number}" href="${deckHref(slide.number, slide.routerMode)}">
        通常の16:9表示で開く
      </a>
    </section>`
}

function renderContents(slides) {
  return slides.map(slide => `
    <li data-mobile-toc-item data-mobile-search="${escapeHtml(searchText(slide))}">
      <a href="#slide-${slide.number}" data-mobile-toc-select="${slide.number}">
        <span class="mobile-contents__number">${String(slide.number).padStart(2, '0')}</span>
        <span class="mobile-contents__copy">
          <strong>${escapeHtml(slide.title)}</strong>
          <small>${escapeHtml(slide.chapter)}</small>
        </span>
      </a>
    </li>`).join('')
}

export function renderMobileViewer({
  title,
  slides,
  routerMode = 'history',
  slideNumbers = slides.map(slide => slide.number),
  variant = 'reader',
}) {
  const byNumber = new Map(slides.map(slide => [slide.number, slide]))
  const viewerSlides = slideNumbers.map((number) => {
    const slide = byNumber.get(number)
    if (!slide)
      throw new Error(`Mobile viewer is missing canonical slide ${number}.`)
    return { ...slide, routerMode }
  })
  if (!viewerSlides.length)
    throw new Error('Mobile viewer requires at least one canonical slide.')
  const fullReader = variant === 'reader'
  const first = viewerSlides[0]
  const data = JSON.stringify({
    routerMode,
    variant,
    slides: viewerSlides.map(slide => ({
      number: slide.number,
      title: slide.title,
      chapter: slide.chapter,
    })),
  }).replace(/</g, '\\u003c')
  const surfaceLabel = fullReader ? 'スマホReader' : 'スマホ拡大pilot'
  const description = fullReader
    ? `${title} · canonical horizontal mobile Reader`
    : `${title} · canonical horizontal mobile zoom pilot`

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#07080d">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)} · ${surfaceLabel}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@600;700;800&amp;family=Noto+Sans+JP:wght@400;500;600;700;800;900&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="./mobile-viewer.css">
</head>
<body>
  <a class="mobile-skip" href="#mobile-stage">スライド表示へ移動</a>
  <div class="mobile-shell" data-mobile-shell data-mobile-current="${first.number}">
    <header class="mobile-appbar">
      <div class="mobile-brand">
        <span class="mobile-brand__mark" aria-hidden="true">◆</span>
        <span><strong>横型スライド</strong><small>${fullReader ? 'READER VIEW' : 'ZOOM PILOT'}</small></span>
      </div>
      <div class="mobile-appbar__actions">
        ${fullReader ? '<button type="button" data-mobile-toc-open aria-haspopup="dialog" aria-controls="mobile-contents-dialog">目次</button>' : ''}
        <button type="button" data-mobile-info aria-haspopup="dialog" aria-controls="mobile-detail-dialog">補足</button>
        <a data-mobile-deck-link href="${deckHref(first.number, routerMode)}" aria-label="通常の16対9スライドを開く">通常</a>
      </div>
    </header>

    <main class="mobile-main">
      <section class="mobile-context" aria-labelledby="mobile-current-title">
        <button type="button" class="mobile-context__step" data-mobile-prev aria-label="前のスライドへ">←</button>
        <div class="mobile-context__copy">
          <p data-mobile-source>SLIDE ${String(first.number).padStart(2, '0')} · 1 / ${viewerSlides.length}</p>
          <h1 id="mobile-current-title" data-mobile-title tabindex="-1">${escapeHtml(first.title)}</h1>
        </div>
        <button type="button" class="mobile-context__step" data-mobile-next aria-label="次のスライドへ">→</button>
      </section>

      <section
        class="mobile-stage"
        id="mobile-stage"
        data-mobile-stage
        data-mobile-zoomed="false"
        tabindex="0"
        role="region"
        aria-label="拡大とパンができる16対9スライド"
        aria-describedby="mobile-gesture-hint"
      >
        <div class="mobile-canvas" data-mobile-canvas>
          <iframe
            data-mobile-frame
            src="${embeddedDeckHref(first.number, routerMode)}"
            title="Slide ${String(first.number).padStart(2, '0')} · ${escapeHtml(first.title)}"
            width="980"
            height="552"
            allow="fullscreen"
          ></iframe>
        </div>
        <p class="mobile-live" data-mobile-live aria-live="polite"></p>
      </section>

      <section class="mobile-guide" aria-label="拡大操作の案内">
        <p class="mobile-gesture-hint" id="mobile-gesture-hint" data-mobile-hint>
          <strong>まず全体を確認</strong>
          <span>読みたい箇所をピンチ／ダブルタップ · 拡大中はドラッグ</span>
        </p>
        ${fullReader
          ? `<button type="button" class="mobile-contents-shortcut" data-mobile-toc-open aria-haspopup="dialog" aria-controls="mobile-contents-dialog">
              <span aria-hidden="true">⌕</span>
              <span>全33枚の目次・検索</span>
            </button>`
          : `<nav class="mobile-samples" aria-label="代表スライドを選ぶ">
          ${viewerSlides.map((slide, index) => `
            <button
              type="button"
              data-mobile-select="${slide.number}"
              aria-label="Slide ${String(slide.number).padStart(2, '0')} · ${escapeHtml(slide.title)}"
              aria-pressed="${index === 0 ? 'true' : 'false'}"
            >${String(slide.number).padStart(2, '0')}</button>
          `).join('')}
        </nav>`}
      </section>

      <nav class="mobile-zoom" aria-label="拡大表示の操作">
        <button type="button" data-mobile-zoom-out aria-label="縮小">−</button>
        <button type="button" class="mobile-zoom__reset" data-mobile-zoom-reset aria-label="スライド全体を表示">
          <span data-mobile-zoom-label>全体</span>
        </button>
        <button type="button" data-mobile-zoom-in aria-label="拡大">＋</button>
        <button type="button" data-mobile-fullscreen aria-label="スライド表示を全画面にする">⛶</button>
      </nav>
    </main>
  </div>

  <dialog class="mobile-dialog" id="mobile-detail-dialog" aria-labelledby="mobile-detail-title">
    <div class="mobile-dialog__sheet">
      <header class="mobile-dialog__header">
        <div>
          <p>CANONICAL SOURCE</p>
          <h2 id="mobile-detail-title">補足と出典</h2>
        </div>
        <button type="button" data-mobile-dialog-close aria-label="補足を閉じる">×</button>
      </header>
      <div class="mobile-dialog__scroll" tabindex="0">
        ${viewerSlides.map(renderDetailPanel).join('\n')}
      </div>
    </div>
  </dialog>

  ${fullReader
   ? `<dialog class="mobile-dialog mobile-dialog--contents" id="mobile-contents-dialog" aria-labelledby="mobile-contents-title">
   <div class="mobile-dialog__sheet">
     <header class="mobile-dialog__header">
       <div>
         <p>SEARCH / CONTENTS</p>
         <h2 id="mobile-contents-title">全33枚から探す</h2>
       </div>
       <button type="button" data-mobile-toc-close aria-label="目次を閉じる">×</button>
     </header>
     <div class="mobile-dialog__scroll mobile-contents">
       <label for="mobile-contents-search">見出し・本文・補足・出典を検索</label>
       <input id="mobile-contents-search" type="search" inputmode="search" autocomplete="off" enterkeyhint="search" data-mobile-search-input>
       <p class="mobile-contents__status" data-mobile-search-status aria-live="polite">${viewerSlides.length}件</p>
       <ol class="mobile-contents__list" data-mobile-search-results>
         ${renderContents(viewerSlides)}
       </ol>
       <p class="mobile-contents__empty" data-mobile-search-empty hidden>一致するスライドはありません。</p>
     </div>
   </div>
  </dialog>`
   : ''}

  <script type="application/json" id="mobile-viewer-data">${data}</script>
  <script src="./mobile-viewer.js"></script>
</body>
</html>`
}
