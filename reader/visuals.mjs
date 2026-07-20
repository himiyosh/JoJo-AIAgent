export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;')
}

function text(value, maxLength = 64) {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim()
  const characters = [...normalized]
  return escapeHtml(characters.length > maxLength
    ? `${characters.slice(0, maxLength - 1).join('')}…`
    : normalized)
}

function first(values = [], fallback = '') {
  return values.find(Boolean) ?? fallback
}

function groupSummary(group, maxLength = 54) {
  return text(first(group?.items, group?.subtitle || group?.text || ''), maxLength)
}

function blockText(block) {
  if (!block)
    return ''
  if (block.type === 'list')
    return block.items?.[0] ?? ''
  if (block.type === 'table')
    return block.rows?.[0]?.filter(Boolean).join(' · ') ?? ''
  return block.text ?? ''
}

function tabSummary(tab, maxLength = 54) {
  return text(first(tab?.blocks?.map(blockText), ''), maxLength)
}

function icon(group, fallback = '◆') {
  return group?.icon
    ? `<span class="pv-icon" aria-hidden="true">${group.icon}</span>`
    : `<span class="pv-icon pv-icon--diamond" aria-hidden="true">${fallback}</span>`
}

function figure(slide, content, extraClass = '') {
  return `
    <figure
      class="portrait-visual pv pv--${escapeHtml(slide.recipe.type)} pv--${escapeHtml(slide.recipe.variant)} ${extraClass}"
      data-reader-visual
      data-reader-visual-kind="${escapeHtml(slide.recipe.variant)}"
      aria-describedby="reader-visual-caption-${slide.number}"
    >
      ${content}
      <figcaption class="reader-sr-only" id="reader-visual-caption-${slide.number}">
        Slide ${String(slide.number).padStart(2, '0')}「${escapeHtml(slide.title)}」の縦向け図解。詳しい説明は補足から確認できます。
      </figcaption>
    </figure>`
}

function renderCover(slide) {
  const data = slide.visualData
  return figure(slide, `
    <div class="pv-cover__orbit">${first(data.hero)}</div>
    <div class="pv-cover__brand">${first(data.brand)}</div>
    <p class="pv-cover__series">${text(first(data.series), 74)}</p>
    <p class="pv-cover__subtitle">${text(first(data.subtitle), 58)}</p>
  `)
}

function renderClosing(slide) {
  const data = slide.visualData
  return figure(slide, `
    <div class="pv-closing__halo" aria-hidden="true">
      <span></span><i></i><b></b>
    </div>
    <div class="pv-closing__brand">${first(data.brand)}</div>
    <p class="pv-closing__thanks">${text(first(data.thanks), 34)}</p>
    <p class="pv-closing__thesis">${text(first(data.thesis), 76)}</p>
    <p class="pv-closing__series">${text(first(data.series), 72)}</p>
  `)
}

function renderNotice(slide) {
  const rows = slide.visualData.rows ?? []
  return figure(slide, `
    <ol class="pv-path" aria-label="要点の流れ">
      ${rows.map((row, index) => `
        <li class="pv-path__stop" style="--pv-index:${index}">
          ${icon(row, String(index + 1))}
          <div>
            <h3>${text(row.title, 30)}</h3>
            <p>${groupSummary(row, 58)}</p>
          </div>
        </li>`).join('')}
    </ol>
    <div class="pv-path__destination" aria-hidden="true"><span></span></div>
  `)
}

function renderAgenda(slide) {
  const agenda = slide.visualData.agenda ?? []
  return figure(slide, `
    <ol class="pv-agenda">
      ${agenda.map((item, index) => `
        <li class="${index === agenda.length - 1 ? 'is-now' : ''}">
          <span class="pv-agenda__number">${String(index + 1).padStart(2, '0')}</span>
          <span class="pv-agenda__line" aria-hidden="true"></span>
          <span class="pv-agenda__copy">
            <b>${text(item.title, 32)}</b>
            <small>${text(item.subtitle, 38)}</small>
          </span>
        </li>`).join('')}
    </ol>
  `)
}

