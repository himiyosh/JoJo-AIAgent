import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@slidev/parser'
import { chromium } from 'playwright-chromium'
import { buildPilotModel } from '../reader/content-model.mjs'
import { assertPortraitSlide, extractRecipeData } from '../reader/extract-visuals.mjs'
import {
  MOBILE_PILOT_SLIDE_NUMBERS,
  buildDirectReaderData,
  directReaderThumbnailPath,
  renderDirectReaderEntry,
  renderMobileViewer,
} from '../reader/mobile-viewer-template.mjs'
import { renderPilot } from '../reader/pilot-template.mjs'
import { RECIPE_BY_NUMBER, validateRecipes } from '../reader/slide-recipes.mjs'
import { renderReader } from '../reader/template.mjs'
import { normalizeBase, startStaticServer } from './lib/static-server.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROTECTED_BUILD_DIRECTORIES = [
  '.git',
  '.github',
  'components',
  'composables',
  'node_modules',
  'public',
  'reader',
  'scripts',
  'setup',
]

function readArg(args, name, fallback) {
  const exact = args.indexOf(name)
  if (exact >= 0 && args[exact + 1])
    return args[exact + 1]
  const prefix = `${name}=`
  const inline = args.find(arg => arg.startsWith(prefix))
  return inline ? inline.slice(prefix.length) : fallback
}

function normalizeText(value = '') {
  return value.replace(/\s+/g, ' ').trim()
}

function safeLink(link) {
  try {
    const url = new URL(link.href)
    if (!['http:', 'https:'].includes(url.protocol))
      return null
    return {
      href: url.href,
      label: normalizeText(link.label) || url.hostname,
    }
  }
  catch {
    return null
  }
}

function uniqueLinks(links, slide) {
  const seen = new Set()
  return links
    .map(safeLink)
    .filter(Boolean)
    .filter((link) => {
      if (seen.has(link.href))
        return false
      seen.add(link.href)
      return true
    })
    .map(link => ({ ...link, slide }))
}

async function extractBlocks(locator) {
  return locator.evaluate((root) => {
    const excluded = [
      '.cite',
      '.cover__foot',
      '.deck-foot',
      '.deck-ribbon',
      '.gb',
      '.reader-link',
      '.rt',
      '.section__chno',
      '.section__mark',
      '.slidev-page-number',
      'script',
      'style',
      'svg',
      '[aria-hidden="true"]',
    ]
    const blockTags = new Set(['BLOCKQUOTE', 'DL', 'H2', 'H3', 'H4', 'OL', 'P', 'TABLE', 'UL'])

    function clean(value = '') {
      return value.replace(/\s+/g, ' ').trim()
    }

    function visible(element) {
      if (!(element instanceof HTMLElement))
        return true
      const style = getComputedStyle(element)
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0
    }

    function isExcluded(element) {
      return excluded.some(selector => element.matches(selector))
    }

    function directBlockChild(element) {
      return [...element.children].some(child => blockTags.has(child.tagName))
    }

    function walk(element, blocks) {
      if (!(element instanceof HTMLElement) || isExcluded(element) || !visible(element))
        return

      const tag = element.tagName
      const text = clean(element.innerText)
      if (!text)
        return

      if (tag === 'H1')
        return
      if (['H2', 'H3', 'H4'].includes(tag)) {
        blocks.push({ type: 'heading', text })
        return
      }
      if (tag === 'P') {
        blocks.push({ type: 'paragraph', text })
        return
      }
      if (tag === 'BLOCKQUOTE') {
        blocks.push({ type: 'quote', text })
        return
      }
      if (tag === 'UL' || tag === 'OL') {
        const items = [...element.children]
          .filter(child => child.tagName === 'LI')
          .map(child => clean(child.innerText))
          .filter(Boolean)
        if (items.length)
          blocks.push({ type: 'list', ordered: tag === 'OL', items })
        return
      }
      if (tag === 'TABLE') {
        const rows = [...element.querySelectorAll('tr')]
          .map(row => [...row.querySelectorAll(':scope > th, :scope > td')].map(cell => clean(cell.innerText)))
          .filter(row => row.some(Boolean))
        if (rows.length)
          blocks.push({ type: 'table', rows })
        return
      }
      if (tag === 'DL') {
        const items = [...element.children]
          .filter(child => child.matches('dt, dd'))
          .map(child => clean(child.innerText))
          .filter(Boolean)
        if (items.length)
          blocks.push({ type: 'list', ordered: false, items })
        return
      }

      const children = [...element.children].filter(child => child instanceof HTMLElement && !isExcluded(child))
      if (!children.length || (!directBlockChild(element) && children.every(child => !directBlockChild(child)))) {
        blocks.push({ type: 'paragraph', text })
        return
      }
      children.forEach(child => walk(child, blocks))
    }

    const blocks = []
    ;[...root.children].forEach(child => walk(child, blocks))
    return blocks.filter((block, index, all) => {
      const previous = all[index - 1]
      return !previous || JSON.stringify(previous) !== JSON.stringify(block)
    })
  })
}

