import { renderSlide06 } from './slide-06.mjs'
import { renderSlide07 } from './slide-07.mjs'
import { renderSlide13 } from './slide-13.mjs'
import { renderSlide16 } from './slide-16.mjs'
import { renderSlide21 } from './slide-21.mjs'
import { renderSlide26 } from './slide-26.mjs'

const RENDERERS = new Map([
  [6, renderSlide06],
  [7, renderSlide07],
  [13, renderSlide13],
  [16, renderSlide16],
  [21, renderSlide21],
  [26, renderSlide26],
])

export function renderPilotPageVisual(model, page) {
  const renderer = RENDERERS.get(page.sourceSlide)
  if (!renderer)
    throw new Error(`Reader pilot has no art direction for source slide ${page.sourceSlide}.`)
  return renderer(model, page)
}
