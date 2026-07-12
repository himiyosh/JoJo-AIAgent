import { content, dataVisual, noteExcerpt } from '../pilot-render-utils.mjs'

const hazards = {
  1: [1, 2, 3],
  2: [4, 5],
  3: [6, 7, 8],
}

function riskItem(model, number) {
  return `<li class="pf26__hazard">
    <span class="pf26__hazard-index" aria-hidden="true">${String(number).padStart(2, '0')}</span>
    <div>
      ${content(model, `s26.hazard.${number}.title`, { tag: 'h4', className: 'pf26__hazard-title' })}
      ${content(model, `s26.hazard.${number}.detail`, { className: 'pilot-copy pf26__hazard-detail' })}
    </div>
  </li>`
}

function phase(model, stage) {
  const prefix = `s26.stage.${stage}`
  return `<section class="pf26__phase pf26__phase--${stage}">
      <header class="pf26__stage-head">
        <span class="pf26__number" aria-hidden="true">0${stage}</span>
        <div>
          ${content(model, `${prefix}.title`, { tag: 'h3', className: 'pf26__stage-title' })}
          ${content(model, `${prefix}.subtitle`, { className: 'pf26__stage-subtitle' })}
        </div>
      </header>
      <ul class="pf26__hazards">${hazards[stage].map(number => riskItem(model, number)).join('')}</ul>
    </section>`
}

export function renderSlide26(model, page) {
  if (page.renderer !== 's26-lifecycle')
    throw new Error(`Unsupported Source 26 renderer: ${page.renderer}`)

  return dataVisual('canonical-three-stage-lifecycle', `
    <div class="pf26">
      ${content(model, 's26.intro', { className: 'pilot-copy pf26__intro' })}
      <div class="pf26__lifecycle" data-meaning-visual>
        ${phase(model, 1)}
        ${phase(model, 2)}
        ${phase(model, 3)}
      </div>
      ${noteExcerpt(model, 's26.note', 'よく見ると、その多くは“足場・ループの設計”(この資料の主役)を軽視すると起きるものばかり。', 'pf26__framing')}
      ${content(model, 's26.takeaway', { tag: 'blockquote', className: 'pilot-copy pf26__takeaway' })}
    </div>`, 'pilot-visual--pf26')
}
