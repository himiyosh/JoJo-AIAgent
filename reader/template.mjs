import { escapeHtml, renderPortraitVisual, visibleTakeaway } from './visuals.mjs'

function renderBlock(block, headingLevel = 4) {
  const body = escapeHtml(block.text)
  if (!body && block.type !== 'table')
    return ''

  switch (block.type) {
    case 'heading':
      return `<h${headingLevel}>${body}</h${headingLevel}>`
    case 'quote':
      return `<blockquote>${body}</blockquote>`
    case 'list':
      return `<${block.ordered ? 'ol' : 'ul'}>${block.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</${block.ordered ? 'ol' : 'ul'}>`
    case 'table':
      return `<div class="reader-table-wrap"><table><tbody>${block.rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
    default:
      return `<p>${body}</p>`
  }
}

function renderLinks(links, slideNumber) {
  if (!links.length)
    return ''

  return `
    <section class="reader-sources" aria-labelledby="sources-heading-${slideNumber}">
      <h4 id="sources-heading-${slideNumber}">出典・関連リンク</h4>
      <ul>
        ${links.map(link => `<li><a href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label || link.href)}<span aria-hidden="true"> ↗</span></a></li>`).join('')}
      </ul>
    </section>`
}

function renderDialog(slide) {
  const body = slide.blocks.map(block => renderBlock(block)).join('\n')
  const tabs = slide.tabs.map((tab, tabIndex) => `
    <section class="reader-reveal" aria-labelledby="dialog-tab-${slide.number}-${tabIndex}">
      <h4 id="dialog-tab-${slide.number}-${tabIndex}">${escapeHtml(tab.label)}</h4>
      ${tab.blocks.map(block => renderBlock(block, 5)).join('\n')}
    </section>`).join('\n')
  const note = slide.note
    ? `<aside class="reader-note" aria-labelledby="note-${slide.number}">
       <h4 id="note-${slide.number}">発表者ノート</h4>
       <p>${escapeHtml(slide.note)}</p>
     </aside>`
    : ''

  return `
    <dialog class="reader-dialog reader-dialog--detail" id="reader-dialog-${slide.number}" aria-labelledby="reader-dialog-title-${slide.number}">
      <div class="reader-dialog__sheet">
        <header class="reader-dialog__header">
          <div>
            <p>Slide ${String(slide.number).padStart(2, '0')} の補足</p>
            <h3 id="reader-dialog-title-${slide.number}">${escapeHtml(slide.title)}</h3>
          </div>
          <button class="reader-dialog__close" type="button" data-reader-close aria-label="補足を閉じる">×</button>
        </header>
        <div class="reader-dialog__scroll" tabindex="0" aria-label="Slide ${String(slide.number).padStart(2, '0')} の補足内容">
          <section class="reader-detail" aria-label="スライド本文の詳細">
            ${body}
            ${tabs}
          </section>
           ${note}
           ${renderLinks(slide.links, slide.number)}
        </div>
      </div>
    </dialog>`
}

function renderPage(slide, index, count) {
  const previous = index > 0
    ? `<a class="reader-control reader-control--step" href="#slide-${index}" aria-label="前のスライド、${index}へ">←</a>`
    : '<button class="reader-control reader-control--step" type="button" disabled aria-label="前のスライドはありません">←</button>'
  const next = index < count - 1
    ? `<a class="reader-control reader-control--step" href="#slide-${index + 2}" aria-label="次のスライド、${index + 2}へ">→</a>`
    : '<a class="reader-control reader-control--step" href="#slide-1" aria-label="最初のスライドへ戻る">↥</a>'
  const progress = ((slide.number / count) * 100).toFixed(3)
  const takeaway = visibleTakeaway(slide)

  return `
    <article
      class="reader-page reader-page--${escapeHtml(slide.recipe.type)}"
      id="slide-${slide.number}"
      data-slide="${slide.number}"
      data-reader-type="${escapeHtml(slide.recipe.type)}"
      data-reader-variant="${escapeHtml(slide.recipe.variant)}"
      aria-labelledby="slide-title-${slide.number}"
    >
      <div class="reader-page__frame">
        <header class="reader-page__header">
          <p class="reader-page__chapter">${escapeHtml(slide.chapter)}</p>
          <button class="reader-search-button" type="button" data-reader-search aria-haspopup="dialog" aria-controls="reader-search-dialog">
            <span aria-hidden="true">⌕</span><span>検索</span>
          </button>
          <div class="reader-page__position">
            <span><strong>${String(slide.number).padStart(2, '0')}</strong> / ${String(count).padStart(2, '0')}</span>
            <span class="reader-progress" role="progressbar" aria-label="Readerの進捗" aria-valuemin="1" aria-valuemax="${count}" aria-valuenow="${slide.number}" style="--reader-progress:${progress}%"><span></span></span>
          </div>
        </header>
        <section class="reader-page__stage" data-reader-stage>
          <header class="reader-page__title">
            <h2 id="slide-title-${slide.number}" tabindex="-1">${escapeHtml(slide.title)}</h2>
            ${takeaway ? `<p>${takeaway}</p>` : ''}
          </header>
          ${renderPortraitVisual(slide)}
        </section>
        <nav class="reader-page__controls" aria-label="Slide ${slide.number} の操作">
          ${previous}
          <button class="reader-control reader-control--detail" type="button" data-reader-dialog="reader-dialog-${slide.number}" aria-haspopup="dialog">補足を見る</button>
          <a class="reader-control reader-control--deck" href="../" aria-label="16対9の通常デッキを開く">16:9</a>
          ${next}
        </nav>
      </div>
      ${renderDialog(slide)}
    </article>`
}

function searchText(slide) {
  const blocks = slide.blocks.flatMap((block) => {
    if (block.type === 'list')
      return block.items
    if (block.type === 'table')
      return block.rows.flat()
    return block.text ? [block.text] : []
  })
  const tabs = slide.tabs.flatMap(tab => [
    tab.label,
    ...tab.blocks.flatMap((block) => {
      if (block.type === 'list')
        return block.items
      if (block.type === 'table')
        return block.rows.flat()
      return block.text ? [block.text] : []
    }),
  ])
  return [
    slide.title,
    slide.chapter,
    ...blocks,
    ...tabs,
    slide.note,
    ...slide.links.flatMap(link => [link.label, link.href]),
  ].join(' ').replace(/\s+/g, ' ').trim()
}

function renderSearch(slides) {
  const index = JSON.stringify(slides.map(slide => ({
    number: slide.number,
    title: slide.title,
    chapter: slide.chapter,
    text: searchText(slide),
  }))).replaceAll('<', '\\u003c')

  return `
    <dialog class="reader-dialog reader-dialog--search" id="reader-search-dialog" aria-labelledby="reader-search-title">
      <div class="reader-dialog__sheet">
        <header class="reader-dialog__header">
          <div>
            <p>SEARCH / CONTENTS</p>
            <h3 id="reader-search-title">全33枚から検索</h3>
          </div>
          <button class="reader-dialog__close" type="button" data-reader-close aria-label="検索を閉じる">×</button>
        </header>
        <div class="reader-dialog__scroll reader-search" tabindex="0" aria-label="Reader検索結果">
          <label for="reader-search-input">見出し・本文・補足・出典を検索</label>
          <input id="reader-search-input" type="search" inputmode="search" autocomplete="off" enterkeyhint="search" data-reader-search-input>
          <p class="reader-search__status" data-reader-search-status aria-live="polite">${slides.length}件</p>
          <ol class="reader-search__results" data-reader-search-results>
            ${slides.map(slide => `
              <li>
                <a href="#slide-${slide.number}">
                  <span>${String(slide.number).padStart(2, '0')}</span>
                  <span><b>${escapeHtml(slide.title)}</b><small>${escapeHtml(slide.chapter)}</small></span>
                </a>
              </li>`).join('')}
          </ol>
        </div>
      </div>
    </dialog>
    <script type="application/json" id="reader-search-data">${index}</script>`
}

export function renderReader({ title, slides }) {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="color-scheme" content="dark">
  <meta name="description" content="${escapeHtml(title)} 全${slides.length}枚を縦向け図解で1ページずつ読むReader View">
  <title>${escapeHtml(title)} | Reader View</title>
  <link rel="stylesheet" href="./reader.css">
  <script src="./reader.js" defer></script>
</head>
<body>
  <a class="reader-skip" href="#slide-1">最初のスライドへ移動</a>
  <h1 class="reader-sr-only">${escapeHtml(title)} Reader View</h1>
  <main class="reader-pages" id="reader-main" aria-label="${escapeHtml(title)} Reader View">
    ${slides.map((slide, index) => renderPage(slide, index, slides.length)).join('\n')}
  </main>
  ${renderSearch(slides)}
</body>
</html>`
}
