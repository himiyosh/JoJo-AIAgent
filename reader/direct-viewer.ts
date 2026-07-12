import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import './direct-viewer.css'

const MIN_ZOOM = 1
const MAX_ZOOM = 4
const ZOOM_STEP = 1.35
const DOUBLE_TAP_DELAY = 320
const DRAG_THRESHOLD = 5

interface ReaderLink {
  label: string
  href: string
}

interface ReaderSlide {
  number: number
  title: string
  chapter: string
  note: string
  links: ReaderLink[]
  search: string
  thumbnail: string
}

interface ReaderData {
  version: number
  title: string
  routerMode: 'hash' | 'history'
  slides: ReaderSlide[]
}

interface Point {
  x: number
  y: number
}

interface ZoomState {
  relative: number
  x: number
  y: number
  dragging: boolean
  suppressClickUntil: number
}

interface PanStart {
  pointer: Point
  offset: Point
}

interface PinchStart {
  distance: number
  relative: number
  anchor: Point
  offset: Point
}

function queryEnabled(route: RouteLocationNormalizedLoaded) {
  const value = route.query.reader
  return value === 'true' || value === '1'
    || (Array.isArray(value) && value.some(item => item === 'true' || item === '1'))
}

function slideNumber(route: RouteLocationNormalizedLoaded) {
  const match = route.path.match(/\/(\d+)\/?$/)
  return match ? Number(match[1]) : 1
}

function isSlidePath(path: string) {
  return /\/\d+\/?$/.test(path)
}

function normalizedBase(base: string) {
  if (!base || base === '/')
    return '/'
  return `/${base.replace(/^\/+|\/+$/g, '')}/`
}

function createButton(label: string, className: string, text: string) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = className
  button.setAttribute('aria-label', label)
  button.textContent = text
  return button
}

function createDialog(className: string, labelledBy: string) {
  const dialog = document.createElement('dialog')
  dialog.className = className
  dialog.setAttribute('aria-labelledby', labelledBy)
  return dialog
}

function normalizeSearch(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase('ja').replace(/\s+/g, ' ').trim()
}

function interactiveTarget(target: EventTarget | null) {
  return target instanceof Element
    ? target.closest('a, button, input, select, textarea, summary, details, [role="tab"], [role="button"], [contenteditable="true"]')
    : null
}

function pointerDistance(points: Point[]) {
  return Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)
}

function pointerCenter(points: Point[]) {
  return {
    x: (points[0].x + points[1].x) / 2,
    y: (points[0].y + points[1].y) / 2,
  }
}

class DirectReader {
  private readonly router: Router
  private readonly data: ReaderData
  private readonly base: string
  private readonly root: HTMLDivElement
  private readonly heading: HTMLHeadingElement
  private readonly counter: HTMLParagraphElement
  private readonly live: HTMLParagraphElement
  private readonly previous: HTMLButtonElement
  private readonly next: HTMLButtonElement
  private readonly zoomReset: HTMLButtonElement
  private readonly zoomLabel: HTMLSpanElement
  private readonly normalLink: HTMLAnchorElement
  private readonly contentsDialog: HTMLDialogElement
  private readonly detailDialog: HTMLDialogElement
  private readonly searchInput: HTMLInputElement
  private readonly searchStatus: HTMLParagraphElement
  private readonly searchList: HTMLOListElement
  private readonly searchEmpty: HTMLParagraphElement
  private readonly detailContent: HTMLDivElement
  private readonly fullscreen: HTMLButtonElement | null
  private readonly pointers = new Map<number, Point>()
  private readonly state: ZoomState = {
    relative: 1,
    x: 0,
    y: 0,
    dragging: false,
    suppressClickUntil: 0,
  }

  private stage: HTMLElement | null = null
  private slideshow: HTMLElement | null = null
  private resizeObserver: ResizeObserver | null = null
  private panStart: PanStart | null = null
  private pinchStart: PinchStart | null = null
  private lastTap: { time: number, point: Point } | null = null
  private index = 0
  private pendingFocus = false
  private contentsOpener: HTMLElement | null = null
  private detailOpener: HTMLElement | null = null
  private surfaceTimer = 0

