import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import parseArgs from 'yargs-parser'
import { assertSafeBuildOutput, buildReader, cleanReaderOutputs } from './build-reader.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SHORT_ALIASES = {
  c: 'with-clicks',
  d: 'download',
  h: 'help',
  o: 'out',
  t: 'theme',
  v: 'version',
}
const SLIDEV_BUILD_PARSE_OPTIONS = {
  alias: SHORT_ALIASES,
  boolean: [
    'dark',
    'download',
    'help',
    'inspect',
    'omit-background',
    'per-slide',
    'version',
    'with-clicks',
    'with-toc',
    'without-notes',
  ],
  string: [
    'base',
    'executable-path',
    'format',
    'out',
    'output',
    'range',
    'router-mode',
    'theme',
    'wait-until',
  ],
  number: ['scale', 'timeout', 'wait'],
  default: {
    inspect: false,
    out: 'dist',
  },
  configuration: {
    'camel-case-expansion': true,
    'dot-notation': false,
    'short-option-groups': true,
    'strip-aliased': false,
    'strip-dashed': false,
  },
}

function canonicalOptionName(name) {
  const bareName = name.replace(/^-+/, '')
  const expandedName = bareName.length === 1 && SHORT_ALIASES[bareName]
    ? SHORT_ALIASES[bareName]
    : bareName
  return `--${expandedName.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase()}`
}

export function parseSlidevBuildArgs(args) {
  const parsed = parseArgs(args, SLIDEV_BUILD_PARSE_OPTIONS)
  const options = new Map()
  for (const [name, value] of Object.entries(parsed)) {
    if (name === '_' || name === '--')
      continue
    options.set(canonicalOptionName(name), value)
  }

  return {
    options,
    positionals: parsed._.map(String),
  }
}

export function readOption(args, names, fallback) {
  const { options } = parseSlidevBuildArgs(args)
  for (const name of Array.isArray(names) ? names : [names]) {
    const canonicalName = canonicalOptionName(name)
    if (options.has(canonicalName))
      return options.get(canonicalName)
  }
  return fallback
}

export function readBooleanOption(args, names, fallback = false) {
  const { options } = parseSlidevBuildArgs(args)
  const optionNames = Array.isArray(names) ? names : [names]
  for (const name of optionNames) {
    const canonicalName = canonicalOptionName(name)
    if (options.has(canonicalName))
      return options.get(canonicalName)
  }
  return fallback
}

export function extractSlideEntries(args) {
  return parseSlidevBuildArgs(args).positionals
}

export function shouldGenerateReader(entries, root = ROOT) {
  return entries.length === 0
    || (entries.length === 1 && path.resolve(root, entries[0]) === path.join(root, 'slides.md'))
}

export function supportsReaderOutput(args) {
  return !readBooleanOption(args, ['--help', '-h'])
    && !readBooleanOption(args, ['--version', '-v'])
}

export function readerBuildOptions(args, entries) {
  return {
    out: readOption(args, ['--out', '-o'], 'dist'),
    base: readOption(args, '--base', '/'),
    source: entries[0] ?? 'slides.md',
    includeNotes: !readBooleanOption(args, '--without-notes'),
    routerMode: readOption(args, '--router-mode', undefined),
  }
}

export function createSlidevInvocation(args, {
  root = ROOT,
  execPath = process.execPath,
} = {}) {
  return {
    command: execPath,
    args: [
      path.join(root, 'node_modules', '@slidev', 'cli', 'bin', 'slidev.mjs'),
      'build',
      ...args,
    ],
    options: {
      cwd: root,
      stdio: 'inherit',
      shell: false,
    },
  }
}

export function runSlidev(invocation, spawnImpl = spawn) {
  return new Promise((resolve, reject) => {
    const child = spawnImpl(invocation.command, invocation.args, invocation.options)
    child.once('error', reject)
    child.once('close', (code, signal) => resolve({ code, signal }))
  })
}

export async function main(args = process.argv.slice(2)) {
  const helpOrVersion = readBooleanOption(args, ['--help', '-h']) || readBooleanOption(args, ['--version', '-v'])
  if (!helpOrVersion)
    await assertSafeBuildOutput(readOption(args, ['--out', '-o'], 'dist'))
  const invocation = createSlidevInvocation(args)
  const { code, signal } = await runSlidev(invocation)
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  if (code !== 0) {
    process.exitCode = code ?? 1
    return
  }

  const entries = extractSlideEntries(args)
  if (!supportsReaderOutput(args)) {
    console.log('Reader skipped for non-SPA Slidev output mode.')
    return
  }
  if (!shouldGenerateReader(entries)) {
    await cleanReaderOutputs({ out: readOption(args, ['--out', '-o'], 'dist') })
    console.log(`Reader skipped for non-canonical slide entr${entries.length === 1 ? 'y' : 'ies'}: ${entries.join(', ')}`)
    return
  }

  const result = await buildReader(readerBuildOptions(args, entries))
  console.log(`Reader generated: ${result.mobileReaderSlides} canonical horizontal slides with ${result.mobileReaderThumbnails} navigation thumbnails, zoom, and pan.`)
  console.log(`Legacy portrait Reader generated: ${result.slides} slides.`)
  console.log(`Mobile zoom pilot generated: ${result.mobilePilotSlides} canonical slides.`)
  if (result.pilotPages)
    console.log(`Reader pilot generated: ${result.pilotPages} pages with ${result.pilotInventory}/${result.pilotInventory} inventory coverage.`)
  else
    console.log('Reader pilot skipped because presenter notes are disabled.')
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  await main()
