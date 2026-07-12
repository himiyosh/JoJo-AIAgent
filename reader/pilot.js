const scroller = document.querySelector('.pilot-pages')
const pages = [...document.querySelectorAll('.pilot-page')]
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const pageIndexById = new Map(pages.map((page, index) => [page.id, index]))
for (const [index, page] of pages.entries()) {
  for (const legacyId of page.dataset.pilotLegacyIds?.split(/\s+/).filter(Boolean) ?? [])
    pageIndexById.set(legacyId, index)
}
const pageStages = pages
  .map(page => page.querySelector('[data-pilot-stage]'))
  .filter(stage => stage instanceof HTMLElement)
const firstPageBySource = new Map()
let currentIndex = 0
let observerEnabled = false
let programmaticTarget = null
let movementSequence = 0
let pendingDialogId = ''
let pendingDialogTarget = null
let overflowSyncFrame = 0
const dialogState = new WeakMap()

for (const [index, page] of pages.entries()) {
  const source = page.dataset.sourceSlide
  if (!firstPageBySource.has(source))
    firstPageBySource.set(source, index)
}

function clampIndex(index) {
  return Math.min(Math.max(index, 0), pages.length - 1)
}

function indexFromHash() {
  let id
  try {
    id = decodeURIComponent(location.hash.replace(/^#/, ''))
  }
  catch {
    return 0
  }
  if (pageIndexById.has(id))
    return pageIndexById.get(id)
  const legacy = id.match(/^slide-(\d+)$/)
  if (legacy && firstPageBySource.has(legacy[1]))
    return firstPageBySource.get(legacy[1])
  return 0
}

function hashForIndex(index) {
  return `#${pages[clampIndex(index)].id}`
}

function canonicalizeHash(index) {
  const hash = hashForIndex(index)
  if (location.hash !== hash)
    history.replaceState(null, '', hash)
}

function activeDialog() {
  return document.querySelector('.pilot-dialog[open]')
}

function markCurrent(index) {
  currentIndex = clampIndex(index)
  if (scroller instanceof HTMLElement)
    scroller.dataset.pilotCurrent = String(currentIndex + 1)
}

function markSettled(index) {
  if (scroller instanceof HTMLElement)
    scroller.dataset.pilotSettled = String(clampIndex(index) + 1)
}

function focusPage(index) {
  const page = pages[clampIndex(index)]
  const stage = page?.querySelector('[data-pilot-stage]')
  const target = page?.querySelector('.pilot-page__title')
  if (stage instanceof HTMLElement)
    stage.scrollTop = 0
  if (target instanceof HTMLElement)
    target.focus({ preventScroll: true })
}

function clearPendingDialog() {
  pendingDialogId = ''
  pendingDialogTarget = null
}

function openPendingDialog(target) {
  if (!pendingDialogId || pendingDialogTarget !== target) {
    clearPendingDialog()
    return
  }
  const dialog = document.getElementById(pendingDialogId)
  clearPendingDialog()
  openDialog(dialog, pages[target].querySelector('[data-pilot-dialog]'))
}

function syncOverflowStageAccess() {
  const fallbackEnabled = scroller instanceof HTMLElement && scroller.dataset.pilotOverflowSafe === 'true'
  for (const stage of pageStages) {
    if (fallbackEnabled) {
      const scrollable = stage.scrollHeight - stage.clientHeight > 1
      stage.toggleAttribute('data-pilot-scrollable', scrollable)
      if (scrollable)
        stage.tabIndex = 0
      else
        stage.removeAttribute('tabindex')
    }
    else {
      stage.removeAttribute('data-pilot-scrollable')
      stage.removeAttribute('tabindex')
    }
  }
}

function scheduleOverflowStageSync() {
  window.cancelAnimationFrame(overflowSyncFrame)
  overflowSyncFrame = window.requestAnimationFrame(syncOverflowStageAccess)
}

function updateOverflowSafety() {
  if (!(scroller instanceof HTMLElement))
    return
  delete scroller.dataset.pilotOverflowSafe
  const scale = window.visualViewport?.scale ?? 1
  const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  const extreme = window.innerWidth < 320 || window.innerHeight < 620 || scale >= 1.5 || rootFontSize >= 24
  const layoutOverflow = pageStages.some(stage => stage.scrollHeight - stage.clientHeight > 1)
  if (extreme || layoutOverflow)
    scroller.dataset.pilotOverflowSafe = 'true'
  syncOverflowStageAccess()
  scheduleOverflowStageSync()
}

function openDialog(dialog, opener, focusSelector = '[data-pilot-close]') {
  if (!(dialog instanceof HTMLDialogElement))
    return
  clearPendingDialog()
  const open = activeDialog()
  if (open && open !== dialog)
    return
  if (dialog.open) {
    dialog.querySelector(focusSelector)?.focus()
    return
  }
  dialogState.set(dialog, {
    opener: opener instanceof HTMLElement ? opener : null,
    navigationTarget: null,
  })
  scroller?.classList.add('pilot-pages--dialog-open')
  dialog.showModal()
  dialog.querySelector(focusSelector)?.focus()
}

function closeDialogForNavigation(index) {
  const dialog = activeDialog()
  const destination = pages[clampIndex(index)]
  if (!(dialog instanceof HTMLDialogElement) || dialog.closest('.pilot-page') === destination)
    return
  const state = dialogState.get(dialog) ?? { opener: null, navigationTarget: null }
  state.navigationTarget = clampIndex(index)
  dialogState.set(dialog, state)
  dialog.close()
}

function finishMovement(sequence, target, top, focusDestination) {
  requestAnimationFrame(() => {
    if (sequence !== movementSequence)
      return
    scroller.scrollTop = top
    requestAnimationFrame(() => {
      if (sequence !== movementSequence)
        return
      scroller.scrollTop = top
      scroller.classList.remove('pilot-pages--instant')
      programmaticTarget = null
      markCurrent(target)
      markSettled(target)
      if (focusDestination)
        focusPage(target)
      openPendingDialog(target)
    })
  })
}

function scrollToPage(index, behavior = reducedMotion.matches ? 'auto' : 'smooth', focusDestination = true) {
  if (!(scroller instanceof HTMLElement) || !pages.length)
    return
  clearPendingDialog()
  const target = clampIndex(index)
  const top = pages[target].offsetTop
  const sequence = ++movementSequence
  const instant = behavior === 'auto' || reducedMotion.matches
  const alreadyAtTarget = Math.abs(scroller.scrollTop - top) <= 1
  delete scroller.dataset.pilotSettled
  programmaticTarget = target
  markCurrent(target)
  closeDialogForNavigation(target)

  if (instant || alreadyAtTarget) {
    scroller.classList.add('pilot-pages--instant')
    scroller.scrollTop = top
    finishMovement(sequence, target, top, focusDestination)
    return
  }

  scroller.classList.remove('pilot-pages--instant')
  scroller.scrollTo({ top, behavior: 'smooth' })
  let settled = false
  const finish = () => {
    if (settled || sequence !== movementSequence)
      return
    settled = true
    if (Math.abs(scroller.scrollTop - top) > 1) {
      scroller.classList.add('pilot-pages--instant')
      scroller.scrollTop = top
      scroller.classList.remove('pilot-pages--instant')
    }
    programmaticTarget = null
    markCurrent(target)
    markSettled(target)
    if (focusDestination)
      focusPage(target)
    openPendingDialog(target)
  }
  scroller.addEventListener('scrollend', finish, { once: true })
  window.setTimeout(finish, 1200)
}

function navigateToPage(index, { focus = true, openDialogId = '' } = {}) {
  const target = clampIndex(index)
  const hash = hashForIndex(target)
  if (location.hash !== hash)
    history.pushState(null, '', hash)
  scrollToPage(target, reducedMotion.matches ? 'auto' : 'smooth', focus)
  if (openDialogId) {
    pendingDialogId = openDialogId
    pendingDialogTarget = target
  }
}

function startObserver() {
  const observer = new IntersectionObserver((entries) => {
    if (!observerEnabled || programmaticTarget !== null || activeDialog())
      return
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
    if (!visible || visible.intersectionRatio < 0.55)
      return
    const index = pages.indexOf(visible.target)
    markCurrent(index)
    markSettled(index)
    const hash = hashForIndex(index)
    if (location.hash !== hash)
      history.replaceState(null, '', hash)
  }, {
    root: scroller,
    threshold: [0.55, 0.75, 0.95],
  })
  pages.forEach(page => observer.observe(page))
  observerEnabled = true
}

function initialize() {
  if (!(scroller instanceof HTMLElement) || !pages.length)
    return
  const target = indexFromHash()
  const top = pages[target].offsetTop
  const sequence = ++movementSequence
  programmaticTarget = target
  markCurrent(target)
  scroller.classList.add('pilot-pages--instant')
  scroller.scrollTop = top
  requestAnimationFrame(() => {
    if (sequence !== movementSequence)
      return
    scroller.scrollTop = top
    requestAnimationFrame(() => {
      if (sequence !== movementSequence)
        return
      scroller.scrollTop = top
      scroller.classList.remove('pilot-pages--instant')
      programmaticTarget = null
      canonicalizeHash(target)
      startObserver()
      markSettled(target)
      scroller.dataset.pilotReady = 'true'
    })
  })
}

initialize()

window.addEventListener('hashchange', () => {
  const target = indexFromHash()
  canonicalizeHash(target)
  scrollToPage(target, 'auto', true)
})

document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
    return
  const anchor = event.target instanceof Element ? event.target.closest('a[href^="#slide-"]') : null
  if (!(anchor instanceof HTMLAnchorElement))
    return
  const id = new URL(anchor.href).hash.replace(/^#/, '')
  const target = pageIndexById.get(id)
  if (!Number.isFinite(target))
    return
  event.preventDefault()
  const openDialogId = anchor.dataset.pilotOpenDialog || ''
  closeDialogForNavigation(target)
  navigateToPage(target, { openDialogId })
})

window.addEventListener('keydown', (event) => {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey)
    return
  const next = ['ArrowDown', 'PageDown'].includes(event.key)
  const previous = ['ArrowUp', 'PageUp'].includes(event.key)
  const target = event.target
  const dialog = activeDialog()
  const dialogScroll = dialog && target instanceof HTMLElement ? target.closest('.pilot-dialog__scroll') : null
  if (dialogScroll && (next || previous)) {
    event.preventDefault()
    const distance = event.key.startsWith('Page') ? Math.max(44, Math.floor(dialogScroll.clientHeight * 0.85)) : 48
    dialogScroll.scrollBy({ top: next ? distance : -distance, behavior: 'auto' })
    return
  }
  if (dialog)
    return
  const interactiveTarget = target instanceof HTMLElement
    && (target.isContentEditable || target.matches('a, button, input, select, textarea'))
  const currentPage = pages[currentIndex]
  const currentOverflowStage = currentPage?.querySelector('[data-pilot-scrollable]')
  const targetBelongsToCurrentPage = target === document.body
    || target === document.documentElement
    || (target instanceof HTMLElement && target.closest('.pilot-page') === currentPage)
  const overflowStage = !interactiveTarget
    && targetBelongsToCurrentPage
    && currentOverflowStage instanceof HTMLElement
    ? currentOverflowStage
    : null
  const forwardInStage = next || (event.key === ' ' && !event.shiftKey)
  const backwardInStage = previous || (event.key === ' ' && event.shiftKey)
  if (overflowStage && (forwardInStage || backwardInStage)) {
    const canScroll = forwardInStage
      ? overflowStage.scrollTop + overflowStage.clientHeight < overflowStage.scrollHeight - 1
      : overflowStage.scrollTop > 1
    if (canScroll) {
      event.preventDefault()
      const distance = event.key.startsWith('Arrow') ? 48 : Math.max(44, Math.floor(overflowStage.clientHeight * 0.85))
      overflowStage.scrollBy({ top: forwardInStage ? distance : -distance, behavior: 'auto' })
      return
    }
    event.preventDefault()
    navigateToPage(currentIndex + (forwardInStage ? 1 : -1))
    return
  }
  if (interactiveTarget)
    return
  const pageNext = next || (event.key === ' ' && !event.shiftKey)
  const pagePrevious = previous || (event.key === ' ' && event.shiftKey)
  if (pageNext) {
    event.preventDefault()
    navigateToPage(currentIndex + 1)
  }
  else if (pagePrevious) {
    event.preventDefault()
    navigateToPage(currentIndex - 1)
  }
})