async function extractExternalLinks(locator, { excludeClosest = '' } = {}) {
  return locator.locator('a[href]').evaluateAll((anchors, excluded) => anchors.flatMap((anchor) => {
    if (excluded && anchor.closest(excluded))
      return []
    const url = new URL(anchor.href)
    if (url.origin === location.origin)
      return []
    const label = anchor.cloneNode(true)
    label.querySelectorAll('[aria-hidden="true"]').forEach(element => element.remove())
    return [{
      href: url.href,
      label: label.textContent ?? '',
    }]
  }), excludeClosest)
}

async function extractTabs(page, slideSelector) {
  const tabGroups = page.locator(`${slideSelector} .rt`)
  const groups = []

  for (let groupIndex = 0; groupIndex < await tabGroups.count(); groupIndex += 1) {
    const group = tabGroups.nth(groupIndex)
    const tabs = group.locator('.rt__tab')

    for (let tabIndex = 0; tabIndex < await tabs.count(); tabIndex += 1) {
      const tab = tabs.nth(tabIndex)
      const metadata = await tab.evaluate((element) => {
        const clean = value => (value ?? '').replace(/\s+/g, ' ').trim()
        const key = element.querySelector('.rt__k')?.cloneNode(true)
        key?.querySelector('.rt__now')?.remove()
        return {
          number: clean(element.querySelector('.rt__no')?.textContent),
          key: clean(key?.textContent),
          tag: clean(element.querySelector('.rt__tag')?.textContent),
          sub: clean(element.querySelector('.rt__sub')?.textContent),
          now: Boolean(element.querySelector('.rt__now')),
        }
      })
      const tabId = await tab.getAttribute('id')
      const full = await group.locator('.rt__measure > .rt__detail').nth(tabIndex).evaluate((element) => {
        const clean = value => (value ?? '').replace(/\s+/g, ' ').trim()
        const structuralText = (target) => {
          if (!target)
            return ''
          const clone = target.cloneNode(true)
          clone.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode(' / ')))
          return clean(clone.textContent)
        }
        const texts = selector => [...element.querySelectorAll(selector)].map(structuralText).filter(Boolean)
        const card = element.querySelector('.rt__card')
        return {
          head: structuralText(element.querySelector('.rt__badge')),
          question: structuralText(element.querySelector('.rt__q')),
          lead: structuralText(element.querySelector('.rt__lead')),
          points: texts('.rt__points > li'),
          pros: texts('.rt__pros > li'),
          cons: texts('.rt__cons > li'),
          chips: texts('.rt__chips .chip'),
          card: card
            ? {
                title: structuralText(card.querySelector('.rt__card-t')),
                body: structuralText(card.querySelector('.rt__card-b')),
                note: structuralText(card.querySelector('.rt__card-n')),
              }
            : null,
        }
      })
      await tab.click()
      const panel = group.locator('.rt__stage [role="tabpanel"]')
      await page.waitForFunction(({ groupIndex, slideSelector, tabId }) => {
        const group = document.querySelectorAll(`${slideSelector} .rt`)[groupIndex]
        return group?.querySelector('.rt__stage [role="tabpanel"]')?.getAttribute('aria-labelledby') === tabId
      }, { groupIndex, slideSelector, tabId })
      await page.waitForTimeout(40)

      const label = [metadata.number, metadata.key, metadata.now ? 'いま' : '', metadata.tag, metadata.sub]
        .filter(Boolean)
        .join(' ')
      const blocks = await extractBlocks(panel)
      const panelLinks = await extractExternalLinks(panel)
      const citationLinks = await extractExternalLinks(group.locator('.rt__bar'))
      const links = [...panelLinks, ...citationLinks]
      groups.push({ ...metadata, label, full, blocks, links })
    }
  }
  return groups
}