function renderChapter(slide) {
  const data = slide.visualData
  const chapterNumber = first(data.chapterNumber)?.dataNumber || String(slide.number).padStart(2, '0')
  return figure(slide, `
    <span class="pv-chapter__watermark" aria-hidden="true">${escapeHtml(chapterNumber)}</span>
    <span class="pv-chapter__diamond" aria-hidden="true"></span>
    <p class="pv-chapter__context">${text(first(data.context), 38)}</p>
    <p class="pv-chapter__lead">${text(first(data.lead), 86)}</p>
    <ol class="pv-chapter__route" aria-label="この章の流れ">
      ${(data.route ?? []).map((route, index) => `
        <li><span>${index + 1}</span><b>${text(route.title, 26)}</b></li>`).join('')}
    </ol>
  `)
}

function renderAssistantCompare(slide) {
  const data = slide.visualData
  const rows = data.rows ?? []
  return figure(slide, `
    <div class="pv-assistant__lane pv-assistant__lane--chat">
      ${icon(rows[0], '1')}
      <div><h3>${text(rows[0]?.title, 28)}</h3><p>${groupSummary(rows[0], 50)}</p></div>
    </div>
    <div class="pv-assistant__art">${first(data.art)}</div>
    <span class="pv-assistant__axis" aria-hidden="true">→</span>
    <div class="pv-assistant__lane pv-assistant__lane--agent">
      ${icon(rows[1], '2')}
      <div><h3>${text(rows[1]?.title, 28)}</h3><p>${groupSummary(rows[1], 50)}</p></div>
    </div>
  `)
}

function renderTraits(slide) {
  return figure(slide, `
    <div class="pv-orbit">
      <span class="pv-orbit__ring" aria-hidden="true"></span>
      <span class="pv-orbit__core"><i aria-hidden="true"></i><b>AI AGENT</b></span>
      ${slide.tabs.map((tab, index) => `
        <section class="pv-orbit__node ${index === slide.tabs.length - 1 ? 'is-now' : ''}" style="--pv-index:${index}">
          <span>${String(index + 1).padStart(2, '0')}</span>
          <h3>${text(tab.key || tab.label, 18)}${tab.tag ? `<small>${text(tab.tag, 18)}</small>` : ''}</h3>
          <p>${text(tab.sub || tabSummary(tab, 34), 34)}</p>
        </section>`).join('')}
    </div>
  `)
}

function renderEquation(slide) {
  const chips = slide.visualData.chips ?? []
  return figure(slide, `
    <div class="pv-equation">
      <ol>
        ${chips.map((chip, index) => `
          <li>
            ${icon(chip, String(index + 1))}
            <b>${text(chip.title, 34)}</b>
          </li>`).join('')}
      </ol>
      <span class="pv-equation__beam" aria-hidden="true"></span>
      <div class="pv-equation__result"><i aria-hidden="true"></i><b>AI AGENT</b></div>
    </div>
  `)
}

function renderLaunch(slide) {
  const chips = slide.visualData.chips ?? []
  return figure(slide, `
    <div class="pv-launch">
      <div class="pv-launch__trail" aria-hidden="true"></div>
      <div class="pv-launch__source">${text(first(slide.visualData.statement), 68)}</div>
      <ol>
        ${chips.map((chip, index) => `
          <li style="--pv-index:${index}">${icon(chip, String(index + 1))}<b>${text(chip.title, 34)}</b></li>`).join('')}
      </ol>
      <div class="pv-launch__destination" aria-hidden="true"><span></span></div>
    </div>
  `)
}

function renderAnatomy(slide) {
  const rows = slide.visualData.rows ?? []
  return figure(slide, `
    <div class="pv-anatomy">
      <span class="pv-anatomy__connector" aria-hidden="true"></span>
      ${rows.map((row, index) => `
        <section class="pv-anatomy__lobe pv-anatomy__lobe--${index + 1}">
          ${icon(row, String(index + 1))}
          <h3>${text(row.title, 32)}</h3>
          <p>${groupSummary(row, 54)}</p>
        </section>`).join('')}
      <div class="pv-anatomy__core"><i aria-hidden="true"></i><b>AGENT</b><small>MCP</small></div>
    </div>
  `)
}