  constructor(router: Router, data: ReaderData, base: string) {
    this.router = router
    this.data = data
    this.base = normalizedBase(base)

    const root = document.createElement('div')
    root.className = 'direct-reader'
    root.dataset.directReader = ''
    root.innerHTML = `
      <a class="direct-reader__skip" href="#slide-container">スライド表示へ移動</a>
      <header class="direct-reader__top">
        <div class="direct-reader__bar">
          <div class="direct-reader__brand" aria-label="横型スライド Reader View">
            <span aria-hidden="true">◆</span>
            <span><strong>横型スライド</strong><small>READER VIEW</small></span>
          </div>
          <div class="direct-reader__actions"></div>
        </div>
        <div class="direct-reader__context">
          <div class="direct-reader__copy">
            <p></p>
            <h1 tabindex="-1"></h1>
          </div>
        </div>
      </header>
      <aside class="direct-reader__hint" aria-label="拡大操作の案内">
        <strong>まず全体を確認</strong>
        <span>読みたい箇所をピンチ／ダブルタップ。拡大中はドラッグ</span>
      </aside>
      <nav class="direct-reader__zoom" aria-label="拡大表示の操作"></nav>
      <p class="direct-reader__live" aria-live="polite"></p>
    `
    this.root = root
    this.heading = root.querySelector('.direct-reader__copy h1')!
    this.counter = root.querySelector('.direct-reader__copy p')!
    this.live = root.querySelector('.direct-reader__live')!
    this.heading.dataset.directReaderTitle = ''
    this.counter.dataset.directReaderSource = ''

    const actions = root.querySelector('.direct-reader__actions')!
    const contents = createButton('全31枚の目次と検索を開く', 'direct-reader__action', '目次')
    const detail = createButton('現在のスライドの補足と出典を開く', 'direct-reader__action', '補足')
    contents.dataset.directReaderTocOpen = ''
    detail.dataset.directReaderInfo = ''
    this.normalLink = document.createElement('a')
    this.normalLink.className = 'direct-reader__action'
    this.normalLink.dataset.directReaderNormal = ''
    this.normalLink.setAttribute('aria-label', '通常の16対9スライドを開く')
    this.normalLink.textContent = '通常'
    actions.append(contents, detail, this.normalLink)

    const context = root.querySelector('.direct-reader__context')!
    this.previous = createButton('前のスライドへ', 'direct-reader__step direct-reader__step--previous', '←')
    this.next = createButton('次のスライドへ', 'direct-reader__step direct-reader__step--next', '→')
    this.previous.dataset.directReaderPrev = ''
    this.next.dataset.directReaderNext = ''
    context.prepend(this.previous)
    context.append(this.next)

    const zoom = root.querySelector('.direct-reader__zoom')!
    const zoomOut = createButton('縮小', 'direct-reader__zoom-button', '−')
    this.zoomReset = createButton('スライド全体を画面内に表示', 'direct-reader__zoom-button direct-reader__zoom-reset', '')
    zoomOut.dataset.directReaderZoomOut = ''
    this.zoomReset.dataset.directReaderZoomReset = ''
    this.zoomReset.disabled = true
    const resetLabel = document.createElement('span')
    resetLabel.className = 'direct-reader__zoom-reset-label'
    resetLabel.textContent = '全体表示'
    this.zoomLabel = document.createElement('span')
    this.zoomLabel.className = 'direct-reader__zoom-level'
    this.zoomLabel.textContent = '100%'
    this.zoomReset.append(resetLabel, this.zoomLabel)
    const zoomIn = createButton('拡大', 'direct-reader__zoom-button', '+')
    zoomIn.dataset.directReaderZoomIn = ''
    zoom.append(zoomOut, this.zoomReset, zoomIn)
    const fullscreenSupported = document.fullscreenEnabled
      && typeof document.documentElement.requestFullscreen === 'function'
    this.fullscreen = fullscreenSupported
      ? createButton('全画面表示にする', 'direct-reader__zoom-button direct-reader__fullscreen', '全画面')
      : null
    if (this.fullscreen) {
      this.fullscreen.dataset.directReaderFullscreen = ''
      this.fullscreen.setAttribute('aria-pressed', 'false')
      zoom.append(this.fullscreen)
    }

    this.contentsDialog = this.buildContentsDialog()
    this.detailDialog = this.buildDetailDialog()
    this.searchInput = this.contentsDialog.querySelector('input')!
    this.searchStatus = this.contentsDialog.querySelector('[data-direct-search-status]')!
    this.searchList = this.contentsDialog.querySelector('ol')!
    this.searchEmpty = this.contentsDialog.querySelector('[data-direct-search-empty]')!
    this.detailContent = this.detailDialog.querySelector('[data-direct-detail-content]')!

    document.body.append(root, this.contentsDialog, this.detailDialog)
    document.documentElement.dataset.directReader = ''

    contents.addEventListener('click', () => this.openContents(contents))
    detail.addEventListener('click', () => this.openDetail(detail))
    this.previous.addEventListener('click', () => this.goTo(this.index - 1))
    this.next.addEventListener('click', () => this.goTo(this.index + 1))
    zoomOut.addEventListener('click', () => this.zoomTo(this.state.relative / ZOOM_STEP))
    zoomIn.addEventListener('click', () => this.zoomTo(this.state.relative * ZOOM_STEP))
    this.zoomReset.addEventListener('click', () => this.zoomTo(1))
    this.fullscreen?.addEventListener('click', () => void this.toggleFullscreen())
    this.searchInput.addEventListener('input', () => this.filterContents())
    this.contentsDialog.addEventListener('close', () => this.returnDialogFocus('contents'))
    this.detailDialog.addEventListener('close', () => this.returnDialogFocus('detail'))
    this.contentsDialog.addEventListener('click', event => this.closeFromBackdrop(event, this.contentsDialog))
    this.detailDialog.addEventListener('click', event => this.closeFromBackdrop(event, this.detailDialog))
    document.addEventListener('keydown', this.onKeyDown, true)
    document.addEventListener('click', this.blockDeckNavigation, true)
    if (this.fullscreen)
      document.addEventListener('fullscreenchange', this.onFullscreenChange)
    this.filterContents()

    this.waitForSurface()
  }