document.querySelectorAll('[data-pilot-dialog]').forEach((button) => {
  button.addEventListener('click', () => openDialog(document.getElementById(button.dataset.pilotDialog), button))
})

document.querySelectorAll('[data-pilot-contents]').forEach((button) => {
  button.addEventListener('click', () => openDialog(document.getElementById('pilot-contents-dialog'), button))
})

document.querySelectorAll('[data-pilot-search]').forEach((button) => {
  button.addEventListener('click', () => openDialog(document.getElementById('pilot-search-dialog'), button, '[data-pilot-search-input]'))
})

const searchDataElement = document.getElementById('pilot-search-data')
const searchInput = document.querySelector('[data-pilot-search-input]')
const searchResults = document.querySelector('[data-pilot-search-results]')
const searchStatus = document.querySelector('[data-pilot-search-status]')
let searchData = []

try {
  searchData = JSON.parse(searchDataElement?.textContent ?? '[]')
}
catch {
  searchData = []
}

function renderSearchResults(query = '') {
  if (!(searchResults instanceof HTMLOListElement) || !(searchStatus instanceof HTMLElement))
    return
  const normalized = query.normalize('NFKC').toLocaleLowerCase('ja').trim()
  const matches = normalized
    ? searchData.filter(entry => entry.text.normalize('NFKC').toLocaleLowerCase('ja').includes(normalized))
    : searchData
  searchResults.replaceChildren(...matches.map((entry) => {
    const li = document.createElement('li')
    const anchor = document.createElement('a')
    const number = document.createElement('span')
    const copy = document.createElement('span')
    const title = document.createElement('b')
    const meta = document.createElement('small')
    anchor.href = `#${entry.id}`
    if (normalized && entry.dialogText?.normalize('NFKC').toLocaleLowerCase('ja').includes(normalized)
      && !entry.visibleText?.normalize('NFKC').toLocaleLowerCase('ja').includes(normalized))
      anchor.dataset.pilotOpenDialog = `pilot-dialog-${entry.id}`
    number.textContent = String(entry.number).padStart(2, '0')
    title.textContent = entry.title
    meta.textContent = `Source ${String(entry.sourceSlide).padStart(2, '0')} · ${entry.sourceOrdinal}`
    copy.append(title, meta)
    anchor.append(number, copy)
    li.append(anchor)
    return li
  }))
  if (!matches.length) {
    const empty = document.createElement('li')
    empty.className = 'pilot-search__empty'
    empty.textContent = '一致するページはありません。'
    searchResults.append(empty)
  }
  searchStatus.textContent = `${matches.length}件`
}

