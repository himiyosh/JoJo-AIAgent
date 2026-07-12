import { createHash } from 'node:crypto'
import {
  PILOT_PAGE_PLAN,
  PILOT_SOURCE_COUNTS,
  PILOT_SOURCE_PAGE_COUNTS,
} from './pilot-page-plan.mjs'

const EXPECTED_INVENTORY_COUNT = 180

function normalizeText(value) {
  return String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim()
}

function requireText(value, label) {
  const text = normalizeText(value)
  if (!text)
    throw new Error(`Reader pilot inventory is missing ${label}.`)
  return text
}

function sourceSlide(slides, number) {
  const slide = slides.find(candidate => candidate.number === number)
  if (!slide)
    throw new Error(`Reader pilot cannot find canonical source slide ${number}.`)
  return slide
}

function blockStartingWith(slide, prefix) {
  const block = slide.blocks.find(candidate => normalizeText(candidate.text).startsWith(prefix))
  return requireText(block?.text, `slide ${slide.number} block "${prefix}"`)
}

function sourceValue(label, href) {
  return {
    text: requireText(label || href, 'source label'),
    href: requireText(href, 'source URL'),
  }
}

function createInventoryBuilder(sourceNumber) {
  const items = []
  const seen = new Set()

  function add(id, kind, role, value, options = {}) {
    if (seen.has(id))
      throw new Error(`Reader pilot inventory contains duplicate item ${id}.`)
    seen.add(id)
    const objectValue = typeof value === 'object' && value !== null ? value : { text: value }
    const text = requireText(objectValue.text, id)
    const href = objectValue.href ? requireText(objectValue.href, `${id} URL`) : ''
    const fingerprint = createHash('sha256')
      .update(JSON.stringify({ text: normalizeText(text), href }))
      .digest('hex')
    items.push({
      id,
      sourceSlide: sourceNumber,
      kind,
      role,
      importance: options.importance ?? 'core',
      text,
      href,
      segments: Array.isArray(objectValue.segments)
        ? objectValue.segments.map(segment => requireText(segment, `${id} segment`))
        : [],
      fingerprint,
      childCount: options.childCount ?? 1,
      groupId: options.groupId ?? '',
    })
  }

  return { add, items }
}

function buildSlide06(slide) {
  const { add, items } = createInventoryBuilder(6)
  const [llm, agent] = slide.visualData.rows
  if (!llm || !agent || llm.items.length !== 3 || agent.items.length !== 3)
    throw new Error('Reader pilot slide 06 expected two three-point comparison rows.')

  add('s06.title', 'heading', 'source-title', slide.title)
  for (const [key, row] of [['llm', llm], ['agent', agent]]) {
    add(`s06.row.${key}.title`, 'heading', 'comparison-side', row.title)
    add(`s06.row.${key}.tag`, 'label', 'comparison-definition', row.subtitle)
    row.items.forEach((text, index) => add(`s06.row.${key}.item.${index + 1}`, 'list-item', 'comparison-evidence', text))
  }
  add('s06.takeaway', 'takeaway', 'source-takeaway', slide.visualData.takeaway[0])
  add('s06.note', 'note', 'presenter-note', slide.note, { importance: 'supplement' })
  return items
}

function buildSlide07(slide) {
  const { add, items } = createInventoryBuilder(7)
  if (slide.tabs.length !== 4)
    throw new Error('Reader pilot slide 07 expected four complete RevealTabs states.')

  add('s07.title', 'heading', 'source-title', slide.title)
  add('s07.eyebrow', 'label', 'source-context', blockStartingWith(slide, 'WHAT MAKES AN AGENT'))
  add('s07.takeaway', 'takeaway', 'source-takeaway', slide.visualData.takeaway[0])
  slide.tabs.forEach((tab, index) => {
    const number = index + 1
    const full = tab.full
    if (!full || full.points.length !== 2 || !full.card)
      throw new Error(`Reader pilot slide 07 tab ${number} is incomplete.`)
    const labelSegments = [
      [tab.number, tab.key, tab.now ? 'いま' : '', tab.tag].filter(Boolean).join(' '),
      tab.sub,
    ].filter(Boolean)
    const label = labelSegments.join(' ')
    const structuredLabel = { text: label, segments: labelSegments }
    add(`s07.overview.${number}`, 'label', 'overview-trait', structuredLabel)
    add(`s07.trait.${number}.label`, 'label', 'trait-identity', structuredLabel)
    add(`s07.trait.${number}.head`, 'heading', 'trait-heading', full.head)
    add(`s07.trait.${number}.lead`, 'paragraph', 'trait-definition', full.lead)
    full.points.forEach((point, pointIndex) => add(`s07.trait.${number}.point.${pointIndex + 1}`, 'list-item', 'trait-evidence', point))
    add(`s07.trait.${number}.card.title`, 'heading', 'trait-example-heading', full.card.title)
    if (number === 3) {
      const tools = full.card.body.split(/\s*\/\s*/).map(normalizeText).filter(Boolean)
      if (tools.length !== 5)
        throw new Error(`Reader pilot slide 07 tool example expected five tools but found ${tools.length}.`)
      tools.forEach((tool, toolIndex) =>
        add(`s07.trait.3.card.tool.${toolIndex + 1}`, 'visual-label', 'trait-example-tool', tool, { groupId: 's07.trait.3.card.body' }))
    }
    else {
      add(`s07.trait.${number}.card.body`, 'paragraph', 'trait-example', full.card.body)
    }
  })
  slide.links.forEach((link, index) => add(`s07.source.${index + 1}`, 'source', 'source-link', sourceValue(link.label, link.href), { importance: 'supplement' }))
  add('s07.note', 'note', 'presenter-note', slide.note, { importance: 'supplement' })
  return items
}

