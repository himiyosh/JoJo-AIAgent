import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeBase, startStaticServer } from './lib/static-server.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)

function readArg(name, fallback) {
  const exact = args.indexOf(name)
  if (exact >= 0 && args[exact + 1])
    return args[exact + 1]
  const inline = args.find(arg => arg.startsWith(`${name}=`))
  return inline ? inline.slice(name.length + 1) : fallback
}

const base = normalizeBase(readArg('--base', '/'))
const root = path.resolve(ROOT, readArg('--out', 'dist'))
const port = Number(readArg('--port', '4173'))
const server = await startStaticServer({ root, base, port })

console.log(`Deck:   ${server.baseUrl}`)
console.log(`Reader: ${server.baseUrl}reader/`)
console.log(`Legacy: ${server.baseUrl}reader-legacy/`)
console.log(`Pilot:  ${server.baseUrl}reader-pilot/`)
console.log(`Zoom:   ${server.baseUrl}mobile-pilot/`)

async function shutdown() {
  await server.close()
  process.exit(0)
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