  sync(route: RouteLocationNormalizedLoaded) {
    const number = slideNumber(route)
    const nextIndex = this.data.slides.findIndex(slide => slide.number === number)
    this.index = nextIndex >= 0 ? nextIndex : 0
    const slide = this.data.slides[this.index]
    this.root.dataset.directReaderCurrent = String(slide.number)
    this.heading.textContent = slide.title
    this.counter.textContent = `SLIDE ${String(slide.number).padStart(2, '0')} · ${this.index + 1} / ${this.data.slides.length}`
    this.previous.disabled = this.index === 0
    this.next.disabled = this.index === this.data.slides.length - 1
    this.previous.setAttribute('aria-label', this.index === 0 ? '前のスライドはありません' : '前のスライドへ')
    this.next.setAttribute('aria-label', this.index === this.data.slides.length - 1 ? '次のスライドはありません' : '次のスライドへ')
    this.normalLink.href = this.normalSlideUrl(slide.number)
    this.syncContentsSelection(slide.number)
    this.renderDetail(slide)
    this.zoomTo(1, null, { announce: false })
    this.live.textContent = `Slide ${String(slide.number).padStart(2, '0')}を表示しました`
    const readerTitle = `${slide.title} · スマホReader`
    document.title = readerTitle
    window.setTimeout(() => {
      if (queryEnabled(this.router.currentRoute.value))
        document.title = readerTitle
    })
    if (this.pendingFocus) {
      this.pendingFocus = false
      requestAnimationFrame(() => this.heading.focus({ preventScroll: true }))
    }
    this.waitForSurface()
  }

  getState() {
    return {
      index: this.index,
      slide: this.data.slides[this.index]?.number,
      fitScale: this.baseScale(),
      scale: this.baseScale() * this.state.relative,
      relativeZoom: this.state.relative,
      x: this.state.x,
      y: this.state.y,
    }
  }

