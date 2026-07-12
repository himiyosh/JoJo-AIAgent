const SLIDE_WIDTH = 980
const SLIDE_HEIGHT = 552
const MIN_RELATIVE_ZOOM = 1
const MAX_RELATIVE_ZOOM = 4
const ZOOM_STEP = 1.35
const DRAG_THRESHOLD = 5
const DOUBLE_TAP_DELAY = 320

const shell = document.querySelector('[data-mobile-shell]')
const stage = document.querySelector('[data-mobile-stage]')
const canvas = document.querySelector('[data-mobile-canvas]')
const frame = document.querySelector('[data-mobile-frame]')
const title = document.querySelector('[data-mobile-title]')
const source = document.querySelector('[data-mobile-source]')
const zoomLabel = document.querySelector('[data-mobile-zoom-label]')
const live = document.querySelector('[data-mobile-live]')
const deckLink = document.querySelector('[data-mobile-deck-link]')
const detailDialog = document.querySelector('#mobile-detail-dialog')
const contentsDialog = document.querySelector('#mobile-contents-dialog')
const infoButton = document.querySelector('[data-mobile-info]')
const fullscreenButton = document.querySelector('[data-mobile-fullscreen]')
const previousButton = document.querySelector('[data-mobile-prev]')
const nextButton = document.querySelector('[data-mobile-next]')
const searchInput = document.querySelector('[data-mobile-search-input]')
const searchStatus = document.querySelector('[data-mobile-search-status]')
const searchEmpty = document.querySelector('[data-mobile-search-empty]')
const data = JSON.parse(document.querySelector('#mobile-viewer-data')?.textContent ?? '{}')
const slides = Array.isArray(data.slides) ? data.slides : []
const isFullReader = data.variant === 'reader'

