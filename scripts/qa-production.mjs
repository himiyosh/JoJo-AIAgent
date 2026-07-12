import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-chromium'
import { extractRecipeData } from '../reader/extract-visuals.mjs'
import { normalizeBase, startStaticServer } from './lib/static-server.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const CHAPTER_NUMBERS = new Map([
  [5, '01'],
  [12, '02'],
  [15, '03'],
  [19, '04'],
  [24, '05'],
])

function readArg(name, fallback) {
  const exact = args.indexOf(name)
  if (exact >= 0 && args[exact + 1])
    return args[exact + 1]
  const inline = args.find(arg => arg.startsWith(`${name}=`))
  return inline ? inline.slice(name.length + 1) : fallback
}

function assert(condition, message) {
  if (!condition)
    throw new Error(message)
}

async function testFragmentSanitizer(browser) {
  const context = await browser.newContext()
  const page = await context.newPage()
  const recipe = {
    extracts: [{ key: 'fixture', selector: '.frag', mode: 'fragment', required: true }],
  }

  async function expectRejection(html, expected) {
    await page.setContent(`<main id="fixture-root">${html}</main>`)
    let error
    try {
      await extractRecipeData(page.locator('#fixture-root'), recipe, 99)
    }
    catch (caught) {
      error = caught
    }
    assert(error && expected.test(String(error)), `Reader fragment sanitizer accepted unsafe markup: ${html}`)
  }

  await expectRejection(
    '<script class="frag" type="application/json">{"unsafe":"root fragment must be rejected rather than returned intact"}</script>',
    /unsafe <script>/,
  )
  await expectRejection(
    '<div class="frag" onclick="alert(1)">Unsafe event attributes must fail extraction rather than disappear silently.</div>',
    /unsafe "onclick"/,
  )
  await expectRejection(
    '<div class="frag" style="color:red">Unsafe inline styles must fail extraction rather than disappear silently.</div>',
    /unsafe "style"/,
  )
  await expectRejection(
    '<svg class="frag"><a href="javascript:alert(1)"><text>Unsafe URL protocols must fail strict extraction.</text></a></svg>',
    /unsafe URL/,
  )

  await page.setContent(`
    <main id="fixture-root"><div class="frag" data-v-fixture>
      <svg viewBox="0 0 100 100">
        <defs><linearGradient id="paint"><stop offset="0" stop-color="#22d3ee"></stop></linearGradient></defs>
        <rect width="100" height="100" fill="url(#paint)"></rect>
      </svg>
    </div></main>`)
  const valid = await extractRecipeData(page.locator('#fixture-root'), recipe, 99)
  assert(valid.fixture.length === 1, 'Reader fragment sanitizer rejected a valid SVG fragment.')
  assert(!valid.fixture[0].includes('data-v-'), 'Reader fragment sanitizer retained Vue scoped attributes.')
  assert(valid.fixture[0].includes('id="reader-slide-99-fixture-paint"'), 'Reader fragment sanitizer did not namespace IDs.')
  assert(valid.fixture[0].includes('url(#reader-slide-99-fixture-paint)'), 'Reader fragment sanitizer did not rewrite local ID references.')
  await context.close()
}

async function visibleOverflow(locator) {
  return locator.evaluate((root) => {
    const bounds = root.getBoundingClientRect()
    const ignored = '.cite__panel, .rt__measure, [aria-hidden="true"], svg, script, style'
    return [...root.querySelectorAll('*')]
      .filter(element => !element.matches(ignored) && !element.closest('.rt__measure'))
      .filter((element) => {
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return style.display !== 'none'
          && style.visibility !== 'hidden'
          && Number(style.opacity) !== 0
          && rect.width > 1
          && rect.height > 1
      })
      .map(element => ({ element, rect: element.getBoundingClientRect() }))
      .filter(({ rect }) => rect.left < bounds.left - 2
        || rect.right > bounds.right + 2
        || rect.top < bounds.top - 2
        || rect.bottom > bounds.bottom + 2)
      .slice(0, 8)
      .map(({ element, rect }) => ({
        tag: element.tagName.toLowerCase(),
        className: element.className?.baseVal ?? element.className ?? '',
        rect: {
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
        },
      }))
  })
}

async function framePositions(group) {
  return group.evaluate((root) => {
    const selectors = ['.rt__tabs', '.rt__stage', '.rt__bar']
    return Object.fromEntries(selectors.map(selector => [
      selector,
      Math.round((root.querySelector(selector)?.getBoundingClientRect().top ?? 0) * 10) / 10,
    ]))
  })
}

function maxPositionDelta(before, after) {
  return Math.max(...Object.keys(before).map(key => Math.abs(before[key] - after[key])))
}