  showSlide(number: number) {
    const index = this.data.slides.findIndex(slide => slide.number === Number(number))
    if (index >= 0)
      this.goTo(index)
  }

  zoomTo(relative: number, anchor: Point | null = null, { announce = true } = {}) {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, relative))
    const rect = this.stage?.getBoundingClientRect()
    if (rect && this.state.relative > 0 && anchor) {
      const ratio = next / this.state.relative
      const center = { x: rect.width / 2, y: rect.height / 2 }
      const delta = { x: anchor.x - center.x, y: anchor.y - center.y }
      this.state.x = delta.x - (delta.x - this.state.x) * ratio
      this.state.y = delta.y - (delta.y - this.state.y) * ratio
    }
    else if (next === 1) {
      this.state.x = 0
      this.state.y = 0
    }
    this.state.relative = next
    this.renderTransform(announce)
  }

  private buildContentsDialog() {
    const dialog = createDialog('direct-reader-dialog direct-reader-dialog--contents', 'direct-reader-contents-title')
    dialog.id = 'direct-reader-contents-dialog'
    dialog.innerHTML = `
      <div class="direct-reader-dialog__sheet">
        <header class="direct-reader-dialog__header">
          <div><p>SEARCH / CONTENTS</p><h2 id="direct-reader-contents-title">全31枚から探す</h2></div>
          <button type="button" aria-label="目次を閉じる">×</button>
        </header>
        <div class="direct-reader-dialog__scroll direct-reader-contents">
          <div class="direct-reader-contents__search">
            <label for="direct-reader-search">見出し・本文・補足・出典を検索</label>
            <input id="direct-reader-search" type="search" inputmode="search" autocomplete="off" enterkeyhint="search">
            <p class="direct-reader-contents__status" data-direct-search-status aria-live="polite"></p>
          </div>
          <ol class="direct-reader-contents__list"></ol>
          <p class="direct-reader-contents__empty" data-direct-search-empty hidden>一致するスライドはありません。</p>
        </div>
      </div>
    `
    dialog.querySelector('header button')!.addEventListener('click', () => dialog.close())
    const list = dialog.querySelector('ol')!
    this.data.slides.forEach((slide) => {
      const item = document.createElement('li')
      item.dataset.directReaderTocItem = String(slide.number)
      item.dataset.directSearch = normalizeSearch(slide.search)
      const button = document.createElement('button')
      button.type = 'button'
      button.dataset.directReaderTocSelect = String(slide.number)
      const preview = document.createElement('span')
      preview.className = 'direct-reader-contents__preview'
      preview.setAttribute('aria-hidden', 'true')
      const image = document.createElement('img')
      image.dataset.directReaderThumbnail = String(slide.number)
      image.src = this.thumbnailUrl(slide.thumbnail)
      image.alt = ''
      image.width = 320
      image.height = 180
      image.decoding = 'async'
      preview.append(image)
      const copy = document.createElement('span')
      copy.className = 'direct-reader-contents__copy'
      const meta = document.createElement('span')
      meta.className = 'direct-reader-contents__meta'
      const number = document.createElement('span')
      number.className = 'direct-reader-contents__number'
      number.textContent = String(slide.number).padStart(2, '0')
      const small = document.createElement('small')
      small.textContent = slide.chapter
      meta.append(number, small)
      const strong = document.createElement('strong')
      strong.textContent = slide.title
      copy.append(meta, strong)
      button.append(preview, copy)
      button.addEventListener('click', () => {
        dialog.close()
        this.pendingFocus = true
        this.goTo(this.data.slides.indexOf(slide))
      })
      item.append(button)
      list.append(item)
    })
    return dialog
  }

  private buildDetailDialog() {
    const dialog = createDialog('direct-reader-dialog', 'direct-reader-detail-title')
    dialog.id = 'direct-reader-detail-dialog'
    dialog.innerHTML = `
      <div class="direct-reader-dialog__sheet">
        <header class="direct-reader-dialog__header">
          <div><p>CANONICAL SOURCE</p><h2 id="direct-reader-detail-title">補足と出典</h2></div>
          <button type="button" aria-label="補足を閉じる">×</button>
        </header>
        <div class="direct-reader-dialog__scroll" tabindex="0" data-direct-detail-content></div>
      </div>
    `
    dialog.querySelector('header button')!.addEventListener('click', () => dialog.close())
    return dialog
  }

  private renderDetail(slide: ReaderSlide) {
    this.detailContent.replaceChildren()
    const source = document.createElement('p')
    source.className = 'direct-reader-dialog__source'
    source.textContent = `SOURCE SLIDE ${String(slide.number).padStart(2, '0')}`
    const title = document.createElement('h3')
    title.textContent = slide.title
    const noteHeading = document.createElement('h4')
    noteHeading.textContent = '補足'
    const note = document.createElement('p')
    note.className = slide.note ? 'direct-reader-dialog__note' : 'direct-reader-dialog__empty'
    note.textContent = slide.note || 'このbuildには発表者ノートが含まれていません。'
    const sourceHeading = document.createElement('h4')
    sourceHeading.textContent = '出典'
    this.detailContent.append(source, title, noteHeading, note, sourceHeading)
    if (slide.links.length) {
      const links = document.createElement('ul')
      links.className = 'direct-reader-dialog__sources'
      slide.links.forEach((link) => {
        const item = document.createElement('li')
        const anchor = document.createElement('a')
        anchor.href = link.href
        anchor.target = '_blank'
        anchor.rel = 'noopener noreferrer'
        anchor.textContent = link.label
        item.append(anchor)
        links.append(item)
      })
      this.detailContent.append(links)
    }
    else {
      const empty = document.createElement('p')
      empty.className = 'direct-reader-dialog__empty'
      empty.textContent = 'このスライドに外部出典はありません。'
      this.detailContent.append(empty)
    }
  }

  private normalSlideUrl(number: number) {
    const root = new URL(this.base, location.origin)
    if (this.data.routerMode === 'hash') {
      root.hash = `#/${number}`
      return root.href
    }
    return new URL(String(number), root).href
  }

  private thumbnailUrl(relative: string) {
    return new URL(relative, new URL(`${this.base}reader/`, location.origin)).href
  }

  private async goTo(index: number) {
    if (index < 0 || index >= this.data.slides.length)
      return
    const slide = this.data.slides[index]
    await this.router.push({
      path: `/${slide.number}`,
      query: { reader: 'true', embedded: 'true' },
    })
  }

  private openContents(opener: HTMLElement) {
    this.contentsOpener = opener
    this.contentsDialog.showModal()
    this.filterContents()
    requestAnimationFrame(() => {
      const current = this.searchList.querySelector<HTMLElement>('[aria-current="page"]')
      if (current && !current.closest('li')?.hidden)
        current.scrollIntoView({ block: 'start' })
      this.searchInput.focus({ preventScroll: true })
    })
  }

  private openDetail(opener: HTMLElement) {
    this.detailOpener = opener
    this.detailDialog.showModal()
    this.detailDialog.querySelector<HTMLElement>('.direct-reader-dialog__scroll')?.focus()
  }

  private returnDialogFocus(type: 'contents' | 'detail') {
    const opener = type === 'contents' ? this.contentsOpener : this.detailOpener
    opener?.focus({ preventScroll: true })
    if (type === 'contents')
      this.contentsOpener = null
    else
      this.detailOpener = null
  }

  private closeFromBackdrop(event: MouseEvent, dialog: HTMLDialogElement) {
    if (event.target === dialog)
      dialog.close()
  }

  private filterContents() {
    const query = normalizeSearch(this.searchInput.value)
    let matches = 0
    this.searchList.querySelectorAll<HTMLLIElement>('li').forEach((item) => {
      const visible = !query || item.dataset.directSearch?.includes(query)
      item.hidden = !visible
      if (visible)
        matches += 1
    })
    this.searchStatus.textContent = `${matches}件`
    this.searchEmpty.hidden = matches !== 0
  }

  private syncContentsSelection(number: number) {
    this.searchList.querySelectorAll<HTMLButtonElement>('[data-direct-reader-toc-select]').forEach((button) => {
      if (Number(button.dataset.directReaderTocSelect) === number)
        button.setAttribute('aria-current', 'page')
      else
        button.removeAttribute('aria-current')
    })
  }

  private waitForSurface() {
    window.clearTimeout(this.surfaceTimer)
    const stage = document.querySelector<HTMLElement>('#slide-container')
    const slideshow = document.querySelector<HTMLElement>('#slideshow')
    if (!stage || !slideshow) {
      this.surfaceTimer = window.setTimeout(() => this.waitForSurface(), 50)
      return
    }
    if (this.stage === stage && this.slideshow === slideshow)
      return
    this.unbindSurface()
    this.stage = stage
    this.slideshow = slideshow
    stage.dataset.directReaderStage = ''
    stage.tabIndex = 0
    stage.setAttribute('role', 'region')
    stage.setAttribute('aria-label', '拡大とパンができる16対9スライド')
    stage.addEventListener('pointerdown', this.onPointerDown, true)
    stage.addEventListener('pointermove', this.onPointerMove, true)
    stage.addEventListener('pointerup', this.onPointerUp, true)
    stage.addEventListener('pointercancel', this.onPointerUp, true)
    this.resizeObserver = new ResizeObserver(() => this.renderTransform(false))
    this.resizeObserver.observe(stage)
    requestAnimationFrame(() => this.renderTransform(false))
  }

  private unbindSurface() {
    if (!this.stage)
      return
    this.stage.removeEventListener('pointerdown', this.onPointerDown, true)
    this.stage.removeEventListener('pointermove', this.onPointerMove, true)
    this.stage.removeEventListener('pointerup', this.onPointerUp, true)
    this.stage.removeEventListener('pointercancel', this.onPointerUp, true)
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
  }

  private baseScale() {
    const content = document.querySelector<HTMLElement>('#slide-content')
    const value = content ? getComputedStyle(content).getPropertyValue('--slidev-slide-scale') : ''
    const scale = Number.parseFloat(value)
    return Number.isFinite(scale) && scale > 0 ? scale : 1
  }

  private clampPosition() {
    if (!this.stage)
      return
    const rect = this.stage.getBoundingClientRect()
    const base = this.baseScale()
    const width = 980 * base * this.state.relative
    const height = 552 * base * this.state.relative
    const maxX = Math.max(0, (width - rect.width) / 2)
    const maxY = Math.max(0, (height - rect.height) / 2)
    this.state.x = Math.min(maxX, Math.max(-maxX, this.state.x))
    this.state.y = Math.min(maxY, Math.max(-maxY, this.state.y))
  }

  private renderTransform(announce: boolean) {
    if (!this.slideshow)
      return
    this.clampPosition()
    const base = this.baseScale()
    this.slideshow.style.transformOrigin = '50% 50%'
    this.slideshow.style.transform = `translate3d(${this.state.x / base}px, ${this.state.y / base}px, 0) scale(${this.state.relative})`
    document.documentElement.dataset.directReaderZoomed = String(this.state.relative > 1.01)
    document.documentElement.dataset.directReaderDragging = String(this.state.dragging)
    const isFit = this.state.relative <= 1.01
    const percentage = Math.round(this.state.relative * 100)
    this.zoomLabel.textContent = `${percentage}%`
    this.zoomReset.disabled = isFit
    this.zoomReset.setAttribute(
      'aria-label',
      isFit ? 'スライド全体を表示中（100%）' : `スライド全体を画面内に表示（現在${percentage}%）`,
    )
    if (announce) {
      this.live.textContent = isFit
        ? 'スライド全体を表示しました'
        : `${percentage}%に拡大しました`
    }
  }

  private eventPoint(event: PointerEvent) {
    const rect = this.stage!.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  private onPointerDown = (event: PointerEvent) => {
    if (!this.stage || this.root.contains(event.target as Node) || interactiveTarget(event.target))
      return
    event.stopImmediatePropagation()
    if (event.isTrusted)
      this.stage.setPointerCapture?.(event.pointerId)
    const point = this.eventPoint(event)
    this.pointers.set(event.pointerId, point)
    if (this.pointers.size === 1) {
      this.panStart = {
        pointer: point,
        offset: { x: this.state.x, y: this.state.y },
      }
      this.state.dragging = false
    }
    else if (this.pointers.size === 2) {
      const points = [...this.pointers.values()]
      this.pinchStart = {
        distance: Math.max(1, pointerDistance(points)),
        relative: this.state.relative,
        anchor: pointerCenter(points),
        offset: { x: this.state.x, y: this.state.y },
      }
      event.preventDefault()
    }
  }

  private onPointerMove = (event: PointerEvent) => {
    if (!this.stage || !this.pointers.has(event.pointerId))
      return
    event.stopImmediatePropagation()
    const point = this.eventPoint(event)
    this.pointers.set(event.pointerId, point)
    if (this.pointers.size === 2 && this.pinchStart) {
      const points = [...this.pointers.values()]
      const distance = pointerDistance(points)
      const center = pointerCenter(points)
      this.state.x = this.pinchStart.offset.x + center.x - this.pinchStart.anchor.x
      this.state.y = this.pinchStart.offset.y + center.y - this.pinchStart.anchor.y
      this.zoomTo(this.pinchStart.relative * distance / this.pinchStart.distance, center, { announce: false })
      this.state.dragging = true
      event.preventDefault()
      return
    }
    if (this.pointers.size === 1 && this.panStart && this.state.relative > 1.01 && !interactiveTarget(event.target)) {
      const dx = point.x - this.panStart.pointer.x
      const dy = point.y - this.panStart.pointer.y
      if (Math.hypot(dx, dy) >= DRAG_THRESHOLD)
        this.state.dragging = true
      if (this.state.dragging) {
        this.state.x = this.panStart.offset.x + dx
        this.state.y = this.panStart.offset.y + dy
        this.renderTransform(false)
        event.preventDefault()
      }
    }
  }

  private onPointerUp = (event: PointerEvent) => {
    if (this.pointers.has(event.pointerId))
      event.stopImmediatePropagation()
    const point = this.pointers.get(event.pointerId)
    const wasDragging = this.state.dragging
    this.pointers.delete(event.pointerId)
    if (this.pointers.size < 2)
      this.pinchStart = null
    if (this.pointers.size === 0) {
      if (wasDragging)
        this.state.suppressClickUntil = performance.now() + 250
      else if (point && !interactiveTarget(event.target))
        this.handleTap(point)
      this.panStart = null
      this.state.dragging = false
      this.renderTransform(false)
    }
  }

  private handleTap(point: Point) {
    const now = performance.now()
    if (this.lastTap
      && now - this.lastTap.time <= DOUBLE_TAP_DELAY
      && Math.hypot(point.x - this.lastTap.point.x, point.y - this.lastTap.point.y) < 32) {
      this.zoomTo(this.state.relative > 1.01 ? 1 : 2, point)
      this.lastTap = null
      return
    }
    this.lastTap = { time: now, point }
  }

  private blockDeckNavigation = (event: MouseEvent) => {
    if (this.root.contains(event.target as Node)
      || this.contentsDialog.contains(event.target as Node)
      || this.detailDialog.contains(event.target as Node)
      || interactiveTarget(event.target))
      return
    if (performance.now() < this.state.suppressClickUntil || event.target instanceof Node) {
      event.preventDefault()
      event.stopImmediatePropagation()
    }
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (this.contentsDialog.open || this.detailDialog.open) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopImmediatePropagation()
        if (this.contentsDialog.open)
          this.contentsDialog.close()
        else
          this.detailDialog.close()
      }
      return
    }
    if (interactiveTarget(event.target))
      return
    const consume = () => {
      event.preventDefault()
      event.stopImmediatePropagation()
    }
    if (event.key === '+' || event.key === '=') {
      consume()
      this.zoomTo(this.state.relative * ZOOM_STEP)
    }
    else if (event.key === '-') {
      consume()
      this.zoomTo(this.state.relative / ZOOM_STEP)
    }
    else if (event.key === '0') {
      consume()
      this.zoomTo(1)
    }
    else if (event.key === 'PageDown' || (event.key === 'ArrowRight' && this.state.relative <= 1.01)) {
      consume()
      this.goTo(this.index + 1)
    }
    else if (event.key === 'PageUp' || (event.key === 'ArrowLeft' && this.state.relative <= 1.01)) {
      consume()
      this.goTo(this.index - 1)
    }
    else if (this.state.relative > 1.01 && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      consume()
      const amount = 44
      if (event.key === 'ArrowLeft')
        this.state.x += amount
      else if (event.key === 'ArrowRight')
        this.state.x -= amount
      else if (event.key === 'ArrowUp')
        this.state.y += amount
      else
        this.state.y -= amount
      this.renderTransform(false)
    }
  }

  private async toggleFullscreen() {
    if (!this.fullscreen)
      return
    try {
      if (document.fullscreenElement)
        await document.exitFullscreen()
      else
        await document.documentElement.requestFullscreen()
    }
    catch (error) {
      console.error('Direct Reader fullscreen request failed:', error)
      this.live.textContent = 'この環境では全画面表示を利用できません'
      this.fullscreen.hidden = true
    }
  }

  private onFullscreenChange = () => {
    if (!this.fullscreen)
      return
    const active = Boolean(document.fullscreenElement)
    this.fullscreen.setAttribute('aria-label', active ? '全画面表示を終了する' : '全画面表示にする')
    this.fullscreen.setAttribute('aria-pressed', String(active))
    this.fullscreen.textContent = active ? '終了' : '全画面'
    requestAnimationFrame(() => this.renderTransform(false))
  }
}

