import { defineAppSetup } from '@slidev/types'
import { installDirectReader } from '../reader/direct-viewer'

/**
 * Fix base-prefixed navigation on static hosts (e.g. GitHub Pages at /<repo>/).
 *
 * Slidev's `nav.go()` pushes `getSlidePath()`, which returns
 * `${import.meta.env.BASE_URL}${no}` (e.g. `/JoJo-AIAgent/12`). With
 * vue-router 5's history base also set to BASE_URL, `router.push` does NOT
 * strip the base before matching, so the resolved path keeps the base
 * (`/JoJo-AIAgent/12`). That path matches no slide route (`/:no` is a single
 * segment), the URL gets the base prepended a second time
 * (`/JoJo-AIAgent/JoJo-AIAgent/12`), and the deck lands on the 404 page —
 * breaking ALL programmatic navigation (arrow keys, click-to-advance, and the
 * glossary term links) once built with `--base`.
 *
 * A normal in-app route never starts with BASE_URL (the history layer strips
 * the real base when reading the URL), so a `to.path` that begins with
 * BASE_URL is unambiguously a double-prefixed push. We redirect it to the
 * clean, base-less path; vue-router then prepends the base exactly once.
 *
 * No-op in dev / root deploys where BASE_URL === '/'.
 */
export default defineAppSetup(({ router }) => {
  const base = import.meta.env.BASE_URL
  installDirectReader(router, base)
  if (!base || base === '/')
    return

  router.beforeEach((to) => {
    if (to.path.startsWith(base)) {
      const rest = to.path.slice(base.length)
      // Only the play/presenter/export slide paths get double-prefixed; they
      // never contain a further leading slash here, so a single redirect is safe.
      if (rest && !rest.startsWith('/'))
        return { path: `/${rest}`, query: to.query, hash: to.hash, replace: true }
    }
    return true
  })
})