function buildSlide13(slide) {
  const { add, items } = createInventoryBuilder(13)
  if (slide.tabs.length !== 4 || slide.links.length !== 12)
    throw new Error('Reader pilot slide 13 expected four RevealTabs states and twelve sources.')

  add('s13.title', 'heading', 'source-title', slide.title)
  add('s13.eyebrow', 'label', 'source-context', blockStartingWith(slide, 'THE EVOLUTION'))
  add('s13.takeaway', 'takeaway', 'source-takeaway', slide.visualData.takeaway[0])
  slide.tabs.forEach((tab, index) => {
    const number = index + 1
    const full = tab.full
    if (!full || !full.card || ![4, 5].includes(full.points.length))
      throw new Error(`Reader pilot slide 13 tab ${number} is incomplete.`)
    const label = [tab.number, tab.key, tab.now ? 'いま' : '', tab.tag].filter(Boolean).join(' ')
    add(`s13.overview.${number}`, 'label', 'overview-era', [label, tab.sub].filter(Boolean).join(' '))
    add(`s13.era.${number}.label`, 'label', 'era-identity', label)
    add(`s13.era.${number}.sub`, 'label', 'era-period', tab.sub)
    add(`s13.era.${number}.head`, 'heading', 'era-heading', full.head)
    add(`s13.era.${number}.lead`, 'paragraph', 'era-definition', full.lead)
    full.points.forEach((point, pointIndex) =>
      add(`s13.era.${number}.point.${pointIndex + 1}`, 'list-item', 'era-evidence', point))
    add(`s13.era.${number}.card.title`, 'heading', 'era-implication-heading', full.card.title)
    add(`s13.era.${number}.card.body`, 'callout', 'era-implication-body', full.card.body)
    add(`s13.era.${number}.card.note`, 'paragraph', 'era-implication-note', full.card.note)
  })
  const eraSources = slide.tabs.flatMap(tab => tab.sources)
  if (eraSources.length !== 12 || slide.tabs.some(tab => tab.sources.length !== 3))
    throw new Error('Reader pilot slide 13 lost the three-to-one source association for an evolution era.')
  eraSources.forEach((link, index) => add(`s13.source.${index + 1}`, 'source', 'source-link', sourceValue(link.label, link.href), { importance: 'supplement' }))
  add('s13.note', 'note', 'presenter-note', slide.note, { importance: 'supplement' })
  return items
}

