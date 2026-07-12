import { content, dataVisual, escapeHtml, item, noteExcerpt } from '../pilot-render-utils.mjs'

function reference(model, id, className) {
  const value = item(model, id)
  return `<span class="${escapeHtml(className)}" data-content-reference="${escapeHtml(id)}">${escapeHtml(value.text)}</span>`
}

function post(model, number, decoration = '') {
  const prefix = `s16.post.${number}`
  return `<article class="pf16__post pf16__post--${number}">
    <header class="pf16__post-head">
      <span class="pf16__avatar" aria-hidden="true">${number === 1 ? 'PS' : 'BC'}</span>
      <div>
        ${content(model, `${prefix}.author`, { className: 'pf16__author' })}
        ${content(model, `${prefix}.meta`, { className: 'pf16__meta' })}
      </div>
      <span class="pf16__network" aria-hidden="true">𝕏</span>
    </header>
    ${content(model, `${prefix}.quote`, { tag: 'blockquote', className: 'pilot-copy pf16__quote' })}
    ${decoration}
  </article>`
}

function translation(model, number) {
  const prefix = `s16.post.${number}`
  return `<section class="pf16__translation-card" data-semantic-shape>
    <header>
      <span class="pf16__avatar" aria-hidden="true">${number === 1 ? 'PS' : 'BC'}</span>
      ${reference(model, `${prefix}.author`, 'pf16__translation-author')}
    </header>
    <div class="pf16__translation" aria-label="日本語訳">
      <span>日本語訳</span>
      ${content(model, `${prefix}.translation`, { className: 'pilot-copy' })}
    </div>
  </section>`
}

export function renderSlide16(model, page) {
  if (page.renderer === 's16-quotes') {
    const mascot = `<aside class="pf16__decoration">
      <div class="pf16__mascot" aria-hidden="true">${model.assets.slide16.decoration}</div>
      ${content(model, 's16.decoration', { className: 'pf16__mascot-label' })}
    </aside>`

    return dataVisual('canonical-two-post-quotes', `
      <div class="pf16 pf16--quotes">
        ${content(model, 's16.eyebrow', { className: 'pf16__context' })}
        ${noteExcerpt(model, 's16.note', '要約すると、どちらも「もうエージェントに毎回プロンプト(指示)を打つのではなく、エージェントに指示を出し続ける“ループ”の方を設計している」と言っています。', 'pf16__consensus')}
        <div class="pf16__posts" data-meaning-visual>
          ${post(model, 1, mascot)}
          <div class="pf16__agreement" data-semantic-shape aria-hidden="true"><span>2人が設計する対象</span><strong>LOOP</strong></div>
          ${post(model, 2)}
        </div>
      </div>`, 'pilot-visual--pf16')
  }

  if (page.renderer === 's16-translations') {
    return dataVisual('canonical-two-post-translations', `
      <div class="pf16 pf16--translations">
        <div class="pf16__translation-pair" data-meaning-visual>
          ${translation(model, 1)}
          <div class="pf16__agreement" data-semantic-shape aria-hidden="true"><span>2人の発言が指す先</span><strong>LOOP</strong></div>
          ${translation(model, 2)}
        </div>
      </div>`, 'pilot-visual--pf16')
  }

  throw new Error(`Unsupported Source 16 renderer: ${page.renderer}`)
}
