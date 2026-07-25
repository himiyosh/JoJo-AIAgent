import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-chromium'
import { normalizeBase, startStaticServer } from './lib/static-server.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const PILOT_PAGE_COUNT = 15
const PILOT_INVENTORY_COUNT = 180
const PILOT_CORE_COUNT = 154
const SOURCE_PAGE_COUNTS = new Map([
  [6, 1],
  [7, 5],
  [13, 5],
  [16, 2],
  [23, 1],
  [28, 1],
])
function readArg(name, fallback) {
  const exact = args.indexOf(name)
  if (exact >= 0 && args[exact + 1])
    return args[exact + 1]
  const inline = args.find(arg => arg.startsWith(`${name}=`))
  return inline ? inline.substring(name.length + 1) : fallback
}

function assert(condition, message) {
  if (!condition)
    throw new Error(message)
}

function normalizeText(value) {
  return String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim()
}

function fingerprint(text, href = '') {
  return createHash('sha256')
    .update(JSON.stringify({ text: normalizeText(text), href }))
    .digest('hex')
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'))
}

async function validateGeneratedFiles(out, routerMode) {
  const pilotDir = path.join(out, 'reader-pilot')
  const [coverage, inventory, plan, html] = await Promise.all([
    readJson(path.join(pilotDir, 'coverage-report.json')),
    readJson(path.join(pilotDir, 'content-inventory.json')),
    readJson(path.join(pilotDir, 'page-plan.json')),
    fs.readFile(path.join(pilotDir, 'index.html'), 'utf8'),
  ])
  assert(coverage.source === 'slides.md', 'Reader pilot coverage is not tied to canonical slides.md.')
  assert(coverage.inventory === PILOT_INVENTORY_COUNT && coverage.assigned === PILOT_INVENTORY_COUNT, `Reader pilot coverage is ${coverage.assigned}/${coverage.inventory}, expected ${PILOT_INVENTORY_COUNT}/${PILOT_INVENTORY_COUNT}.`)
  assert(coverage.core === PILOT_CORE_COUNT && coverage.coreVisible === PILOT_CORE_COUNT, `Reader pilot core visible coverage is ${coverage.coreVisible}/${coverage.core}, expected ${PILOT_CORE_COUNT}/${PILOT_CORE_COUNT}.`)
  assert(coverage.version === 3 && coverage.variant === 'full-height', 'Reader pilot is not the approved full-height v3 variant.')
  assert(coverage.pages === PILOT_PAGE_COUNT && plan.length === PILOT_PAGE_COUNT, `Reader pilot does not contain exactly ${PILOT_PAGE_COUNT} v3 pages.`)
  assert(Object.values(coverage.truncation).every(value => value === 0), `Reader pilot reports a truncation path: ${JSON.stringify(coverage.truncation)}`)
  assert(inventory.length === PILOT_INVENTORY_COUNT && new Set(inventory.map(item => item.id)).size === PILOT_INVENTORY_COUNT, 'Reader pilot inventory IDs are incomplete or duplicated.')
  assert(inventory.every(item => item.childCount === 1), 'Reader pilot still collapses multiple canonical children into one coverage item.')
  const inventoryById = new Map(inventory.map(item => [item.id, item]))
  assert(new Set(plan.map(page => page.id)).size === PILOT_PAGE_COUNT, 'Reader pilot page IDs are duplicated.')
  assert(plan.every(page => !Object.hasOwn(page, 'text') && !Object.hasOwn(page, 'href')), 'Reader pilot page plan contains duplicated copy or URLs.')
  for (const [source, expected] of SOURCE_PAGE_COUNTS) {
    const sourcePages = plan.filter(page => page.sourceSlide === source)
    assert(sourcePages.length === expected, `Reader pilot source ${source} has ${sourcePages.length}/${expected} pages.`)
    assert(coverage.sources[source].actual === coverage.sources[source].expected, `Reader pilot source ${source} inventory is incomplete.`)
  }
  assert((html.match(/<article\s+class="pilot-page\b/g) ?? []).length === PILOT_PAGE_COUNT, 'Reader pilot initial HTML is missing pages.')
  assert((html.match(/data-reader-visual(?:\s|>)/g) ?? []).length === PILOT_PAGE_COUNT, 'Reader pilot initial HTML is missing meaningful visuals.')
  assert((html.match(/data-content-id=/g) ?? []).length === PILOT_INVENTORY_COUNT, 'Reader pilot initial HTML does not map every inventory item exactly once.')
  assert(html.includes('<title>AIエージェント、いま何が起きている? · Portrait Reader Pilot v3</title>'), 'Reader pilot document title is not derived from canonical metadata.')
  assert(html.includes('data-pilot-version="3"'), 'Reader pilot HTML does not identify the v3 composition.')
  assert(html.includes(`data-pilot-router-mode="${routerMode}"`), `Reader pilot does not record router mode ${routerMode}.`)
  assert(html.includes(routerMode === 'hash' ? 'href="../#/6"' : 'href="../6"'), `Reader pilot deck links do not support ${routerMode} routing.`)
  assert(!/(?:localhost|127\.0\.0\.1|\[?::1\]?)(?::\d+)?/i.test(html), 'Reader pilot HTML contains a loopback URL.')
  assert(!/<img\b/i.test(html), 'Reader pilot unexpectedly contains raster slide screenshots.')
  const expectedEraSources = [
    ['s13.source.1', 'platform.openai.com/docs/guides/prompt-engineering'],
    ['s13.source.4', 'anthropic.com/engineering/effective-context-engineering'],
    ['s13.source.7', 'anthropic.com/engineering/building-effective-agents'],
    ['s13.source.10', 'arxiv.org/abs/2210.03629'],
  ]
  for (const [id, expected] of expectedEraSources)
    assert(inventoryById.get(id)?.href.includes(expected), `Reader pilot assigned ${id} to the wrong evolution era.`)
  assert(inventory.filter(item => item.groupId === 's07.trait.3.card.body').length === 5, 'Reader pilot collapsed the five canonical tool examples.')
  assert(inventoryById.get('s13.era.2.lead')?.text.includes(' / '), 'Reader pilot collapsed an EvolutionMap <br> boundary.')
  assert(inventoryById.get('s07.overview.4')?.text.includes('いま'), 'Reader pilot dropped the current FourTraits marker.')
  assert(inventoryById.get('s13.overview.4')?.text.includes('いま'), 'Reader pilot dropped the current evolution-era marker.')
  assert(inventoryById.get('s16.post.1.meta')?.text === 'OpenClaw 開発者 · 2026-06-07', 'Reader pilot duplicated XPost role/date metadata.')
  assert(inventoryById.get('s16.decoration')?.text === '“OpenClaw” の主', 'Reader pilot changed the canonical OpenClaw visual label.')
  assert(!inventoryById.get('s16.post.1.translation')?.text.startsWith('翻訳'), 'Reader pilot duplicated the XPost translation label.')
  assert(!html.includes('class="xp__pun"'), 'Reader pilot duplicates the tracked OpenClaw label inside its visual asset.')
  assert(!inventory.some(item => item.kind === 'source' && item.text.includes('↗')), 'Reader pilot source labels contain a decorative citation glyph.')
  const page16OpenClaw = plan.find(page => page.id === 'slide-16-01')
  assert(page16OpenClaw?.dialogItemIds.includes('s16.source.4'), 'Reader pilot separated the OpenClaw visual from its provenance link.')
  assert(html.includes('class="pf06__assistant"') && html.includes('data-reader-visual-kind="canonical-chat-agent-comparison"'), 'Reader pilot Source 06 does not preserve the canonical Assistant comparison.')
  assert(html.includes('data-reader-visual-kind="canonical-four-trait-map"') && (html.match(/class="pf07__icon"/g) ?? []).length >= 8, 'Reader pilot Source 07 does not preserve the canonical four-trait icon system.')
  assert(html.includes('class="pf13__nest"') && html.includes('data-reader-visual-kind="canonical-evolution-nesting"'), 'Reader pilot Source 13 does not preserve the evolution and nesting relationship.')
  assert((html.match(/class="pf16__post pf16__post--/g) ?? []).length === 2 && html.includes('class="pf16__agreement"'), 'Reader pilot Source 16 does not show both canonical posts in one viewport.')
  assert(html.includes('class="pf23__choice pf23__choice--split"') && html.includes('class="pf23__choice pf23__choice--single"'), 'Reader pilot Source 23 does not preserve the two-way decision comparison.')
  assert([1, 2, 3].every(stage => html.includes(`class="pf28__phase pf28__phase--${stage}"`)), 'Reader pilot Source 28 does not preserve all three lifecycle stages in one viewport.')
  assert((html.match(/data-note-excerpt-for=/g) ?? []).length === 4, 'Reader pilot does not surface the four interpretation-critical presenter-note excerpts.')
  assert(plan.find(page => page.id === 'slide-06-01')?.legacyIds.includes('slide-06-02'), 'Reader pilot dropped the merged Source 06 deep-link alias.')
  assert(plan.find(page => page.id === 'slide-16-02')?.renderer === 's16-translations', 'Reader pilot does not preserve both Source 16 translations on their shared page.')
  assert(plan.find(page => page.id === 'slide-23-01')?.legacyIds.includes('slide-23-02'), 'Reader pilot dropped the merged Source 23 deep-link alias.')
  assert(['slide-28-02', 'slide-28-03'].every(id => plan.find(page => page.id === 'slide-28-01')?.legacyIds.includes(id)), 'Reader pilot dropped a merged Source 28 deep-link alias.')

  const sourceFiles = [
    'reader/content-model.mjs',
    'reader/pilot-page-plan.mjs',
    'reader/pilot-render-utils.mjs',
    'reader/pilot-template.mjs',
    'reader/pilot.css',
    'reader/pilot.js',
    'reader/pilot-pages/slide-06.mjs',
    'reader/pilot-pages/slide-07.mjs',
    'reader/pilot-pages/slide-13.mjs',
    'reader/pilot-pages/slide-16.mjs',
    'reader/pilot-pages/slide-23.mjs',
    'reader/pilot-pages/slide-28.mjs',
  ]
  for (const relative of sourceFiles) {
    const code = await fs.readFile(path.join(ROOT, relative), 'utf8')
    assert(!/(?:line-clamp|text-overflow\s*:\s*ellipsis|maxLength|\.slice\s*\()/i.test(code), `Reader pilot reintroduced truncation in ${relative}.`)
  }
  return { pilotDir, coverage, inventory, plan }
}

async function waitForPage(page, index) {
  await page.locator(`.pilot-pages[data-pilot-ready="true"][data-pilot-current="${index + 1}"][data-pilot-settled="${index + 1}"]`).waitFor()
}

function indexFor(plan, id) {
  const index = plan.findIndex(page => page.id === id)
  assert(index >= 0, `Reader pilot plan is missing ${id}.`)
  return index
}

async function validateViewport(browser, baseUrl, viewport, expectedHeight) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = []
  const layout = []
  page.on('console', (message) => {
    if (message.type() === 'error')
      errors.push(message.text())
  })
  await page.goto(`${baseUrl}reader-pilot/#slide-06-01`, { waitUntil: 'networkidle' })
  await waitForPage(page, 0)
  const allPages = page.locator('.pilot-page')
  assert(await allPages.count() === PILOT_PAGE_COUNT, `Reader pilot has ${await allPages.count()} pages at ${viewport.width}x${viewport.height}.`)
  for (let index = 0; index < PILOT_PAGE_COUNT; index += 1) {
    const target = allPages.nth(index)
    const id = await target.getAttribute('id')
    await page.evaluate(id => { location.hash = `#${id}` }, id)
    await waitForPage(page, index)
    const metrics = await target.evaluate((element) => {
      const stage = element.querySelector('[data-pilot-stage]')
      const visual = element.querySelector('[data-reader-visual]')
      const figure = visual?.getBoundingClientRect()
      const title = element.querySelector('.pilot-page__title')
      const bodySizes = [...element.querySelectorAll('[data-content-kind]')]
        .filter(item => ['paragraph', 'list-item', 'quote', 'translation', 'takeaway', 'callout'].includes(item.dataset.contentKind))
        .map(item => Number.parseFloat(getComputedStyle(item).fontSize))
      const labelSizes = [...element.querySelectorAll('[data-content-kind]')]
        .filter(item => ['label', 'visual-label', 'person'].includes(item.dataset.contentKind) && !item.closest('dialog'))
        .map(item => Number.parseFloat(getComputedStyle(item).fontSize))
      const controls = [...element.querySelectorAll('.pilot-page__controls > *')].map(control => control.getBoundingClientRect())
      const stageRect = stage.getBoundingClientRect()
      const titleRect = title.getBoundingClientRect()
      const isVisible = (node) => {
        if (node.closest('dialog'))
          return false
        const style = getComputedStyle(node)
        const rect = node.getBoundingClientRect()
        return style.display !== 'none'
          && style.visibility !== 'hidden'
          && Number.parseFloat(style.opacity || '1') > 0.01
          && rect.width > 1
          && rect.height > 1
      }
      const visibleRects = selector => [...element.querySelectorAll(selector)]
        .filter(isVisible)
        .map((node) => {
          const rect = node.getBoundingClientRect()
          return {
            top: Math.max(stageRect.top, rect.top),
            bottom: Math.min(stageRect.bottom, rect.bottom),
          }
        })
        .filter(rect => rect.bottom > rect.top)
      const bounds = (rects) => {
        if (!rects.length)
          return { top: stageRect.top, bottom: stageRect.top, height: 0 }
        const top = Math.min(...rects.map(rect => rect.top))
        const bottom = Math.max(...rects.map(rect => rect.bottom))
        return { top, bottom, height: bottom - top }
      }
      const meaningRects = visibleRects('.pilot-page__title, [data-content-id], [data-meaning-visual]')
      const visualRects = visibleRects('[data-meaning-visual]')
      const semanticRects = visibleRects('[data-content-id], [data-semantic-shape]')
      const contentBounds = bounds(meaningRects)
      const visualBounds = bounds(visualRects)
      const largestBlankBand = (rects) => {
        const intervals = rects
        .map(rect => [rect.top, rect.bottom])
        .sort((left, right) => left[0] - right[0])
        const merged = []
        for (const interval of intervals) {
          const previous = merged.at(-1)
          if (!previous || interval[0] > previous[1])
            merged.push([...interval])
          else
            previous[1] = Math.max(previous[1], interval[1])
        }
        let largestGap = merged.length ? Math.max(0, merged[0][0] - stageRect.top) : stageRect.height
        for (let cursor = 1; cursor < merged.length; cursor += 1)
          largestGap = Math.max(largestGap, merged[cursor][0] - merged[cursor - 1][1])
        if (merged.length)
          largestGap = Math.max(largestGap, stageRect.bottom - merged.at(-1)[1])
        return largestGap
      }
      const largestGap = largestBlankBand(meaningRects)
      const semanticLargestGap = largestBlankBand(semanticRects)
      const topWhitespace = Math.max(0, contentBounds.top - stageRect.top)
      const bottomWhitespace = Math.max(0, stageRect.bottom - contentBounds.bottom)
      const firstMeaningTop = semanticRects
        .filter(rect => rect.top >= titleRect.bottom - 1)
        .reduce((top, rect) => Math.min(top, rect.top), stageRect.bottom)
      const lineMetrics = [...element.querySelectorAll('[data-content-id]')]
        .filter(isVisible)
        .map((node) => {
          const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
          const boxes = []
          while (walker.nextNode()) {
            const textNode = walker.currentNode
            if (!textNode.textContent.trim())
              continue
            const range = document.createRange()
            range.selectNodeContents(textNode)
            boxes.push(...[...range.getClientRects()].filter(rect => rect.width > 1 && rect.height > 1))
          }
          boxes.sort((left, right) => left.top - right.top || left.left - right.left)
          const lines = []
          for (const box of boxes) {
            const line = lines.find(candidate => Math.abs(candidate.top - box.top) <= 2)
            if (line)
              line.width += box.width
            else
              lines.push({ top: box.top, width: box.width })
          }
          const widest = lines.length ? Math.max(...lines.map(line => line.width)) : 0
          return {
            id: node.dataset.contentId,
            kind: node.dataset.contentKind,
            lines: lines.length,
            lastLineRatio: lines.length > 1 && widest ? lines.at(-1).width / widest : 1,
            textLength: node.textContent.trim().length,
          }
        })
      const textBoxEntries = [...element.querySelectorAll('[data-content-id]')]
        .filter(node => !node.closest('dialog') && isVisible(node))
        .map((node) => {
          const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
          const boxes = []
          while (walker.nextNode()) {
            const textNode = walker.currentNode
            if (!textNode.textContent.trim())
              continue
            const range = document.createRange()
            range.selectNodeContents(textNode)
            boxes.push(...[...range.getClientRects()].filter(rect => rect.width > 1 && rect.height > 1))
          }
          return { node, id: node.dataset.contentId, boxes }
        })
      const contentOverlaps = []
      for (let left = 0; left < textBoxEntries.length; left += 1) {
        for (let right = left + 1; right < textBoxEntries.length; right += 1) {
          const a = textBoxEntries[left]
          const b = textBoxEntries[right]
          const overlaps = a.boxes.some(aBox => b.boxes.some((bBox) => {
            const width = Math.min(aBox.right, bBox.right) - Math.max(aBox.left, bBox.left)
            const height = Math.min(aBox.bottom, bBox.bottom) - Math.max(aBox.top, bBox.top)
            return width > 2 && height > 2
          }))
          if (overlaps)
            contentOverlaps.push(`${a.id}/${b.id}`)
        }
      }
      const clippedContent = []
      for (const entry of textBoxEntries) {
        const clipped = entry.boxes.some((box) => {
          let ancestor = entry.node
          while (ancestor && ancestor !== element) {
            const style = getComputedStyle(ancestor)
            const clipsX = style.overflowX === 'hidden' || style.overflowX === 'clip'
            const clipsY = style.overflowY === 'hidden' || style.overflowY === 'clip'
            if (clipsX || clipsY) {
              const rect = ancestor.getBoundingClientRect()
              if ((clipsX && (box.left < rect.left - 1 || box.right > rect.right + 1))
                || (clipsY && (box.top < rect.top - 1 || box.bottom > rect.bottom + 1)))
                return true
            }
            ancestor = ancestor.parentElement
          }
          return false
        })
        if (clipped)
          clippedContent.push(entry.id)
      }
      const structuralLines = lineMetrics
        .filter(metric => ['label', 'list-item', 'visual-label', 'person'].includes(metric.kind))
        .map(metric => metric.lines)
      const orphanedLines = lineMetrics.filter(metric =>
        metric.lines > 1
        && metric.textLength >= 12
        && metric.lastLineRatio < 0.12,
      )
      const repeatedSeparators = [...element.querySelectorAll('[data-content-id]')]
        .filter(isVisible)
        .filter((node) => {
          const style = getComputedStyle(node)
          return Number.parseFloat(style.borderTopWidth) > 0 || Number.parseFloat(style.borderBottomWidth) > 0
        })
        .map(node => node.dataset.contentId ?? node.className)
      const p13ListSlack = [...element.querySelectorAll('.pf13__editor-lines li, .pf13__context-items li, .pf13__harness-modules li, .pf13__loop-controls li')]
        .filter(isVisible)
        .map((node) => {
          const rect = node.getBoundingClientRect()
          const range = document.createRange()
          range.selectNodeContents(node)
          const textRects = [...range.getClientRects()].filter(item => item.width > 1 && item.height > 1)
          if (!textRects.length)
            return 0
          return Math.max(0, rect.height - (Math.max(...textRects.map(item => item.bottom)) - Math.min(...textRects.map(item => item.top))))
        })
      const splitBranch = element.querySelector('.pf23__choice--split')?.getBoundingClientRect()
      const singleBranch = element.querySelector('.pf23__choice--single')?.getBoundingClientRect()
      return {
        id: element.id,
        height: element.getBoundingClientRect().height,
        internalOverflow: element.scrollHeight - element.clientHeight,
        stageOverflow: stage.scrollHeight - stage.clientHeight,
        snapAlign: getComputedStyle(element).scrollSnapAlign,
        snapStop: getComputedStyle(element).scrollSnapStop,
        titleSize: Number.parseFloat(getComputedStyle(title).fontSize),
        bodySize: bodySizes.length ? Math.min(...bodySizes) : 16,
        labelSize: labelSizes.length ? Math.min(...labelSizes) : 13,
        visual: figure ? { width: figure.width, height: figure.height } : null,
        visualKind: visual?.dataset.readerVisualKind ?? '',
        meaningful: visualRects.length,
        contentHeightRatio: contentBounds.height / stageRect.height,
        visualHeightRatio: visualBounds.height / stageRect.height,
        topWhitespaceRatio: topWhitespace / stageRect.height,
        bottomWhitespaceRatio: bottomWhitespace / stageRect.height,
        bottomEdgeRatio: (contentBounds.bottom - stageRect.top) / stageRect.height,
        blankBandRatio: largestGap / stageRect.height,
        semanticBlankBandRatio: semanticLargestGap / stageRect.height,
        centered: Math.abs(topWhitespace - bottomWhitespace) / stageRect.height <= 0.1,
        titleTopGap: titleRect.top - stageRect.top,
        titleContentGap: firstMeaningTop - titleRect.bottom,
        titleOutlineStyle: getComputedStyle(title).outlineStyle,
        content: element.querySelectorAll('[data-content-id]').length,
        fallback: element.closest('.pilot-pages')?.dataset.pilotOverflowSafe ?? '',
        controls: controls.map(rect => ({ width: rect.width, height: rect.height })),
        maxContentLines: lineMetrics.length ? Math.max(...lineMetrics.map(metric => metric.lines)) : 0,
        maxStructuralLines: structuralLines.length ? Math.max(...structuralLines) : 0,
        orphanedLines,
        repeatedSeparators,
        contentOverlaps,
        clippedContent: [...new Set(clippedContent)],
        p13ListSlack: p13ListSlack.length ? Math.max(...p13ListSlack) : 0,
        p23BranchGap: splitBranch && singleBranch
          ? Math.max(splitBranch.top, singleBranch.top) - Math.min(splitBranch.bottom, singleBranch.bottom)
          : 0,
      }

    })
    assert(Math.abs(metrics.height - expectedHeight) <= 1, `${metrics.id} is ${metrics.height}px, expected ${expectedHeight}px.`)
    assert(metrics.internalOverflow <= 1 && metrics.stageOverflow <= 1, `${metrics.id} overflows (${metrics.internalOverflow}px page, ${metrics.stageOverflow}px stage) at ${viewport.width}x${viewport.height}.`)
    assert(metrics.snapAlign === 'start' && metrics.snapStop === 'always', `${metrics.id} is missing mandatory page snap behavior.`)
    assert(metrics.titleSize >= 30 && metrics.titleSize <= 34.5, `${metrics.id} h2 is ${metrics.titleSize}px, outside 30–34px.`)
    assert(metrics.bodySize >= 16, `${metrics.id} body copy is ${metrics.bodySize}px, below 16px.`)
    assert(metrics.labelSize >= 13, `${metrics.id} visible label is ${metrics.labelSize}px, below 13px.`)
    assert(metrics.visual && metrics.visual.width >= Math.min(300, viewport.width - 40) && metrics.visual.height >= 180, `${metrics.id} visual is too small.`)
    assert(metrics.visualKind && metrics.meaningful >= 1, `${metrics.id} lacks a semantic visual structure.`)
    assert(metrics.visualHeightRatio >= 0.35, `${metrics.id} meaningful visual uses only ${(metrics.visualHeightRatio * 100).toFixed(1)}% of stage height.`)
    assert(metrics.contentHeightRatio >= 0.7 || metrics.centered, `${metrics.id} uses only ${(metrics.contentHeightRatio * 100).toFixed(1)}% of stage height without balanced centering.`)
    assert(metrics.bottomEdgeRatio >= 0.85 || metrics.centered, `${metrics.id} content ends at ${(metrics.bottomEdgeRatio * 100).toFixed(1)}% of stage height.`)
    assert(metrics.blankBandRatio <= 0.25, `${metrics.id} has a ${(metrics.blankBandRatio * 100).toFixed(1)}% continuous blank band.`)
    assert(metrics.semanticBlankBandRatio <= 0.18, `${metrics.id} has a ${(metrics.semanticBlankBandRatio * 100).toFixed(1)}% blank band between real text/visual anchors.`)
    assert(metrics.titleTopGap >= (viewport.height <= 720 ? 10 : 17), `${metrics.id} leaves only ${metrics.titleTopGap.toFixed(1)}px above its title.`)
    assert(metrics.titleContentGap >= (viewport.height <= 720 ? 10 : 18) && metrics.titleContentGap <= 64, `${metrics.id} title-to-content gap is ${metrics.titleContentGap.toFixed(1)}px.`)
    assert(metrics.titleOutlineStyle === 'none', `${metrics.id} programmatic heading focus renders a box outline.`)
    assert(!metrics.fallback, `${metrics.id} enabled the overflow fallback at a normal viewport.`)
    assert(metrics.controls.every(control => control.width >= 44 && control.height >= 44), `${metrics.id} has a control below 44px.`)
    assert(metrics.maxContentLines <= 4, `${metrics.id} has visible copy spanning ${metrics.maxContentLines} lines.`)
    assert(metrics.maxStructuralLines <= 3, `${metrics.id} has structural copy spanning ${metrics.maxStructuralLines} lines.`)
    assert(metrics.orphanedLines.length === 0, `${metrics.id} has orphaned final lines: ${metrics.orphanedLines.map(item => item.id).join(', ')}.`)
    assert(metrics.repeatedSeparators.length === 0, `${metrics.id} repeats list separators: ${metrics.repeatedSeparators.join(', ')}.`)
    assert(metrics.contentOverlaps.length === 0, `${metrics.id} overlaps visible text: ${metrics.contentOverlaps.join(', ')}.`)
    assert(metrics.clippedContent.length === 0, `${metrics.id} clips visible text: ${metrics.clippedContent.join(', ')}.`)
    assert(metrics.p13ListSlack <= 18, `${metrics.id} stretches a Source 13 list row by ${metrics.p13ListSlack.toFixed(1)}px beyond its text.`)
    assert(metrics.p23BranchGap <= 180, `${metrics.id} stretches its decision axis to ${metrics.p23BranchGap.toFixed(1)}px.`)
    layout.push(metrics)
  }
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  assert(horizontalOverflow <= 1, `Reader pilot has ${horizontalOverflow}px horizontal overflow at ${viewport.width}x${viewport.height}.`)
  assert(errors.length === 0, `Reader pilot console errors at ${viewport.width}x${viewport.height}: ${errors.join(' | ')}`)
  await context.close()
  return layout
}

async function validateLowHeightFallback(browser, baseUrl, plan) {
  const context = await browser.newContext({ viewport: { width: 360, height: 640 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto(`${baseUrl}reader-pilot/#slide-16-01`, { waitUntil: 'networkidle' })
  await waitForPage(page, indexFor(plan, 'slide-16-01'))
  await page.locator('.pilot-pages[data-pilot-overflow-safe="true"]').waitFor()
  await page.waitForFunction(() => [...document.querySelectorAll('[data-pilot-stage]')].every(stage =>
    stage.scrollHeight - stage.clientHeight <= 1 || stage.getAttribute('tabindex') === '0',
  ))
  const inaccessible = await page.locator('[data-pilot-stage]').evaluateAll(stages => stages
    .filter(stage => stage.scrollHeight - stage.clientHeight > 1 && stage.tabIndex !== 0)
    .map(stage => stage.closest('.pilot-page')?.id))
  assert(inaccessible.length === 0, `Reader pilot low-height overflow stages are not keyboard reachable: ${inaccessible.join(', ')}`)
  const result = await page.locator('#slide-16-01 [data-pilot-stage]').evaluate((stage) => {
    stage.scrollTop = stage.scrollHeight
    return {
      overflow: stage.scrollHeight - stage.clientHeight,
      overflowY: getComputedStyle(stage).overflowY,
      canReachEnd: Math.abs(stage.scrollTop + stage.clientHeight - stage.scrollHeight) <= 1,
    }
  })
  assert(result.overflow > 1 && result.overflowY === 'auto' && result.canReachEnd, `Reader pilot low-height fallback hides content: ${JSON.stringify(result)}`)
  await context.close()
}

async function validateRenderedCoverage(page, inventory) {
  const rendered = await page.locator('[data-content-id]').evaluateAll(elements => elements.map((element) => ({
    id: element.dataset.contentId,
    fingerprint: element.dataset.contentFingerprint,
    importance: element.dataset.contentImportance,
    text: element.textContent,
    href: element instanceof HTMLAnchorElement
      ? element.href
      : element.querySelector(':scope > a[href]')?.href ?? '',
    inDialog: Boolean(element.closest('dialog')),
  })))
  assert(rendered.length === PILOT_INVENTORY_COUNT, `Reader pilot rendered ${rendered.length}/${PILOT_INVENTORY_COUNT} inventory items.`)
  const renderedById = new Map(rendered.map(entry => [entry.id, entry]))
  assert(renderedById.size === PILOT_INVENTORY_COUNT, 'Reader pilot rendered duplicate content IDs.')
  for (const source of inventory) {
    const target = renderedById.get(source.id)
    assert(target, `Reader pilot did not render ${source.id}.`)
    const href = source.href ? new URL(source.href).href : ''
    assert(target.fingerprint === source.fingerprint, `Reader pilot fingerprint attribute changed for ${source.id}.`)
    assert(fingerprint(target.text, href) === source.fingerprint, `Reader pilot mutated visible text or URL for ${source.id}.`)
    assert(source.importance !== 'core' || !target.inDialog, `Reader pilot core item ${source.id} is dialog-only.`)
  }

}

async function validatePendingDialogHistoryRace(browser, baseUrl, plan) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.goto(`${baseUrl}reader-pilot/#slide-13-05`, { waitUntil: 'networkidle' })
  await waitForPage(page, indexFor(plan, 'slide-13-05'))
  await page.locator('#slide-13-05 [data-pilot-search]').click()
  await page.locator('[data-pilot-search-input]').fill('迷ったら単一から')
  const result = page.locator('[data-pilot-search-results] a')
  assert(await result.count() === 1 && await result.getAttribute('data-pilot-open-dialog') === 'pilot-dialog-slide-23-01', 'Reader pilot race fixture did not resolve the note dialog result.')
  await result.click()
  await page.goBack()
  await waitForPage(page, indexFor(plan, 'slide-13-05'))
  await page.waitForTimeout(1300)
  assert(page.url().endsWith('#slide-13-05'), 'Reader pilot Back lost the original page during pending dialog navigation.')
  assert(await page.locator('.pilot-dialog[open]').count() === 0, 'Reader pilot Back opened a stale dialog from another page.')
  await context.close()

  const stackingContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const stackingPage = await stackingContext.newPage()
  await stackingPage.goto(`${baseUrl}reader-pilot/#slide-13-05`, { waitUntil: 'networkidle' })
  await waitForPage(stackingPage, indexFor(plan, 'slide-13-05'))
  await stackingPage.locator('#slide-13-05 [data-pilot-search]').click()
  await stackingPage.locator('[data-pilot-search-input]').fill('迷ったら単一から')
  await stackingPage.evaluate(() => {
    document.querySelector('[data-pilot-search-results] a')?.click()
    document.querySelector('#slide-13-05 [data-pilot-contents]')?.click()
  })
  await stackingPage.waitForTimeout(1300)
  await waitForPage(stackingPage, indexFor(plan, 'slide-23-01'))
  assert(await stackingPage.locator('.pilot-dialog[open]').count() === 1, 'Reader pilot stacked a pending detail dialog over another modal.')
  assert(await stackingPage.locator('#pilot-contents-dialog[open]').count() === 1, 'Reader pilot did not preserve the newer dialog after cancelling a pending open.')
  assert(await stackingPage.locator('.pilot-pages').evaluate(element => element.classList.contains('pilot-pages--dialog-open')), 'Reader pilot stale close event removed the active dialog scroll lock.')
  await stackingPage.keyboard.press('Escape')
  assert(await stackingPage.locator('#slide-23-01 .pilot-page__title').evaluate(element => element === document.activeElement), 'Reader pilot returned focus to an off-screen dialog opener.')
  await stackingContext.close()
}

async function validateInteractions(browser, server, inventory, plan) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const malformedPage = await context.newPage()
  const malformedErrors = []
  malformedPage.on('pageerror', error => malformedErrors.push(error.message))
  await malformedPage.goto(`${server.baseUrl}reader-pilot/#%`, { waitUntil: 'networkidle' })
  await waitForPage(malformedPage, 0)
  assert(malformedErrors.length === 0, `Reader pilot malformed hash stopped initialization: ${malformedErrors.join(' | ')}`)
  await malformedPage.close()

  const legacyPage = await context.newPage()
  await legacyPage.goto(`${server.baseUrl}reader-pilot/#slide-23-02`, { waitUntil: 'networkidle' })
  await waitForPage(legacyPage, indexFor(plan, 'slide-23-01'))
  assert(legacyPage.url().endsWith('#slide-23-01'), 'Reader pilot did not canonicalize a merged v2 deep link.')
  await legacyPage.close()

  const page = await context.newPage()
  const response = await page.goto(`${server.baseUrl}reader-pilot/#slide-13-05`, { waitUntil: 'networkidle' })
  assert(response?.status() === 200, 'Reader pilot deep reload did not return 200.')
  await waitForPage(page, indexFor(plan, 'slide-13-05'))
  assert(page.url().endsWith('#slide-13-05'), 'Reader pilot deep link changed its hash during initialization.')
  assert(await page.locator('#slide-13-05').evaluate(element => Math.abs(element.getBoundingClientRect().top - element.closest('.pilot-pages').getBoundingClientRect().top)) <= 1, 'Reader pilot deep link did not land instantly.')
  assert(await page.evaluate(() => document.activeElement === document.body), 'Reader pilot initial deep link caused an unsolicited focus jump.')
  await validateRenderedCoverage(page, inventory)

  const currentReader = await fetch(`${server.baseUrl}reader-legacy/`)
  const currentReaderHtml = await currentReader.text()
  assert(currentReader.ok && (currentReaderHtml.match(/<article\s+class="reader-page\b/g) ?? []).length === 33, 'Comparison Reader was not preserved.')
  assert((await fetch(`${server.baseUrl}reader-pilot/pilot.css`)).ok && (await fetch(`${server.baseUrl}reader-pilot/pilot.js`)).ok, 'Reader pilot assets do not resolve through the configured base.')

  await page.locator('#slide-13-05 [data-pilot-contents]').click()
  const contents = page.locator('#pilot-contents-dialog')
  assert(await contents.getAttribute('open') !== null, 'Reader pilot contents dialog did not open.')
  assert(await contents.locator('.pilot-contents__source').count() === 6, 'Reader pilot contents dialog is missing a source group.')
  await contents.evaluate(async (dialog) => {
    dialog.style.setProperty('--pilot-dialog-safe-bottom', '34px')
    const scroll = dialog.querySelector('.pilot-dialog__scroll')
    await new Promise(resolve => requestAnimationFrame(resolve))
    if (scroll) {
      scroll.scrollTop = scroll.scrollHeight
      await new Promise(resolve => requestAnimationFrame(resolve))
      scroll.scrollTop = scroll.scrollHeight
    }
  })
  const safeArea = await contents.locator('.pilot-dialog__scroll').evaluate((scroll) => {
    const finalLink = [...scroll.querySelectorAll('a[href]')].at(-1)
    return {
      paddingBottom: Number.parseFloat(getComputedStyle(scroll).paddingBottom),
      finalBottom: finalLink?.getBoundingClientRect().bottom ?? Number.POSITIVE_INFINITY,
    }
  })
  assert(safeArea.paddingBottom >= 46 && safeArea.finalBottom <= 810, `Reader pilot dialog controls enter the mobile safe area: ${JSON.stringify(safeArea)}`)
  await contents.locator('a[href="#slide-23-01"]').click()
  await waitForPage(page, indexFor(plan, 'slide-23-01'))
  assert(page.url().endsWith('#slide-23-01'), 'Reader pilot contents navigation did not synchronize the hash.')
  assert(await page.locator('#slide-23-01 .pilot-page__title').evaluate(element => element === document.activeElement), 'Reader pilot contents navigation did not focus the destination.')

  const searchButton = page.locator('#slide-23-01 [data-pilot-search]')
  await searchButton.click()
  const search = page.locator('#pilot-search-dialog')
  const input = search.locator('[data-pilot-search-input]')
  assert(await input.evaluate(element => element === document.activeElement), 'Reader pilot search did not focus its input.')
  assert(await search.locator('[data-pilot-search-results] a').count() === PILOT_PAGE_COUNT, `Reader pilot search does not expose all ${PILOT_PAGE_COUNT} pages.`)
  await input.fill('迷ったら単一から')
  const noteResult = search.locator('[data-pilot-search-results] a')
  assert(await noteResult.count() === 1 && await noteResult.getAttribute('href') === '#slide-23-01', 'Reader pilot search did not index the closed presenter note.')
  await noteResult.click()
  await waitForPage(page, indexFor(plan, 'slide-23-01'))
  const detail = page.locator('#pilot-dialog-slide-23-01')
  assert(await detail.getAttribute('open') !== null, 'Reader pilot note search did not open the matching supplemental dialog.')
  assert(await detail.locator('[data-pilot-close]').evaluate(element => element === document.activeElement), 'Reader pilot detail dialog did not receive focus.')
  await page.keyboard.press('Escape')
  assert(await detail.getAttribute('open') === null, 'Reader pilot detail dialog did not close with Escape.')
  assert(await page.locator('#slide-23-01 [data-pilot-dialog]').evaluate(element => element === document.activeElement), 'Reader pilot detail dialog did not return focus to its opener.')

  const opener = page.locator('#slide-23-01 [data-pilot-dialog]')
  await opener.click()
  assert(await detail.getAttribute('open') !== null, 'Reader pilot detail dialog did not open.')
  const scroll = detail.locator('.pilot-dialog__scroll')
  await scroll.focus()
  await page.keyboard.press('PageDown')
  assert(await detail.getAttribute('open') !== null && page.url().endsWith('#slide-23-01'), 'Reader pilot navigated behind an open dialog.')
  await detail.evaluate(element => element.dispatchEvent(new MouseEvent('click', { bubbles: true })))
  assert(await detail.getAttribute('open') === null, 'Reader pilot backdrop click did not close the dialog.')

  const next = page.locator('#slide-23-01 .pilot-control--step').last()
  await next.click()
  await waitForPage(page, indexFor(plan, 'slide-28-01'))
  assert(page.url().endsWith('#slide-28-01'), 'Reader pilot next control did not move one page.')
  await page.goBack()
  await waitForPage(page, indexFor(plan, 'slide-23-01'))
  assert(page.url().endsWith('#slide-23-01'), 'Reader pilot browser Back did not restore the previous page.')
  await page.goForward()
  await waitForPage(page, indexFor(plan, 'slide-28-01'))
  assert(page.url().endsWith('#slide-28-01'), 'Reader pilot browser Forward did not restore the intended page.')
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur())
  await page.keyboard.press('ArrowUp')
  await waitForPage(page, indexFor(plan, 'slide-23-01'))
  assert(page.url().endsWith('#slide-23-01'), 'Reader pilot ArrowUp did not move one page.')
  await page.keyboard.press('PageDown')
  await waitForPage(page, indexFor(plan, 'slide-28-01'))
  assert(page.url().endsWith('#slide-28-01'), 'Reader pilot PageDown did not move one page.')
  await page.keyboard.press('Shift+Space')
  await waitForPage(page, indexFor(plan, 'slide-23-01'))
  assert(page.url().endsWith('#slide-23-01'), 'Reader pilot Shift+Space did not move to the previous normal page.')
  await page.keyboard.press(' ')
  await waitForPage(page, indexFor(plan, 'slide-28-01'))
  assert(page.url().endsWith('#slide-28-01'), 'Reader pilot Space did not move one normal page.')

  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px'
    window.dispatchEvent(new Event('resize'))
  })
  await page.waitForFunction(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize) >= 31.5)
  const fallbackState = await page.evaluate(() => {
    window.updatePilotOverflowSafety()
    const pages = document.querySelector('.pilot-pages')
    return {
      enabled: pages?.dataset.pilotOverflowSafe ?? '',
      rootFontSize: getComputedStyle(document.documentElement).fontSize,
      connected: pages?.isConnected ?? false,
    }
  })
  assert(fallbackState.enabled === 'true', `Reader pilot did not enable the 200% text fallback: ${JSON.stringify(fallbackState)}`)
  const overflowStage = page.locator('#slide-28-01 [data-pilot-stage]')
  assert(await overflowStage.getAttribute('tabindex') === '0', 'Reader pilot overflow stage is not keyboard reachable.')
  assert(await page.locator('#slide-28-01 .pilot-page__title').evaluate(element => element === document.activeElement), 'Reader pilot lost destination heading focus before zoom navigation.')
  await overflowStage.evaluate(element => { element.scrollTop = 0 })
  const headingZoomHash = new URL(page.url()).hash
  await page.keyboard.press('PageDown')
  assert(
    await overflowStage.evaluate(element => element.scrollTop > 0) && new URL(page.url()).hash === headingZoomHash,
    'Reader pilot destination heading bypassed enlarged stage content.',
  )
  await page.evaluate(() => document.querySelector('#slide-28-01 .pilot-control--step:first-child')?.click())
  await waitForPage(page, indexFor(plan, 'slide-23-01'))
  await page.goBack()
  await waitForPage(page, indexFor(plan, 'slide-28-01'))
  const restoredOverflowFocus = await page.locator('#slide-28-01').evaluate((pilotPage) => {
    const stage = pilotPage.querySelector('[data-pilot-stage]')
    const title = pilotPage.querySelector('.pilot-page__title')
    if (!(stage instanceof HTMLElement) || !(title instanceof HTMLElement))
      return null
    const stageRect = stage.getBoundingClientRect()
    const titleRect = title.getBoundingClientRect()
    return {
      scrollTop: stage.scrollTop,
      focused: title === document.activeElement,
      titleVisible: titleRect.top >= stageRect.top - 1 && titleRect.bottom <= stageRect.bottom + 1,
    }
  })
  assert(
    restoredOverflowFocus?.scrollTop === 0 && restoredOverflowFocus.focused && restoredOverflowFocus.titleVisible,
    `Reader pilot restored an overflow page with off-screen heading focus: ${JSON.stringify(restoredOverflowFocus)}`,
  )
  await page.locator('#slide-28-01 [data-pilot-search]').focus()
  await page.keyboard.press('Tab')
  assert(await overflowStage.evaluate(element => element === document.activeElement), 'Reader pilot Tab order skips the overflow stage.')
  await overflowStage.evaluate(element => { element.scrollTop = 0 })
  const zoomHash = new URL(page.url()).hash
  await page.keyboard.press('PageDown')
  assert(
    await overflowStage.evaluate(element => element.scrollTop > 0) && new URL(page.url()).hash === zoomHash,
    'Reader pilot PageDown navigated away before scrolling enlarged content.',
  )
  const zoom = await page.locator('#slide-28-01').evaluate((element) => {
    const stage = element.querySelector('[data-pilot-stage]')
    const chrome = element.querySelector('.pilot-page__chrome')
    const controls = element.querySelector('.pilot-page__controls')
    const source = element.querySelector('.pilot-page__source')
    stage.scrollTop = stage.scrollHeight
    return {
      height: element.getBoundingClientRect().height,
      overflow: stage.scrollHeight - stage.clientHeight,
      overflowY: getComputedStyle(stage).overflowY,
      canScroll: stage.scrollTop > 0,
      chromeClipped: chrome.scrollHeight - chrome.clientHeight > 1 || chrome.scrollWidth - chrome.clientWidth > 1,
      controlsClipped: controls.scrollHeight - controls.clientHeight > 1 || controls.scrollWidth - controls.clientWidth > 1,
      sourceClipped: source.scrollHeight - source.clientHeight > 1 || source.scrollWidth - source.clientWidth > 1,
      chromeOverlapsStage: chrome.getBoundingClientRect().bottom > stage.getBoundingClientRect().top,
      stageOverlapsControls: stage.getBoundingClientRect().bottom > controls.getBoundingClientRect().top,
    }
  })
  assert(
    Math.abs(zoom.height - 844) <= 1
      && zoom.overflow > 0
      && zoom.overflowY === 'auto'
      && zoom.canScroll
      && !zoom.chromeClipped
      && !zoom.controlsClipped
      && !zoom.sourceClipped
      && !zoom.chromeOverlapsStage
      && !zoom.stageOverlapsControls,
    `Reader pilot 200% text fallback failed: ${JSON.stringify(zoom)}`,
  )
  const zoomOverlaps = await page.locator('.pilot-page').evaluateAll(pages => pages.flatMap((pilotPage) => {
    const elements = [...pilotPage.querySelectorAll('[data-content-id]')]
      .filter(element => !element.closest('dialog'))
    const overlaps = []
    for (let left = 0; left < elements.length; left += 1) {
      for (let right = left + 1; right < elements.length; right += 1) {
        const a = elements[left]
        const b = elements[right]
        if (a.contains(b) || b.contains(a))
          continue
        const aRect = a.getBoundingClientRect()
        const bRect = b.getBoundingClientRect()
        const width = Math.min(aRect.right, bRect.right) - Math.max(aRect.left, bRect.left)
        const height = Math.min(aRect.bottom, bRect.bottom) - Math.max(aRect.top, bRect.top)
        if (aRect.width > 0 && bRect.width > 0 && width > 4 && height > 4)
          overlaps.push(`${pilotPage.id}:${a.dataset.contentId}/${b.dataset.contentId}`)
      }
    }
    return overlaps
  }))
  assert(zoomOverlaps.length === 0, `Reader pilot 200% content overlaps: ${zoomOverlaps.join(', ')}`)
  await context.close()
}

async function screenshotPage(page, url, target) {
  await page.goto(url, { waitUntil: 'networkidle' })
  if (url.includes('/reader-pilot/'))
    await page.locator('.pilot-pages[data-pilot-ready="true"][data-pilot-settled]').waitFor()
  await page.screenshot({ path: target })
}

async function createContactSheet(browser, imageFiles, target, title, columns = 4) {
  const images = await Promise.all(imageFiles.map(async file => ({
    name: `${path.basename(path.dirname(file))}/${path.basename(file, '.png')}`,
    data: `data:image/png;base64,${(await fs.readFile(file)).toString('base64')}`,
  })))
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } })
  await page.setContent(`<!doctype html><html><style>
    *{box-sizing:border-box}body{margin:0;padding:28px;background:#07080d;color:#f4f7fb;font-family:system-ui,sans-serif}
    h1{margin:0 0 20px;font-size:28px}.grid{display:grid;grid-template-columns:repeat(${columns},1fr);align-items:start;gap:18px}
    figure{margin:0;padding:8px;border:1px solid #344058;border-radius:10px;background:#111724}
    img{display:block;width:100%;height:auto}figcaption{padding:7px 3px 1px;color:#aebed2;font:700 12px monospace}
  </style><body><h1>${title}</h1><div class="grid">${images.map(image => `<figure><img src="${image.data}"><figcaption>${image.name}</figcaption></figure>`).join('')}</div></body></html>`)
  await page.screenshot({ path: target, fullPage: true })
  await page.close()
}

async function capturePilotSet(browser, server, plan, viewport, targetDir, entries = plan) {
  await fs.mkdir(targetDir, { recursive: true })
  const page = await browser.newPage({ viewport })
  const files = []
  for (const entry of entries) {
    const target = path.join(targetDir, `${String(entry.index + 1).padStart(2, '0')}-${entry.id}.png`)
    await screenshotPage(page, `${server.baseUrl}reader-pilot/#${entry.id}`, target)
    files.push(target)
  }
  await page.close()
  return files
}

async function captureArtifacts(browser, server, plan, output, v2Screenshots, canonicalScreenshots, layouts) {
  const currentDir = path.join(output, 'current-reader')
  const mobile390Dir = path.join(output, 'v3-390')
  const mobile430Dir = path.join(output, 'v3-430')
  const desktopDir = path.join(output, 'v3-desktop')
  const sheetDir = path.join(output, 'contact-sheets')
  await Promise.all([currentDir, mobile390Dir, mobile430Dir, desktopDir, sheetDir].map(directory => fs.rm(directory, { recursive: true, force: true })))
  await Promise.all([currentDir, mobile390Dir, mobile430Dir, desktopDir, sheetDir].map(directory => fs.mkdir(directory, { recursive: true })))
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const currentFiles = new Map()
  for (const source of SOURCE_PAGE_COUNTS.keys()) {
    const target = path.join(currentDir, `source-${String(source).padStart(2, '0')}-current-reader.png`)
    await screenshotPage(page, `${server.baseUrl}reader/#slide-${source}`, target)
    currentFiles.set(source, target)
  }
  await page.close()
  const mobile390Files = await capturePilotSet(browser, server, plan, { width: 390, height: 844 }, mobile390Dir)
  const mobile430Files = await capturePilotSet(browser, server, plan, { width: 430, height: 932 }, mobile430Dir)
  const desktopIds = new Set(['slide-06-01', 'slide-07-03', 'slide-13-01', 'slide-13-05', 'slide-16-01', 'slide-16-02', 'slide-23-01', 'slide-28-01'])
  const desktopFiles = await capturePilotSet(
    browser,
    server,
    plan,
    { width: 1280, height: 720 },
    desktopDir,
    plan.filter(entry => desktopIds.has(entry.id)),
  )
  const mobile390BySource = new Map()
  for (const [index, entry] of plan.entries()) {
    if (!mobile390BySource.has(entry.sourceSlide))
      mobile390BySource.set(entry.sourceSlide, [])
    mobile390BySource.get(entry.sourceSlide).push(mobile390Files[index])
  }
  await createContactSheet(browser, mobile390Files, path.join(sheetDir, 'v3-15-pages-390.png'), 'Canonical-faithful Reader pilot v3 · 15 pages · 390×844', 4)
  await createContactSheet(browser, mobile430Files, path.join(sheetDir, 'v3-15-pages-430.png'), 'Canonical-faithful Reader pilot v3 · 15 pages · 430×932', 4)
  await createContactSheet(browser, desktopFiles, path.join(sheetDir, 'v3-desktop-representatives.png'), 'Reader pilot v3 · desktop representatives · 1280×720', 3)

  for (const source of SOURCE_PAGE_COUNTS.keys()) {
    await createContactSheet(
      browser,
      [currentFiles.get(source), ...mobile390BySource.get(source)],
      path.join(sheetDir, `source-${String(source).padStart(2, '0')}-current-v3.png`),
      `Source ${String(source).padStart(2, '0')} · Current Reader / v3`,
      Math.min(3, mobile390BySource.get(source).length + 1),
    )
  }

  if (v2Screenshots) {
    const v2Files = (await fs.readdir(v2Screenshots))
      .filter(file => file.endsWith('.png'))
      .sort()
      .map(file => path.join(v2Screenshots, file))
    assert(v2Files.length === 19, `Reader pilot v2 comparison has ${v2Files.length}/19 screenshots.`)
    await createContactSheet(browser, [...v2Files, ...mobile390Files], path.join(sheetDir, 'v2-19-vs-v3-15.png'), 'Reader pilot · v2 19 pages / v3 15 pages', 5)
    for (const source of SOURCE_PAGE_COUNTS.keys()) {
      const sourceToken = `slide-${String(source).padStart(2, '0')}-`
      const sourceV2 = v2Files.filter(file => path.basename(file).includes(sourceToken))
      await createContactSheet(
        browser,
        [...sourceV2, ...mobile390BySource.get(source)],
        path.join(sheetDir, `source-${String(source).padStart(2, '0')}-v2-v3.png`),
        `Source ${String(source).padStart(2, '0')} · v2 / v3`,
        Math.min(5, Math.max(sourceV2.length, mobile390BySource.get(source).length)),
      )
    }
  }

  if (canonicalScreenshots) {
    const canonicalBySource = new Map()
    for (const source of SOURCE_PAGE_COUNTS.keys()) {
      const file = path.join(canonicalScreenshots, `slide-${String(source).padStart(2, '0')}.png`)
      await fs.access(file)
      canonicalBySource.set(source, file)
    }
    const canonicalFiles = [...canonicalBySource.values()]
    await createContactSheet(
      browser,
      [...canonicalFiles, ...mobile390Files],
      path.join(sheetDir, 'canonical-6-vs-v3-15.png'),
      'Canonical 16:9 source / canonical-faithful portrait v3',
      4,
    )
    for (const source of SOURCE_PAGE_COUNTS.keys()) {
      await createContactSheet(
        browser,
        [canonicalBySource.get(source), ...mobile390BySource.get(source)],
        path.join(sheetDir, `source-${String(source).padStart(2, '0')}-canonical-v3.png`),
        `Source ${String(source).padStart(2, '0')} · canonical 16:9 / canonical-faithful v3`,
        Math.min(3, mobile390BySource.get(source).length + 1),
      )
    }
  }

  await fs.writeFile(path.join(output, 'layout-utilization.json'), `${JSON.stringify(layouts, null, 2)}\n`)
}

const out = path.resolve(ROOT, readArg('--out', 'dist'))
const base = normalizeBase(readArg('--base', '/'))
const routerMode = readArg('--router-mode', 'history')
const screenshotsArg = readArg('--screenshots', '')
const screenshots = screenshotsArg ? path.resolve(ROOT, screenshotsArg) : ''
const v2ScreenshotsArg = readArg('--v2-screenshots', '')
const v2Screenshots = v2ScreenshotsArg ? path.resolve(ROOT, v2ScreenshotsArg) : ''
const canonicalScreenshotsArg = readArg('--canonical-screenshots', '')
const canonicalScreenshots = canonicalScreenshotsArg ? path.resolve(ROOT, canonicalScreenshotsArg) : ''
const generated = await validateGeneratedFiles(out, routerMode)
const server = await startStaticServer({ root: out, base })
const browser = await chromium.launch({ headless: true })

try {
  const layouts = {
    mobile390: await validateViewport(browser, server.baseUrl, { width: 390, height: 844 }, 844),
    mobile430: await validateViewport(browser, server.baseUrl, { width: 430, height: 932 }, 932),
    desktop1280: await validateViewport(browser, server.baseUrl, { width: 1280, height: 720 }, 720),
  }
  await validateLowHeightFallback(browser, server.baseUrl, generated.plan)
  await validatePendingDialogHistoryRace(browser, server.baseUrl, generated.plan)
  await validateInteractions(browser, server, generated.inventory, generated.plan)
  if (screenshots)
    await captureArtifacts(
      browser,
      server,
      generated.plan.map((entry, index) => ({ ...entry, index })),
      screenshots,
      v2Screenshots,
      canonicalScreenshots,
      layouts,
    )
  console.log(`Reader pilot v3 QA passed: ${PILOT_INVENTORY_COUNT}/${PILOT_INVENTORY_COUNT} atomic inventory, 15 pages, canonical-faithful compositions, normal-view overflow 0.`)
}
finally {
  await browser.close()
  await server.close()
}
