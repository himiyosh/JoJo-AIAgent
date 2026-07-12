export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
  })[character])
}

export function item(model, id) {
  const value = model.itemById.get(id)
  if (!value)
    throw new Error(`Reader pilot renderer cannot find content item ${id}.`)
  return value
}

export function noteExcerpt(model, id, excerpt, className = '') {
  const source = item(model, id)
  if (source.kind !== 'note' || !source.text.includes(excerpt))
    throw new Error(`Reader pilot editorial copy is not an exact excerpt of ${id}.`)
  return `<p class="pilot-editorial${className ? ` ${escapeHtml(className)}` : ''}" data-note-excerpt-for="${escapeHtml(id)}">${escapeHtml(excerpt)}</p>`
}

function attributes(value, className = '') {
  return [
    className ? `class="${escapeHtml(className)}"` : '',
    `data-content-id="${escapeHtml(value.id)}"`,
    `data-content-fingerprint="${value.fingerprint}"`,
    `data-content-importance="${value.importance}"`,
    `data-content-kind="${escapeHtml(value.kind)}"`,
  ].filter(Boolean).join(' ')
}

export function content(model, id, {
  tag = 'p',
  className = 'pilot-copy',
  link = false,
} = {}) {
  const value = item(model, id)
  const copy = value.segments.length
    ? value.segments.map(segment => `<span class="pilot-content-segment">${escapeHtml(segment)}</span>`).join(' ')
    : escapeHtml(value.text)
  if (link || value.href) {
    return `<a ${attributes(value, className)} href="${escapeHtml(value.href)}" target="_blank" rel="noopener noreferrer">${copy}</a>`
  }
  return `<${tag} ${attributes(value, className)}>${copy}</${tag}>`
}

export function contentList(model, ids, {
  className = '',
  itemClassName = 'pilot-copy',
  ordered = false,
} = {}) {
  const tag = ordered ? 'ol' : 'ul'
  return `<${tag} class="${escapeHtml(className)}">${ids.map(id => content(model, id, {
    tag: 'li',
    className: itemClassName,
  })).join('')}</${tag}>`
}

export function titleContent(model, id, headingId) {
  const value = item(model, id)
  const copy = value.href
    ? `<a href="${escapeHtml(value.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(value.text)}</a>`
    : escapeHtml(value.text)
  return `<h2 id="${escapeHtml(headingId)}" tabindex="-1" ${attributes(value, 'pilot-page__title')}>${copy}</h2>`
}

export function dialogContent(model, ids) {
  if (!ids.length)
    return '<p class="pilot-dialog__empty">このページに追加の補足はありません。</p>'

  const notes = ids.filter(id => item(model, id).kind === 'note')
  const sources = ids.filter(id => item(model, id).kind === 'source')
  return `
    ${notes.map(id => content(model, id, { className: 'pilot-dialog__note' })).join('')}
    ${sources.length
      ? `<section class="pilot-dialog__sources" aria-label="出典・関連リンク">
           <h4>出典・関連リンク</h4>
           <ul>${sources.map(id => `<li>${content(model, id, { className: 'pilot-dialog__source', link: true })}</li>`).join('')}</ul>
         </section>`
      : ''}`
}

export function dataVisual(kind, body, className = '') {
  return `<figure class="pilot-visual ${escapeHtml(className)}" data-reader-visual data-reader-visual-kind="${escapeHtml(kind)}">${body}</figure>`
}