async function testChapterDivider(slide, slideNumber, expectedNumber, expectedFontSize = 144) {
  const number = slide.locator('.section__chno')
  assert(await number.count() === 1, `Slide ${slideNumber}: chapter numeral is missing or duplicated.`)
  assert(await number.evaluate(element => element.tagName === 'SPAN' && !element.textContent?.trim()), `Slide ${slideNumber}: chapter numeral wrapper must be an empty span.`)
  assert(await number.getAttribute('data-number') === expectedNumber, `Slide ${slideNumber}: expected chapter numeral ${expectedNumber}.`)
  assert(await number.getAttribute('aria-hidden') === 'true', `Slide ${slideNumber}: chapter numeral is not decorative.`)

  const metrics = await slide.evaluate((root) => {
    const layer = root.querySelector('.section__chno')
    const layerRect = layer?.getBoundingClientRect()
    const layerStyle = layer ? getComputedStyle(layer) : null
    const pseudo = layer ? getComputedStyle(layer, '::before') : null
    const mark = root.querySelector('.section__mark')?.getBoundingClientRect()
    const overlaps = (a, b) => Boolean(a && b
      && a.left < b.right
      && a.right > b.left
      && a.top < b.bottom
      && a.bottom > b.top)
    const probe = document.createElement('span')
    probe.textContent = layer?.getAttribute('data-number') ?? ''
    Object.assign(probe.style, {
      position: 'absolute',
      right: pseudo?.right,
      bottom: pseudo?.bottom,
      fontFamily: pseudo?.fontFamily,
      fontSize: pseudo?.fontSize,
      fontWeight: pseudo?.fontWeight,
      lineHeight: pseudo?.lineHeight,
      letterSpacing: pseudo?.letterSpacing,
      pointerEvents: 'none',
    })
    root.append(probe)
    const numeral = probe.getBoundingClientRect()
    const title = root.querySelector('h1')
    const titleRects = []
    if (title) {
      const range = document.createRange()
      range.selectNodeContents(title)
      titleRects.push(...range.getClientRects())
    }
    const bounds = root.getBoundingClientRect()
    const result = {
      content: pseudo?.content.replace(/^['"]|['"]$/g, ''),
      fontSize: Number.parseFloat(pseudo?.fontSize ?? '0'),
      strokeWidth: pseudo?.webkitTextStrokeWidth,
      contain: pseudo?.contain,
      wrapper: {
        insetMatches: Boolean(layerRect
          && Math.abs(layerRect.left - bounds.left) <= 1
          && Math.abs(layerRect.right - bounds.right) <= 1
          && Math.abs(layerRect.top - bounds.top) <= 1
          && Math.abs(layerRect.bottom - bounds.bottom) <= 1),
        overflow: layerStyle?.overflow,
        pointerEvents: layerStyle?.pointerEvents,
        userSelect: layerStyle?.userSelect,
        zIndex: layerStyle?.zIndex,
      },
      foregroundZ: [...root.querySelectorAll('.section__context, h1, .section__lead, .section__route')]
        .map(element => getComputedStyle(element).zIndex),
      rightRatio: (bounds.right - numeral.right) / bounds.width,
      bottomGap: bounds.bottom - numeral.bottom,
      titleOverlap: titleRects.some(rect => overlaps(numeral, rect)),
      markOverlap: overlaps(numeral, mark),
    }
    probe.remove()
    return result
  })
  assert(metrics.content === expectedNumber, `Slide ${slideNumber}: pseudo-element content is not ${expectedNumber}.`)
  assert(Math.abs(metrics.fontSize - expectedFontSize) <= 0.2, `Slide ${slideNumber}: expected ${expectedFontSize}px chapter numeral, got ${metrics.fontSize}px.`)
  assert(metrics.strokeWidth === '1px' && metrics.contain.includes('layout') && metrics.contain.includes('paint'), `Slide ${slideNumber}: chapter numeral outline or containment differs from the approved values.`)
  assert(metrics.wrapper.insetMatches
    && metrics.wrapper.overflow === 'hidden'
    && metrics.wrapper.pointerEvents === 'none'
    && metrics.wrapper.userSelect === 'none'
    && metrics.wrapper.zIndex === '0', `Slide ${slideNumber}: chapter numeral wrapper differs from the approved full-slide layer.`)
  assert(metrics.foregroundZ.every(zIndex => zIndex === '1'), `Slide ${slideNumber}: foreground is not explicitly above the numeral.`)
  assert(Math.abs(metrics.rightRatio - 0.025) <= 0.002 && Math.abs(metrics.bottomGap) <= 1, `Slide ${slideNumber}: chapter numeral is not anchored at right 2.5% / bottom 0.`)
  assert(!metrics.titleOverlap && !metrics.markOverlap, `Slide ${slideNumber}: chapter numeral overlaps foreground content.`)
}

async function testMobileChapters(browser, server) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  for (const [slideNumber, expectedNumber] of CHAPTER_NUMBERS) {
    await page.goto(`${server.baseUrl}${slideNumber}`, { waitUntil: 'networkidle' })
    const slide = page.locator(`.slidev-page-${slideNumber} .slidev-layout`)
    await slide.waitFor({ state: 'visible' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(350)
    await testChapterDivider(slide, slideNumber, expectedNumber, 89.6)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    assert(overflow <= 1, `Slide ${slideNumber}: ${overflow}px horizontal overflow at 390x844.`)
  }
  await context.close()
}

async function testTabs(page, baseUrl, slideNumber) {
  await page.goto(`${baseUrl}${slideNumber}`, { waitUntil: 'networkidle' })
  const slideUrl = page.url()
  const slide = page.locator(`.slidev-page-${slideNumber} .slidev-layout`)
  const groups = slide.locator('.rt')
  assert(await groups.count() > 0, `Slide ${slideNumber}: RevealTabs was not found.`)

  for (let groupIndex = 0; groupIndex < await groups.count(); groupIndex += 1) {
    const group = groups.nth(groupIndex)
    const tabs = group.locator('[role="tab"]')
    const count = await tabs.count()
    const ids = await tabs.evaluateAll(elements => elements.map(element => element.id))
    assert(ids.every(Boolean) && new Set(ids).size === count, `Slide ${slideNumber}: tab IDs are not unique.`)

    const panel = group.locator('[role="tabpanel"]')
    const panelId = await panel.getAttribute('id')
    assert(panelId && await tabs.first().getAttribute('aria-controls') === panelId, `Slide ${slideNumber}: aria-controls is disconnected.`)

    await tabs.first().focus()
    await page.keyboard.press('End')
    assert(await tabs.last().getAttribute('aria-selected') === 'true', `Slide ${slideNumber}: End did not select the final tab.`)
    assert(await tabs.last().evaluate(element => element === document.activeElement), `Slide ${slideNumber}: roving focus did not follow End.`)

    await page.keyboard.press('Home')
    assert(await tabs.first().getAttribute('aria-selected') === 'true', `Slide ${slideNumber}: Home did not select the first tab.`)
    await page.keyboard.press('ArrowRight')
    assert(await tabs.nth(1).getAttribute('aria-selected') === 'true', `Slide ${slideNumber}: ArrowRight did not select the next tab.`)
    assert(page.url() === slideUrl, `Slide ${slideNumber}: tab keyboard input advanced the deck.`)

    const baseline = await framePositions(group)
    for (let tabIndex = 0; tabIndex < count; tabIndex += 1) {
      await tabs.nth(tabIndex).click()
      await page.waitForTimeout(300)
      const selected = group.locator('[role="tab"][aria-selected="true"]')
      assert(await selected.count() === 1, `Slide ${slideNumber}: expected exactly one selected tab.`)
      assert(await selected.getAttribute('tabindex') === '0', `Slide ${slideNumber}: selected tab is not in the tab order.`)
      assert(await panel.getAttribute('aria-labelledby') === await selected.getAttribute('id'), `Slide ${slideNumber}: panel label is disconnected.`)
      const delta = maxPositionDelta(baseline, await framePositions(group))
      assert(delta <= 1, `Slide ${slideNumber}: tab ${tabIndex + 1} shifted the frame by ${delta}px.`)
    }
  }
}

async function testReaderDeepLink(browser, server, target) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  const readerRasterRequests = []
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname
    if (/\/reader-legacy\/images\/|\/reader-legacy\/.*\.(?:avif|jpe?g|png|webp)$/i.test(pathname))
      readerRasterRequests.push(pathname)
  })
  await page.addInitScript(() => {
    window.__readerHistoryEvents = []
    for (const method of ['pushState', 'replaceState']) {
      const original = history[method].bind(history)
      history[method] = (...args) => {
        window.__readerHistoryEvents.push({ method, url: String(args[2] ?? location.href) })
        return original(...args)
      }
    }
    window.addEventListener('hashchange', () => {
      window.__readerHistoryEvents.push({ method: 'hashchange', url: location.href })
    })
  })

  const response = await page.goto(`${server.baseUrl}reader-legacy/#slide-${target}`, { waitUntil: 'domcontentloaded' })
  assert(response?.status() === 200, `Reader slide ${target} direct load did not return HTTP 200.`)
  await page.locator(`.reader-pages[data-reader-ready="true"][data-reader-current="${target}"]`).waitFor()
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))

  const state = await page.evaluate((number) => {
    const scroller = document.querySelector('.reader-pages')
    const targetPage = document.querySelector(`#slide-${number}`)
    return {
      hash: location.hash,
      offset: Math.abs(targetPage.getBoundingClientRect().top - scroller.getBoundingClientRect().top),
      counter: targetPage.querySelector('.reader-page__position')?.textContent?.replace(/\s+/g, ' ').trim(),
      activeSlide: document.activeElement?.closest('.reader-page')?.id ?? '',
      events: window.__readerHistoryEvents,
    }
  }, target)
  assert(state.hash === `#slide-${target}`, `Reader cold load changed slide ${target} to ${state.hash}.`)
  assert(state.offset <= 1, `Reader cold load left slide ${target} at a ${state.offset}px offset.`)
  assert(state.counter?.includes(`${String(target).padStart(2, '0')} / 31`), `Reader cold load counter is wrong for slide ${target}.`)
  assert(state.activeSlide === '', `Reader cold load unexpectedly moved focus into ${state.activeSlide}.`)
  assert(state.events.length === 0, `Reader cold load polluted history for slide ${target}: ${JSON.stringify(state.events)}`)

  await page.waitForTimeout(250)
  assert(readerRasterRequests.length === 0, `Reader slide ${target} requested obsolete full-slide raster assets: ${readerRasterRequests.join(', ')}`)
  assert(await page.locator('.reader-page img').count() === 0, `Reader slide ${target} still contains a full-slide raster image.`)
  await context.close()
}