function renderMcp(slide) {
  const data = slide.visualData
  const states = data.states ?? []
  return figure(slide, `
    <div class="pv-mcp__states" aria-label="REST APIとMCPの役割比較">
      ${states.map((state, index) => `
        <section class="${index ? 'is-mcp' : 'is-rest'}">
          <small>${text(state.subtitle, 32)}</small>
          <h3>${text(state.title, 42)}</h3>
          <p>${text((state.items ?? []).slice(0, 2).join(' ／ '), 78)}</p>
        </section>`).join('')}
    </div>
    <div class="pv-mcp__bridge"><b>MCP Server</b> の内側で <b>REST API</b> を使える</div>
  `)
}

function renderEvolution(slide) {
  return figure(slide, `
    <ol class="pv-timeline">
      ${slide.tabs.map((tab, index) => `
        <li class="${index === slide.tabs.length - 1 ? 'is-now' : ''}">
          <span class="pv-timeline__index">${String(index + 1).padStart(2, '0')}</span>
          <span class="pv-timeline__rail" aria-hidden="true"></span>
          <div>
            <h3>${text([tab.key, tab.tag].filter(Boolean).join(' '), 32)}</h3>
            <p>${text(tab.sub || tabSummary(tab, 48), 48)}</p>
          </div>
        </li>`).join('')}
    </ol>
  `)
}

function renderNested(slide) {
  const layers = slide.visualData.layers ?? []
  const renderLayer = index => index >= layers.length
    ? ''
    : `<div class="pv-nested__layer pv-nested__layer--${index + 1}">
        <span>${text(layers[index], 42)}</span>
        ${renderLayer(index + 1)}
      </div>`
  return figure(slide, `<div class="pv-nested">${renderLayer(0)}</div>`)
}

function renderQuotes(slide) {
  const posts = slide.visualData.posts ?? []
  return figure(slide, `
    <div class="pv-quotes">
      ${posts.map((post, index) => `
        <blockquote class="${index === 0 ? 'has-decoration' : ''}">
          <header>
            <span class="pv-quotes__avatar" aria-hidden="true">${text(post.name.split(/\s+/).map(part => part[0]).join(''), 3)}</span>
            <span><b>${text(post.name, 32)}</b><small>${text(post.handle, 24)}</small></span>
          </header>
          <p>${text(post.post, 168)}</p>
          <footer>${text(post.role || post.date, 48)}</footer>
          ${post.decoration ? `<div class="pv-quotes__decoration">${post.decoration}</div>` : ''}
        </blockquote>`).join('')}
    </div>
  `)
}

function renderAgentLoop(slide) {
  const data = slide.visualData
  const start = first(data.pills)?.title || first(data.pills)?.text
  const done = data.pills?.at(-1)?.title || data.pills?.at(-1)?.text
  return figure(slide, `
    <div class="pv-loop">
      <div class="pv-loop__terminal pv-loop__terminal--start">${text(start, 28)}</div>
      <ol>
        ${(data.nodes ?? []).map((node, index) => `
          <li>
            ${icon(node, String(index + 1))}
            <span><b>${text(node.title, 18)}</b><small>${text(node.subtitle, 18)}</small></span>
          </li>`).join('')}
      </ol>
      <div class="pv-loop__decision"><span>${text(first(data.decision), 20)}</span><b aria-hidden="true">?</b></div>
      <div class="pv-loop__terminal pv-loop__terminal--done">${text(done, 28)}</div>
      <div class="pv-loop__return" aria-hidden="true"><span>↺</span></div>
    </div>
  `)
}

function renderRubberduck(slide) {
  const data = slide.visualData
  const chips = data.chips ?? []
  return figure(slide, `
    <div class="pv-duck__bubble pv-duck__bubble--left">${text(chips[0]?.title, 26)}</div>
    <div class="pv-duck__art">${first(data.art)}</div>
    <div class="pv-duck__bubble pv-duck__bubble--right">${text(chips[1]?.title, 26)}</div>
    <div class="pv-duck__pattern">${text(chips[2]?.title, 30)}</div>
  `)
}

