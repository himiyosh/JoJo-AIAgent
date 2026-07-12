import { content, dataVisual } from '../pilot-render-utils.mjs'

function comparison(model, side, modifier) {
  return `<section class="pf06__side pf06__side--${modifier}">
    <header class="pf06__side-head">
      ${content(model, `s06.row.${side}.tag`, { className: 'pf06__tag' })}
      ${content(model, `s06.row.${side}.title`, { tag: 'h3', className: 'pf06__side-title' })}
    </header>
    <ul class="pf06__facts">
      ${[1, 2, 3].map(number => content(model, `s06.row.${side}.item.${number}`, {
        tag: 'li',
        className: 'pilot-copy',
      })).join('')}
    </ul>
  </section>`
}

export function renderSlide06(model) {
  const assistant = model.assets.slide06.art
  if (!assistant)
    throw new Error('Reader pilot Source 06 lost the canonical Assistant visual.')

  return dataVisual('canonical-chat-agent-comparison', `
    <div class="pf06">
      <div class="pf06__comparison" data-meaning-visual>
        <div class="pf06__hero" data-semantic-shape>
          <div class="pf06__mode pf06__mode--chat"><strong>一往復</strong><span>質問 → 回答</span></div>
          <div class="pf06__assistant" aria-hidden="true">${assistant}</div>
          <div class="pf06__mode pf06__mode--agent"><strong>完了まで</strong><span>目標 → 行動 → 確認</span></div>
        </div>
        <div class="pf06__columns">
          ${comparison(model, 'llm', 'chat')}
          ${comparison(model, 'agent', 'agent')}
        </div>
      </div>
      ${content(model, 's06.takeaway', { tag: 'blockquote', className: 'pilot-copy pf06__takeaway' })}
    </div>`, 'pilot-visual--pf06')
}