const state = {
  index: 0,
  fitScale: 1,
  scale: 1,
  x: 0,
  y: 0,
  dragging: false,
  suppressClickUntil: 0,
}
const pointers = new Map()
let panStart = null
let pinchStart = null
let lastTap = null
let frameCleanup = null
let frameBindTimer = 0
let detailOpener = null
let contentsOpener = null

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function slideIndexFromHash() {
  const match = location.hash.match(/^#slide-(\d+)$/)
  if (!match)
    return 0
  const index = slides.findIndex(slide => slide.number === Number(match[1]))
  return index >= 0 ? index : 0
}

function baseUrl() {
  return new URL('../', location.href)
}

function embeddedSlideUrl(number) {
  if (data.routerMode === 'hash')
    return new URL(`?embedded=true#/${number}`, baseUrl()).href
  return new URL(`${number}?embedded=true`, baseUrl()).href
}

function deckUrl(number) {
  if (data.routerMode === 'hash')
    return new URL(`#/${number}`, baseUrl()).href
  return new URL(String(number), baseUrl()).href
}

function relativeZoom() {
  return state.fitScale > 0 ? state.scale / state.fitScale : 1
}

function stageSize() {
  const rect = stage.getBoundingClientRect()
  return { width: rect.width, height: rect.height }
}

function clampPosition() {
  const size = stageSize()
  const width = SLIDE_WIDTH * state.scale
  const height = SLIDE_HEIGHT * state.scale
  if (width <= size.width)
    state.x = (size.width - width) / 2
  else
    state.x = clamp(state.x, size.width - width, 0)
  if (height <= size.height)
    state.y = (size.height - height) / 2
  else
    state.y = clamp(state.y, size.height - height, 0)
}

function renderTransform({ announce = false } = {}) {
  clampPosition()
  canvas.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) scale(${state.scale})`
  const relative = relativeZoom()
  const isFit = relative <= 1.01
  const percent = Math.round(relative * 100)
  zoomLabel.textContent = isFit ? '全体' : `${percent}%`
  stage.dataset.mobileZoomed = String(!isFit)
  shell.dataset.mobileZoomed = String(!isFit)
  stage.dataset.mobileDragging = String(state.dragging)
  stage.dataset.mobileRelativeZoom = relative.toFixed(3)
  if (announce)
    live.textContent = isFit ? 'スライド全体を表示しました' : `${percent}%に拡大しました`
}

function calculateFit({ preserveRelative = false } = {}) {
  const previousRelative = preserveRelative ? relativeZoom() : 1
  const size = stageSize()
  state.fitScale = Math.min(size.width / SLIDE_WIDTH, size.height / SLIDE_HEIGHT)
  state.scale = state.fitScale * clamp(previousRelative, MIN_RELATIVE_ZOOM, MAX_RELATIVE_ZOOM)
  state.x = (size.width - SLIDE_WIDTH * state.scale) / 2
  state.y = (size.height - SLIDE_HEIGHT * state.scale) / 2
  renderTransform()
}

function zoomTo(relative, anchor = null, { announce = true } = {}) {
  const nextRelative = clamp(relative, MIN_RELATIVE_ZOOM, MAX_RELATIVE_ZOOM)
  const nextScale = state.fitScale * nextRelative
  const size = stageSize()
  const point = anchor ?? { x: size.width / 2, y: size.height / 2 }
  if (state.scale > 0) {
    const ratio = nextScale / state.scale
    state.x = point.x - (point.x - state.x) * ratio
    state.y = point.y - (point.y - state.y) * ratio
  }
  state.scale = nextScale
  renderTransform({ announce })
}

function resetZoom({ announce = true } = {}) {
  zoomTo(1, null, { announce })
}

function frameTitle(slide) {
  return `Slide ${String(slide.number).padStart(2, '0')} · ${slide.title}`
}

function updateDetailPanel(number) {
  document.querySelectorAll('[data-mobile-detail-panel]').forEach((panel) => {
    panel.hidden = Number(panel.dataset.mobileDetailPanel) !== number
  })
}

function updateSlide(index, {
  history = 'push',
  focus = false,
} = {}) {
  if (!slides.length)
    return
  if (isFullReader && (index < 0 || index >= slides.length))
    return
  state.index = (index + slides.length) % slides.length
  state.suppressClickUntil = 0
  const slide = slides[state.index]
  shell.dataset.mobileCurrent = String(slide.number)
  title.textContent = slide.title
  source.textContent = `SLIDE ${String(slide.number).padStart(2, '0')} · ${state.index + 1} / ${slides.length}`
  frame.title = frameTitle(slide)
  const nextFrameUrl = embeddedSlideUrl(slide.number)
  let currentFrameUrl = ''
  try {
    currentFrameUrl = frame.contentWindow.location.href
  }
  catch {
    currentFrameUrl = frame.src
  }
  if (currentFrameUrl !== nextFrameUrl) {
    if (frame.dataset.mobileInitialized !== 'true') {
      frame.src = nextFrameUrl
    }
    else {
      try {
        frame.contentWindow.location.replace(nextFrameUrl)
      }
      catch {
        frame.src = nextFrameUrl
      }
    }
  }
  frame.dataset.mobileInitialized = 'true'
  deckLink.href = deckUrl(slide.number)
  updateDetailPanel(slide.number)
  document.querySelectorAll('[data-mobile-select]').forEach((button) => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.mobileSelect) === slide.number))
  })
  if (isFullReader) {
    previousButton.disabled = state.index === 0
    nextButton.disabled = state.index === slides.length - 1
    previousButton.setAttribute('aria-label', state.index === 0 ? '前のスライドはありません' : '前のスライドへ')
    nextButton.setAttribute('aria-label', state.index === slides.length - 1 ? '次のスライドはありません' : '次のスライドへ')
  }
  resetZoom({ announce: false })

  const hash = `#slide-${slide.number}`
  if (location.hash !== hash) {
    if (history === 'replace')
      window.history.replaceState(null, '', hash)
    else
      window.history.pushState(null, '', hash)
  }
  if (focus)
    title.focus?.({ preventScroll: true })
  live.textContent = `Slide ${String(slide.number).padStart(2, '0')}を表示しました`
}

function eventPoint(event, frameDocument = false) {
  if (frameDocument) {
    return {
      x: state.x + event.clientX * state.scale,
      y: state.y + event.clientY * state.scale,
    }
  }
  const rect = stage.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function midpoint(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  }
}

function startPinch() {
  if (pointers.size < 2)
    return
  const [first, second] = [...pointers.values()]
  pinchStart = {
    distance: Math.max(1, distance(first, second)),
    center: midpoint(first, second),
    scale: state.scale,
    x: state.x,
    y: state.y,
  }
  state.dragging = true
  renderTransform()
}

