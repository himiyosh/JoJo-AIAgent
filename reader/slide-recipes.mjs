const chapterExtracts = [
  { key: 'chapterNumber', selector: '.section__chno', mode: 'groups', required: true },
  { key: 'context', selector: '.section__context', mode: 'texts', required: true },
  { key: 'lead', selector: '.section__lead', mode: 'texts', required: true },
  { key: 'route', selector: '.section__route > span', mode: 'groups', required: true },
]

export const SLIDE_RECIPES = [
  {
    number: 1,
    type: 'cover-hero',
    variant: 'cover',
    extracts: [
      { key: 'hero', selector: '.hero', mode: 'fragment', required: true },
      { key: 'brand', selector: '.brand', mode: 'fragment', required: true },
      { key: 'author', selector: '.author', mode: 'groups', required: true },
      { key: 'series', selector: '.cover__series', mode: 'texts', required: true },
      { key: 'subtitle', selector: '.cover__sub', mode: 'texts', required: true },
    ],
  },
  {
    number: 2,
    type: 'notice-path',
    variant: 'disclaimer',
    extracts: [
      { key: 'rows', selector: '.row', mode: 'groups', required: true },
      { key: 'takeaway', selector: '.tk', mode: 'texts', required: true },
    ],
  },
  {
    number: 3,
    type: 'notice-path',
    variant: 'goal',
    extracts: [
      { key: 'rows', selector: '.row', mode: 'groups', required: true },
      { key: 'takeaway', selector: '.tk', mode: 'texts', required: true },
    ],
  },
  {
    number: 4,
    type: 'agenda-spine',
    variant: 'agenda',
    extracts: [
      { key: 'agenda', selector: '.agenda__item', mode: 'groups', required: true },
    ],
  },
  { number: 5, type: 'chapter-gate', variant: 'chapter', extracts: chapterExtracts },
  {
    number: 6,
    type: 'compare-axis',
    variant: 'assistant',
    extracts: [
      { key: 'rows', selector: '.row', mode: 'groups', required: true },
      { key: 'art', selector: '.llm-vs__bot .bot', mode: 'fragment', required: true },
      { key: 'takeaway', selector: '.tk', mode: 'texts', required: true },
    ],
  },
  {
    number: 7,
    type: 'visual-diagram',
    variant: 'traits',
    expectedTabs: 4,
    expectedSources: 2,
    extracts: [
      { key: 'takeaway', selector: '.tk', mode: 'texts', required: true },
    ],
  },
  {
    number: 8,
    type: 'assembly-equation',
    variant: 'equation',
    extracts: [
      { key: 'statement', selector: '.bigstate', mode: 'texts', required: true },
      { key: 'chips', selector: '.chip', mode: 'groups', required: true },
    ],
  },
  {
    number: 9,
    type: 'visual-diagram',
    variant: 'launch',
    extracts: [
      { key: 'statement', selector: '.bigstate', mode: 'texts', required: true },
      { key: 'chips', selector: '.chip', mode: 'groups', required: true },
      { key: 'takeaway', selector: '.tk', mode: 'texts', required: true },
    ],
  },
  {
    number: 10,
    type: 'assembly-equation',
    variant: 'anatomy',
    extracts: [
      { key: 'rows', selector: '.row', mode: 'groups', required: true },
      { key: 'takeaway', selector: '.tk', mode: 'texts', required: true },
    ],
  },
  {
    number: 11,
    type: 'visual-diagram',
    variant: 'mcp',
    expectedTabs: 2,
    expectedSources: 4,
    extracts: [
      { key: 'states', selector: '.api-mcp__measure-state', mode: 'groups', required: true },
      { key: 'takeaway', selector: '.tk', mode: 'texts', required: true },
    ],
  },
  { number: 12, type: 'chapter-gate', variant: 'chapter', extracts: chapterExtracts },
  {
    number: 13,
    type: 'timeline-rail',
    variant: 'evolution',
    expectedTabs: 4,
    expectedSources: 12,
    extracts: [
      { key: 'takeaway', selector: '.tk', mode: 'texts', required: true },
    ],
  },
  {
    number: 14,
    type: 'visual-diagram',
    variant: 'nested',
    extracts: [
      { key: 'layers', selector: '.nest .lbl', mode: 'texts', required: true },
      { key: 'takeaway', selector: '.tk', mode: 'texts', required: true },
    ],
  },
  { number: 15, type: 'chapter-gate', variant: 'chapter', extracts: chapterExtracts },
  {
    number: 16,
    type: 'quote-editorial',
    variant: 'xposts',
    expectedPosts: 2,
    requirePostDecoration: true,
    extracts: [
      { key: 'posts', selector: '.xp', mode: 'xposts', required: true },
      { key: 'takeaway', selector: '.tk', mode: 'texts', required: true },
    ],
  },
  {
    number: 17,
    type: 'timeline-rail',
    variant: 'agent-loop',
    extracts: [
      { key: 'nodes', selector: '.aloop__node', mode: 'groups', required: true },
      { key: 'pills', selector: '.aloop__pill', mode: 'groups', required: true },
      { key: 'decision', selector: '.aloop__dec', mode: 'texts', required: true },
      { key: 'takeaway', selector: '.tk', mode: 'texts', required: true },
    ],
  },
  {
    number: 18,
    type: 'visual-diagram',
    variant: 'rubberduck',
    extracts: [
      { key: 'art', selector: '.duck', mode: 'fragment', required: true },
      { key: 'statement', selector: '.bigstate', mode: 'texts', required: true },
      { key: 'chips', selector: '.chip', mode: 'groups', required: true },
      { key: 'takeaway', selector: '.tk', mode: 'texts', required: true },
    ],
  },
  { number: 19, type: 'chapter-gate', variant: 'chapter', extracts: chapterExtracts },
  {
    number: 20,
    type: 'compare-axis',
    variant: 'single-multi',
    expectedTabs: 2,
    expectedSources: 2,
    extracts: [
      { key: 'takeaway', selector: '.tk', mode: 'texts', required: true },
    ],
  },
  {
    number: 21,
    type: 'compare-axis',
    variant: 'decision-picker',
    extracts: [
      { key: 'principle', selector: 'blockquote', mode: 'texts', required: true },
      { key: 'rows', selector: '.row', mode: 'groups', required: true },
    ],
  },
  {
    number: 22,
    type: 'visual-diagram',
    variant: 'patterns',
    extracts: [
      { key: 'patterns', selector: '.ptn', mode: 'groups', required: true },
      { key: 'takeaway', selector: '.tk', mode: 'texts', required: true },
    ],
  },
  {
    number: 23,
    type: 'scenario-flow',
    variant: 'support',
    extracts: [
      { key: 'rows', selector: '.row', mode: 'groups', required: true },
      { key: 'takeaway', selector: '.sink', mode: 'texts', required: true },
    ],
  },
  { number: 24, type: 'chapter-gate', variant: 'chapter', extracts: chapterExtracts },
  {
    number: 25,
    type: 'visual-diagram',
    variant: 'control-loop',
    extracts: [
      { key: 'statement', selector: '.bigstate', mode: 'texts', required: true },
      { key: 'chips', selector: '.chip', mode: 'groups', required: true },
      { key: 'takeaway', selector: '.tk', mode: 'texts', required: true },
    ],
  },
  {
    number: 26,
    type: 'risk-pipeline',
    variant: 'risk',
    extracts: [
      { key: 'stages', selector: '.risk-stage', mode: 'groups', required: true },
      { key: 'takeaway', selector: '.risk-takeaway', mode: 'texts', required: true },
    ],
  },
  {
    number: 27,
    type: 'timeline-rail',
    variant: 'summary',
    extracts: [
      { key: 'steps', selector: '.tl-step', mode: 'groups', required: true },
      { key: 'statement', selector: '.bigstate', mode: 'texts', required: true },
      { key: 'chips', selector: '.chip', mode: 'groups', required: true },
    ],
  },
  {
    number: 28,
    type: 'notice-path',
    variant: 'next-steps',
    extracts: [
      { key: 'rows', selector: '.row', mode: 'groups', required: true },
      { key: 'takeaway', selector: '.sink', mode: 'texts', required: true },
    ],
  },
  {
    number: 29,
    type: 'source-map',
    variant: 'references',
    extracts: [
      { key: 'references', selector: '.refgrp', mode: 'groups', required: true },
      { key: 'takeaway', selector: '.tk', mode: 'texts', required: true },
    ],
  },
  {
    number: 30,
    type: 'term-constellation',
    variant: 'glossary',
    expectedTerms: 18,
    extracts: [
      { key: 'terms', selector: '.gl__item', mode: 'glossary', required: true },
    ],
  },
  {
    number: 31,
    type: 'cover-hero',
    variant: 'closing',
    titleSelector: '.closing__thanks',
    extracts: [
      { key: 'brand', selector: '.brand', mode: 'fragment', required: true },
      { key: 'author', selector: '.author', mode: 'groups', required: true },
      { key: 'thanks', selector: '.closing__thanks', mode: 'texts', required: true },
      { key: 'thesis', selector: '.closing__thesis', mode: 'texts', required: true },
      { key: 'series', selector: '.cover__series', mode: 'texts', required: true },
    ],
  },
]

export const RECIPE_BY_NUMBER = new Map(SLIDE_RECIPES.map(recipe => [recipe.number, recipe]))

export function validateRecipes(slideCount) {
  if (SLIDE_RECIPES.length !== slideCount)
    throw new Error(`Reader expected ${slideCount} portrait recipes but found ${SLIDE_RECIPES.length}.`)

  const numbers = SLIDE_RECIPES.map(recipe => recipe.number)
  if (new Set(numbers).size !== slideCount || numbers.some((number, index) => number !== index + 1))
    throw new Error('Reader portrait recipes must map exactly once to every canonical slide in order.')

  for (const recipe of SLIDE_RECIPES) {
    if (!recipe.type || !recipe.variant || !Array.isArray(recipe.extracts))
      throw new Error(`Reader recipe ${recipe.number} is incomplete.`)
    for (const descriptor of recipe.extracts) {
      if (!descriptor.key || !descriptor.selector || !descriptor.mode)
        throw new Error(`Reader recipe ${recipe.number} has an invalid extraction descriptor.`)
      if ('text' in descriptor || 'url' in descriptor || 'href' in descriptor)
        throw new Error(`Reader recipe ${recipe.number} must not contain authored copy or URLs.`)
    }
  }
}