async function waitForReaderSlide(page, target) {
  await page.waitForFunction((number) => {
    const scroller = document.querySelector('.reader-pages')
    const slide = document.querySelector(`#slide-${number}`)
    return location.hash === `#slide-${number}`
      && scroller?.dataset.readerCurrent === String(number)
      && scroller?.dataset.readerSettled === String(number)
      && Math.abs(slide.getBoundingClientRect().top - scroller.getBoundingClientRect().top) <= 1
  }, target)
}

async function testReaderHistory(browser, server) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.addInitScript(() => {
    window.__readerHistoryEvents = []
    for (const method of ['pushState', 'replaceState']) {
      const original = history[method].bind(history)
      history[method] = (...args) => {
        window.__readerHistoryEvents.push({ method, hash: new URL(String(args[2] ?? location.href), location.href).hash })
        return original(...args)
      }
    }
    window.addEventListener('hashchange', () => {
      window.__readerHistoryEvents.push({ method: 'hashchange', hash: location.hash })
    })
  })
  await page.goto(`${server.baseUrl}reader-legacy/#slide-21`, { waitUntil: 'domcontentloaded' })
  await page.locator('.reader-pages[data-reader-ready="true"][data-reader-current="21"]').waitFor()
  await page.evaluate(() => { window.__readerHistoryEvents = [] })

  await page.locator('#slide-21 a[href="#slide-22"]').click()
  await waitForReaderSlide(page, 22)
  await page.locator('#slide-22 [data-reader-dialog]').click()
  await page.goBack()
  await waitForReaderSlide(page, 21)
  assert(await page.locator('dialog.reader-dialog[open]').count() === 0, 'Reader Back left the departing slide dialog open.')
  const backState = await page.evaluate(() => ({
    activeSlide: document.activeElement?.closest('.reader-page')?.id ?? '',
    counter: document.querySelector('#slide-21 .reader-page__position')?.textContent?.replace(/\s+/g, ' ').trim(),
  }))
  assert(backState.activeSlide === 'slide-21', `Reader Back returned focus to an off-screen slide: ${backState.activeSlide}`)
  assert(backState.counter?.includes('21 / 31'), 'Reader Back did not restore the slide 21 counter.')
  await page.goForward()
  await waitForReaderSlide(page, 22)
  assert(await page.locator('dialog.reader-dialog[open]').count() === 0, 'Reader Forward unexpectedly reopened a dialog.')
  assert(await page.evaluate(() => document.activeElement?.closest('.reader-page')?.id) === 'slide-22', 'Reader Forward left focus on the previous page.')

  const events = await page.evaluate(() => window.__readerHistoryEvents)
  assert(events.length === 3, `Reader Back/Forward produced unexpected history events: ${JSON.stringify(events)}`)
  assert(events[0].method === 'pushState' && events[0].hash === '#slide-22', `Reader forward control did not create one intended history entry: ${JSON.stringify(events)}`)
  assert(events[1].method === 'hashchange' && events[1].hash === '#slide-21', `Reader Back polluted the intermediate hash: ${JSON.stringify(events)}`)
  assert(events[2].method === 'hashchange' && events[2].hash === '#slide-22', `Reader Forward polluted the intermediate hash: ${JSON.stringify(events)}`)
  await context.close()
}

async function testReaderDialogNavigation(browser, server, contextOptions) {
  const context = await browser.newContext(contextOptions)
  const page = await context.newPage()
  await page.goto(`${server.baseUrl}reader-legacy/#slide-21`, { waitUntil: 'domcontentloaded' })
  await page.locator('.reader-pages[data-reader-ready="true"][data-reader-current="21"]').waitFor()

  await page.locator('#slide-21 [data-reader-dialog]').click()
  await page.keyboard.press('PageDown')
  await waitForReaderSlide(page, 22)
  assert(await page.locator('dialog.reader-dialog[open]').count() === 0, 'Reader PageDown left the departing dialog open.')
  assert(await page.evaluate(() => document.activeElement?.closest('.reader-page')?.id) === 'slide-22', 'Reader PageDown returned focus to the departing slide.')

  await page.locator('#slide-22 [data-reader-dialog]').click()
  await page.locator('#slide-22 a[href="#slide-21"]').dispatchEvent('click')
  await waitForReaderSlide(page, 21)
  assert(await page.locator('dialog.reader-dialog[open]').count() === 0, 'Reader previous control left the departing dialog open.')
  assert(await page.evaluate(() => document.activeElement?.closest('.reader-page')?.id) === 'slide-21', 'Reader previous control did not focus the destination page.')

  await page.locator('#slide-21 [data-reader-dialog]').click()
  await page.locator('.reader-skip').dispatchEvent('click')
  await waitForReaderSlide(page, 1)
  assert(await page.locator('dialog.reader-dialog[open]').count() === 0, 'Reader hash link left the departing dialog open.')
  assert(await page.evaluate(() => document.activeElement?.closest('.reader-page')?.id) === 'slide-1', 'Reader hash link did not focus the destination page.')

  const opener = page.locator('#slide-1 [data-reader-dialog]')
  await opener.click()
  await page.keyboard.press('Escape')
  assert(await opener.evaluate(element => element === document.activeElement), 'Reader same-slide dialog close did not return focus to its opener.')
  await context.close()
}

async function testReaderProgrammaticFocus(browser, server, contextOptions) {
  const context = await browser.newContext(contextOptions)
  const page = await context.newPage()
  await page.goto(`${server.baseUrl}reader-legacy/#slide-21`, { waitUntil: 'domcontentloaded' })
  await page.locator('.reader-pages[data-reader-ready="true"][data-reader-current="21"]').waitFor()

  const assertFocus = async (target, action) => {
    await waitForReaderSlide(page, target)
    const activeSlide = await page.evaluate(() => document.activeElement?.closest('.reader-page')?.id ?? '')
    assert(activeSlide === `slide-${target}`, `Reader ${action} focused ${activeSlide || 'no page'} instead of slide-${target}.`)
  }

  await page.locator('#slide-21 a[href="#slide-22"]').click()
  await assertFocus(22, 'next control')
  await page.goBack()
  await assertFocus(21, 'Back')
  await page.goForward()
  await assertFocus(22, 'Forward')
  await page.keyboard.press('ArrowUp')
  await assertFocus(21, 'ArrowUp')
  await page.keyboard.press('PageDown')
  await assertFocus(22, 'PageDown')
  await page.locator('.reader-skip').dispatchEvent('click')
  await assertFocus(1, 'hash link')

  const manualFocus = page.locator('#slide-1 [data-reader-dialog]')
  await manualFocus.focus()
  await page.locator('.reader-pages').evaluate((element) => {
    element.scrollTop = document.querySelector('#slide-2').offsetTop
  })
  await page.waitForFunction(() => location.hash === '#slide-2')
  assert(await manualFocus.evaluate(element => element === document.activeElement), 'Reader manual scroll forcibly moved focus to the visible page.')
  await context.close()
}

