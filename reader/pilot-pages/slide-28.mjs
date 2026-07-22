import { content, dataVisual, noteExcerpt } from '../pilot-render-utils.mjs'

const hazards = {
  1: [1, 2, 3],
  2: [4, 5],
  3: [6, 7, 8],
}

function riskItem(model, number) {
  return `<li class="pf28__hazard">
    <span class="pf28__hazard-index" aria-hidden="true">${String(number).padStart(2, '0')}</span>
    <div>
      ${content(model, `s28.hazard.${number}.title`, { tag: 'h4', className: 'pf28__hazard-title' })}
      ${content(model, `s28.hazard.${number}.detail`, { className: 'pilot-copy pf28__hazard-detail' })}
    </div>
  </li>`
}

function phase(model, stage) {
  const prefix = `s28.stage.${stage}`
  return `<section class="pf28__phase pf28__phase--${stage}">
      <header class="pf28__stage-head">
        <span class="pf28__number" aria-hidden="true">0${stage}</span>
        <div>
          ${content(model, `${prefix}.title`, { tag: 'h3', className: 'pf28__stage-title' })}
          ${content(model, `${prefix}.subtitle`, { className: 'pf28__stage-subtitle' })}
        </div>
      </header>
      <ul class="pf28__hazards">${hazards[stage].map(number => riskItem(model, number)).join('')}</ul>
    </section>`
}

export function renderSlide28(model, page) {
  if (page.renderer !== 's28-lifecycle')
    throw new Error(`Unsupported Source 28 renderer: ${page.renderer}`)

  return dataVisual('canonical-three-stage-lifecycle', `
    <div class="pf28">
      ${content(model, 's28.intro', { className: 'pilot-copy pf28__intro' })}
      <div class="pf28__lifecycle" data-meaning-visual>
        ${phase(model, 1)}
        ${phase(model, 2)}
        ${phase(model, 3)}
      </div>
      ${noteExcerpt(model, 's28.note', 'よく見ると、その多くは“足場・ループの設計”(この資料の主役)を軽視すると起きるものばかり。', 'pf28__framing')}
      ${content(model, 's28.takeaway', { tag: 'blockquote', className: 'pilot-copy pf28__takeaway' })}
    </div>`, 'pilot-visual--pf28')
}
