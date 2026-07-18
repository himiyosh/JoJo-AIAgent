import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-chromium'
import { normalizeBase, startStaticServer } from './lib/static-server.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)

function readArg(name, fallback) {
  const exact = args.indexOf(name)
  if (exact >= 0 && args[exact + 1])
    return args[exact + 1]
  const inline = args.find(arg => arg.startsWith(`${name}=`))
  return inline ? inline.slice(name.length + 1) : fallback
}

const route = readArg('--route', 'mobile-pilot').replace(/^\/+|\/+$/g, '')
const fullReader = route === 'reader'
const EXPECTED_SLIDES = fullReader
  ? Array.from({ length: 31 }, (_, index) => index + 1)
  : [6, 16, 26]
const routeLabel = fullReader ? 'Mobile Reader' : 'Mobile pilot'

function directReaderRoute(urlValue) {
  const url = new URL(urlValue)
  if (readerConfig?.routerMode === 'hash') {
    const [pathPart, queryPart = ''] = url.hash.slice(1).split('?')
    return { path: pathPart, query: new URLSearchParams(queryPart) }
  }
  const slidePath = url.pathname.match(/\/(\d+)\/?$/)
  return { path: slidePath ? `/${slidePath[1]}` : url.pathname, query: url.searchParams }
}

async function waitForCanonicalFrame(page, number) {
  if (fullReader) {
    await page.waitForFunction((slideNumber) => {
      const root = document.querySelector('.direct-reader[data-direct-reader]')
      const slide = document.querySelector(`.slidev-page-${slideNumber}`)
      const state = window.__mobileViewer?.getState()
      const style = slide ? getComputedStyle(slide) : null
      return root
        && document.querySelectorAll('iframe').length === 0
        && state?.slide === slideNumber
        && style?.width === '980px'
        && style?.height === '552px'
        && style?.display !== 'none'
        && style?.visibility !== 'hidden'
        && Number(style?.opacity) !== 0
    }, number)
    await page.evaluate(async () => {
      await document.fonts.ready
    })
    await page.waitForTimeout(100)
    return
  }
  await page.waitForFunction((slideNumber) => {
    const frame = document.querySelector('[data-mobile-frame]')
    const config = JSON.parse(document.querySelector('#mobile-viewer-data')?.textContent ?? '{}')
    const slide = frame?.contentDocument?.querySelector(`.slidev-page-${slideNumber}`)
    const rect = slide?.getBoundingClientRect()
    const style = slide ? frame.contentWindow.getComputedStyle(slide) : null
    const location = frame?.contentWindow?.location
    const routeMatches = config.routerMode === 'hash'
      ? location?.hash === `#/${slideNumber}`
      : location?.pathname.endsWith(`/${slideNumber}`)
    return routeMatches
      && rect
      && Math.abs(rect.width - 980) < 1
      && Math.abs(rect.height - 552) < 1
      && style?.display !== 'none'
      && style?.visibility !== 'hidden'
      && Number(style?.opacity) !== 0
  }, number)
  await page.evaluate(async () => {
    await document.fonts.ready
    const frame = document.querySelector('[data-mobile-frame]')
    await frame?.contentDocument?.fonts?.ready
  })
  await page.waitForTimeout(100)
}