async function testReaderViewportFit(browser, server, viewport) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto(`${server.baseUrl}reader-legacy/#slide-1`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.locator('.reader-pages[data-reader-ready="true"]').waitFor()

  const results = await page.locator('.reader-page').evaluateAll((articles) => {
    const meaningfulSelector = [
      'svg',
      'section',
      'blockquote',
      'ol',
      'ul',
      'dl',
      '.pv-cover__loop',
      '.pv-chapter__mark',
      '.pv-nested__layer',
      '.pv-closing__halo',
      '.pv-split__axis',
      '.pv-launch__spine',
      '.pv-equation__beam',
      '.pv-sources__rail',
    ].join(',')

    return articles.map((article) => {
      const stage = article.querySelector('[data-reader-stage]')
      const visual = article.querySelector('[data-reader-visual]')
      const frame = article.querySelector('.reader-page__frame')
      const title = article.querySelector('.reader-page__title h2')
      const controls = [...article.querySelectorAll('.reader-page__controls > *')]
      const articleRect = article.getBoundingClientRect()
      const stageRect = stage?.getBoundingClientRect()
      const visualRect = visual?.getBoundingClientRect()
      return {
        number: Number(article.dataset.slide),
        height: articleRect.height,
        articleOverflow: article.scrollHeight - article.clientHeight,
        stageOverflow: stage ? stage.scrollHeight - stage.clientHeight : Infinity,
        visualOverflowX: stageRect && visualRect ? Math.max(0, stageRect.left - visualRect.left, visualRect.right - stageRect.right) : Infinity,
        visualOverflowY: stageRect && visualRect ? Math.max(0, stageRect.top - visualRect.top, visualRect.bottom - stageRect.bottom) : Infinity,
        visualWidth: visualRect?.width ?? 0,
        visualHeight: visualRect?.height ?? 0,
        visualKind: visual?.getAttribute('data-reader-visual-kind') ?? '',
        visualText: visual?.textContent?.replace(/\s+/g, '').length ?? 0,
        visualStructure: visual?.querySelectorAll(meaningfulSelector).length ?? 0,
        titleHeight: title?.getBoundingClientRect().height ?? 0,
        frameWidth: frame?.getBoundingClientRect().width ?? 0,
        minControlWidth: controls.length ? Math.min(...controls.map(control => control.getBoundingClientRect().width)) : 0,
        minControlHeight: controls.length ? Math.min(...controls.map(control => control.getBoundingClientRect().height)) : 0,
        snapAlign: getComputedStyle(article).scrollSnapAlign,
        snapStop: getComputedStyle(article).scrollSnapStop,
        overflowSafe: article.closest('.reader-pages')?.getAttribute('data-reader-overflow-safe') === 'true',
      }
    })
  })

  assert(results.length === 31, `Reader ${viewport.width}x${viewport.height} contains ${results.length} pages.`)
  for (const result of results) {
    const label = `Reader page ${result.number} at ${viewport.width}x${viewport.height}`
    assert(Math.abs(result.height - viewport.height) <= 1, `${label} is ${result.height}px high.`)
    assert(result.articleOverflow <= 1 && result.stageOverflow <= 1, `${label} overflows (${result.articleOverflow}px article, ${result.stageOverflow}px stage).`)
    assert(result.visualOverflowX <= 1 && result.visualOverflowY <= 1, `${label} clips its portrait visual.`)
    assert(result.visualWidth >= Math.min(300, viewport.width - 48) && result.visualHeight >= 120, `${label} has an undersized portrait visual.`)
    assert(result.visualKind && result.visualStructure >= 1, `${label} is missing a meaningful non-text visual structure.`)
    assert(result.visualText >= 4 && result.visualText <= 380, `${label} has ${result.visualText} visible visual characters.`)
    assert(result.titleHeight <= Math.max(82, viewport.height * 0.12), `${label} has an oversized title block.`)
    assert(result.minControlWidth >= 44 && result.minControlHeight >= 44, `${label} has an undersized control.`)
    assert(result.snapAlign === 'start' && result.snapStop === 'always', `${label} is missing mandatory page snap behavior.`)
    assert(!result.overflowSafe, `${label} unexpectedly enabled the extreme-view fallback.`)
    if (viewport.width >= 864)
      assert(result.frameWidth <= 550, `${label} stretches the portrait canvas to ${result.frameWidth}px.`)
  }

  const pageState = await page.evaluate(() => ({
    horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    snapType: getComputedStyle(document.querySelector('.reader-pages')).scrollSnapType,
    rasterImages: document.querySelectorAll('.reader-page img').length,
  }))
  assert(pageState.horizontalOverflow <= 1, `Reader has ${pageState.horizontalOverflow}px horizontal overflow at ${viewport.width}px.`)
  assert(pageState.snapType.includes('y') && pageState.snapType.includes('mandatory'), `Reader scroll snap is not mandatory at ${viewport.width}x${viewport.height}.`)
  assert(pageState.rasterImages === 0, `Reader still has ${pageState.rasterImages} full-slide raster images.`)
  await context.close()
}

