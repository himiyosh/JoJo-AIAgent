import { content, dataVisual, item, noteExcerpt } from '../pilot-render-utils.mjs'

const ICONS = {
  split: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v5m0 0H6v5m6-5h6v5M6 13v5m12-5v5"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></svg>',
  single: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3"/><path d="M6 23v-3a6 6 0 0 1 12 0v3M8 18h8"/></svg>',
}

function groupedSignals(model, ids) {
  const groups = []
  for (const id of ids) {
    const value = item(model, id)
    const previous = groups.at(-1)
    if (!previous || previous.groupId !== value.groupId)
      groups.push({ groupId: value.groupId, ids: [id] })
    else
      previous.ids.push(id)
  }
  return `<ul class="pf23__signals">${groups.map(group => `
    <li class="pf23__signal-group">
      ${group.ids.map(id => content(model, id, { tag: 'span', className: 'pilot-copy pf23__signal' })).join('')}
    </li>`).join('')}
  </ul>`
}

export function renderSlide23(model) {
  return dataVisual('canonical-two-way-decision', `
    <div class="pf23">
      ${content(model, 's23.eyebrow', { className: 'pf23__context' })}
      ${content(model, 's23.principle', { tag: 'blockquote', className: 'pilot-copy pf23__principle' })}
      <div class="pf23__decision" data-meaning-visual>
        <section class="pf23__choice pf23__choice--single">
          <header class="pf23__choice-head">
            <span class="pf23__choice-icon" data-semantic-shape>${ICONS.single}</span>
            <div><span>単一</span>${content(model, 's23.row.single.title', { tag: 'h3', className: 'pf23__choice-title' })}</div>
          </header>
          ${groupedSignals(model, [
            's23.row.single.signal.1',
            's23.row.single.signal.2',
            's23.row.single.signal.3',
            's23.row.single.signal.4',
          ])}
        </section>
        <div class="pf23__decision-rule" data-semantic-shape><span>問題が出たら</span><strong>分ける</strong></div>
        <section class="pf23__choice pf23__choice--split">
          <header class="pf23__choice-head">
            <span class="pf23__choice-icon" data-semantic-shape>${ICONS.split}</span>
            <div><span>分ける</span>${content(model, 's23.row.split.title', { tag: 'h3', className: 'pf23__choice-title' })}</div>
          </header>
          ${groupedSignals(model, [
            's23.row.split.signal.1',
            's23.row.split.signal.2',
            's23.row.split.signal.3',
            's23.row.split.signal.4',
            's23.row.split.signal.5',
          ])}
        </section>
      </div>
      ${noteExcerpt(model, 's23.note', '迷ったら単一から、と覚えておけば大丈夫です。', 'pf23__note')}
    </div>`, 'pilot-visual--pf23')
}