async function inspectLayout(page) {
  return page.evaluate(() => {
    const direct = document.querySelector('.direct-reader[data-direct-reader]')
    const shell = direct || document.querySelector('[data-mobile-shell]')
    const stage = direct
      ? document.querySelector('[data-direct-reader-stage]')
      : document.querySelector('[data-mobile-stage]')
    const frame = document.querySelector('[data-mobile-frame]')
    const stageRect = stage.getBoundingClientRect()
    const controlRoot = direct || document
    const controls = [...controlRoot.querySelectorAll('button, a')]
      .filter((element) => {
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return style.display !== 'none'
          && style.visibility !== 'hidden'
          && rect.width > 0
          && rect.height > 0
          && rect.bottom > 0
          && rect.top < innerHeight
      })
      .map((element) => {
        const rect = element.getBoundingClientRect()
        return {
          label: element.getAttribute('aria-label') || element.textContent.trim(),
          width: rect.width,
          height: rect.height,
        }
      })
    const current = direct
      ? Number(direct.dataset.directReaderCurrent)
      : Number(shell.dataset.mobileCurrent)
    const canonicalSlide = direct
      ? document.querySelector(`.slidev-page-${current}`)
      : frame.contentDocument?.querySelector(`[class*="slidev-page-${current}"]`)
    const canonicalStyle = canonicalSlide ? getComputedStyle(canonicalSlide) : null
    const slidevControls = direct
      ? [...document.querySelectorAll('#slide-container > div.absolute.bottom-0.left-0')]
          .filter(element => getComputedStyle(element).display !== 'none')
      : [...(frame.contentDocument?.querySelectorAll('[class*="control"]') ?? [])]
          .filter(element => getComputedStyle(element).display !== 'none')
    const documentStyle = getComputedStyle(document.documentElement)
    const readerTitle = direct?.querySelector('[data-direct-reader-title]')
    const readerTitleStyle = readerTitle ? getComputedStyle(readerTitle) : null
    const readerTitleRect = readerTitle?.getBoundingClientRect()
    const readerTitleLineHeight = readerTitleStyle ? Number.parseFloat(readerTitleStyle.lineHeight) : 0
    return {
      viewport: { width: innerWidth, height: innerHeight },
      documentOverflow: {
        x: Math.max(0, document.documentElement.scrollWidth - innerWidth),
        y: Math.max(0, document.documentElement.scrollHeight - innerHeight),
      },
      shellOverflow: {
        x: Math.max(0, shell.scrollWidth - shell.clientWidth),
        y: Math.max(0, shell.scrollHeight - shell.clientHeight),
      },
      stage: {
        width: stageRect.width,
        height: stageRect.height,
      },
      controls,
      canonicalSlide: canonicalStyle
        ? { width: Number.parseFloat(canonicalStyle.width), height: Number.parseFloat(canonicalStyle.height) }
        : null,
      nestedFrames: document.querySelectorAll('iframe').length,
      directRoots: document.querySelectorAll('.direct-reader[data-direct-reader]').length,
      slidevControls: slidevControls.length,
      readerChrome: direct
        ? {
            top: Number.parseFloat(documentStyle.getPropertyValue('--direct-reader-top')),
            bottom: Number.parseFloat(documentStyle.getPropertyValue('--direct-reader-bottom')),
            title: {
              text: readerTitle?.textContent?.trim() ?? '',
              lines: readerTitleRect && readerTitleLineHeight
                ? Math.round(readerTitleRect.height / readerTitleLineHeight)
                : 0,
              overflowX: readerTitle ? Math.max(0, readerTitle.scrollWidth - readerTitle.clientWidth) : 0,
              overflowY: readerTitle ? Math.max(0, readerTitle.scrollHeight - readerTitle.clientHeight) : 0,
              whiteSpace: readerTitleStyle?.whiteSpace ?? '',
            },
          }
        : null,
      state: window.__mobileViewer.getState(),
    }
  })
}

function assertLayout(layout, label) {
  assert.equal(layout.documentOverflow.x, 0, `${label} has horizontal document overflow.`)
  assert.equal(layout.documentOverflow.y, 0, `${label} has vertical document overflow.`)
  assert.equal(layout.shellOverflow.x, 0, `${label} shell overflows horizontally.`)
  assert.equal(layout.shellOverflow.y, 0, `${label} shell overflows vertically.`)
  assert(layout.stage.width > 280 && layout.stage.height > 180, `${label} stage is too small.`)
  assert(layout.controls.every(control => control.width >= 44 && control.height >= 44), `${label} has a touch target below 44px.`)
  assert.deepEqual(layout.canonicalSlide, { width: 980, height: 552 }, `${label} did not preserve the canonical 980x552 canvas.`)
  if (fullReader) {
    assert.equal(layout.nestedFrames, 0, `${label} nested the canonical deck inside an iframe.`)
    assert.equal(layout.directRoots, 1, `${label} did not render exactly one direct Reader overlay.`)
    if (layout.viewport.height > layout.viewport.width) {
      assert(layout.readerChrome.title.lines >= 1 && layout.readerChrome.title.lines <= 2, `${label} current title is not fully readable within two lines.`)
      assert.equal(layout.readerChrome.title.overflowX, 0, `${label} current title overflows horizontally.`)
      assert.equal(layout.readerChrome.title.overflowY, 0, `${label} current title is vertically clipped.`)
      assert.notEqual(layout.readerChrome.title.whiteSpace, 'nowrap', `${label} current title is forced into a truncated single line.`)
      const availableHeight = layout.viewport.height - layout.readerChrome.top - layout.readerChrome.bottom
      const expectedFitHeight = Math.min(layout.viewport.width * 552 / 980, availableHeight)
      assert(Math.abs(layout.stage.height - expectedFitHeight) <= 2, `${label} did not hug the fitted 16:9 slide.`)
    }
  }
  assert.equal(layout.slidevControls, 0, `${label} exposed duplicate Slidev navigation controls.`)
  assert(Math.abs(layout.state.relativeZoom - 1) < 0.02, `${label} did not start in fit mode.`)
}