async function testReader(browser, server, screenshots) {
  for (const target of [31, 21, 1, 31, 21])
    await testReaderDeepLink(browser, server, target)
  await testReaderHistory(browser, server)
  await testReaderDialogNavigation(browser, server, {
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  })
  await testReaderDialogNavigation(browser, server, {
    viewport: { width: 1280, height: 720 },
  })
  await testReaderProgrammaticFocus(browser, server, {
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  })
  await testReaderProgrammaticFocus(browser, server, {
    viewport: { width: 1280, height: 720 },
  })
  await testReaderViewportFit(browser, server, { width: 390, height: 844 })
  await testReaderViewportFit(browser, server, { width: 430, height: 932 })
  await testReaderViewportFit(browser, server, { width: 1280, height: 720 })

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  const readerErrors = []
  page.on('console', (message) => {
    if (message.type() === 'error')
      readerErrors.push(message.text())
  })

  const response = await page.goto(`${server.baseUrl}reader-legacy/#slide-1`, { waitUntil: 'networkidle' })
  assert(response?.status() === 200, 'Reader deep reload did not return HTTP 200.')
  assert((await fetch(server.baseUrl)).ok, 'Reader return link does not resolve to the deck.')
  assert((await fetch(`${server.baseUrl}reader-legacy/reader.css`)).ok, 'Reader stylesheet does not resolve under the production base.')
  assert((await fetch(`${server.baseUrl}reader-legacy/reader.js`)).ok, 'Reader script does not resolve under the production base.')

  const pages = page.locator('article.reader-page')
  assert(await pages.count() === 31, 'Reader does not contain 31 snap pages.')
  assert(await page.locator('dialog.reader-dialog--detail').count() === 31, 'Reader does not contain 31 detail dialogs.')
  assert(await page.locator('aside.reader-note').count() === 31, 'Reader does not retain 31 presenter notes.')
  assert(await page.locator('main.reader-pages').count() === 1 && await page.locator('h1').count() === 1 && await page.locator('.reader-page__title h2').count() === 31, 'Reader landmarks or heading hierarchy are incomplete.')
  assert(await page.locator('figure[data-reader-visual]').count() === 31, 'Reader does not contain one native portrait visual per page.')
  assert(await page.locator('dialog#reader-search-dialog').count() === 1 && await page.locator('#reader-search-data').count() === 1, 'Reader search dialog or static search index is missing.')
  for (const [slideNumber, expectedSources] of [[7, 2], [13, 12], [20, 2]]) {
    const sourceCount = await page.locator(`#reader-dialog-${slideNumber} .reader-sources a`).count()
    assert(sourceCount === expectedSources, `Reader slide ${slideNumber} retained ${sourceCount}/${expectedSources} RevealTabs sources.`)
  }

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  assert(horizontalOverflow <= 1, `Reader has ${horizontalOverflow}px horizontal overflow at 390px.`)

  const scrollerStyle = await page.locator('.reader-pages').evaluate(element => ({
    behavior: getComputedStyle(element).scrollBehavior,
    snapType: getComputedStyle(element).scrollSnapType,
  }))
  assert(scrollerStyle.snapType.includes('y') && scrollerStyle.snapType.includes('mandatory'), `Reader scroll snap is not mandatory: ${scrollerStyle.snapType}`)
  assert(scrollerStyle.behavior === 'auto', 'Reader does not disable smooth scrolling for reduced motion.')

  const manifest = JSON.parse(await fs.readFile(path.join(out, 'reader-legacy', 'reader-manifest.json'), 'utf8'))
  assert(manifest.source === 'slides.md' && manifest.slides?.length === 31, 'Reader manifest is missing its 31 canonical slide mappings.')
  assert(manifest.slides.every((entry, index) => entry.number === index + 1 && entry.note && entry.type && entry.variant), 'Reader manifest has an incomplete slide mapping.')
  assert(manifest.slides.every(entry => Object.values(entry.visualFragments).every(count => count > 0)), 'Reader manifest accepted a missing canonical visual fragment.')
  const readerImages = await fs.readdir(path.join(out, 'reader-legacy', 'images')).catch(error => error.code === 'ENOENT' ? [] : Promise.reject(error))
  assert(readerImages.length === 0, `Reader retained obsolete raster assets: ${readerImages.join(', ')}`)

  for (let index = 0; index < await pages.count(); index += 1) {
    const number = index + 1
    const readerPage = pages.nth(index)
    const metrics = await readerPage.evaluate((element) => {
      const style = getComputedStyle(element)
      const stage = element.querySelector('[data-reader-stage]')
      const visual = element.querySelector('[data-reader-visual]')
      const figure = visual?.getBoundingClientRect()
      const stageRect = stage?.getBoundingClientRect()
      const caption = visual?.querySelector('figcaption')
      const controls = [...element.querySelectorAll('.reader-page__controls > *')].map(control => control.getBoundingClientRect())
      const meaningfulSelector = 'svg, section, blockquote, ol, ul, dl, .pv-cover__loop, .pv-chapter__mark, .pv-nested__layer, .pv-closing__halo, .pv-split__axis, .pv-launch__spine, .pv-equation__beam, .pv-sources__rail'
      return {
        height: element.getBoundingClientRect().height,
        internalOverflow: element.scrollHeight - element.clientHeight,
        stageOverflow: stage ? stage.scrollHeight - stage.clientHeight : Infinity,
        snapAlign: style.scrollSnapAlign,
        snapStop: style.scrollSnapStop,
        counter: element.querySelector('.reader-page__position')?.textContent?.replace(/\s+/g, ' ').trim(),
        title: element.querySelector('.reader-page__title h2')?.textContent?.trim() ?? '',
        titleId: element.querySelector('.reader-page__title h2')?.id ?? '',
        visualKind: visual?.getAttribute('data-reader-visual-kind') ?? '',
        visualText: visual?.textContent?.replace(/\s+/g, '').length ?? 0,
        visualStructure: visual?.querySelectorAll(meaningfulSelector).length ?? 0,
        visualOverflowX: stageRect && figure ? Math.max(0, stageRect.left - figure.left, figure.right - stageRect.right) : Infinity,
        visualOverflowY: stageRect && figure ? Math.max(0, stageRect.top - figure.top, figure.bottom - stageRect.bottom) : Infinity,
        caption: caption?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
        describedBy: visual?.getAttribute('aria-describedby') ?? '',
        rasterCount: element.querySelectorAll('img').length,
        overflowSafe: element.closest('.reader-pages')?.getAttribute('data-reader-overflow-safe') === 'true',
        figure: figure ? { width: figure.width, height: figure.height } : null,
        controls: controls.map(rect => ({ width: rect.width, height: rect.height })),
      }
    })
    assert(Math.abs(metrics.height - 844) <= 1, `Reader page ${number} is ${metrics.height}px instead of one 844px viewport.`)
    assert(metrics.internalOverflow <= 1 && metrics.stageOverflow <= 1, `Reader page ${number} overflows (${metrics.internalOverflow}px article, ${metrics.stageOverflow}px stage).`)
    assert(metrics.snapAlign === 'start' && metrics.snapStop === 'always', `Reader page ${number} is missing snap alignment or stop.`)
    assert(metrics.counter?.includes(`${String(number).padStart(2, '0')} / 31`), `Reader page ${number} counter is incorrect.`)
    assert(metrics.title && metrics.titleId === `slide-title-${number}`, `Reader page ${number} title is missing or disconnected.`)
    assert(metrics.visualKind && metrics.visualStructure >= 1, `Reader page ${number} lacks a meaningful native visual structure.`)
    assert(metrics.visualText >= 4 && metrics.visualText <= 380, `Reader page ${number} has ${metrics.visualText} visible visual characters.`)
    assert(metrics.figure && metrics.figure.width >= 300 && metrics.figure.height >= 120, `Reader page ${number} portrait visual is too small at 390x844.`)
    assert(metrics.visualOverflowX <= 1 && metrics.visualOverflowY <= 1, `Reader page ${number} clips its portrait visual.`)
    assert(metrics.caption.includes(`Slide ${String(number).padStart(2, '0')}`) && metrics.caption.includes(metrics.title), `Reader page ${number} has an incomplete visual caption.`)
    assert(metrics.describedBy === `reader-visual-caption-${number}`, `Reader page ${number} visual is disconnected from its caption.`)
    assert(metrics.rasterCount === 0, `Reader page ${number} contains an obsolete full-slide raster.`)
    assert(!metrics.overflowSafe, `Reader page ${number} unexpectedly enabled the extreme-view fallback at 390x844.`)
    assert(metrics.controls.every(rect => rect.width >= 44 && rect.height >= 44), `Reader page ${number} has an undersized navigation control.`)
  }

  const representative = [5, 7, 9, 13, 14, 16, 17, 20, 21, 26, 29]
  for (const number of representative) {
    const visual = await page.locator(`#slide-${number} [data-reader-visual]`).boundingBox()
    assert(visual && visual.width >= 300 && visual.height >= 120, `Reader slide ${number} does not preserve a legible native portrait visual.`)
  }

  const rawHtml = await (await fetch(`${server.baseUrl}reader-legacy/`)).text()
  assert((rawHtml.match(/<article\s+class="reader-page\b/g) ?? []).length === 31, 'Reader initial HTML is missing slide pages.')
  assert((rawHtml.match(/<aside class="reader-note"/g) ?? []).length === 31, 'Reader initial HTML is missing notes.')
  assert((rawHtml.match(/<dialog class="reader-dialog reader-dialog--detail"/g) ?? []).length === 31, 'Reader initial HTML is missing detail dialogs.')
  assert((rawHtml.match(/<figure\s+class="portrait-visual/g) ?? []).length === 31, 'Reader initial HTML is missing native portrait visuals.')
  assert((rawHtml.match(/data-reader-visual-kind=/g) ?? []).length === 31, 'Reader initial HTML is missing visual type metadata.')
  assert((rawHtml.match(/<img/g) ?? []).length === 0 && !rawHtml.includes('/reader-legacy/images/'), 'Reader initial HTML still references full-slide raster images.')
  assert(rawHtml.includes('id="reader-search-dialog"') && rawHtml.includes('id="reader-search-data"'), 'Reader initial HTML is missing searchable static content.')
  assert(!rawHtml.includes(server.origin), `Reader HTML leaked its temporary build origin: ${server.origin}`)
  assert(!/(?:localhost|127\.0\.0\.1|\[?::1\]?)(?::\d+)?/i.test(rawHtml), 'Reader HTML contains a loopback URL.')
  const absoluteInternalLinks = await page.locator('a[href^="http://"], a[href^="https://"]').evaluateAll(anchors => anchors
    .map(anchor => anchor.href)
    .filter(href => new URL(href).origin === location.origin))
  assert(absoluteInternalLinks.length === 0, `Reader contains absolute same-origin links: ${absoluteInternalLinks.join(', ')}`)

  await page.goto(`${server.baseUrl}reader-legacy/#slide-21`, { waitUntil: 'networkidle' })
  const reloadResponse = await page.reload({ waitUntil: 'networkidle' })
  assert(reloadResponse?.status() === 200 && page.url().endsWith('#slide-21'), 'Reader slide hash does not survive direct reload.')
  await page.waitForTimeout(100)
  const slide21Offset = await page.locator('#slide-21').evaluate((element) => {
    const scroller = document.querySelector('.reader-pages')
    return Math.abs(element.getBoundingClientRect().top - scroller.getBoundingClientRect().top)
  })
  assert(slide21Offset <= 1, `Reader reload did not restore slide 21 (${slide21Offset}px offset).`)

  const searchButton = page.locator('#slide-21 [data-reader-search]')
  const searchChrome = await searchButton.evaluate((button) => {
    const header = button.closest('.reader-page__header')
    const buttonRect = button.getBoundingClientRect()
    const headerRect = header?.getBoundingClientRect()
    return {
      buttonWidth: buttonRect.width,
      buttonHeight: buttonRect.height,
      headerHeight: headerRect?.height ?? 0,
    }
  })
  assert(
    searchChrome.buttonWidth >= 44
      && searchChrome.buttonHeight >= 44
      && searchChrome.headerHeight <= 45
      && searchChrome.buttonHeight <= searchChrome.headerHeight + 1,
    `Reader search does not fit its 44px page chrome: ${JSON.stringify(searchChrome)}`,
  )
  await searchButton.click()
  const searchDialog = page.locator('#reader-search-dialog')
  const searchInput = searchDialog.locator('[data-reader-search-input]')
  assert(await searchDialog.getAttribute('open') !== null, 'Reader search dialog did not open.')
  assert(await searchInput.evaluate(element => element === document.activeElement), 'Reader search did not focus its input.')
  assert(await searchDialog.locator('[data-reader-search-results] a').count() === 31, 'Reader search does not expose all 31 pages before filtering.')
  await searchInput.fill('__reader_no_match__')
  assert(await searchDialog.locator('[data-reader-search-results] a').count() === 0, 'Reader search no-match fixture unexpectedly found a page.')
  await page.keyboard.press('Tab')
  assert(await searchDialog.locator('[data-reader-close]').evaluate(element => element === document.activeElement), 'Reader search focus escaped after its no-match input.')
  await page.keyboard.press('Shift+Tab')
  assert(await searchInput.evaluate(element => element === document.activeElement), 'Reader search focus trap could not return to its no-match input.')
  await page.keyboard.press('Escape')
  assert(await searchDialog.getAttribute('open') === null, 'Reader search dialog did not close with Escape.')
  assert(await searchButton.evaluate(element => element === document.activeElement), 'Reader search dialog did not return focus to its opener.')

  await searchButton.click()
  await searchInput.fill('platform.openai.com/docs/guides/prompt-engineering')
  let searchMatches = searchDialog.locator('[data-reader-search-results] a')
  const sourceSearchTargets = await searchMatches.evaluateAll(anchors => anchors.map(anchor => anchor.getAttribute('href')))
  assert(sourceSearchTargets.includes('#slide-13'), `Reader search did not index sources from every RevealTabs state: ${JSON.stringify(sourceSearchTargets)}`)
  await searchInput.fill('ひとりで抱え込ませる')
  searchMatches = searchDialog.locator('[data-reader-search-results] a')
  assert(await searchMatches.count() === 1 && await searchMatches.first().getAttribute('href') === '#slide-18', 'Reader search did not index closed presenter notes.')
  await searchInput.fill('aider.chat')
  searchMatches = searchDialog.locator('[data-reader-search-results] a')
  assert(await searchMatches.count() === 1 && await searchMatches.first().getAttribute('href') === '#slide-18', 'Reader search did not index closed source URLs.')
  await searchInput.fill('ひとりで抱え込ませる')
  searchMatches = searchDialog.locator('[data-reader-search-results] a')
  await searchMatches.first().focus()
  await page.keyboard.press('Enter')
  await waitForReaderSlide(page, 18)
  assert(await searchDialog.getAttribute('open') === null, 'Reader search stayed open after result navigation.')
  const searchDestination = await page.locator('#slide-18').evaluate((element) => {
    const scroller = element.closest('.reader-pages')
    return {
      hash: location.hash,
      current: scroller?.dataset.readerCurrent,
      settled: scroller?.dataset.readerSettled,
      counter: element.querySelector('.reader-page__position')?.textContent?.replace(/\s+/g, ' ').trim(),
      activeSlide: document.activeElement?.closest('.reader-page')?.id,
    }
  })
  assert(
    searchDestination.hash === '#slide-18'
      && searchDestination.current === '18'
      && searchDestination.settled === '18'
      && searchDestination.counter?.includes('18 / 31')
      && searchDestination.activeSlide === 'slide-18',
    `Reader search did not synchronize its destination: ${JSON.stringify(searchDestination)}`,
  )
  await page.goto(`${server.baseUrl}reader-legacy/#slide-21`, { waitUntil: 'networkidle' })
  await page.locator('.reader-pages[data-reader-ready="true"][data-reader-current="21"]').waitFor()

  const opener = page.locator('#slide-21 [data-reader-dialog]')
  const pageTopBeforeDialog = await page.locator('#slide-21').evaluate(element => element.getBoundingClientRect().top)
  await opener.click()
  const dialog = page.locator('#reader-dialog-21')
  assert(await dialog.getAttribute('open') !== null, 'Reader detail dialog did not open.')
  assert(await dialog.locator('[data-reader-close]').evaluate(element => element === document.activeElement), 'Reader dialog did not place focus on its close control.')
  await page.keyboard.press('Shift+Tab')
  assert(await dialog.evaluate(element => element.contains(document.activeElement)), 'Reader dialog does not trap keyboard focus.')
  const dialogScroll = dialog.locator('.reader-dialog__scroll')
  const dialogOverflow = await dialogScroll.evaluate(element => element.scrollHeight - element.clientHeight)
  assert(dialogOverflow > 0, 'Reader dialog does not provide an internal scroll area for long details.')
  await dialogScroll.evaluate(element => { element.scrollTop = 0 })
  await dialogScroll.focus()
  const keyboardDialogHash = new URL(page.url()).hash
  await page.keyboard.press('PageDown')
  assert(await dialog.getAttribute('open') !== null, 'Reader PageDown closed an open detail dialog.')
  assert(await dialogScroll.evaluate(element => element.scrollTop) > 0, 'Reader PageDown did not scroll the detail dialog.')
  assert(new URL(page.url()).hash === keyboardDialogHash, 'Reader PageDown navigated the deck behind a detail dialog.')
  assert(await dialog.evaluate(element => element.contains(document.activeElement)), 'Reader PageDown moved focus outside the detail dialog.')
  await page.keyboard.press('PageUp')
  assert(await dialogScroll.evaluate(element => element.scrollTop) === 0, 'Reader PageUp did not scroll the detail dialog back.')
  await dialogScroll.evaluate(element => { element.scrollTop = element.scrollHeight })
  assert(await dialogScroll.evaluate(element => element.scrollTop) > 0, 'Reader dialog content cannot be scrolled.')
  assert(Math.abs(await page.locator('#slide-21').evaluate(element => element.getBoundingClientRect().top) - pageTopBeforeDialog) <= 1, 'Opening Reader details shifted the slide page.')
  const dialogHash = new URL(page.url()).hash
  const dialogPageTop = await page.locator('.reader-pages').evaluate((element) => {
    const top = element.scrollTop
    element.scrollTop += element.clientHeight
    return top
  })
  await page.waitForTimeout(100)
  assert(new URL(page.url()).hash === dialogHash, 'Reader observer changed the hash behind an open dialog.')
  await page.locator('.reader-pages').evaluate((element, top) => { element.scrollTop = top }, dialogPageTop)
  await page.keyboard.press('Escape')
  assert(await dialog.getAttribute('open') === null, 'Reader dialog did not close with Escape.')
  assert(await opener.evaluate(element => element === document.activeElement), 'Reader dialog did not return focus to its opener.')
  await opener.click()
  await dialog.evaluate(element => element.dispatchEvent(new MouseEvent('click', { bubbles: true })))
  assert(await dialog.getAttribute('open') === null, 'Reader dialog did not close from a backdrop click.')

  const next = page.locator('#slide-21 .reader-page__controls a[href="#slide-22"]')
  await next.click()
  await page.waitForTimeout(100)
  assert(page.url().endsWith('#slide-22'), 'Reader next control did not update the hash.')
  await page.goBack()
  await page.waitForTimeout(100)
  assert(page.url().endsWith('#slide-21'), 'Reader browser Back did not restore the prior page.')
  await page.goForward()
  await page.waitForTimeout(100)
  assert(page.url().endsWith('#slide-22'), 'Reader browser Forward did not restore the intended page.')
  await page.goBack()
  await page.waitForTimeout(100)
  assert(page.url().endsWith('#slide-21'), 'Reader second browser Back did not restore the prior page.')
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur())
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(100)
  assert(page.url().endsWith('#slide-22'), 'Reader ArrowDown did not move to the next page.')
  await page.keyboard.press('PageDown')
  await page.waitForTimeout(100)
  assert(page.url().endsWith('#slide-23'), 'Reader PageDown did not move to the next page.')
  await page.keyboard.press('ArrowUp')
  await page.waitForTimeout(100)
  assert(page.url().endsWith('#slide-22'), 'Reader ArrowUp did not move to the previous page.')
  await page.keyboard.press('PageUp')
  await page.waitForTimeout(100)
  assert(page.url().endsWith('#slide-21'), 'Reader PageUp did not move to the previous page.')

  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px'
    window.dispatchEvent(new Event('resize'))
  })
  await page.waitForFunction(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize) >= 31.5)
  await page.evaluate(() => updateOverflowSafety())
  await page.locator('.reader-pages[data-reader-overflow-safe="true"]').waitFor({ state: 'attached' })
  await page.waitForFunction(() => {
    const stage = document.querySelector('#slide-21 [data-reader-stage]')
    return stage && stage.scrollHeight > stage.clientHeight
  })
  const zoomState = await page.locator('#slide-21').evaluate((element) => {
    const stage = element.querySelector('[data-reader-stage]')
    stage.scrollTop = 0
    const before = stage.scrollTop
    stage.scrollTop = stage.scrollHeight
    const result = {
      pageHeight: element.getBoundingClientRect().height,
      stageOverflow: stage.scrollHeight - stage.clientHeight,
      stageOverflowY: getComputedStyle(stage).overflowY,
      canScroll: stage.scrollTop > before,
    }
    stage.scrollTop = 0
    return result
  })
  assert(Math.abs(zoomState.pageHeight - 844) <= 1, 'Reader changed page boundaries at 200% text size.')
  assert(
    zoomState.stageOverflow > 0 && zoomState.stageOverflowY === 'auto' && zoomState.canScroll,
    `Reader did not expose its extreme text-zoom safety scroll area: ${JSON.stringify(zoomState)}`,
  )
  await page.evaluate(() => {
    document.documentElement.style.fontSize = ''
    window.dispatchEvent(new Event('resize'))
  })
  await page.waitForFunction(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize) < 31.5)
  await page.evaluate(() => updateOverflowSafety())
  await page.waitForFunction(() => !document.querySelector('.reader-pages[data-reader-overflow-safe]'))

  if (screenshots) {
    for (const number of representative) {
      await page.goto(`${server.baseUrl}reader-legacy/#slide-${number}`, { waitUntil: 'networkidle' })
      await page.screenshot({ path: path.join(screenshots, `after-reader-page-${String(number).padStart(2, '0')}-390x844.png`), fullPage: false })
    }
    await page.goto(`${server.baseUrl}reader-legacy/#slide-7`, { waitUntil: 'networkidle' })
    await page.locator('#slide-7 [data-reader-dialog]').click()
    await page.screenshot({ path: path.join(screenshots, 'after-reader-dialog-07-390x844.png'), fullPage: false })
  }

  assert(readerErrors.length === 0, `Reader console errors: ${readerErrors.join(' | ')}`)
  await context.close()

  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const desktopPage = await desktopContext.newPage()
  await desktopPage.goto(`${server.baseUrl}reader-legacy/#slide-21`, { waitUntil: 'networkidle' })
  const desktopMetrics = await desktopPage.locator('#slide-21').evaluate((element) => {
    const visual = element.querySelector('[data-reader-visual]')?.getBoundingClientRect()
    const stage = element.querySelector('[data-reader-stage]')
    const frame = element.querySelector('.reader-page__frame')?.getBoundingClientRect()
    return {
      height: element.getBoundingClientRect().height,
      internalOverflow: element.scrollHeight - element.clientHeight,
      stageOverflow: stage ? stage.scrollHeight - stage.clientHeight : Infinity,
      visual: visual ? { width: visual.width, height: visual.height } : null,
      frameWidth: frame?.width ?? 0,
      overflowSafe: element.hasAttribute('data-reader-overflow-safe'),
    }
  })
  assert(Math.abs(desktopMetrics.height - 720) <= 1 && desktopMetrics.internalOverflow <= 1 && desktopMetrics.stageOverflow <= 1, 'Desktop Reader page is not exactly one viewport.')
  assert(desktopMetrics.visual && desktopMetrics.visual.width >= 420 && desktopMetrics.visual.height >= 120, 'Desktop Reader portrait visual is too small.')
  assert(desktopMetrics.frameWidth <= 550 && !desktopMetrics.overflowSafe, 'Desktop Reader over-stretches or enabled an unnecessary fallback.')
  if (screenshots)
    await desktopPage.screenshot({ path: path.join(screenshots, 'after-reader-desktop-21-1280x720.png'), fullPage: false })
  await desktopContext.close()

  const lowContext = await browser.newContext({ viewport: { width: 390, height: 520 }, reducedMotion: 'reduce' })
  const lowPage = await lowContext.newPage()
  await lowPage.goto(`${server.baseUrl}reader-legacy/#slide-21`, { waitUntil: 'networkidle' })
  await lowPage.locator('.reader-pages[data-reader-overflow-safe="true"]').waitFor({ state: 'attached' })
  const lowState = await lowPage.locator('#slide-21').evaluate((element) => {
    const stage = element.querySelector('[data-reader-stage]')
    stage.scrollTop = stage.scrollHeight
    return {
      pageHeight: element.getBoundingClientRect().height,
      stageOverflow: stage.scrollHeight - stage.clientHeight,
      stageOverflowY: getComputedStyle(stage).overflowY,
      canScroll: stage.scrollTop > 0,
    }
  })
  assert(Math.abs(lowState.pageHeight - 520) <= 1, 'Reader changed page boundaries at 390x520.')
  assert(lowState.stageOverflow > 0 && lowState.stageOverflowY === 'auto' && lowState.canScroll, 'Reader did not enable the low-height safety scroll area.')
  await lowContext.close()
}

async function testPrimaryReader(browser, server) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const entryResponse = await context.request.get(`${server.baseUrl}reader/`)
  const entryHtml = await entryResponse.text()
  assert(entryResponse.status() === 200, 'Primary horizontal Reader entry did not return HTTP 200.')
  assert(!/<iframe\b/i.test(entryHtml), 'Primary horizontal Reader entry reintroduced an iframe.')

  const dataResponse = await context.request.get(`${server.baseUrl}reader/reader-data.json`)
  const config = await dataResponse.json()
  assert(dataResponse.status() === 200, 'Primary horizontal Reader data does not resolve under the production base.')
  assert(
    config.version === 2
      && config.slides?.length === 31
      && config.slides.every((slide, index) => slide.number === index + 1 && slide.thumbnail),
    'Primary horizontal Reader data has an incomplete canonical mapping.',
  )
  const thumbnailResponses = await Promise.all(config.slides.map(slide => context.request.get(
    new URL(slide.thumbnail, `${server.baseUrl}reader/`).href,
  )))
  assert(
    thumbnailResponses.every(response => response.status() === 200 && response.headers()['content-type']?.startsWith('image/jpeg')),
    'Primary horizontal Reader thumbnails do not all resolve as JPEG images.',
  )

  await page.goto(`${server.baseUrl}reader/#slide-21`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-direct-reader]')
    const slide = document.querySelector('.slidev-page-21')
    const style = slide ? getComputedStyle(slide) : null
    return root
      && window.__mobileViewer?.getState().slide === 21
      && style?.width === '980px'
      && style?.height === '552px'
  })
  const state = await page.evaluate(() => {
    const slide = document.querySelector('.slidev-page-21')
    const style = slide ? getComputedStyle(slide) : null
    return {
      current: document.querySelector('.direct-reader[data-direct-reader]')?.dataset.directReaderCurrent,
      pathname: location.pathname,
      readerQuery: new URLSearchParams(location.search).get('reader'),
      overflowX: document.documentElement.scrollWidth - innerWidth,
      overflowY: document.documentElement.scrollHeight - innerHeight,
      toc: document.querySelectorAll('[data-direct-reader-toc-item]').length,
      thumbnails: document.querySelectorAll('[data-direct-reader-thumbnail]').length,
      currentToc: document.querySelector('[data-direct-reader-toc-select][aria-current="page"]')?.getAttribute('data-direct-reader-toc-select'),
      iframeCount: document.querySelectorAll('iframe').length,
      canvas: style ? { width: style.width, height: style.height } : null,
    }
  })
  assert(
    state.toc === 31 && state.thumbnails === 31 && state.currentToc === '21' && state.iframeCount === 0,
    `Primary Reader is not a direct canonical viewer: ${JSON.stringify(state)}`,
  )
  assert(
    state.current === '21' && state.pathname.endsWith('/21') && state.readerQuery === 'true',
    `Primary Reader did not restore slide 21: ${JSON.stringify(state)}`,
  )
  assert(state.overflowX <= 1 && state.overflowY <= 1, `Primary Reader overflows at 390x844: ${JSON.stringify(state)}`)
  assert(state.canvas?.width === '980px' && state.canvas?.height === '552px', 'Primary Reader changed the canonical slide canvas.')
  await context.close()
}

