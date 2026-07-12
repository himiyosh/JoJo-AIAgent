const scroller = document.querySelector('.reader-pages')
const pages = [...document.querySelectorAll('.reader-page')]
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
let currentIndex = 0
let dialogOpener = null
let dialogNavigationTarget = null
let movementSequence = 0
let observerEnabled = false
let programmaticTarget = null

function clampIndex(index) {
  return Math.min(Math.max(index, 0), pages.length - 1)
}

function indexFromHash() {
  const match = location.hash.match(/^#slide-(\d+)$/)
  if (!match)
    return 0
  return clampIndex(Number(match[1]) - 1)
}

function activeDialog() {
  return document.querySelector('.reader-dialog[open]')
}

function markCurrent(index) {
  currentIndex = clampIndex(index)
  if (scroller instanceof HTMLElement)
    scroller.dataset.readerCurrent = String(currentIndex + 1)
}

function markSettled(index) {
  if (scroller instanceof HTMLElement)
    scroller.dataset.readerSettled = String(clampIndex(index) + 1)
}

function focusPageTarget(index) {
  const target = pages[clampIndex(index)]?.querySelector('.reader-page__title h2, [data-reader-dialog]')
  if (target instanceof HTMLElement)
    target.focus({ preventScroll: true })
}

function updateOverflowSafety() {
  const scale = window.visualViewport?.scale ?? 1
  const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  const extremeViewport = window.innerWidth < 320
    || window.innerHeight < 620
    || scale >= 1.5
    || rootFontSize >= 24

  if (!(scroller instanceof HTMLElement))
    return
  if (extremeViewport)
    scroller.dataset.readerOverflowSafe = 'true'
  else
    delete scroller.dataset.readerOverflowSafe
}

function openReaderDialog(dialog, opener, focusTarget = '[data-reader-close]') {
  if (!(dialog instanceof HTMLDialogElement))
    return
  dialogOpener = opener
  dialogNavigationTarget = null
  scroller?.classList.add('reader-pages--dialog-open')
  dialog.showModal()
  dialog.querySelector(focusTarget)?.focus()
}

function closeDialogForNavigation(index) {
  const dialog = activeDialog()
  if (!(dialog instanceof HTMLDialogElement) || dialog.closest('.reader-page') === pages[clampIndex(index)])
    return
  dialogNavigationTarget = clampIndex(index)
  dialog.close()
  focusPageTarget(dialogNavigationTarget)
}

function finishInstantMovement(sequence, target, top, focusDestination) {
  requestAnimationFrame(() => {
    if (sequence !== movementSequence)
      return
    scroller.scrollTop = top
    requestAnimationFrame(() => {
      if (sequence !== movementSequence)
        return
      scroller.scrollTop = top
      scroller.classList.remove('reader-pages--instant')
      programmaticTarget = null
      markCurrent(target)
      if (focusDestination)
        focusPageTarget(target)
      markSettled(target)
    })
  })
}

function scrollToPage(index, behavior = reducedMotion.matches ? 'auto' : 'smooth', focusDestination = true) {
  if (!(scroller instanceof HTMLElement) || pages.length === 0)
    return

  const target = clampIndex(index)
  const top = pages[target].offsetTop
  const sequence = ++movementSequence
  const instant = behavior === 'auto' || reducedMotion.matches
  delete scroller.dataset.readerSettled
  programmaticTarget = target
  markCurrent(target)
  closeDialogForNavigation(target)

  if (instant) {
    scroller.classList.add('reader-pages--instant')
    scroller.scrollTop = top
    finishInstantMovement(sequence, target, top, focusDestination)
    return
  }

  scroller.classList.remove('reader-pages--instant')
  scroller.scrollTo({ top, behavior: 'smooth' })

  let settled = false
  const finish = () => {
    if (settled || sequence !== movementSequence)
      return
    settled = true
    if (Math.abs(scroller.scrollTop - top) > 1) {
      scroller.classList.add('reader-pages--instant')
      scroller.scrollTop = top
      scroller.classList.remove('reader-pages--instant')
    }
    programmaticTarget = null
    markCurrent(target)
    if (focusDestination)
      focusPageTarget(target)
    markSettled(target)
  }
  scroller.addEventListener('scrollend', finish, { once: true })
  window.setTimeout(finish, 1200)
}

function navigateToPage(index) {
  const target = clampIndex(index)
  const hash = `#slide-${target + 1}`
  programmaticTarget = target
  markCurrent(target)
  closeDialogForNavigation(target)
  if (location.hash !== hash)
    history.pushState(null, '', hash)
  scrollToPage(target)
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
    const hash = `#slide-${index + 1}`
    if (location.hash !== hash)
      history.replaceState(null, '', hash)
  }, {
    root: scroller,
    threshold: [0.55, 0.75, 0.95],
  })
  pages.forEach(page => observer.observe(page))
  observerEnabled = true
}

function initializeReader() {
  if (!(scroller instanceof HTMLElement) || pages.length === 0)
    return

  const target = indexFromHash()
  const top = pages[target].offsetTop
  const sequence = ++movementSequence
  programmaticTarget = target
  markCurrent(target)
  scroller.classList.add('reader-pages--instant')
  scroller.scrollTop = top

  requestAnimationFrame(() => {
    if (sequence !== movementSequence)
      return
    scroller.scrollTop = top
    requestAnimationFrame(() => {
      if (sequence !== movementSequence)
        return
      scroller.scrollTop = top
      scroller.classList.remove('reader-pages--instant')
      programmaticTarget = null
      startObserver()
      markSettled(target)
      scroller.dataset.readerReady = 'true'
    })
  })
}