function fallbackTitle(slide, number) {
  return normalizeText(slide.title || slide.meta?.slide?.title || '') || `Slide ${String(number).padStart(2, '0')}`
}

function manifestEntry(slide) {
  const visibleCopy = [
    slide.title,
    ...(slide.visualData.takeaway ?? []),
    ...(slide.visualData.statement ?? []),
  ].join(' ')
  return {
    number: slide.number,
    title: slide.title,
    chapter: slide.chapter,
    type: slide.recipe.type,
    variant: slide.recipe.variant,
    note: Boolean(slide.note),
    sources: slide.links.length,
    revealStates: slide.tabs.length,
    visualFragments: Object.fromEntries(slide.recipe.extracts.map(descriptor => [
      descriptor.key,
      slide.visualData[descriptor.key]?.length ?? 0,
    ])),
    defaultTextCharacters: [...normalizeText(visibleCopy)].length,
  }
}

async function captureSlideThumbnail(cdp, slide, target) {
  const box = await slide.boundingBox()
  if (!box || box.width <= 0 || box.height <= 0)
    throw new Error(`Cannot capture Reader thumbnail from an invisible slide: ${target}`)
  const capture = await cdp.send('Page.captureScreenshot', {
    format: 'jpeg',
    quality: 72,
    clip: {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      scale: 0.25,
    },
    captureBeyondViewport: false,
  })
  await fs.writeFile(target, Buffer.from(capture.data, 'base64'))
}