async function dispatchPinch(page) {
  await page.evaluate(() => {
    const stage = document.querySelector('[data-direct-reader-stage], [data-mobile-stage]')
    const rect = stage.getBoundingClientRect()
    const emit = (type, pointerId, x, y) => stage.dispatchEvent(new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + x,
      clientY: rect.top + y,
      isPrimary: pointerId === 1,
      pointerId,
      pointerType: 'touch',
    }))
    const centerY = rect.height / 2
    emit('pointerdown', 1, rect.width / 2 - 50, centerY)
    emit('pointerdown', 2, rect.width / 2 + 50, centerY)
    emit('pointermove', 2, rect.width / 2 + 115, centerY)
    emit('pointerup', 2, rect.width / 2 + 115, centerY)
    emit('pointerup', 1, rect.width / 2 - 50, centerY)
  })
}

async function dispatchPan(page) {
  return page.evaluate(() => {
    const stage = document.querySelector('[data-direct-reader-stage], [data-mobile-stage]')
    const rect = stage.getBoundingClientRect()
    const before = window.__mobileViewer.getState()
    const emit = (type, x, y) => stage.dispatchEvent(new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      button: 0,
      buttons: type === 'pointerup' ? 0 : 1,
      clientX: rect.left + x,
      clientY: rect.top + y,
      isPrimary: true,
      pointerId: 8,
      pointerType: 'touch',
    }))
    const x = rect.width / 2
    const y = rect.height / 2
    emit('pointerdown', x, y)
    emit('pointermove', x - 72, y - 28)
    emit('pointerup', x - 72, y - 28)
    const after = window.__mobileViewer.getState()
    return { before, after }
  })
}

