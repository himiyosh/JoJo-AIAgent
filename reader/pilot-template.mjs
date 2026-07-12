import { dialogContent, escapeHtml, item, titleContent } from './pilot-render-utils.mjs'
import { renderPilotPageVisual } from './pilot-pages/index.mjs'

function contentIdOccurrences(markup, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return (markup.match(new RegExp(`data-content-id="${escaped}"`, 'g')) ?? []).length
}

function validatePageMarkup(page, markup) {
  for (const id of [...page.visibleItemIds, ...page.dialogItemIds]) {
    const count = contentIdOccurrences(markup, id)
    if (count !== 1)
      throw new Error(`Reader pilot page ${page.id} rendered content item ${id} ${count} times.`)
  }
  if ((markup.match(/data-reader-visual(?:\s|>)/g) ?? []).length !== 1)
    throw new Error(`Reader pilot page ${page.id} did not render exactly one meaningful visual.`)
}

function renderDialog(model, page, routerMode) {
  const number = String(page.index + 1).padStart(2, '0')
  const source = String(page.sourceSlide).padStart(2, '0')
  const deckHref = routerMode === 'hash' ? `../#/${page.sourceSlide}` : `../${page.sourceSlide}`
  return `
    <dialog class="pilot-dialog pilot-dialog--detail" id="pilot-dialog-${page.id}" aria-labelledby="pilot-dialog-title-${page.id}">
      <div class="pilot-dialog__sheet">
        <header class="pilot-dialog__header">
          <div>
            <p>${number} / ${String(model.pages.length).padStart(2, '0')} · Source ${String(page.sourceSlide).padStart(2, '0')}</p>
            <h3 id="pilot-dialog-title-${page.id}">${escapeHtml(item(model, page.titleItemId).text)}の補足</h3>
          </div>
          <button type="button" class="pilot-dialog__close" data-pilot-close aria-label="補足を閉じる">×</button>
        </header>
        <div class="pilot-dialog__scroll" tabindex="0" aria-label="${escapeHtml(item(model, page.titleItemId).text)}の補足内容">
          ${dialogContent(model, page.dialogItemIds)}
          <nav class="pilot-dialog__destinations" aria-label="Source ${source}の別表示">
            <a href="../reader/#slide-${page.sourceSlide}">現行Readerで比較</a>
            <a href="${deckHref}">16:9スライドを開く</a>
          </nav>
        </div>
      </div>
    </dialog>`
}

function renderPage(model, page, routerMode) {
  const count = model.pages.length
  const index = page.index
  const previous = index > 0 ? model.pages[index - 1].id : model.pages.at(-1).id
  const next = index < count - 1 ? model.pages[index + 1].id : model.pages[0].id
  const number = String(index + 1).padStart(2, '0')
  const source = String(page.sourceSlide).padStart(2, '0')
  const headingId = `pilot-title-${page.id}`
  const title = item(model, page.titleItemId).text
  const progress = (((index + 1) / count) * 100).toFixed(3)
  const captionId = `pilot-caption-${page.id}`
  const visual = renderPilotPageVisual(model, page).replace(
    /<\/figure>$/,
    `<figcaption id="${captionId}">Source Slide ${source} · ${escapeHtml(title)} · portrait ${page.sourceOrdinal} / ${page.sourcePageCount}</figcaption></figure>`,
  )
  const markup = `
    <article
      class="pilot-page pilot-page--source-${source}"
      id="${page.id}"
      data-pilot-index="${index + 1}"
      data-source-slide="${page.sourceSlide}"
      data-source-ordinal="${page.sourceOrdinal}"
      data-pilot-renderer="${escapeHtml(page.renderer)}"
      data-pilot-legacy-ids="${escapeHtml((page.legacyIds ?? []).join(' '))}"
      aria-labelledby="${headingId}"
    >
      <div class="pilot-page__frame">
        <header class="pilot-page__chrome">
          <button type="button" class="pilot-chrome-button" data-pilot-contents aria-haspopup="dialog" aria-controls="pilot-contents-dialog">
            <span aria-hidden="true">◆</span><span>目次</span>
          </button>
          <p class="pilot-page__source">SOURCE ${source} · ${page.sourceOrdinal}/${page.sourcePageCount}</p>
          <button type="button" class="pilot-chrome-button" data-pilot-search aria-haspopup="dialog" aria-controls="pilot-search-dialog">
            <span aria-hidden="true">⌕</span><span>検索</span>
          </button>
          <div class="pilot-page__position">
            <strong>${number}</strong><span>/ ${String(count).padStart(2, '0')}</span>
            <span class="pilot-progress" role="progressbar" aria-label="Pilot Readerの進捗" aria-valuemin="1" aria-valuemax="${count}" aria-valuenow="${index + 1}" style="--pilot-progress:${progress}%"><span></span></span>
          </div>
        </header>
        <section class="pilot-page__stage" data-pilot-stage role="region" aria-labelledby="${headingId}">
          <p class="pilot-page__canonical" data-presentation-ref="${page.sourceSlide}" aria-hidden="true">${escapeHtml(page.source.title)}</p>
          ${titleContent(model, page.titleItemId, headingId)}
          <div class="pilot-page__visual-wrap" aria-describedby="${captionId}">
            ${visual}
          </div>
        </section>
        <nav class="pilot-page__controls" aria-label="${number}ページの操作">
          <a class="pilot-control pilot-control--step" href="#${previous}" aria-label="前のページへ">←</a>
          <button class="pilot-control pilot-control--detail" type="button" data-pilot-dialog="pilot-dialog-${page.id}" aria-haspopup="dialog">補足</button>
          <a class="pilot-control pilot-control--step" href="#${next}" aria-label="次のページへ">→</a>
        </nav>
      </div>
      ${renderDialog(model, page, routerMode)}
    </article>`

  validatePageMarkup(page, markup)
  return markup
}