function buildSlide16(slide) {
  const { add, items } = createInventoryBuilder(16)
  const posts = slide.visualData.posts
  if (posts.length !== 2 || !posts[0].decoration)
    throw new Error('Reader pilot slide 16 expected two posts and the OpenClaw decoration.')
  const decoration = posts[0].decoration.replace(
    /<span\b[^>]*class="[^"]*\bxp__pun\b[^"]*"[^>]*>[\s\S]*?<\/span>/i,
    '',
  )
  if (!decoration.includes('oclob') || decoration.includes('xp__pun'))
    throw new Error('Reader pilot slide 16 could not isolate the OpenClaw art from its separately tracked label.')

  add('s16.title', 'heading', 'source-title', slide.title)
  add('s16.eyebrow', 'label', 'source-context', blockStartingWith(slide, 'TREND'))
  posts.forEach((post, index) => {
    const number = index + 1
    const profile = slide.links.find(link => link.href.includes(post.handle.replace(/^@/, '')))
    add(`s16.post.${number}.author`, 'person', 'post-author', sourceValue(`${post.name} ${post.handle}`, profile?.href || `https://x.com/${post.handle.replace(/^@/, '')}`))
    add(`s16.post.${number}.meta`, 'label', 'post-role-date', [post.role, post.date].filter(Boolean).join(' · '))
    add(`s16.post.${number}.quote`, 'quote', 'post-original', post.post)
    add(`s16.post.${number}.translation`, 'translation', 'post-translation', post.translation)
  })
  add('s16.decoration', 'visual-label', 'openclaw-identity', '“OpenClaw” の主')
  add('s16.takeaway', 'takeaway', 'source-takeaway', slide.visualData.takeaway[0])
  const citations = slide.links.filter(link => !/^https:\/\/x\.com\/(?:steipete|bcherny)\/?$/i.test(link.href))
  if (citations.length !== 4)
    throw new Error(`Reader pilot slide 16 expected four citation links, found ${citations.length}.`)
  citations.forEach((link, index) => add(`s16.source.${index + 1}`, 'source', 'source-link', sourceValue(link.label, link.href), { importance: 'supplement' }))
  add('s16.note', 'note', 'presenter-note', slide.note, { importance: 'supplement' })
  return { items, assets: { decoration } }
}

function splitSignals(row, prefix, preserveLast = false) {
  return row.items.flatMap((value, index) => {
    const text = normalizeText(value)
    if (preserveLast && index === row.items.length - 1)
      return [{ text, groupId: `${prefix}.${index + 1}` }]
    return text.split(/\s*[／/]\s*/)
      .map(part => normalizeText(part))
      .filter(Boolean)
      .map(part => ({ text: part, groupId: `${prefix}.${index + 1}` }))
  })
}

function buildSlide21(slide) {
  const { add, items } = createInventoryBuilder(21)
  const [split, single] = slide.visualData.rows
  const splitItems = splitSignals(split, 'split', true)
  const singleItems = splitSignals(single, 'single')
  if (splitItems.length !== 5 || singleItems.length !== 4)
    throw new Error(`Reader pilot slide 21 expected 5/4 decision signals, found ${splitItems.length}/${singleItems.length}.`)

  add('s21.title', 'heading', 'source-title', slide.title)
  add('s21.eyebrow', 'label', 'source-context', blockStartingWith(slide, 'DECISION GUIDE'))
  add('s21.principle', 'quote', 'decision-principle', slide.visualData.principle[0])
  add('s21.row.split.title', 'heading', 'decision-branch', split.title)
  splitItems.forEach((signal, index) => add(`s21.row.split.signal.${index + 1}`, 'list-item', 'split-signal', signal.text, { groupId: signal.groupId }))
  add('s21.row.single.title', 'heading', 'decision-branch', single.title)
  singleItems.forEach((signal, index) => add(`s21.row.single.signal.${index + 1}`, 'list-item', 'single-signal', signal.text, { groupId: signal.groupId }))
  slide.links.forEach((link, index) => add(`s21.source.${index + 1}`, 'source', 'source-link', sourceValue(link.label, link.href), { importance: 'supplement' }))
  add('s21.note', 'note', 'presenter-note', slide.note, { importance: 'supplement' })
  return items
}

function buildSlide26(slide) {
  const { add, items } = createInventoryBuilder(26)
  const stages = slide.visualData.stages
  if (stages.length !== 3 || stages.reduce((sum, stage) => sum + stage.items.length, 0) !== 8)
    throw new Error('Reader pilot slide 26 expected three lifecycle stages and eight hazards.')

  add('s26.title', 'heading', 'source-title', slide.title)
  add('s26.intro', 'paragraph', 'risk-introduction', blockStartingWith(slide, 'よくある8項目'))
  let hazardNumber = 1
  stages.forEach((stage, index) => {
    const number = index + 1
    add(`s26.stage.${number}.title`, 'heading', 'risk-stage-title', stage.title)
    add(`s26.stage.${number}.subtitle`, 'label', 'risk-stage-subtitle', stage.subtitle)
    stage.items.forEach((_fallback, itemIndex) => {
      const detail = stage.itemDetails?.[itemIndex]
      if (!detail?.heading || !detail?.detail)
        throw new Error(`Reader pilot slide 26 risk ${hazardNumber} lost its heading/detail structure.`)
      add(`s26.hazard.${hazardNumber}.title`, 'heading', 'risk-hazard-title', detail.heading)
      add(`s26.hazard.${hazardNumber}.detail`, 'paragraph', 'risk-hazard-detail', detail.detail)
      hazardNumber += 1
    })
  })
  add('s26.takeaway', 'takeaway', 'source-takeaway', slide.visualData.takeaway[0])
  add('s26.note', 'note', 'presenter-note', slide.note, { importance: 'supplement' })
  return items
}