if (searchInput instanceof HTMLInputElement) {
  searchInput.addEventListener('input', () => renderSearchResults(searchInput.value))
  searchInput.addEventListener('search', () => renderSearchResults(searchInput.value))
  renderSearchResults()
}

document.querySelectorAll('.pilot-dialog').forEach((dialog) => {
  dialog.querySelector('[data-pilot-close]')?.addEventListener('click', () => dialog.close())
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog)
      dialog.close()
  })
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      dialog.close()
      return
    }
    if (event.key !== 'Tab')
      return
    const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter(element => element.getClientRects().length > 0)
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last)
      return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    }
    else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  })
  dialog.addEventListener('close', () => {
    const newerDialog = activeDialog()
    const state = dialogState.get(dialog)
    if (!newerDialog)
      scroller?.classList.remove('pilot-pages--dialog-open')
    if (!newerDialog && state?.navigationTarget === null && state.opener instanceof HTMLElement) {
      const openerPage = state.opener.closest('.pilot-page')
      if (!openerPage || openerPage === pages[currentIndex])
        state.opener.focus({ preventScroll: true })
      else
        focusPage(currentIndex)
    }
    dialogState.delete(dialog)
  })
})

Promise.resolve(document.fonts?.ready).then(updateOverflowSafety)
const overflowResizeObserver = new ResizeObserver(() => {
  if (scroller instanceof HTMLElement && scroller.dataset.pilotOverflowSafe === 'true')
    scheduleOverflowStageSync()
})
pageStages.forEach(stage => overflowResizeObserver.observe(stage))
window.addEventListener('resize', updateOverflowSafety)
window.visualViewport?.addEventListener('resize', updateOverflowSafety)
window.updatePilotOverflowSafety = updateOverflowSafety