let activeReader: DirectReader | null = null

export function installDirectReader(router: Router, baseUrl: string) {
  function reportError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Direct Reader failed to initialize:', error)
    let alert = document.querySelector<HTMLDivElement>('[data-direct-reader-error]')
    if (!alert) {
      alert = document.createElement('div')
      alert.dataset.directReaderError = ''
      alert.setAttribute('role', 'alert')
      Object.assign(alert.style, {
        position: 'fixed',
        zIndex: '100',
        inset: '1rem',
        margin: 'auto',
        maxWidth: '34rem',
        height: 'fit-content',
        padding: '1rem',
        border: '1px solid #fb7185',
        borderRadius: '0.75rem',
        background: '#111724',
        color: '#f4f7fb',
      })
      document.body.append(alert)
    }
    alert.textContent = `Reader Viewを開始できませんでした: ${message}`
  }

  router.beforeEach((to, from) => {
    if (queryEnabled(from) && isSlidePath(to.path) && !queryEnabled(to)) {
      return {
        path: to.path,
        query: { ...to.query, reader: 'true', embedded: 'true' },
        hash: to.hash,
        replace: true,
      }
    }
    return true
  })

  async function sync(route: RouteLocationNormalizedLoaded) {
    if (!queryEnabled(route))
      return
    if (!activeReader) {
      const base = normalizedBase(baseUrl)
      const response = await fetch(`${base}reader/reader-data.json`)
      if (!response.ok)
        throw new Error(`Reader data request failed with HTTP ${response.status}.`)
      const data = await response.json() as ReaderData
      if (data.version !== 2
        || !Array.isArray(data.slides)
        || data.slides.length !== 31
        || data.slides.some(slide => !slide.thumbnail))
        throw new Error('Reader data is incomplete or has an unsupported version.')
      activeReader = new DirectReader(router, data, base)
      const viewer = {
        getState: () => activeReader!.getState(),
        reset: () => activeReader!.zoomTo(1),
        zoomTo: (value: number) => activeReader!.zoomTo(value),
        showSlide: (number: number) => activeReader!.showSlide(number),
      }
      Object.assign(window, {
        __mobileViewer: viewer,
        __mobilePilot: viewer,
      })
    }
    activeReader.sync(route)
  }

  router.afterEach(to => void sync(to).catch(reportError))
  void sync(router.currentRoute.value).catch(reportError)
}