function bindGestureSurface(target, frameDocument = false) {
  function pointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0)
      return
    const point = eventPoint(event, frameDocument)
    pointers.set(event.pointerId, point)
    if (pointers.size === 1) {
      panStart = {
        point,
        x: state.x,
        y: state.y,
        moved: false,
      }
    }
    else {
      event.preventDefault()
      startPinch()
    }
  }

  function pointerMove(event) {
    if (!pointers.has(event.pointerId))
      return
    const point = eventPoint(event, frameDocument)
    pointers.set(event.pointerId, point)
    if (pointers.size >= 2 && pinchStart) {
      event.preventDefault()
      const [first, second] = [...pointers.values()]
      const center = midpoint(first, second)
      const ratio = distance(first, second) / pinchStart.distance
      const nextScale = clamp(
        pinchStart.scale * ratio,
        state.fitScale * MIN_RELATIVE_ZOOM,
        state.fitScale * MAX_RELATIVE_ZOOM,
      )
      const scaleRatio = nextScale / pinchStart.scale
      state.scale = nextScale
      state.x = center.x - (pinchStart.center.x - pinchStart.x) * scaleRatio
      state.y = center.y - (pinchStart.center.y - pinchStart.y) * scaleRatio
      renderTransform()
      return
    }

    if (pointers.size === 1 && panStart && relativeZoom() > 1.01) {
      const dx = point.x - panStart.point.x
      const dy = point.y - panStart.point.y
      if (!panStart.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD)
        return
      event.preventDefault()
      panStart.moved = true
      state.dragging = true
      state.x = panStart.x + dx
      state.y = panStart.y + dy
      renderTransform()
    }
  }

  function pointerUp(event) {
    const point = pointers.get(event.pointerId) ?? eventPoint(event, frameDocument)
    const moved = Boolean(panStart?.moved)
    pointers.delete(event.pointerId)
    if (moved)
      state.suppressClickUntil = performance.now() + 350

    if (event.pointerType === 'touch' && !moved && pointers.size === 0) {
      const now = performance.now()
      if (lastTap && now - lastTap.time <= DOUBLE_TAP_DELAY && distance(point, lastTap.point) <= 28) {
        event.preventDefault()
        state.suppressClickUntil = now + 400
        if (relativeZoom() > 1.01)
          resetZoom()
        else
          zoomTo(2.25, point)
        lastTap = null
      }
      else {
        lastTap = { time: now, point }
      }
    }

    if (pointers.size < 2)
      pinchStart = null
    if (pointers.size === 1) {
      const remaining = [...pointers.values()][0]
      panStart = { point: remaining, x: state.x, y: state.y, moved: false }
    }
    else if (pointers.size === 0) {
      panStart = null
      state.dragging = false
      renderTransform({ announce: moved })
    }
  }

  function doubleClick(event) {
    event.preventDefault()
    const point = eventPoint(event, frameDocument)
    if (relativeZoom() > 1.01)
      resetZoom()
    else
      zoomTo(2.25, point)
  }

  function wheel(event) {
    if (!event.ctrlKey && !event.metaKey && relativeZoom() <= 1.01)
      return
    event.preventDefault()
    const point = eventPoint(event, frameDocument)
    if (event.ctrlKey || event.metaKey) {
      const factor = Math.exp(-event.deltaY * 0.002)
      zoomTo(relativeZoom() * factor, point, { announce: false })
    }
    else {
      state.x -= event.deltaX
      state.y -= event.deltaY
      renderTransform()
    }
  }

  target.addEventListener('pointerdown', pointerDown, { passive: false })
  target.addEventListener('pointermove', pointerMove, { passive: false })
  target.addEventListener('pointerup', pointerUp, { passive: false })
  target.addEventListener('pointercancel', pointerUp, { passive: false })
  target.addEventListener('dblclick', doubleClick, { passive: false })
  target.addEventListener('wheel', wheel, { passive: false })

  return () => {
    target.removeEventListener('pointerdown', pointerDown)
    target.removeEventListener('pointermove', pointerMove)
    target.removeEventListener('pointerup', pointerUp)
    target.removeEventListener('pointercancel', pointerUp)
    target.removeEventListener('dblclick', doubleClick)
    target.removeEventListener('wheel', wheel)
  }
}