async function verifyInteraction(page, baseUrl) {
  await page.goto(`${baseUrl}${route}/#slide-6`, { waitUntil: 'networkidle' })
  await waitForCanonicalFrame(page, 6)
  if (fullReader) {
    assert.equal(await page.locator('[data-direct-reader-current]').getAttribute('data-direct-reader-current'), '6')
    const currentRoute = directReaderRoute(page.url())
    assert.equal(currentRoute.path, '/6', 'Direct Reader did not open canonical slide 6.')
    assert.equal(currentRoute.query.get('reader'), 'true', 'Direct Reader mode was not preserved.')
    assert.equal(currentRoute.query.get('embedded'), 'true', 'Direct Reader did not suppress duplicate Slidev chrome.')
    assert.equal(await page.locator('iframe').count(), 0, 'Direct Reader contains a nested iframe.')
    assert.equal(directReaderRoute(await page.locator('[data-direct-reader-normal]').getAttribute('href')).path, '/6')
  }
  else {
    assert.equal(await page.locator('[data-mobile-shell]').getAttribute('data-mobile-current'), '6')
    const frameLocation = await page.locator('[data-mobile-frame]').evaluate((frame) => {
      const url = new URL(frame.contentWindow.location.href)
      const config = JSON.parse(document.querySelector('#mobile-viewer-data')?.textContent ?? '{}')
      return { pathname: url.pathname, search: url.search, hash: url.hash, routerMode: config.routerMode }
    })
    if (frameLocation.routerMode === 'hash') {
      assert.equal(frameLocation.search, '?embedded=true', 'Hash-router frame is missing embedded mode.')
      assert.equal(frameLocation.hash, '#/6', 'Hash-router frame did not open canonical slide 6.')
    }
    else {
      assert.match(`${frameLocation.pathname}${frameLocation.search}`, /\/6\?embedded=true$/, 'History-router frame did not open canonical slide 6.')
    }
    assert.match(await page.locator('[data-mobile-deck-link]').getAttribute('href'), /\/6$/)
  }

  const zoomIn = fullReader ? '[data-direct-reader-zoom-in]' : '[data-mobile-zoom-in]'
  const zoomReset = fullReader ? '[data-direct-reader-zoom-reset]' : '[data-mobile-zoom-reset]'
  const next = fullReader ? '[data-direct-reader-next]' : '[data-mobile-next]'
  const info = fullReader ? '[data-direct-reader-info]' : '[data-mobile-info]'
  const stage = fullReader ? '[data-direct-reader-stage]' : '[data-mobile-stage]'

  if (fullReader) {
    const fitControl = page.locator(zoomReset)
    assert.match(
      (await fitControl.textContent()).replace(/\s+/g, ''),
      /^全体表示100%$/,
      'Fit control did not separate its action from the zoom percentage.',
    )
    assert(await fitControl.isDisabled(), 'Fit control remained actionable while the whole slide was already visible.')
  }
  await page.locator(zoomIn).click()
  assert((await page.evaluate(() => window.__mobileViewer.getState().relativeZoom)) > 1.3, 'Zoom-in control did not enlarge the slide.')
  if (fullReader) {
    const fitControl = page.locator(zoomReset)
    assert(!(await fitControl.isDisabled()), 'Fit control did not become available after zooming.')
    assert.match(
      (await fitControl.textContent()).replace(/\s+/g, ''),
      /^全体表示1[3-4]\d%$/,
      'Fit control did not keep its action label while showing the current zoom.',
    )
  }
  await page.locator(zoomReset).click()
  assert(Math.abs(await page.evaluate(() => window.__mobileViewer.getState().relativeZoom) - 1) < 0.02, 'Fit control did not reset zoom.')

  if (fullReader) {
    const fullscreenSupported = await page.evaluate(() => document.fullscreenEnabled
      && typeof document.documentElement.requestFullscreen === 'function')
    const fullscreen = page.locator('[data-direct-reader-fullscreen]')
    assert.equal(await fullscreen.count(), fullscreenSupported ? 1 : 0, 'Fullscreen control did not match browser capability.')
    if (fullscreenSupported) {
      assert.equal((await fullscreen.textContent()).trim(), '全画面', 'Fullscreen control used an ambiguous icon-only label.')
      await fullscreen.click()
      await page.waitForFunction(() => Boolean(document.fullscreenElement))
      assert.equal(await fullscreen.getAttribute('aria-pressed'), 'true', 'Fullscreen control did not expose its active state.')
      assert.equal((await fullscreen.textContent()).trim(), '終了', 'Fullscreen control did not expose its exit action.')
      await fullscreen.click()
      await page.waitForFunction(() => !document.fullscreenElement)
      assert.equal(await fullscreen.getAttribute('aria-pressed'), 'false', 'Fullscreen control did not clear its active state.')
    }
  }

  await dispatchPinch(page)
  assert((await page.evaluate(() => window.__mobileViewer.getState().relativeZoom)) > 1.45, 'Pinch gesture did not enlarge the slide.')
  const pan = await dispatchPan(page)
  assert(pan.before.x !== pan.after.x || pan.before.y !== pan.after.y, 'Drag gesture did not pan an enlarged slide.')
  await page.locator(zoomReset).click()

  await page.locator(next).click()
  const nextFromSix = fullReader ? 7 : 16
  await waitForCanonicalFrame(page, nextFromSix)
  if (fullReader) {
    assert.equal(directReaderRoute(page.url()).path, `/${nextFromSix}`, 'Next control did not synchronize the canonical route.')
    assert.equal(await page.locator('[data-direct-reader-current]').getAttribute('data-direct-reader-current'), String(nextFromSix))
  }
  else {
    assert.equal(new URL(page.url()).hash, `#slide-${nextFromSix}`, 'Next control did not synchronize the outer hash.')
    assert.equal(await page.locator('[data-mobile-shell]').getAttribute('data-mobile-current'), String(nextFromSix))
  }

  if (fullReader) {
    const tocButton = page.locator('[data-direct-reader-toc-open]').first()
    await tocButton.click()
    const contentsDialog = page.locator('#direct-reader-contents-dialog')
    const searchInput = contentsDialog.locator('input[type="search"]')
    assert(await contentsDialog.evaluate(dialog => dialog.open), 'Reader contents dialog did not open.')
    assert(await searchInput.evaluate(element => element === document.activeElement), 'Reader contents search did not receive focus.')
    assert.equal(await contentsDialog.locator('[data-direct-reader-toc-item]').count(), 31, 'Reader contents did not expose all 31 slides.')
    const thumbnails = contentsDialog.locator('[data-direct-reader-thumbnail]')
    assert.equal(await thumbnails.count(), 31, 'Reader contents did not expose all 31 slide thumbnails.')
    const listLayout = await contentsDialog.locator('.direct-reader-contents__list').evaluate((list) => {
      const first = list.querySelector('button')
      const second = list.querySelectorAll('button')[1]
      const firstRect = first?.getBoundingClientRect()
      const secondRect = second?.getBoundingClientRect()
      const previewRect = first?.querySelector('[aria-hidden="true"]')?.getBoundingClientRect()
      const copyRect = first?.querySelector('.direct-reader-contents__copy')?.getBoundingClientRect()
      return {
        firstTop: firstRect?.top,
        secondTop: secondRect?.top,
        firstBottom: firstRect?.bottom,
        previewRight: previewRect?.right,
        copyLeft: copyRect?.left,
      }
    })
    assert(
      listLayout.firstBottom <= listLayout.secondTop
        && listLayout.previewRight < listLayout.copyLeft,
      `Reader contents is not a vertical thumbnail-and-copy list: ${JSON.stringify(listLayout)}`,
    )
    const titleLines = await contentsDialog.locator('.direct-reader-contents__copy strong').evaluateAll(titles => titles.map((title, index) => {
      const style = getComputedStyle(title)
      return {
        slide: index + 1,
        lines: Math.round(title.getBoundingClientRect().height / Number.parseFloat(style.lineHeight)),
      }
    }))
    assert(
      titleLines.every(title => title.lines <= 2),
      `Reader contents titles exceed the approved two-line maximum at 390px: ${JSON.stringify(titleLines.filter(title => title.lines > 2))}`,
    )
    await page.waitForFunction(() => [...document.querySelectorAll('[data-direct-reader-thumbnail]')]
      .every(image => image.complete && image.naturalWidth === 320 && image.naturalHeight === 180))
    const currentResult = contentsDialog.locator('[data-direct-reader-toc-select][aria-current="page"]')
    assert.equal(await currentResult.getAttribute('data-direct-reader-toc-select'), '7', 'Reader contents did not mark the current slide.')
    const currentIsVisible = await currentResult.evaluate((button) => {
      const viewport = button.closest('.direct-reader-dialog__scroll')?.getBoundingClientRect()
      const search = button.closest('.direct-reader-dialog__scroll')?.querySelector('.direct-reader-contents__search')?.getBoundingClientRect()
      const rect = button.getBoundingClientRect()
      return Boolean(viewport && search && rect.top >= search.bottom - 1 && rect.bottom <= viewport.bottom)
    })
    assert(currentIsVisible, 'Reader contents did not position the current slide below the sticky search controls.')
    await contentsDialog.locator('[data-direct-reader-toc-select="12"]').click()
    await waitForCanonicalFrame(page, 12)
    assert.equal(directReaderRoute(page.url()).path, '/12', 'Reader thumbnail did not navigate to its canonical slide.')
    assert(await page.locator('[data-direct-reader-title]').evaluate(element => element === document.activeElement), 'Reader thumbnail navigation did not focus the destination heading.')
    await tocButton.click()
    assert.equal(
      await contentsDialog.locator('[data-direct-reader-toc-select][aria-current="page"]').getAttribute('data-direct-reader-toc-select'),
      '12',
      'Reader contents did not update its current-slide selection after thumbnail navigation.',
    )
    await searchInput.fill('platform.openai.com/docs/guides/prompt-engineering')
    const sourceMatches = await contentsDialog.locator('[data-direct-reader-toc-item]:not([hidden])').evaluateAll(items => items.map(item => item.dataset.directReaderTocItem))
    assert(sourceMatches.includes('13'), `Reader search did not index RevealTabs sources: ${JSON.stringify(sourceMatches)}`)
    await searchInput.fill('ひとりで抱え込ませる')
    const noteMatches = await contentsDialog.locator('[data-direct-reader-toc-item]:not([hidden])').evaluateAll(items => items.map(item => item.dataset.directReaderTocItem))
    assert.deepEqual(noteMatches, ['18'], 'Reader search did not index closed presenter notes.')
    await page.keyboard.press('Escape')
    assert(!(await contentsDialog.evaluate(dialog => dialog.open)), 'Escape did not close the contents dialog.')
    assert(await tocButton.evaluate(element => element === document.activeElement), 'Contents dialog focus did not return to its opener.')
    await tocButton.click()
    await searchInput.fill('ひとりで抱え込ませる')
    await contentsDialog.locator('[data-direct-reader-toc-item]:not([hidden]) [data-direct-reader-toc-select]').click()
    await waitForCanonicalFrame(page, 18)
    assert.equal(directReaderRoute(page.url()).path, '/18', 'Reader search result did not synchronize the canonical route.')
    assert(await page.locator('[data-direct-reader-title]').evaluate(element => element === document.activeElement), 'Reader search result did not focus the destination heading.')
  }

  await page.evaluate(() => window.__mobileViewer.showSlide(16))
  await waitForCanonicalFrame(page, 16)

  const activeSlide = fullReader
    ? page.locator('.slidev-page-16')
    : page.frameLocator('[data-mobile-frame]').locator('.slidev-page-16')
  const cite = activeSlide.locator('.cite__summary').first()
  if (await cite.count()) {
    await cite.click()
    assert(await activeSlide.locator('.cite[open]').count(), 'Canonical citation was not interactive inside the zoom viewer.')
  }

  await page.locator(info).click()
  const detailDialog = page.locator(fullReader ? '#direct-reader-detail-dialog' : '#mobile-detail-dialog')
  assert(await detailDialog.evaluate(dialog => dialog.open), 'Supplement dialog did not open.')
  const currentPanel = fullReader
    ? detailDialog.locator('[data-direct-detail-content]')
    : page.locator('[data-mobile-detail-panel="16"]:not([hidden])')
  assert(await currentPanel.count(), 'Supplement dialog did not synchronize with Slide 16.')
  const note = currentPanel.locator(fullReader ? '.direct-reader-dialog__note' : '.mobile-dialog__note')
  assert((await note.textContent()).trim().length > 40, 'Supplement dialog lost the canonical presenter note.')
  await page.keyboard.press('Escape')
  assert(!(await detailDialog.evaluate(dialog => dialog.open)), 'Escape did not close the supplement dialog.')
  assert(await page.locator(info).evaluate(element => element === document.activeElement), 'Dialog focus did not return to its opener.')

  await page.goto(`${baseUrl}${route}/#slide-16`, { waitUntil: 'networkidle' })
  await waitForCanonicalFrame(page, 16)
  await page.locator(next).click()
  const historyNext = fullReader ? 17 : 26
  await waitForCanonicalFrame(page, historyNext)
  await page.goBack()
  await waitForCanonicalFrame(page, 16)
  if (fullReader)
    assert.equal(directReaderRoute(page.url()).path, '/16', 'Back navigation did not restore the previous sample.')
  else
    assert.equal(new URL(page.url()).hash, '#slide-16', 'Back navigation did not restore the previous sample.')
  await page.goForward()
  await waitForCanonicalFrame(page, historyNext)
  if (fullReader)
    assert.equal(directReaderRoute(page.url()).path, `/${historyNext}`, 'Forward navigation did not restore the next slide.')
  else
    assert.equal(new URL(page.url()).hash, `#slide-${historyNext}`, 'Forward navigation did not restore the next slide.')

  await page.locator(stage).focus()
  await page.keyboard.press('+')
  assert((await page.evaluate(() => window.__mobileViewer.getState().relativeZoom)) > 1.3, 'Keyboard zoom shortcut failed.')
  await page.keyboard.press('0')
  assert(Math.abs(await page.evaluate(() => window.__mobileViewer.getState().relativeZoom) - 1) < 0.02, 'Keyboard fit shortcut failed.')
}

