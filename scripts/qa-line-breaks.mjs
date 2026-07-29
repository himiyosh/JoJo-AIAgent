/**
 * Rendered line-break audit for the 16:9 deck.
 *
 * The Reader already had a Range-based scan (scripts/qa-production.mjs), but it
 * only walked `.reader-page__title h2`. Every defect in the deck's own body copy
 * — a quoted compound split across lines, a line opening with a bare particle —
 * was therefore invisible to CI, which is how the p19 defects shipped. This
 * module scans the real rendered glyph boxes and reports the class of defect
 * documented in DESIGN.md §130 / §132.
 *
 * The audit has to be *rendered*: `text-wrap: balance` picks break points after
 * layout, so no source-string heuristic can predict them.
 *
 * Run standalone against `npm run dev` while iterating:
 *   node scripts/qa-line-breaks.mjs http://localhost:3030
 * In CI it runs inside `npm run qa:production`, against the built artifact.
 */

export const TOTAL_SLIDES = 33

/** Prose blocks the audience reads as sentences (not labels or chrome). */
export const PROSE_SELECTOR = [
  '.slidev-layout h1',
  '.tk',
  '.note',
  '.lead',
  '.concl',
  '.lgraph__cap',
  '.rt__card-b',
  '.gl__def',
].join(', ')

/**
 * Serialized into the page by `page.evaluate`. Scans the currently visible
 * slide and returns one entry per prose block that breaks at a bad position.
 */
export function collectBreakDefects({ selector }) {
  // A line may not START with closing punctuation, a nakaguro, or a bare
  // grammatical particle: each orphans a fragment that belongs to the line above.
  const badLeading = /^[」』）)】〕》〉、。，．,.·・：:；;！!？?ー]/
  const orphanParticle = /^(?:を|が|は|に|へ|で|と|も|や|の|から|まで|より)(?![ぁ-んァ-ヶ])/
  // A line may not END with an opening bracket, nor with a closing emphasis
  // quote whose quoted term modifies the noun pushed onto the next line
  // (the “死亡宣告”|記事。 defect that `text-wrap: balance` introduced on p19).
  const danglingOpener = /[「『（(【〔《〈“]$/
  const closingQuote = /[”』」]$/
  const startsWithWord = /^[\u3040-\u30ff\u3400-\u9fffA-Za-z0-9]/

  function renderedLines(node) {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
    const chars = []
    const range = document.createRange()
    let textNode
    while ((textNode = walker.nextNode())) {
      const value = textNode.nodeValue
      if (!value) continue
      for (let i = 0; i < value.length; i += 1) {
        range.setStart(textNode, i)
        range.setEnd(textNode, i + 1)
        const rects = range.getClientRects()
        if (!rects.length) continue
        chars.push({ ch: value[i], top: Math.round(rects[0].top) })
      }
    }
    const lines = []
    let current = ''
    let top = null
    for (const c of chars) {
      if (top === null) top = c.top
      if (c.top !== top) { lines.push(current); current = ''; top = c.top }
      current += c.ch
    }
    if (current) lines.push(current)
    return lines.map(line => line.trim()).filter(Boolean)
  }

  const defects = []
  const slide = [...document.querySelectorAll('.slidev-layout')]
    .find((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
  if (!slide) return defects

  for (const node of slide.querySelectorAll(selector)) {
    if (!node.textContent?.trim()) continue
    const rect = node.getBoundingClientRect()
    if (!rect.width || !rect.height) continue
    const lines = renderedLines(node)
    for (let i = 1; i < lines.length; i += 1) {
      const previous = lines[i - 1]
      const line = lines[i]
      const reasons = []
      if (badLeading.test(line)) reasons.push('行頭が約物・中黒')
      if (orphanParticle.test(line)) reasons.push('行頭が助詞')
      if (danglingOpener.test(previous)) reasons.push('行末が開き括弧')
      if (closingQuote.test(previous) && startsWithWord.test(line)) reasons.push('引用符つき複合語の分断')
      if (reasons.length) {
        defects.push({
          selector: node.className || node.tagName.toLowerCase(),
          reasons,
          previous: previous.slice(-18),
          line: line.slice(0, 18),
        })
      }
    }
  }
  return defects
}

/** Formats one finding for a CI assertion message or the standalone report. */
export function formatDefect(slide, defect) {
  return `p${slide} ${defect.selector} [${defect.reasons.join('/')}] …${defect.previous} / ${defect.line}…`
}

async function main() {
  const { chromium } = await import('playwright-chromium')
  const baseUrl = (process.argv[2] ?? 'http://localhost:3030').replace(/\/$/, '')
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
  const findings = []
  try {
    for (let number = 1; number <= TOTAL_SLIDES; number += 1) {
      await page.goto(`${baseUrl}/${number}`, { waitUntil: 'networkidle' })
      await page.waitForSelector(`.slidev-page-${number}`, { timeout: 15000 })
      await page.evaluate(() => document.fonts.ready)
      const defects = await page.evaluate(collectBreakDefects, { selector: PROSE_SELECTOR })
      for (const defect of defects) findings.push(formatDefect(number, defect))
    }
  }
  finally {
    await browser.close()
  }
  if (!findings.length) {
    console.log(`OK — ${TOTAL_SLIDES}枚の本文に改行欠陥なし`)
    return
  }
  for (const finding of findings) console.log(finding)
  console.log(`\n${findings.length} 件の改行欠陥`)
  process.exitCode = 1
}

if (import.meta.url === `file://${process.argv[1]}`)
  await main()
