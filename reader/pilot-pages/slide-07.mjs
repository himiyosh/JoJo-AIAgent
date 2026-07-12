import { content, dataVisual } from '../pilot-render-utils.mjs'

const ICONS = [
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 2.2 5.8L20 10l-5.8 2.2L12 18l-2.2-5.8L4 10l5.8-2.2Z"/><circle cx="12" cy="10" r="2.4"/></svg>',
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M4 8h16M6 8l-3 5h6Zm12 0-3 5h6Z"/><path d="M7 21h10"/></svg>',
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 4.5 5 5-3 3-2-2-7.5 7.5-3-3 7.5-7.5-2-2Z"/><path d="m4 20 3.5-3.5"/></svg>',
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7a7 7 0 0 1 11 2l2-2v6h-6l2-2a4.5 4.5 0 0 0-8-1M17 17a7 7 0 0 1-11-2l-2 2v-6h6l-2 2a4.5 4.5 0 0 0 8 1"/></svg>',
]

function traitLabel(model, trait) {
  return `<div class="pf07__identity">
    <span class="pf07__icon" data-semantic-shape>${ICONS[trait - 1]}</span>
    ${content(model, `s07.trait.${trait}.label`, { className: 'pf07__trait-label' })}
  </div>`
}

function traitExample(model, trait) {
  return `<section class="pf07__example" aria-label="具体例" data-semantic-shape>
    ${content(model, `s07.trait.${trait}.card.title`, { tag: 'h3', className: 'pf07__example-title' })}
    ${content(model, `s07.trait.${trait}.card.body`, { className: 'pilot-copy pf07__example-body' })}
  </section>`
}

function renderAutonomy(model) {
  return `<div class="pf07 pf07--autonomy">
    ${traitLabel(model, 1)}
    ${content(model, 's07.trait.1.lead', { className: 'pilot-copy pf07__lead' })}
    <div class="pf07__autonomy-map" data-meaning-visual>
      ${content(model, 's07.trait.1.point.1', { className: 'pilot-copy pf07__autonomy-step' })}
      <span class="pf07__autonomy-connector" aria-hidden="true" data-semantic-shape></span>
      ${content(model, 's07.trait.1.point.2', { className: 'pilot-copy pf07__autonomy-step' })}
      <span class="pf07__autonomy-connector" aria-hidden="true" data-semantic-shape></span>
      <p class="pf07__derived" data-semantic-shape>ゴールを見失わず、状況に合わせて選び直す</p>
    </div>
    ${traitExample(model, 1)}
  </div>`
}

function renderGoalDriven(model) {
  return `<div class="pf07 pf07--goal">
    ${traitLabel(model, 2)}
    ${content(model, 's07.trait.2.lead', { className: 'pilot-copy pf07__lead' })}
    <div class="pf07__goal-board" data-meaning-visual>
      <div class="pf07__goal-routes">
        <div class="pf07__goal-route pf07__goal-route--a" data-semantic-shape>${content(model, 's07.trait.2.point.1', { className: 'pilot-copy' })}</div>
        <div class="pf07__goal-route pf07__goal-route--b" data-semantic-shape>${content(model, 's07.trait.2.point.2', { className: 'pilot-copy' })}</div>
      </div>
      <span class="pf07__goal-join" aria-hidden="true" data-semantic-shape></span>
      <div class="pf07__goal-center" data-semantic-shape>${ICONS[1]}<strong>同じゴール</strong></div>
    </div>
    ${traitExample(model, 2)}
  </div>`
}

function renderToolUse(model) {
  return `<div class="pf07 pf07--tools">
    ${traitLabel(model, 3)}
    ${content(model, 's07.trait.3.lead', { className: 'pilot-copy pf07__lead' })}
    <div class="pf07__tool-workbench" data-meaning-visual>
      <div class="pf07__tool-purpose" data-semantic-shape>
        <span class="pf07__tool-hero" data-semantic-shape>${ICONS[2]}</span>
        ${content(model, 's07.trait.3.point.1', { className: 'pilot-copy' })}
      </div>
      <section class="pf07__tool-belt" aria-label="利用できる道具の例">
        ${content(model, 's07.trait.3.card.title', { tag: 'h3', className: 'pf07__example-title' })}
        <ul class="pf07__tool-list">
          ${[1, 2, 3, 4, 5].map(number => content(model, `s07.trait.3.card.tool.${number}`, {
            tag: 'li',
            className: 'pf07__tool',
          })).join('')}
        </ul>
      </section>
      <div class="pf07__tool-effect" data-semantic-shape>
        ${content(model, 's07.trait.3.point.2', { className: 'pilot-copy' })}
      </div>
    </div>
  </div>`
}

function renderLoop(model) {
  return `<div class="pf07 pf07--loop">
    ${traitLabel(model, 4)}
    ${content(model, 's07.trait.4.lead', { className: 'pilot-copy pf07__lead' })}
    <div class="pf07__loop-composition" data-meaning-visual>
      ${content(model, 's07.trait.4.point.1', { className: 'pilot-copy pf07__loop-copy' })}
      <div class="pf07__cycle" data-semantic-shape>
        <svg viewBox="0 0 260 210" aria-hidden="true">
          <path d="M62 56c20-28 50-40 84-35 36 5 64 31 73 65M200 66l19 20-27 5M198 154c-22 28-53 39-87 32-34-7-60-32-69-64M61 142l-19-20 27-5"/>
        </svg>
        <span class="pf07__cycle-step pf07__cycle-step--one">試す</span>
        <span class="pf07__cycle-step pf07__cycle-step--two">観察</span>
        <span class="pf07__cycle-step pf07__cycle-step--three">直す</span>
        <span class="pf07__cycle-step pf07__cycle-step--four">再試行</span>
      </div>
      ${content(model, 's07.trait.4.point.2', { className: 'pilot-copy pf07__loop-copy pf07__loop-copy--after' })}
    </div>
    ${traitExample(model, 4)}
  </div>`
}

export function renderSlide07(model, page) {
  if (page.renderer === 's07-overview') {
    return dataVisual('canonical-four-trait-map', `
      <div class="pf07 pf07--overview">
        ${content(model, 's07.eyebrow', { className: 'pf07__context' })}
        <div class="pf07__trait-map" data-meaning-visual>
          <svg class="pf07__trait-links" viewBox="0 0 360 400" preserveAspectRatio="none" aria-hidden="true" data-semantic-shape>
            <path d="M180 200 90 70M180 200 270 70M180 200 90 330M180 200 270 330"/>
          </svg>
          <div class="pf07__trait-core" data-semantic-shape><strong>AI AGENT</strong><span>4つがそろう</span></div>
          <ol>
            ${[1, 2, 3, 4].map((number, index) => `
              <li class="pf07__quadrant pf07__quadrant--${number}">
                <span class="pf07__icon" data-semantic-shape>${ICONS[index]}</span>
                ${content(model, `s07.overview.${number}`, { className: 'pilot-copy pf07__overview-copy' })}
              </li>`).join('')}
          </ol>
        </div>
        ${content(model, 's07.takeaway', { tag: 'blockquote', className: 'pilot-copy pf07__takeaway' })}
      </div>`, 'pilot-visual--pf07')
  }

  const trait = Number(page.renderer.match(/(\d+)$/)?.[1])
  const renderers = [renderAutonomy, renderGoalDriven, renderToolUse, renderLoop]
  return dataVisual(`canonical-trait-${trait}`, renderers[trait - 1](model), `pilot-visual--pf07 pilot-visual--pf07-${trait}`)
}