async function captureSample(browser, baseUrl, output, {
  viewport,
  slide,
  zoom = 1,
  name,
}) {
  const page = await browser.newPage({ viewport })
  await page.goto(`${baseUrl}${route}/#slide-${slide}`, { waitUntil: 'networkidle' })
  await waitForCanonicalFrame(page, slide)
  if (zoom > 1)
    await page.evaluate(value => window.__mobileViewer.zoomTo(value), zoom)
  const file = path.join(output, name)
  await page.screenshot({ path: file })
  await page.close()
  return file
}

async function captureContentsSample(browser, baseUrl, output) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page.goto(`${baseUrl}${route}/#slide-16`, { waitUntil: 'networkidle' })
  await waitForCanonicalFrame(page, 16)
  await page.locator('[data-direct-reader-toc-open]').click()
  await page.waitForFunction(() => [...document.querySelectorAll('[data-direct-reader-thumbnail]')]
    .every(image => image.complete && image.naturalWidth === 320 && image.naturalHeight === 180))
  await page.screenshot({ path: path.join(output, 'reader-thumbnail-contents-390.png') })
  await page.close()
}

async function verifyUnsupportedFullscreen(browser, baseUrl) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await context.addInitScript(() => {
    Object.defineProperty(document, 'fullscreenEnabled', {
      configurable: true,
      value: false,
    })
  })
  const page = await context.newPage()
  await page.goto(`${baseUrl}${route}/#slide-6`, { waitUntil: 'networkidle' })
  await waitForCanonicalFrame(page, 6)
  assert.equal(
    await page.locator('[data-direct-reader-fullscreen]').count(),
    0,
    'Reader exposed an inert fullscreen control in an unsupported browser.',
  )
  await context.close()
}

