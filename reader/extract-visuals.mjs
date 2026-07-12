function hasValues(value) {
  return Array.isArray(value) && value.length > 0
}

function assertDescriptorResult(slideNumber, descriptor, value) {
  if (descriptor.required && !hasValues(value))
    throw new Error(`Reader slide ${slideNumber} is missing required portrait fragment "${descriptor.key}" (${descriptor.selector}).`)

  if (descriptor.mode === 'fragment' && value.some(fragment => typeof fragment !== 'string' || fragment.length < 80))
    throw new Error(`Reader slide ${slideNumber} produced an empty sanitized fragment for "${descriptor.key}".`)
}

export async function extractRecipeData(slide, recipe, slideNumber) {
  const result = {}

  for (const descriptor of recipe.extracts) {
    const locator = slide.locator(descriptor.selector)
    const count = await locator.count()
    if (descriptor.required && count === 0)
      throw new Error(`Reader slide ${slideNumber} could not resolve required selector "${descriptor.selector}".`)

    const values = await locator.evaluateAll((elements, payload) => {
      const { mode, prefix } = payload
      const clean = value => (value ?? '').replace(/\s+/g, ' ').trim()
      const unsafeTags = new Set([
        'BASE',
        'SCRIPT',
        'STYLE',
        'LINK',
        'META',
        'IFRAME',
        'OBJECT',
        'EMBED',
        'FOREIGNOBJECT',
        'FORM',
        'INPUT',
        'TEXTAREA',
        'SELECT',
        'VIDEO',
        'AUDIO',
        'CANVAS',
      ])

      function sanitize(source) {
        const sourceNodes = [source, ...source.querySelectorAll('*')]
        for (const node of sourceNodes) {
          if (unsafeTags.has(node.tagName))
            throw new Error(`Reader slide ${payload.slideNumber} fragment "${payload.key}" contains unsafe <${node.tagName.toLowerCase()}> markup.`)

          for (const attribute of [...node.attributes]) {
            const lowerName = attribute.name.toLowerCase()
            const normalizedValue = attribute.value.trim().replace(/[\u0000-\u0020]+/g, '')
            if (lowerName.startsWith('on') || lowerName === 'style' || lowerName === 'srcdoc')
              throw new Error(`Reader slide ${payload.slideNumber} fragment "${payload.key}" contains unsafe "${attribute.name}" markup.`)
            if (/^(?:javascript|vbscript|file|data):/i.test(normalizedValue))
              throw new Error(`Reader slide ${payload.slideNumber} fragment "${payload.key}" contains an unsafe URL.`)
          }
        }

        const clone = source.cloneNode(true)
        const liveNodes = [clone, ...clone.querySelectorAll('*')]
        const idMap = new Map()
        for (const node of liveNodes) {
          if (node.id) {
            const nextId = `${prefix}-${node.id}`
            idMap.set(node.id, nextId)
            node.id = nextId
          }
        }

        for (const node of liveNodes) {
          for (const attribute of [...node.attributes]) {
            const name = attribute.name
            const lowerName = name.toLowerCase()
            let value = attribute.value

            if (lowerName.startsWith('data-v-')) {
              node.removeAttribute(name)
              continue
            }

            for (const [oldId, nextId] of idMap) {
              value = value
                .replaceAll(`url(#${oldId})`, `url(#${nextId})`)
                .replaceAll(`#${oldId}`, `#${nextId}`)
            }
            node.setAttribute(name, value)
          }
        }

        return clone.outerHTML
      }

      function firstText(element, selectors) {
        for (const selector of selectors) {
          const value = clean(element.querySelector(selector)?.textContent)
          if (value)
            return value
        }
        return ''
      }

      function unique(values) {
        return [...new Set(values.map(clean).filter(Boolean))]
      }

      function group(element) {
        const title = firstText(element, [
          '.row__title',
          '.agenda__t',
          '.ptn__name',
          '.risk-stage__title > span',
          '.tl-step .k',
          '.aloop__jp',
          '.card h3',
          'h2',
          'h3',
          'h4',
          'dt',
        ]) || clean(element.textContent).split(/\n/)[0]
        const subtitle = firstText(element, [
          '.row__tag',
          '.agenda__d',
          '.ptn__en',
          '.risk-stage__title small',
          '.tl-step .d',
          '.aloop__en',
          '.card__ba',
          '.u',
        ])
        let items = unique([...element.querySelectorAll('li')].map(item => item.textContent))
        const itemDetails = [...element.querySelectorAll('li')].map((item) => {
          const heading = firstText(item, ['strong', 'b', '.risk-item__title'])
          const detail = firstText(item, ['span', 'small', '.risk-item__detail'])
          return {
            heading,
            detail,
            text: clean(item.textContent),
          }
        })
        if (!items.length)
          items = unique([...element.querySelectorAll('.chip')].map(item => item.textContent))
        if (!items.length) {
          const detail = firstText(element, [
            '.row__body',
            '.ptn__d',
            '.gl__def',
            '.card p',
            'dd',
            'p',
          ])
          if (detail && detail !== title)
            items = [detail]
        }

        const icon = element.querySelector('svg.ico')
        return {
          title,
          subtitle,
          text: clean(element.textContent),
          items,
          itemDetails,
          icon: icon ? sanitize(icon) : '',
          dataNumber: element.getAttribute('data-number') ?? '',
        }
      }

      if (mode === 'fragment')
        return elements.map(element => sanitize(element))
      if (mode === 'texts')
        return unique(elements.map(element => element.textContent))
      if (mode === 'groups')
        return elements.map(group)
      if (mode === 'glossary') {
        return elements.map((element) => {
          const term = element.querySelector('.gl__term')?.cloneNode(true)
          term?.querySelector('.gl__en')?.remove()
          return {
            id: element.id.replace(/^g-/, ''),
            term: clean(term?.textContent),
            english: firstText(element, ['.gl__en']),
            definition: firstText(element, ['.gl__def']),
          }
        })
      }
      if (mode === 'xposts') {
        return elements.map((element) => {
          const decoration = element.querySelector('.xp__deco')
          const role = element.querySelector('.xp__role')?.cloneNode(true)
          const when = element.querySelector('.xp__when')?.cloneNode(true)
          when?.querySelector('.xp__role')?.remove()
          when?.querySelector('.xp__sep')?.remove()
          const translation = element.querySelector('.xp__jp')?.cloneNode(true)
          translation?.querySelector('.xp__tr')?.remove()
          return {
            name: firstText(element, ['.xp__nm']),
            handle: firstText(element, ['.xp__hn']),
            post: firstText(element, ['.xp__bd']),
            translation: clean(translation?.textContent),
            role: clean(role?.textContent),
            date: clean(when?.textContent),
            decoration: decoration ? sanitize(decoration) : '',
          }
        })
      }
      return []
    }, {
      key: descriptor.key,
      mode: descriptor.mode,
      prefix: `reader-slide-${String(slideNumber).padStart(2, '0')}-${descriptor.key}`,
      slideNumber,
    })

    assertDescriptorResult(slideNumber, descriptor, values)
    result[descriptor.key] = values
  }

  if (recipe.expectedPosts && result.posts?.length !== recipe.expectedPosts)
    throw new Error(`Reader slide ${slideNumber} expected ${recipe.expectedPosts} posts but extracted ${result.posts?.length ?? 0}.`)
  if (recipe.requirePostDecoration && !result.posts?.some(post => post.decoration))
    throw new Error(`Reader slide ${slideNumber} lost its required sanitized post decoration.`)
  if (recipe.expectedTerms && result.terms?.length !== recipe.expectedTerms)
    throw new Error(`Reader slide ${slideNumber} expected ${recipe.expectedTerms} glossary terms but extracted ${result.terms?.length ?? 0}.`)

  return result
}

export function assertPortraitSlide(slide, { requireNote = true } = {}) {
  const { recipe, visualData } = slide
  if (!recipe || !visualData)
    throw new Error(`Reader slide ${slide.number} is missing its portrait recipe or extracted data.`)
  if (recipe.expectedTabs && slide.tabs.length !== recipe.expectedTabs)
    throw new Error(`Reader slide ${slide.number} expected ${recipe.expectedTabs} reveal states but extracted ${slide.tabs.length}.`)
  if (recipe.expectedSources && slide.links.length !== recipe.expectedSources)
    throw new Error(`Reader slide ${slide.number} expected ${recipe.expectedSources} sources but extracted ${slide.links.length}.`)
  if (requireNote && !slide.note)
    throw new Error(`Reader slide ${slide.number} is missing its presenter note.`)

  for (const descriptor of recipe.extracts)
    assertDescriptorResult(slide.number, descriptor, visualData[descriptor.key] ?? [])
}