function renderSingleMulti(slide) {
  return figure(slide, `
    <div class="pv-split">
      <span class="pv-split__axis" aria-hidden="true"></span>
      ${slide.tabs.map((tab, index) => `
        <section class="pv-split__side pv-split__side--${index + 1}">
          <span class="pv-split__glyph" aria-hidden="true">${index === 0 ? '●' : '● ● ●'}</span>
          <h3>${text([tab.key, tab.tag].filter(Boolean).join(' '), 34)}</h3>
          <p>${text(tab.sub || tabSummary(tab, 54), 54)}</p>
        </section>`).join('')}
      <div class="pv-split__pivot" aria-hidden="true"><i></i></div>
    </div>
  `)
}

function renderDecision(slide) {
  const data = slide.visualData
  const rows = data.rows ?? []
  return figure(slide, `
    <div class="pv-decision">
      <div class="pv-decision__start"><span aria-hidden="true">◆</span><b>${text(first(data.principle), 66)}</b></div>
      <span class="pv-decision__stem" aria-hidden="true"></span>
      <div class="pv-decision__gate" aria-hidden="true">?</div>
      <div class="pv-decision__branches" aria-hidden="true"><span></span><span></span></div>
      <div class="pv-decision__outcomes">
        ${rows.map((row, index) => `
          <section class="${index === 0 ? 'is-split' : 'is-single'}">
            ${icon(row, index === 0 ? '↗' : '↓')}
            <h3>${text(row.title, 28)}</h3>
            <p>${groupSummary(row, 50)}</p>
          </section>`).join('')}
      </div>
    </div>
  `)
}

function renderPatterns(slide) {
  const patterns = slide.visualData.patterns ?? []
  return figure(slide, `
    <div class="pv-patterns">
      <span class="pv-patterns__spokes" aria-hidden="true"></span>
      <span class="pv-patterns__core"><i></i><b>ORCHESTRATE</b></span>
      ${patterns.map((pattern, index) => `
        <section class="pv-patterns__node" style="--pv-index:${index}">
          ${icon(pattern, String(index + 1))}
          <h3>${text(pattern.title, 26)}</h3>
          <p>${groupSummary(pattern, 38)}</p>
        </section>`).join('')}
    </div>
  `)
}

function renderScenario(slide) {
  const rows = slide.visualData.rows ?? []
  const single = rows[0]
  const split = rows[1]
  return figure(slide, `
    <div class="pv-scenario">
      <section class="pv-scenario__single">
        ${icon(single, '1')}
        <h3>${text(single?.title, 26)}</h3>
        <div>${(single?.items ?? []).slice(0, 3).map(item => `<span>${text(item, 18)}</span>`).join('')}</div>
      </section>
      <div class="pv-scenario__trigger"><span aria-hidden="true">↓</span><b>${text(first(slide.visualData.takeaway), 88)}</b></div>
      <section class="pv-scenario__split">
        <header>${icon(split, '2')}<h3>${text(split?.title, 26)}</h3></header>
        <div>${(split?.items ?? []).slice(0, 3).map(item => `<span>${text(item, 18)}</span>`).join('')}</div>
      </section>
    </div>
  `)
}

function renderControlLoop(slide) {
  const chips = slide.visualData.chips ?? []
  return figure(slide, `
    <div class="pv-control">
      <span class="pv-control__ring" aria-hidden="true"></span>
      <span class="pv-control__core"><i></i><b>測る → 直す</b></span>
      ${chips.map((chip, index) => `
        <section style="--pv-index:${index}">
          ${icon(chip, String(index + 1))}
          <h3>${text(chip.title, 34)}</h3>
        </section>`).join('')}
    </div>
  `)
}

function renderRisk(slide) {
  const stages = slide.visualData.stages ?? []
  return figure(slide, `
    <ol class="pv-risk">
      ${stages.map((stage, index) => `
        <li class="pv-risk__stage pv-risk__stage--${index + 1}">
          <span class="pv-risk__number">${String(index + 1).padStart(2, '0')}</span>
          <header><h3>${text(stage.title, 22)}</h3><small>${text(stage.subtitle, 32)}</small></header>
          <div class="pv-risk__items">
            ${stage.items.map(item => `<span>${text(item, 30)}</span>`).join('')}
          </div>
        </li>`).join('')}
    </ol>
  `)
}