async function createContactSheet(browser, imageFiles, target) {
  const images = await Promise.all(imageFiles.map(async file => ({
    name: path.basename(file, '.png'),
    data: `data:image/png;base64,${(await fs.readFile(file)).toString('base64')}`,
  })))
  const page = await browser.newPage({ viewport: { width: fullReader ? 1800 : 1200, height: 900 } })
  await page.setContent(`<!doctype html><html><style>
    *{box-sizing:border-box}body{margin:0;padding:28px;background:#07080d;color:#f4f7fb;font-family:system-ui,sans-serif}
    h1{margin:0 0 20px;font-size:28px}.grid{display:grid;grid-template-columns:repeat(${fullReader ? 5 : 3},1fr);align-items:start;gap:18px}
    figure{margin:0;padding:8px;border:1px solid #344058;border-radius:10px;background:#111724}
    img{display:block;width:100%;height:auto}figcaption{padding:7px 3px 1px;color:#aebed2;font:700 12px monospace}
  </style><body><h1>${fullReader ? 'Canonical horizontal Mobile Reader · all 31 slides' : 'Canonical horizontal mobile zoom pilot · 06 / 16 / 26'}</h1><div class="grid">${images.map(image => `<figure><img src="${image.data}"><figcaption>${image.name}</figcaption></figure>`).join('')}</div></body></html>`)
  await page.screenshot({ path: target, fullPage: true })
  await page.close()
}