function renderContents(model) {
  const groups = new Map()
  for (const page of model.pages) {
    if (!groups.has(page.sourceSlide))
      groups.set(page.sourceSlide, [])
    groups.get(page.sourceSlide).push(page)
  }
  return [...groups.entries()].map(([sourceSlide, pages]) => `
    <section class="pilot-contents__source" aria-labelledby="pilot-contents-source-${sourceSlide}">
      <h3 id="pilot-contents-source-${sourceSlide}">Source ${String(sourceSlide).padStart(2, '0')} · ${escapeHtml(pages[0].source.title)}</h3>
      <ol>
        ${pages.map(page => `<li><a href="#${page.id}"><span>${String(page.index + 1).padStart(2, '0')}</span>${escapeHtml(item(model, page.titleItemId).text)}</a></li>`).join('')}
      </ol>
    </section>`).join('')
}

function searchData(model) {
  const allocations = new Map(model.coverage.allocations.map(entry => [entry.itemId, entry]))
  return model.pages.map((page) => {
    const items = model.inventory.filter(candidate => allocations.get(candidate.id)?.pageId === page.id)
    const visibleItems = items.filter(value => allocations.get(value.id)?.placement === 'visible')
    const dialogItems = items.filter(value => allocations.get(value.id)?.placement === 'dialog')
    const itemText = values => values.flatMap(value => [value.text, value.href]).filter(Boolean).join(' ')
    return {
      id: page.id,
      number: page.index + 1,
      sourceSlide: page.sourceSlide,
      sourceOrdinal: page.sourceOrdinal,
      title: item(model, page.titleItemId).text,
      chapter: page.source.chapter,
      text: [
        page.source.title,
        page.source.chapter,
        itemText(items),
      ].join(' '),
      visibleText: itemText(visibleItems),
      dialogText: itemText(dialogItems),
    }
  })
}

export function renderPilot(model, title, { routerMode = 'history' } = {}) {
  const data = JSON.stringify(searchData(model)).replace(/</g, '\\u003c')
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#07080d">
  <meta name="description" content="${escapeHtml(title)} · coverage-first portrait Reader pilot v3">
  <title>${escapeHtml(title)} · Portrait Reader Pilot v3</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700;800&amp;family=Noto+Sans+JP:wght@400;500;600;700;800;900&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="./pilot.css">
</head>
<body>
  <a class="pilot-skip" href="#slide-06-01">本文へ移動</a>
  <main class="pilot-pages" data-pilot-version="3" data-pilot-current="1" data-pilot-total="${model.pages.length}" data-pilot-router-mode="${routerMode}" aria-label="Portrait Reader Pilot v3">
    ${model.pages.map(page => renderPage(model, page, routerMode)).join('\n')}
  </main>
  <dialog class="pilot-dialog pilot-dialog--utility" id="pilot-contents-dialog" aria-labelledby="pilot-contents-title">
    <div class="pilot-dialog__sheet">
      <header class="pilot-dialog__header"><div><p>6 sources · ${model.pages.length} pages · v3</p><h2 id="pilot-contents-title">目次</h2></div><button type="button" class="pilot-dialog__close" data-pilot-close aria-label="目次を閉じる">×</button></header>
      <div class="pilot-dialog__scroll pilot-contents">${renderContents(model)}</div>
    </div>
  </dialog>
  <dialog class="pilot-dialog pilot-dialog--utility" id="pilot-search-dialog" aria-labelledby="pilot-search-title">
    <div class="pilot-dialog__sheet">
      <header class="pilot-dialog__header"><div><p>visible + notes + sources</p><h2 id="pilot-search-title">Reader内を検索</h2></div><button type="button" class="pilot-dialog__close" data-pilot-close aria-label="検索を閉じる">×</button></header>
      <div class="pilot-dialog__scroll pilot-search">
        <label for="pilot-search-input">キーワード・出典URL・ノート</label>
        <input id="pilot-search-input" type="search" data-pilot-search-input autocomplete="off">
        <p class="pilot-search__status" data-pilot-search-status aria-live="polite"></p>
        <ol class="pilot-search__results" data-pilot-search-results></ol>
      </div>
    </div>
  </dialog>
  <script type="application/json" id="pilot-search-data">${data}</script>
  <script type="module" src="./pilot.js"></script>
</body>
</html>`
}