function handleKey(event) {
  if (detailDialog.open || contentsDialog?.open)
    return
  const active = document.activeElement
  if (active instanceof HTMLButtonElement || active instanceof HTMLAnchorElement)
    return

  if (event.key === '+' || event.key === '=') {
    event.preventDefault()
    zoomTo(relativeZoom() * ZOOM_STEP)
  }
  else if (event.key === '-') {
    event.preventDefault()
    zoomTo(relativeZoom() / ZOOM_STEP)
  }
  else if (event.key === '0') {
    event.preventDefault()
    resetZoom()
  }
  else if (event.key === 'PageDown' || (event.key === 'ArrowRight' && relativeZoom() <= 1.01)) {
    event.preventDefault()
    updateSlide(state.index + 1, { focus: true })
  }
  else if (event.key === 'PageUp' || (event.key === 'ArrowLeft' && relativeZoom() <= 1.01)) {
    event.preventDefault()
    updateSlide(state.index - 1, { focus: true })
  }
  else if (relativeZoom() > 1.01 && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    event.preventDefault()
    const amount = event.shiftKey ? 80 : 32
    if (event.key === 'ArrowLeft')
      state.x += amount
    else if (event.key === 'ArrowRight')
      state.x -= amount
    else if (event.key === 'ArrowUp')
      state.y += amount
    else
      state.y -= amount
    renderTransform()
  }
}