export async function buildReader({
  out = 'dist',
  base = '/',
  source = 'slides.md',
  includeNotes = true,
  routerMode,
} = {}) {
  const outDir = path.resolve(ROOT, out)
  const readerDir = path.join(outDir, 'reader')
  const thumbnailsDir = path.join(readerDir, 'thumbnails')
  const legacyReaderDir = path.join(outDir, 'reader-legacy')
  const pilotDir = path.join(outDir, 'reader-pilot')
  const mobilePilotDir = path.join(outDir, 'mobile-pilot')
  await Promise.all([
    assertSafeReaderOutput(readerDir),
    assertSafeReaderOutput(legacyReaderDir),
    assertSafeReaderOutput(pilotDir),
    assertSafeReaderOutput(mobilePilotDir),
  ])
  const sourcePath = path.resolve(ROOT, source)
  const markdown = await fs.readFile(sourcePath, 'utf8')
  const deck = await parse(markdown, sourcePath)
  validateRecipes(deck.slides.length)
  const effectiveRouterMode = routerMode ?? deck.slides[0]?.frontmatter?.routerMode ?? 'history'
  if (!['hash', 'history'].includes(effectiveRouterMode))
    throw new Error(`Reader does not support router mode "${effectiveRouterMode}".`)

  await Promise.all([
    fs.rm(readerDir, { recursive: true, force: true }),
    fs.rm(legacyReaderDir, { recursive: true, force: true }),
    fs.rm(pilotDir, { recursive: true, force: true }),
    fs.rm(mobilePilotDir, { recursive: true, force: true }),
  ])
  await Promise.all([
    fs.mkdir(readerDir, { recursive: true }),
    fs.mkdir(thumbnailsDir, { recursive: true }),
    fs.mkdir(legacyReaderDir, { recursive: true }),
    fs.mkdir(mobilePilotDir, { recursive: true }),
  ])
  if (includeNotes)
    await fs.mkdir(pilotDir, { recursive: true })
  const server = await startStaticServer({ root: outDir, base: normalizeBase(base) })
  const browser = await chromium.launch({ headless: true })

  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
      reducedMotion: 'reduce',
    })
    const cdp = await page.context().newCDPSession(page)
    const slides = []
    let chapter = 'イントロ'

    for (let index = 0; index < deck.slides.length; index += 1) {
      const number = index + 1
      const parsedSlide = deck.slides[index]
      const recipe = RECIPE_BY_NUMBER.get(number)
      if (!recipe)
        throw new Error(`Reader is missing portrait recipe ${number}.`)
      if (parsedSlide.frontmatter?.chapter)
        chapter = normalizeText(String(parsedSlide.frontmatter.chapter))

      await page.goto(readerSlideUrl(server.baseUrl, number, effectiveRouterMode), { waitUntil: 'networkidle' })
      const slideSelector = `.slidev-page-${number} .slidev-layout`
      const slide = page.locator(slideSelector)
      await slide.waitFor({ state: 'visible' })
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(120)
      await captureSlideThumbnail(
        cdp,
        slide,
        path.join(readerDir, directReaderThumbnailPath(number)),
      )

      const domTitle = normalizeText(await slide.locator(recipe.titleSelector || 'h1').first().textContent().catch(() => ''))
      const blocks = await extractBlocks(slide)
      const tabs = await extractTabs(page, slideSelector)
      const visualData = await extractRecipeData(slide, recipe, number)
      const bodyLinks = await extractExternalLinks(slide, { excludeClosest: '.rt' })
      const tabLinks = tabs.flatMap(tab => tab.links)
      const links = uniqueLinks([...bodyLinks, ...tabLinks], number)
      const title = domTitle || fallbackTitle(parsedSlide, number)

      const portraitSlide = {
        number,
        chapter,
        title,
        note: includeNotes ? normalizeText(parsedSlide.note ?? '') : '',
        blocks,
        tabs: tabs.map(({ links: sources, ...tab }) => ({ ...tab, sources })),
        links,
        recipe,
        visualData,
      }
      assertPortraitSlide(portraitSlide, { requireNote: includeNotes })
      slides.push(portraitSlide)
    }

    if (slides.length !== 31)
      throw new Error(`Reader expected 31 slides but extracted ${slides.length}.`)
    if (slides.some(slide => !slide.title || (!slide.blocks.length && !slide.tabs.length)))
      throw new Error('Reader extraction produced a slide without a title or readable body.')
    const thumbnailFiles = await fs.readdir(thumbnailsDir)
    if (thumbnailFiles.length !== slides.length)
      throw new Error(`Reader expected ${slides.length} thumbnails but generated ${thumbnailFiles.length}.`)

    const title = normalizeText(deck.slides[0]?.frontmatter?.title || deck.headmatter?.title || deck.config?.title || 'JoJo’s Bizarre AI Agents')
    const legacyHtml = renderReader({ title, slides })
    const pilot = includeNotes ? buildPilotModel(slides) : null
    const pilotHtml = pilot ? renderPilot(pilot, title, { routerMode: effectiveRouterMode }) : ''
    const readerHtml = renderDirectReaderEntry({
      title,
      routerMode: effectiveRouterMode,
    })
    const readerData = buildDirectReaderData({
      title,
      slides,
      routerMode: effectiveRouterMode,
    })
    const readerDataJson = `${JSON.stringify(readerData, null, 2)}\n`
    const mobilePilotHtml = renderMobileViewer({
      title,
      slides,
      routerMode: effectiveRouterMode,
      slideNumbers: MOBILE_PILOT_SLIDE_NUMBERS,
      variant: 'pilot',
    })
    const manifest = {
      version: 1,
      source: path.basename(sourcePath),
      slides: slides.map(manifestEntry),
    }
    const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`
    const pilotCoverageJson = pilot ? `${JSON.stringify(pilot.coverage, null, 2)}\n` : ''
    const pilotInventoryJson = pilot ? `${JSON.stringify(pilot.inventory, null, 2)}\n` : ''
    const pilotPlanJson = pilot ? `${JSON.stringify(pilot.pages.map(({
      source: _source,
      ...page
    }) => page), null, 2)}\n` : ''

    if ((legacyHtml.match(/data-reader-visual(?:\s|>)/g) ?? []).length !== slides.length)
      throw new Error('Reader did not render exactly one meaningful portrait visual for every slide.')
    if (/<img[^>]+slide-\d+\.(?:jpe?g|webp)/i.test(legacyHtml))
      throw new Error('Reader unexpectedly rendered a full-slide raster image.')
    if (/<iframe(?:\s|>)/i.test(readerHtml))
      throw new Error('Direct Reader entry unexpectedly contains an iframe.')
    if (readerData.slides.length !== slides.length
      || readerData.slides.some(slide => !slide.title || !slide.search || !slide.thumbnail))
      throw new Error('Direct Reader data is incomplete.')

    const writes = [
      fs.writeFile(path.join(readerDir, 'index.html'), readerHtml),
      fs.writeFile(path.join(readerDir, 'reader-data.json'), readerDataJson),
      fs.writeFile(path.join(readerDir, 'reader-manifest.json'), manifestJson),
      fs.writeFile(path.join(legacyReaderDir, 'index.html'), legacyHtml),
      fs.writeFile(path.join(legacyReaderDir, 'reader-manifest.json'), manifestJson),
      fs.copyFile(path.join(ROOT, 'reader', 'reader.css'), path.join(legacyReaderDir, 'reader.css')),
      fs.copyFile(path.join(ROOT, 'reader', 'reader.js'), path.join(legacyReaderDir, 'reader.js')),
      fs.writeFile(path.join(mobilePilotDir, 'index.html'), mobilePilotHtml),
      fs.copyFile(path.join(ROOT, 'reader', 'mobile-viewer.css'), path.join(mobilePilotDir, 'mobile-viewer.css')),
      fs.copyFile(path.join(ROOT, 'reader', 'mobile-viewer.js'), path.join(mobilePilotDir, 'mobile-viewer.js')),
    ]
    if (pilot) {
      writes.push(
        fs.writeFile(path.join(pilotDir, 'index.html'), pilotHtml),
        fs.writeFile(path.join(pilotDir, 'coverage-report.json'), pilotCoverageJson),
        fs.writeFile(path.join(pilotDir, 'content-inventory.json'), pilotInventoryJson),
        fs.writeFile(path.join(pilotDir, 'page-plan.json'), pilotPlanJson),
        fs.copyFile(path.join(ROOT, 'reader', 'pilot.css'), path.join(pilotDir, 'pilot.css')),
        fs.copyFile(path.join(ROOT, 'reader', 'pilot.js'), path.join(pilotDir, 'pilot.js')),
      )
    }
    await Promise.all(writes)

    return {
      slides: slides.length,
      chapters: new Set(slides.map(slide => slide.chapter)).size,
      manifestBytes: Buffer.byteLength(manifestJson),
      pilotPages: pilot?.pages.length ?? 0,
      pilotInventory: pilot?.inventory.length ?? 0,
      pilotCoverageBytes: Buffer.byteLength(pilotCoverageJson),
      outDir: readerDir,
      legacyOutDir: legacyReaderDir,
      pilotOutDir: pilotDir,
      mobileReaderSlides: slides.length,
      mobileReaderThumbnails: thumbnailFiles.length,
      mobilePilotSlides: MOBILE_PILOT_SLIDE_NUMBERS.length,
      mobilePilotOutDir: mobilePilotDir,
    }
  }
  finally {
    await browser.close()
    await server.close()
  }
}

async function filesystemIdentity(target) {
  try {
    const [realPath, stats] = await Promise.all([
      fs.realpath(target),
      fs.stat(target),
    ])
    return { realPath, device: stats.dev, inode: stats.ino }
  }
  catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR')
      return null
    throw error
  }
}

function comparablePath(target) {
  const normalized = path.normalize(target)
  return process.platform === 'win32' || process.platform === 'darwin'
    ? normalized.toLowerCase()
    : normalized
}

async function canonicalTargetPath(target) {
  let existing = path.resolve(target)
  const missingSegments = []
  while (true) {
    try {
      const realPath = await fs.realpath(existing)
      return path.resolve(realPath, ...missingSegments)
    }
    catch (error) {
      if (error?.code !== 'ENOENT' && error?.code !== 'ENOTDIR')
        throw error
      const parent = path.dirname(existing)
      if (parent === existing)
        throw error
      missingSegments.unshift(path.basename(existing))
      existing = parent
    }
  }
}

function includesPath(parent, child) {
  const relative = path.relative(comparablePath(parent), comparablePath(child))
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

export async function assertSafeBuildOutput(out = 'dist') {
  const [outputRoot, repositoryRoot, ...protectedRoots] = await Promise.all([
    canonicalTargetPath(path.resolve(ROOT, out)),
    canonicalTargetPath(ROOT),
    ...PROTECTED_BUILD_DIRECTORIES.map(directory => canonicalTargetPath(path.join(ROOT, directory))),
  ])
  const overwritesRepository = comparablePath(outputRoot) === comparablePath(repositoryRoot)
  const overlapsSource = protectedRoots.some(sourceRoot =>
    includesPath(outputRoot, sourceRoot) || includesPath(sourceRoot, outputRoot),
  )
  if (overwritesRepository || overlapsSource)
    throw new Error(`Slidev build output "${out}" would overwrite repository source assets.`)
}

export async function assertSafeReaderOutput(readerDir) {
  const sourceReaderDir = path.join(ROOT, 'reader')
  if (path.resolve(readerDir) === sourceReaderDir)
    throw new Error('Reader generation refuses to overwrite the source reader directory.')

  const [candidate, source] = await Promise.all([
    filesystemIdentity(readerDir),
    filesystemIdentity(sourceReaderDir),
  ])
  if (!source)
    throw new Error('Reader source directory is missing.')
  if (!candidate)
    return

  const sameRealPath = comparablePath(candidate.realPath) === comparablePath(source.realPath)
  const sameInode = candidate.inode !== 0
    && candidate.device === source.device
    && candidate.inode === source.inode
  if (sameRealPath || sameInode)
    throw new Error('Reader generation refuses to overwrite the source reader directory.')
}

export async function cleanReaderOutputs({ out = 'dist' } = {}) {
  const outDir = path.resolve(ROOT, out)
  const outputDirectories = [
    path.join(outDir, 'reader'),
    path.join(outDir, 'reader-legacy'),
    path.join(outDir, 'reader-pilot'),
    path.join(outDir, 'mobile-pilot'),
  ]
  await Promise.all(outputDirectories.map(assertSafeReaderOutput))
  await Promise.all(outputDirectories.map(directory => fs.rm(directory, { recursive: true, force: true })))
}

export function readerSlideUrl(baseUrl, number, routerMode = 'history') {
  return routerMode === 'hash'
    ? `${baseUrl}#/${number}`
    : `${baseUrl}${number}`
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const result = await buildReader({
    out: readArg(args, '--out', 'dist'),
    base: readArg(args, '--base', '/'),
    source: readArg(args, '--source', 'slides.md'),
    routerMode: readArg(args, '--router-mode', undefined),
  })
  console.log(`Reader generated: ${result.mobileReaderSlides} canonical horizontal slides → ${result.outDir}`)
  console.log(`Legacy portrait Reader generated: ${result.slides} slides → ${result.legacyOutDir}`)
  console.log(`Mobile zoom pilot generated: ${result.mobilePilotSlides} canonical slides → ${result.mobilePilotOutDir}`)
  if (result.pilotPages)
    console.log(`Reader pilot generated: ${result.pilotPages} pages, ${result.pilotInventory}/${result.pilotInventory} inventory → ${result.pilotOutDir}`)
  else
    console.log('Reader pilot skipped because presenter notes are disabled.')
}