initializeReader()

window.addEventListener('hashchange', () => {
  scrollToPage(indexFromHash(), 'auto')
})

document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
    return
  const anchor = event.target instanceof Element ? event.target.closest('a[href^="#slide-"]') : null
  if (!(anchor instanceof HTMLAnchorElement))
    return
  const target = Number(new URL(anchor.href).hash.match(/^#slide-(\d+)$/)?.[1]) - 1
  if (!Number.isFinite(target))
    return
  event.preventDefault()
  navigateToPage(target)
})

window.addEventListener('keydown', (event) => {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey)
    return
  const isNext = ['ArrowDown', 'PageDown'].includes(event.key)
  const isPrevious = ['ArrowUp', 'PageUp'].includes(event.key)
  const target = event.target
  const dialog = activeDialog()
  if (dialog?.matches('.reader-dialog--search')
    && target instanceof HTMLElement
    && target.matches('input, a, button'))
    return
  const dialogScrollTarget = dialog && target instanceof HTMLElement
    ? target.closest('.reader-dialog__scroll')
    : null
  if (dialogScrollTarget && (isNext || isPrevious)) {
    event.preventDefault()
    const pageDistance = Math.max(44, Math.floor(dialogScrollTarget.clientHeight * 0.85))
    const distance = event.key.startsWith('Page') ? pageDistance : 48
    dialogScrollTarget.scrollBy({ top: isNext ? distance : -distance, behavior: 'auto' })
    return
  }
  if (dialogScrollTarget)
    return
  if (!activeDialog() && target instanceof HTMLElement && (target.isContentEditable || target.matches('a, button, input, select, textarea, summary')))
    return

  if (isNext) {
    event.preventDefault()
    navigateToPage(currentIndex + 1)
  }
  else if (isPrevious) {
    event.preventDefault()
    navigateToPage(currentIndex - 1)
  }
})

document.querySelectorAll('[data-reader-dialog]').forEach((button) => {
  button.addEventListener('click', () => {
    const dialog = document.getElementById(button.dataset.readerDialog)
    openReaderDialog(dialog, button)
  })
})

document.querySelectorAll('[data-reader-search]').forEach((button) => {
  button.addEventListener('click', () => {
    const dialog = document.getElementById('reader-search-dialog')
    openReaderDialog(dialog, button, '[data-reader-search-input]')
  })
})

const searchDataElement = document.getElementById('reader-search-data')
const searchInput = document.querySelector('[data-reader-search-input]')
const searchResults = document.querySelector('[data-reader-search-results]')
const searchStatus = document.querySelector('[data-reader-search-status]')
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

  const normalizedQuery = query.normalize('NFKC').toLocaleLowerCase('ja').trim()
  const matches = normalizedQuery
    ? searchData.filter(item => item.text.normalize('NFKC').toLocaleLowerCase('ja').includes(normalizedQuery))
    : searchData

  searchResults.replaceChildren(...matches.map((item) => {
    const listItem = document.createElement('li')
    const anchor = document.createElement('a')
    const number = document.createElement('span')
    const copy = document.createElement('span')
    const title = document.createElement('b')
    const chapter = document.createElement('small')
    anchor.href = `#slide-${item.number}`
    number.textContent = String(item.number).padStart(2, '0')
    title.textContent = item.title
    chapter.textContent = item.chapter
    copy.append(title, chapter)
    anchor.append(number, copy)
    listItem.append(anchor)
    return listItem
  }))

  if (!matches.length) {
    const empty = document.createElement('li')
    empty.className = 'reader-search__empty'
    empty.textContent = '一致するスライドはありません。'
    searchResults.append(empty)
  }
  searchStatus.textContent = `${matches.length}件`
}

if (searchInput instanceof HTMLInputElement) {
  searchInput.addEventListener('input', () => renderSearchResults(searchInput.value))
  searchInput.addEventListener('search', () => renderSearchResults(searchInput.value))
}

Promise.resolve(document.fonts?.ready).then(updateOverflowSafety)
window.addEventListener('resize', updateOverflowSafety)
window.visualViewport?.addEventListener('resize', updateOverflowSafety)

document.querySelectorAll('.reader-dialog').forEach((dialog) => {
  dialog.querySelector('[data-reader-close]')?.addEventListener('click', () => dialog.close())
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      dialog.close()
      return
    }
    if (event.key !== 'Tab')
      return
    const focusable = [...dialog.querySelectorAll([
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[contenteditable="true"]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(','))]
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
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog)
      dialog.close()
  })
  dialog.addEventListener('close', () => {
    scroller?.classList.remove('reader-pages--dialog-open')
    const openerPage = dialogOpener instanceof HTMLElement ? dialogOpener.closest('.reader-page') : null
    const openerIsCurrent = openerPage === pages[currentIndex]
      && Math.abs(openerPage.getBoundingClientRect().top - scroller.getBoundingClientRect().top) <= 1
    if (dialogNavigationTarget !== null) {
      const target = dialogNavigationTarget
      focusPageTarget(target)
      requestAnimationFrame(() => {
        if (!activeDialog() && currentIndex === target)
          focusPageTarget(target)
      })
    }
    else if (dialogOpener instanceof HTMLElement && openerIsCurrent) {
      dialogOpener.focus({ preventScroll: true })
    }
    dialogOpener = null
    dialogNavigationTarget = null
  })
})