function bindFrame() {
  window.clearTimeout(frameBindTimer)
  frameCleanup?.()
  frameCleanup = null
  const doc = frame.contentDocument
  if (!doc?.querySelector('.slidev-layout')) {
    frameBindTimer = window.setTimeout(bindFrame, 50)
    return
  }
  doc.documentElement.style.touchAction = 'none'
  if (doc.body)
    doc.body.style.touchAction = 'none'
  const unbindGesture = bindGestureSurface(doc, true)

  function blockDeckNavigation(event) {
    if (performance.now() < state.suppressClickUntil) {
      event.preventDefault()
      event.stopImmediatePropagation()
      return
    }
    const interactive = typeof event.target?.closest === 'function'
      && event.target.closest('button, a, input, select, textarea, summary, [role="tab"], [role="button"]')
    if (!interactive) {
      event.preventDefault()
      event.stopImmediatePropagation()
    }
  }

  function frameKeydown(event) {
    if (['+', '=', '-', '0', 'PageDown', 'PageUp', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault()
      event.stopImmediatePropagation()
      handleKey(event)
    }
  }

  doc.defaultView?.addEventListener('click', blockDeckNavigation, true)
  doc.defaultView?.addEventListener('keydown', frameKeydown, true)
  const enforceFrameRoute = () => {
    const expected = embeddedSlideUrl(slides[state.index].number)
    if (doc.defaultView?.location.href !== expected)
      doc.defaultView?.location.replace(expected)
  }
  const routeTimer = window.setTimeout(enforceFrameRoute, 150)
  doc.defaultView?.addEventListener('hashchange', enforceFrameRoute)
  frameCleanup = () => {
    window.clearTimeout(routeTimer)
    unbindGesture()
    doc.defaultView?.removeEventListener('click', blockDeckNavigation, true)
    doc.defaultView?.removeEventListener('keydown', frameKeydown, true)
    doc.defaultView?.removeEventListener('hashchange', enforceFrameRoute)
  }

  enforceFrameRoute()
}

function openDetail() {
  const slide = slides[state.index]
  updateDetailPanel(slide.number)
  detailOpener = infoButton
  detailDialog.showModal()
  detailDialog.querySelector('[data-mobile-dialog-close]')?.focus()
}

bindGestureSurface(stage)
frame.addEventListener('load', bindFrame)
bindFrame()
previousButton?.addEventListener('click', () => updateSlide(state.index - 1))
nextButton?.addEventListener('click', () => updateSlide(state.index + 1))
document.querySelectorAll('[data-mobile-select]').forEach((button) => {
  button.addEventListener('click', () => {
    const index = slides.findIndex(slide => slide.number === Number(button.dataset.mobileSelect))
    if (index >= 0)
      updateSlide(index)
  })
})
document.querySelector('[data-mobile-zoom-in]')?.addEventListener('click', () => zoomTo(relativeZoom() * ZOOM_STEP))
document.querySelector('[data-mobile-zoom-out]')?.addEventListener('click', () => zoomTo(relativeZoom() / ZOOM_STEP))
document.querySelector('[data-mobile-zoom-reset]')?.addEventListener('click', () => resetZoom())
infoButton?.addEventListener('click', openDetail)
document.querySelector('[data-mobile-dialog-close]')?.addEventListener('click', () => detailDialog.close())
detailDialog?.addEventListener('click', (event) => {
  if (event.target === detailDialog)
    detailDialog.close()
})
detailDialog?.addEventListener('close', () => {
  detailOpener?.focus({ preventScroll: true })
  detailOpener = null
})

function filterContents() {
  if (!contentsDialog)
    return
  const query = (searchInput?.value ?? '').normalize('NFKC').toLocaleLowerCase('ja')
  let matches = 0
  contentsDialog.querySelectorAll('[data-mobile-toc-item]').forEach((item) => {
    const text = (item.dataset.mobileSearch ?? '').normalize('NFKC').toLocaleLowerCase('ja')
    const visible = !query || text.includes(query)
    item.hidden = !visible
    if (visible)
      matches += 1
  })
  searchStatus.textContent = `${matches}件`
  searchEmpty.hidden = matches !== 0
}

function openContents(opener) {
  if (!contentsDialog)
    return
  contentsOpener = opener
  contentsDialog.showModal()
  searchInput?.focus()
}

document.querySelectorAll('[data-mobile-toc-open]').forEach((button) => {
  button.addEventListener('click', () => openContents(button))
})
document.querySelector('[data-mobile-toc-close]')?.addEventListener('click', () => contentsDialog.close())
searchInput?.addEventListener('input', filterContents)
contentsDialog?.querySelectorAll('[data-mobile-toc-select]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault()
    const index = slides.findIndex(slide => slide.number === Number(link.dataset.mobileTocSelect))
    if (index < 0)
      return
    contentsOpener = null
    contentsDialog.close()
    updateSlide(index, { focus: true })
  })
})
contentsDialog?.addEventListener('click', (event) => {
  if (event.target === contentsDialog)
    contentsDialog.close()
})
contentsDialog?.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape')
    return
  event.preventDefault()
  contentsDialog.close()
})
contentsDialog?.addEventListener('close', () => {
  contentsOpener?.focus({ preventScroll: true })
  contentsOpener = null
})

if (!stage.requestFullscreen)
  fullscreenButton.hidden = true
fullscreenButton?.addEventListener('click', async () => {
  if (document.fullscreenElement)
    await document.exitFullscreen()
  else
    await stage.requestFullscreen()
})
document.addEventListener('fullscreenchange', () => {
  fullscreenButton.setAttribute('aria-label', document.fullscreenElement
    ? '全画面表示を終了する'
    : 'スライド表示を全画面にする')
  requestAnimationFrame(() => calculateFit({ preserveRelative: true }))
})
window.addEventListener('keydown', handleKey, true)
window.addEventListener('hashchange', () => updateSlide(slideIndexFromHash(), { history: 'replace' }))

const resizeObserver = new ResizeObserver(() => calculateFit({ preserveRelative: true }))
resizeObserver.observe(stage)

state.index = slideIndexFromHash()
updateSlide(state.index, { history: 'replace' })
requestAnimationFrame(() => calculateFit())

window.__mobileViewer = {
  getState: () => ({
    index: state.index,
    slide: slides[state.index]?.number,
    fitScale: state.fitScale,
    scale: state.scale,
    relativeZoom: relativeZoom(),
    x: state.x,
    y: state.y,
  }),
  reset: () => resetZoom(),
  zoomTo: value => zoomTo(value),
  showSlide: (number) => {
    const index = slides.findIndex(slide => slide.number === Number(number))
    if (index >= 0)
      updateSlide(index)
  },
}
window.__mobilePilot = window.__mobileViewer