const out = path.resolve(ROOT, readArg('--out', 'dist'))
const base = normalizeBase(readArg('--base', '/'))
const screenshots = readArg('--screenshots', '')
const mobileDir = path.join(out, route)

const requiredFiles = fullReader
  ? ['index.html', 'reader-data.json', 'reader-manifest.json']
  : ['index.html', 'mobile-viewer.css', 'mobile-viewer.js']
await Promise.all(requiredFiles.map(file => fs.access(path.join(mobileDir, file))))
const readerConfig = fullReader
  ? JSON.parse(await fs.readFile(path.join(mobileDir, 'reader-data.json'), 'utf8'))
  : null
if (fullReader) {
  assert(!/<iframe(?:\s|>)/i.test(await fs.readFile(path.join(mobileDir, 'index.html'), 'utf8')), 'Direct Reader entry contains an iframe.')
  assert.equal(readerConfig.version, 2, 'Direct Reader data has an unsupported thumbnail contract.')
  assert.equal(readerConfig.slides.length, EXPECTED_SLIDES.length, 'Direct Reader data has the wrong slide count.')
  assert.deepEqual(readerConfig.slides.map(slide => slide.number), EXPECTED_SLIDES, 'Direct Reader data has an incorrect canonical mapping.')
  assert(readerConfig.slides.every(slide => slide.note && slide.search), 'Direct Reader data lost notes or searchable source content.')
  assert.equal(new Set(readerConfig.slides.map(slide => slide.thumbnail)).size, EXPECTED_SLIDES.length, 'Direct Reader data has duplicate thumbnail paths.')
  await Promise.all(readerConfig.slides.map(slide => fs.access(path.join(mobileDir, slide.thumbnail))))
}

const server = await startStaticServer({ root: out, base })
const browser = await chromium.launch({ headless: true })