function validateCoverage(inventory, pages) {
  const itemById = new Map(inventory.map(item => [item.id, item]))
  const allocations = new Map()

  for (const page of pages) {
    if (!page.visibleItemIds.includes(page.titleItemId))
      throw new Error(`Reader pilot page ${page.id} does not allocate its title item visibly.`)
    const local = new Set()
    for (const [placement, itemIds] of [['visible', page.visibleItemIds], ['dialog', page.dialogItemIds]]) {
      for (const itemId of itemIds) {
        if (!itemById.has(itemId))
          throw new Error(`Reader pilot page ${page.id} references unknown item ${itemId}.`)
        if (local.has(itemId))
          throw new Error(`Reader pilot page ${page.id} allocates ${itemId} more than once.`)
        local.add(itemId)
        if (allocations.has(itemId))
          throw new Error(`Reader pilot item ${itemId} has multiple primary allocations.`)
        const item = itemById.get(itemId)
        if (placement === 'dialog' && item.importance === 'core')
          throw new Error(`Reader pilot core item ${itemId} is hidden in a dialog.`)
        allocations.set(itemId, { pageId: page.id, placement })
      }
    }
  }

  const unassigned = inventory.filter(item => !allocations.has(item.id))
  if (unassigned.length)
    throw new Error(`Reader pilot has unassigned inventory items: ${unassigned.map(item => item.id).join(', ')}`)
  if (inventory.length !== EXPECTED_INVENTORY_COUNT)
    throw new Error(`Reader pilot expected ${EXPECTED_INVENTORY_COUNT} inventory items, found ${inventory.length}.`)

  return allocations
}

export function buildPilotModel(slides) {
  const s06 = sourceSlide(slides, 6)
  const s07 = sourceSlide(slides, 7)
  const s13 = sourceSlide(slides, 13)
  const s16 = sourceSlide(slides, 16)
  const s21 = sourceSlide(slides, 21)
  const s26 = sourceSlide(slides, 26)
  const slide16 = buildSlide16(s16)
  const inventory = [
    ...buildSlide06(s06),
    ...buildSlide07(s07),
    ...buildSlide13(s13),
    ...slide16.items,
    ...buildSlide21(s21),
    ...buildSlide26(s26),
  ]
  const allocations = validateCoverage(inventory, PILOT_PAGE_PLAN)
  const sourceCounts = Object.fromEntries([...PILOT_SOURCE_COUNTS].map(([number, expected]) => {
    const actual = inventory.filter(item => item.sourceSlide === number).length
    if (actual !== expected)
      throw new Error(`Reader pilot slide ${number} expected ${expected} inventory items, found ${actual}.`)
    const pages = PILOT_PAGE_PLAN.filter(page => page.sourceSlide === number)
    const expectedPages = PILOT_SOURCE_PAGE_COUNTS.get(number)
    if (pages.length !== expectedPages || pages.some(page => page.sourcePageCount !== expectedPages))
      throw new Error(`Reader pilot slide ${number} expected ${expectedPages} v3 pages, found ${pages.length}.`)
    return [number, { expected, actual, pages: expectedPages }]
  }))
  const sourceByNumber = new Map([s06, s07, s13, s16, s21, s26].map(slide => [slide.number, slide]))
  const itemById = new Map(inventory.map(item => [item.id, item]))
  const pages = PILOT_PAGE_PLAN.map((page, index) => ({
    ...page,
    index,
    source: sourceByNumber.get(page.sourceSlide),
  }))
  const coverage = {
    version: 3,
    variant: 'full-height',
    source: 'slides.md',
    expectedInventory: EXPECTED_INVENTORY_COUNT,
    inventory: inventory.length,
    assigned: allocations.size,
    core: inventory.filter(item => item.importance === 'core').length,
    coreVisible: inventory.filter(item => item.importance === 'core' && allocations.get(item.id)?.placement === 'visible').length,
    pages: pages.length,
    sources: sourceCounts,
    truncation: {
      characterLimits: 0,
      ellipsisTransforms: 0,
      contentSlices: 0,
      lineClamps: 0,
    },
    allocations: inventory.map(item => ({
      itemId: item.id,
      sourceSlide: item.sourceSlide,
      importance: item.importance,
      fingerprint: item.fingerprint,
      ...allocations.get(item.id),
    })),
  }
  return {
    inventory,
    itemById,
    pages,
    coverage,
    assets: {
      slide06: { art: s06.visualData.art[0] },
      slide16: slide16.assets,
    },
  }
}
