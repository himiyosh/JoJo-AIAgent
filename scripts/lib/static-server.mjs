import { createReadStream, promises as fs } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

export function normalizeBase(base = '/') {
  const value = base.startsWith('/') ? base : `/${base}`
  return value.endsWith('/') ? value : `${value}/`
}

function isInside(root, candidate) {
  const relative = path.relative(root, candidate)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

async function resolveFile(root, pathname) {
  let candidate = path.resolve(root, `.${pathname}`)
  if (!isInside(root, candidate))
    return null

  try {
    const stat = await fs.stat(candidate)
    if (stat.isDirectory())
      candidate = path.join(candidate, 'index.html')
    const fileStat = await fs.stat(candidate)
    return fileStat.isFile() ? candidate : null
  }
  catch {
    return null
  }
}

export async function startStaticServer({
  root,
  base = '/',
  host = '127.0.0.1',
  port = 0,
  spaFallback = true,
} = {}) {
  if (!root)
    throw new Error('Static server root is required.')

  const absoluteRoot = path.resolve(root)
  const normalizedBase = normalizeBase(base)

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', `http://${request.headers.host ?? host}`)
      const pathname = decodeURIComponent(url.pathname)

      if (!pathname.startsWith(normalizedBase)) {
        response.writeHead(404)
        response.end('Not found')
        return
      }

      const relativePath = pathname.slice(normalizedBase.length)
      let file = await resolveFile(absoluteRoot, `/${relativePath}`)
      if (!file && spaFallback)
        file = await resolveFile(absoluteRoot, '/index.html')

      if (!file) {
        response.writeHead(404)
        response.end('Not found')
        return
      }

      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': MIME_TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
      })
      createReadStream(file).pipe(response)
    }
    catch (error) {
      response.writeHead(500)
      response.end(error instanceof Error ? error.message : 'Server error')
    }
  })

  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, host, resolve)
  })

  const address = server.address()
  if (!address || typeof address === 'string')
    throw new Error('Static server did not expose a TCP address.')

  const origin = `http://${host}:${address.port}`
  return {
    server,
    origin,
    base: normalizedBase,
    baseUrl: `${origin}${normalizedBase}`,
    close: () => new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve())
    }),
  }
}