function renderSummary(slide) {
  const steps = slide.visualData.steps ?? []
  return figure(slide, `
    <ol class="pv-summary">
      ${steps.map((step, index) => `
        <li class="${index === steps.length - 1 ? 'is-now' : ''}">
          <span>${String(index + 1).padStart(2, '0')}</span>
          <div><h3>${text(step.title, 24)}</h3><p>${text(step.subtitle || groupSummary(step), 30)}</p></div>
        </li>`).join('')}
    </ol>
    <div class="pv-summary__thesis">${text(first(slide.visualData.statement), 72)}</div>
  `)
}

function renderNextSteps(slide) {
  const rows = slide.visualData.rows ?? []
  const actions = rows[0]?.items ?? []
  const sources = rows[1]?.items ?? []
  return figure(slide, `
    <div class="pv-next">
      <ol class="pv-next__route">
        ${actions.slice(0, 3).map((item, index) => `<li><span>${index + 1}</span><b>${text(item, 40)}</b></li>`).join('')}
      </ol>
      <div class="pv-next__compass" aria-hidden="true"><i></i><b>N</b></div>
      <ul class="pv-next__sources">
        ${sources.slice(0, 3).map(item => `<li>${text(item, 38)}</li>`).join('')}
      </ul>
    </div>
  `)
}

function renderSources(slide) {
  const references = slide.visualData.references ?? []
  return figure(slide, `
    <ol class="pv-sources">
      ${references.map((reference, index) => `
        <li>
          <span class="pv-sources__rail" aria-hidden="true"></span>
          <span class="pv-sources__index">${String(index + 1).padStart(2, '0')}</span>
          <div>
            <h3>${text(reference.title, 38)}</h3>
            <p>${text(reference.items[0], 58)}</p>
            <small>${reference.items.length} SOURCES</small>
          </div>
        </li>`).join('')}
    </ol>
  `)
}

function renderGlossary(slide) {
  const terms = slide.visualData.terms ?? []
  const ids = ['prompt-engineering', 'context-engineering', 'harness', 'loop', 'mcp', 'agent']
  const coreTerms = ids.map(id => terms.find(term => term.id === id)).filter(Boolean)
  return figure(slide, `
    <div class="pv-terms">
      <span class="pv-terms__ring" aria-hidden="true"></span>
      <span class="pv-terms__core"><i></i><b>LOOP</b></span>
      ${coreTerms.map((term, index) => `
        <section style="--pv-index:${index}">
          <h3>${text(term.term, 28)}</h3>
          <small>${text(term.english, 24)}</small>
        </section>`).join('')}
      <p class="pv-terms__count">${terms.length} TERMS · SEARCHABLE</p>
    </div>
  `)
}

const renderers = {
  cover: renderCover,
  closing: renderClosing,
  disclaimer: renderNotice,
  goal: renderNotice,
  'next-steps': renderNextSteps,
  agenda: renderAgenda,
  chapter: renderChapter,
  assistant: renderAssistantCompare,
  traits: renderTraits,
  equation: renderEquation,
  launch: renderLaunch,
  anatomy: renderAnatomy,
  mcp: renderMcp,
  evolution: renderEvolution,
  nested: renderNested,
  xposts: renderQuotes,
  'agent-loop': renderAgentLoop,
  rubberduck: renderRubberduck,
  'single-multi': renderSingleMulti,
  'decision-picker': renderDecision,
  patterns: renderPatterns,
  support: renderScenario,
  'control-loop': renderControlLoop,
  risk: renderRisk,
  summary: renderSummary,
  references: renderSources,
  glossary: renderGlossary,
}

export function renderPortraitVisual(slide) {
  const renderer = renderers[slide.recipe.variant]
  if (!renderer)
    throw new Error(`Reader slide ${slide.number} has no renderer for portrait variant "${slide.recipe.variant}".`)
  const output = renderer(slide)
  if (!output.includes('data-reader-visual'))
    throw new Error(`Reader slide ${slide.number} renderer did not emit a meaningful visual root.`)
  return output
}

export function visibleTakeaway(slide) {
  const explicit = first(slide.visualData.takeaway)
  if (explicit)
    return text(explicit, 88)
  const statement = first(slide.visualData.statement)
  if (statement)
    return text(statement, 88)
  return ''
}