try {
  const portrait = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await portrait.goto(`${server.baseUrl}${route}/#slide-6`, { waitUntil: 'networkidle' })
  try {
    await waitForCanonicalFrame(portrait, 6)
  }
  catch (error) {
    const diagnostics = await portrait.evaluate(() => {
      const frame = document.querySelector('[data-mobile-frame]')
      return {
        outer: location.href,
        current: document.querySelector('[data-direct-reader-current]')?.getAttribute('data-direct-reader-current')
          || document.querySelector('[data-mobile-shell]')?.getAttribute('data-mobile-current'),
        directRoots: document.querySelectorAll('.direct-reader[data-direct-reader]').length,
        iframeCount: document.querySelectorAll('iframe').length,
        readerError: document.querySelector('[data-direct-reader-error]')?.textContent,
        frameAttribute: frame?.getAttribute('src'),
        frameLocation: frame?.contentWindow?.location.href,
        framePages: [...(frame?.contentDocument?.querySelectorAll('[class*="slidev-page-"]') ?? [])]
          .map(element => element.className)
          .slice(0, 8),
      }
    })
    throw new Error(`${routeLabel} did not initialize slide 6: ${JSON.stringify(diagnostics)}`, { cause: error })
  }
  const portraitLayout = await inspectLayout(portrait)
  assertLayout(portraitLayout, '390x844')
  if (!fullReader) {
    const config = await portrait.locator('#mobile-viewer-data').evaluate(element => JSON.parse(element.textContent))
    assert.equal(config.slides.length, EXPECTED_SLIDES.length, `${routeLabel} config has the wrong slide count.`)
    assert.deepEqual(config.slides.map(slide => slide.number), EXPECTED_SLIDES, `${routeLabel} config has an incorrect canonical mapping.`)
    assert.equal(await portrait.locator('[data-mobile-detail-panel]').count(), EXPECTED_SLIDES.length, `${routeLabel} has an incomplete supplement mapping.`)
  }
  await verifyInteraction(portrait, server.baseUrl)
  if (fullReader)
    await verifyUnsupportedFullscreen(browser, server.baseUrl)

  if (fullReader) {
    for (const slide of EXPECTED_SLIDES) {
      await portrait.evaluate(number => window.__mobileViewer.showSlide(number), slide)
      try {
        await waitForCanonicalFrame(portrait, slide)
      }
      catch (error) {
        throw new Error(`Mobile Reader did not load canonical slide ${slide}: ${error.message}`, { cause: error })
      }
      const layout = await inspectLayout(portrait)
      assertLayout(layout, `390x844 slide ${slide}`)
      assert.equal(layout.state.slide, slide, `Reader did not settle on canonical slide ${slide}.`)
    }
  }

  const widePortrait = await browser.newPage({ viewport: { width: 430, height: 932 } })
  await widePortrait.goto(`${server.baseUrl}${route}/#slide-16`, { waitUntil: 'networkidle' })
  await waitForCanonicalFrame(widePortrait, 16)
  const widePortraitLayout = await inspectLayout(widePortrait)
  assertLayout(widePortraitLayout, '430x932')

  const landscape = await browser.newPage({ viewport: { width: 844, height: 390 } })
  await landscape.goto(`${server.baseUrl}${route}/#slide-26`, { waitUntil: 'networkidle' })
  await waitForCanonicalFrame(landscape, 26)
  const landscapeLayout = await inspectLayout(landscape)
  assertLayout(landscapeLayout, '844x390')

  const deepPage = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const deepReload = await deepPage.goto(`${server.baseUrl}${route}/#slide-26`, { waitUntil: 'networkidle' })
  assert.equal(deepReload?.status(), 200, 'Mobile pilot deep reload did not return 200.')
  await waitForCanonicalFrame(deepPage, 26)
  const deepCurrent = fullReader
    ? await deepPage.locator('[data-direct-reader-current]').getAttribute('data-direct-reader-current')
    : await deepPage.locator('[data-mobile-shell]').getAttribute('data-mobile-current')
  assert.equal(deepCurrent, '26')

  if (screenshots) {
    const output = path.resolve(screenshots)
    await fs.rm(output, { recursive: true, force: true })
    await fs.mkdir(output, { recursive: true })
    const files = []
    for (const slide of EXPECTED_SLIDES) {
      files.push(await captureSample(browser, server.baseUrl, output, {
        viewport: { width: 390, height: 844 },
        slide,
        name: `slide-${String(slide).padStart(2, '0')}-fit-390.png`,
      }))
    }
    files.push(await captureSample(browser, server.baseUrl, output, {
      viewport: { width: 390, height: 844 },
      slide: 6,
      zoom: 2.25,
      name: 'slide-06-zoom-390.png',
    }))
    for (const slide of [6, 16, 26]) {
      files.push(await captureSample(browser, server.baseUrl, output, {
        viewport: { width: 430, height: 932 },
        slide,
        name: `slide-${String(slide).padStart(2, '0')}-fit-430.png`,
      }))
    }
    files.push(await captureSample(browser, server.baseUrl, output, {
      viewport: { width: 844, height: 390 },
      slide: 26,
      name: 'slide-26-fit-844x390.png',
    }))
    if (fullReader)
      await captureContentsSample(browser, server.baseUrl, output)
    await createContactSheet(browser, files, path.join(output, fullReader ? 'mobile-reader-all-31-contact.png' : 'mobile-zoom-pilot-contact.png'))
    await fs.writeFile(path.join(output, 'layout-report.json'), `${JSON.stringify({
      portrait390: portraitLayout,
      portrait430: widePortraitLayout,
      landscape844: landscapeLayout,
    }, null, 2)}\n`)
  }

  await Promise.all([portrait.close(), widePortrait.close(), landscape.close(), deepPage.close()])
}
finally {
  await browser.close()
  await server.close()
}

console.log(`${routeLabel} QA passed: ${EXPECTED_SLIDES.length} canonical slides, fit/pinch/pan/keyboard/search/dialog/history, root/base-safe output.`)
