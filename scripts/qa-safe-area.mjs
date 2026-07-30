/**
 * Deck-wide safe-area / breathing-room audit.
 *
 * DESIGN.md §4 fixes the logical canvas at 980x552 with a 48px (3rem) outer
 * safe area, and §111 additionally targets `h1 top ≈ 48–70px` because Slidev
 * centres content vertically: once the content column exceeds ~456px it bleeds
 * symmetrically into the padding and the title sticks to the top edge.
 *
 * §111 also says the scan must be re-run across the whole deck after *any*
 * additive change — but nothing automated it, so "I added a caption" never
 * triggered a re-measure. This module measures every slide in canvas pixels.
 *
 * Run standalone against `npm run dev`:
 *   node scripts/qa-safe-area.mjs http://localhost:3030
 */

export const TOTAL_SLIDES = 33
export const SAFE_AREA = 48
/**
 * The default theme pulls every heading out by `margin-left: -0.05em` so the
 * cap-height edge of a large title sits optically flush with the 48px padding.
 * That offset scales with font-size (-1.8px at 36px, -3px on the 60px cover
 * title), so a fixed pixel tolerance would either leak or false-alarm. We add
 * negative margins back instead and judge the *layout* position, which is the
 * number the 48px rule is actually about. Only subpixel noise is forgiven.
 */
export const SUBPIXEL_TOLERANCE = 0.5
/** §111: story slides aim for 48px; dense reference/showcase slides may sit in the near band. */
export const H1_TOP_MIN = 48
export const H1_TOP_NEAR_BAND = 36
/** Slides DESIGN.md §111 records as inherently dense (quote showcase, references, glossary). */
export const DENSE_SLIDES = new Set([16, 19, 31, 32])

/** Serialized into the page; returns canvas-pixel geometry for the visible slide. */
export function measureSafeArea() {
  const slide = [...document.querySelectorAll('.slidev-layout')]
    .find((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
  if (!slide) return null
  const slideRect = slide.getBoundingClientRect()
  // The 980px logical canvas is uniformly scaled to the viewport.
  const scale = slideRect.width / 980
  const toCanvas = value => Math.round((value / scale) * 10) / 10

  const heading = slide.querySelector('h1')
  const headingRect = heading?.getBoundingClientRect()
  const headingTop = headingRect
    ? headingRect.top - Math.min(0, parseFloat(getComputedStyle(heading).marginTop) || 0) * scale
    : null

  let left = Infinity
  let right = -Infinity
  let bottom = -Infinity
  let widest = null
  for (const node of slide.querySelectorAll('*')) {
    const style = getComputedStyle(node)
    if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') continue
    // Full-bleed decoration (top rule, background grid, footer chrome) is not body content.
    if (node.classList.contains('slidev-layout')) continue
    // Chapter dividers deliberately bleed their oversized numeral and mark past the
    // safe area; DESIGN.md §5 owns that composition and qa-production's
    // testChapterDivider already asserts its own 48px flow safe area.
    if ([...node.classList].some(name => name.startsWith('section__'))) continue
    // A rotated decorative mark (the brand diamond) reports the *rotated* bounding
    // box, whose corner tips reach ~5px past the element edge even when the element
    // itself is aligned. A point carries almost no optical weight, so measuring it
    // as an edge would report a violation that does not exist visually.
    const transform = style.transform
    if (transform && transform !== 'none' && !transform.startsWith('matrix(1,')) continue
    const rect = node.getBoundingClientRect()
    if (rect.width < 4 || rect.height < 4) continue
    if (rect.width >= slideRect.width - 1) continue
    // A negative margin-left physically shifts the box; it is an optical
    // correction, not layout. Measure where the box would have sat without it so
    // the rule tracks intent. Children inherit an ancestor's shift, so the pull is
    // accumulated up to the slide. CSS margins are authored in unscaled layout px
    // while getBoundingClientRect reports the transform-scaled canvas, hence the
    // `* scale`. (margin-right/bottom do not move the box itself, so they are not
    // compensated — an overflow there is a real one.)
    let pullLeft = 0
    for (let hop = node; hop && hop !== slide; hop = hop.parentElement)
      pullLeft += Math.min(0, parseFloat(getComputedStyle(hop).marginLeft) || 0)
    const nodeLeft = rect.left - pullLeft * scale
    if (nodeLeft < left) { left = nodeLeft; widest = node.className || node.tagName }
    if (rect.right > right) right = rect.right
    if (rect.bottom > bottom) bottom = rect.bottom
  }

  return {
    scale,
    h1Top: headingTop === null ? null : toCanvas(headingTop - slideRect.top),
    insetLeft: Number.isFinite(left) ? toCanvas(left - slideRect.left) : null,
    insetRight: Number.isFinite(right) ? toCanvas(slideRect.right - right) : null,
    insetBottom: Number.isFinite(bottom) ? toCanvas(slideRect.bottom - bottom) : null,
    widest: typeof widest === 'string' ? widest.slice(0, 40) : '',
  }
}

/** Returns the rule violations for one measured slide, or [] when it breathes. */
export function checkSafeArea(number, metrics) {
  if (!metrics) return [`p${number}: no visible slide`]
  const problems = []
  const dense = DENSE_SLIDES.has(number)
  const floor = dense ? H1_TOP_NEAR_BAND : H1_TOP_MIN
  if (metrics.h1Top !== null && metrics.h1Top < floor)
    problems.push(`h1 top ${metrics.h1Top}px < ${floor}px`)
  // Slidev centres the content column, so the bottom inset mirrors the title
  // inset: judge it against the same floor rather than the horizontal 48px.
  if (metrics.insetBottom !== null && metrics.insetBottom < floor)
    problems.push(`bottom inset ${metrics.insetBottom}px < ${floor}px`)
  for (const [side, value] of [['left', metrics.insetLeft], ['right', metrics.insetRight]]) {
    if (value !== null && value < SAFE_AREA - SUBPIXEL_TOLERANCE)
      problems.push(`${side} inset ${value}px < ${SAFE_AREA}px`)
  }
  return problems.map(problem => `p${number}: ${problem}`)
}

async function main() {
  const { chromium } = await import('playwright-chromium')
  const baseUrl = (process.argv[2] ?? 'http://localhost:3030').replace(/\/$/, '')
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 980, height: 552 } })
  const rows = []
  const problems = []
  try {
    for (let number = 1; number <= TOTAL_SLIDES; number += 1) {
      await page.goto(`${baseUrl}/${number}`, { waitUntil: 'networkidle' })
      await page.waitForSelector(`.slidev-page-${number}`, { timeout: 15000 })
      await page.evaluate(() => document.fonts.ready)
      const metrics = await page.evaluate(measureSafeArea)
      rows.push({ number, ...metrics })
      problems.push(...checkSafeArea(number, metrics))
    }
  }
  finally {
    await browser.close()
  }
  console.log('slide\th1Top\tleft\tright\tbottom\twidest')
  for (const row of rows)
    console.log(`p${row.number}\t${row.h1Top ?? '-'}\t${row.insetLeft}\t${row.insetRight}\t${row.insetBottom}\t${row.widest}`)
  if (!problems.length) {
    console.log(`\nOK — ${TOTAL_SLIDES}枚とも 48px safe area と h1-top を満たす`)
    return
  }
  console.log('')
  for (const problem of problems) console.log(problem)
  console.log(`\n${problems.length} 件の余白違反`)
  process.exitCode = 1
}

if (import.meta.url === `file://${process.argv[1]}`)
  await main()
