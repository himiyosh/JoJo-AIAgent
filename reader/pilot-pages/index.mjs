import { renderSlide06 } from './slide-06.mjs'
import { renderSlide07 } from './slide-07.mjs'
import { renderSlide13 } from './slide-13.mjs'
import { renderSlide16 } from './slide-16.mjs'
import { renderSlide23 } from './slide-23.mjs'
import { renderSlide28 } from './slide-28.mjs'

const RENDERERS = new Map([
  [6, renderSlide06],
  [7, renderSlide07],
  [13, renderSlide13],
  [16, renderSlide16],
  [23, renderSlide23],
  [28, renderSlide28],
])

export function renderPilotPageVisual(model, page) {
  const renderer = RENDERERS.get(page.sourceSlide)
  if (!renderer)
    throw new Error(`Reader pilot has no art direction for source slide ${page.sourceSlide}.`)
  return renderer(model, page)
}