const out = path.resolve(ROOT, readArg('--out', 'dist'))
const base = normalizeBase(readArg('--base', '/'))
const screenshotsArg = readArg('--screenshots', '')
const screenshots = screenshotsArg ? path.resolve(ROOT, screenshotsArg) : ''
if (screenshots)
  await fs.mkdir(screenshots, { recursive: true })

const server = await startStaticServer({ root: out, base })
const browser = await chromium.launch({ headless: true })
const consoleErrors = []

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()
  page.on('console', message => {
    if (message.type() === 'error')
      consoleErrors.push(message.text())
  })

  let citeCount = 0
  for (let number = 1; number <= 31; number += 1) {
    await page.goto(`${server.baseUrl}${number}`, { waitUntil: 'networkidle' })
    const slide = page.locator(`.slidev-page-${number} .slidev-layout`)
    await slide.waitFor({ state: 'visible' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(350)

    const overflow = await visibleOverflow(slide)
    assert(overflow.length === 0, `Slide ${number} overflows at 1280x720: ${JSON.stringify(overflow)}`)
    assert(await slide.locator('.ico[aria-hidden="true"][role]').count() === 0, `Slide ${number}: decorative Ico has a conflicting role.`)
    if (number === 1) {
      assert(await slide.locator('.cover__reader').count() === 0, 'Cover retained the obsolete mobile Reader CTA.')
      assert(!(await slide.textContent()).includes('スマホで拡大'), 'Cover retained obsolete mobile Reader copy.')
    }
    if (CHAPTER_NUMBERS.has(number))
      await testChapterDivider(slide, number, CHAPTER_NUMBERS.get(number))

    const citations = slide.locator('.cite > summary')
    citeCount += await citations.count()
    for (let citeIndex = 0; citeIndex < await citations.count(); citeIndex += 1) {
      const summary = citations.nth(citeIndex)
      const details = summary.locator('..')
      const before = await slide.locator('h1').first().boundingBox()
      await summary.focus()
      const slideUrl = page.url()
      await page.keyboard.press('Enter')
      assert(await details.getAttribute('open') !== null, `Slide ${number}: citation did not open with Enter.`)
      await page.keyboard.press('Space')
      assert(await details.getAttribute('open') === null, `Slide ${number}: citation did not close with Space.`)
      await page.waitForTimeout(100)
      assert(page.url() === slideUrl, `Slide ${number}: citation keyboard input advanced the deck.`)
      const after = await slide.locator('h1').first().boundingBox()
      if (before && after)
        assert(Math.abs(before.y - after.y) <= 1, `Slide ${number}: citation shifted the slide layout.`)
    }

    if (screenshots && [5, 7, 26].includes(number)) {
      await page.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur())
      await page.screenshot({ path: path.join(screenshots, `after-slide-${String(number).padStart(2, '0')}.png`) })
    }
  }
  assert(citeCount >= 8, `Expected at least 8 citation controls, found ${citeCount}.`)

  for (const slideNumber of [7, 13, 20])
    await testTabs(page, server.baseUrl, slideNumber)

  if (screenshots) {
    await page.goto(`${server.baseUrl}7`, { waitUntil: 'networkidle' })
    const firstTab = page.locator('.slidev-page-7 .rt__tab').first()
    await firstTab.focus()
    await page.screenshot({ path: path.join(screenshots, 'after-slide-07-keyboard-focus.png') })
    const cite = page.locator('.slidev-page-7 .cite > summary').first()
    await cite.click()
    await page.screenshot({ path: path.join(screenshots, 'after-slide-07-cite-open.png') })
  }

  await context.close()
  await testFragmentSanitizer(browser)
  await testMobileChapters(browser, server)
  await testPrimaryReader(browser, server)
  await testReader(browser, server, screenshots)
  assert(consoleErrors.length === 0, `Browser console errors: ${consoleErrors.join(' | ')}`)
  console.log('Production QA passed: 31 slides, accessible tabs/citations, direct horizontal Reader, and legacy portrait Reader.')
}
finally {
  await browser.close()
  await server.close()
}
