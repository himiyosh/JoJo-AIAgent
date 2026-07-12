import { content, contentList, dataVisual, noteExcerpt } from '../pilot-render-utils.mjs'

function eraMeta(model, era) {
  const prefix = `s13.era.${era}`
  return `<div class="pf13__era-meta">
    ${content(model, `${prefix}.label`, { className: 'pf13__era-label' })}
    ${content(model, `${prefix}.sub`, { className: 'pf13__era-period' })}
  </div>`
}

function eraPoints(model, era, className = '') {
  const count = era === 3 ? 5 : 4
  return contentList(model, Array.from({ length: count }, (_, index) => `s13.era.${era}.point.${index + 1}`), {
    className,
    itemClassName: 'pilot-copy',
    ordered: true,
  })
}

function eraInsight(model, era) {
  return `<aside class="pf13__insight">
    ${content(model, `s13.era.${era}.card.title`, { tag: 'h3', className: 'pf13__insight-title' })}
    ${content(model, `s13.era.${era}.card.body`, { className: 'pilot-copy pf13__insight-body' })}
    ${content(model, `s13.era.${era}.card.note`, { className: 'pilot-copy pf13__insight-note' })}
  </aside>`
}

function renderPrompt(model) {
  return `<div class="pf13 pf13--prompt">
    ${eraMeta(model, 1)}
    ${content(model, 's13.era.1.lead', { className: 'pilot-copy pf13__lead' })}
    <div class="pf13__editor" data-meaning-visual data-semantic-shape>
      <header><span>PROMPT.md</span><strong>どう伝えるかを設計</strong></header>
      ${eraPoints(model, 1, 'pf13__editor-lines')}
    </div>
    ${eraInsight(model, 1)}
  </div>`
}

function renderContext(model) {
  return `<div class="pf13 pf13--context">
    ${eraMeta(model, 2)}
    ${content(model, 's13.era.2.lead', { className: 'pilot-copy pf13__lead' })}
    <div class="pf13__context-window" data-meaning-visual data-semantic-shape>
      <header><strong>CONTEXT WINDOW</strong><span>容量は有限</span></header>
      ${eraPoints(model, 2, 'pf13__context-items')}
      <footer>情報・形式・タイミングを選んで入れる</footer>
    </div>
    ${eraInsight(model, 2)}
  </div>`
}

function renderHarness(model) {
  return `<div class="pf13 pf13--harness">
    ${eraMeta(model, 3)}
    ${content(model, 's13.era.3.lead', { className: 'pilot-copy pf13__lead' })}
    <div class="pf13__harness-shell" data-meaning-visual data-semantic-shape>
      <header>HARNESS · モデルを囲む足場</header>
      <div class="pf13__model-core"><span>MODEL</span><strong>考える</strong></div>
      ${eraPoints(model, 3, 'pf13__harness-modules')}
    </div>
    ${eraInsight(model, 3)}
  </div>`
}

function renderLoop(model) {
  return `<div class="pf13 pf13--loop">
    ${eraMeta(model, 4)}
    ${content(model, 's13.era.4.lead', { className: 'pilot-copy pf13__lead' })}
    <div class="pf13__loop-panel" data-meaning-visual data-semantic-shape>
      <div class="pf13__loop-core"><span>RUN</span><strong>続ける / 止める</strong></div>
      ${eraPoints(model, 4, 'pf13__loop-controls')}
    </div>
    ${eraInsight(model, 4)}
  </div>`
}

export function renderSlide13(model, page) {
  if (page.renderer === 's13-overview') {
    return dataVisual('canonical-evolution-nesting', `
      <div class="pf13 pf13--overview">
        ${content(model, 's13.eyebrow', { className: 'pf13__context' })}
        ${noteExcerpt(model, 's13.note', 'ポイントは、これらが古いものを捨てて新しくなったのではなく、実は“入れ子”の関係になっていること。', 'pf13__framing')}
        <div class="pf13__nest" data-meaning-visual data-semantic-shape>
          <div class="pf13__layer pf13__layer--loop">
            ${content(model, 's13.overview.4', { className: 'pilot-copy' })}
            <div class="pf13__layer pf13__layer--harness">
              ${content(model, 's13.overview.3', { className: 'pilot-copy' })}
              <div class="pf13__layer pf13__layer--context">
                ${content(model, 's13.overview.2', { className: 'pilot-copy' })}
                <div class="pf13__layer pf13__layer--prompt">
                  ${content(model, 's13.overview.1', { className: 'pilot-copy' })}
                </div>
              </div>
            </div>
          </div>
          <span class="pf13__nest-direction">設計対象が外側へ広がる</span>
        </div>
        ${content(model, 's13.takeaway', { tag: 'blockquote', className: 'pilot-copy pf13__takeaway' })}
      </div>`, 'pilot-visual--pf13')
  }

  const era = Number(page.renderer.match(/(\d+)$/)?.[1])
  const renderers = [renderPrompt, renderContext, renderHarness, renderLoop]
  return dataVisual(`canonical-evolution-era-${era}`, renderers[era - 1](model), `pilot-visual--pf13 pilot-visual--pf13-${era}`)
}
