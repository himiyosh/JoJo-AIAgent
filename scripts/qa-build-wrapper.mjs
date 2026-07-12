import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  createSlidevInvocation,
  extractSlideEntries,
  parseSlidevBuildArgs,
  readBooleanOption,
  readOption,
  readerBuildOptions,
  runSlidev,
  shouldGenerateReader,
  supportsReaderOutput,
} from './build.mjs'
import { assertSafeBuildOutput, assertSafeReaderOutput, buildReader, cleanReaderOutputs, readerSlideUrl } from './build-reader.mjs'

const root = path.resolve('/test/project')

assert.deepEqual(extractSlideEntries([]), [])
assert.deepEqual(extractSlideEntries(['--base', '/JoJo-AIAgent/', '--out', 'dist']), [])
assert.deepEqual(extractSlideEntries(['--inspect', 'false']), [])
assert.deepEqual(extractSlideEntries(['--without-notes', 'false']), [])
assert.deepEqual(extractSlideEntries(['-dh', 'false']), [])
assert.deepEqual(extractSlideEntries(['-dv', 'false']), [])
assert.deepEqual(extractSlideEntries(['-dvh', 'false']), [])
assert.deepEqual(extractSlideEntries(['-do', 'preview']), [])
assert.deepEqual(extractSlideEntries(['-do=preview']), [])
assert.deepEqual(extractSlideEntries(['-dt', 'custom-theme']), [])
assert.deepEqual(extractSlideEntries(['--routerMode', 'hash']), [])
assert.deepEqual(extractSlideEntries(['--withoutNotes']), [])
assert.deepEqual(extractSlideEntries(['--inspect', 'true']), [])
assert.deepEqual(extractSlideEntries(['--dark', 'true', '--base', '/JoJo-AIAgent/']), [])
assert.deepEqual(extractSlideEntries(['--inspect=false', '--without-notes=true']), [])
assert.deepEqual(extractSlideEntries(['--inspect', 'false', 'slides.md']), ['slides.md'])
assert.deepEqual(extractSlideEntries(['slides-compare.md', '--out', 'dist-compare']), ['slides-compare.md'])
assert.deepEqual(extractSlideEntries(['--without-notes', 'false', 'slides-compare.md']), ['slides-compare.md'])
assert.deepEqual(extractSlideEntries(['--base', '/preview/', 'slides-compare.md']), ['slides-compare.md'])
assert.deepEqual(extractSlideEntries(['slides.md', 'slides-compare.md', '--out=dist']), ['slides.md', 'slides-compare.md'])
assert.deepEqual(extractSlideEntries(['--', 'slides-compare.md']), ['slides-compare.md'])

assert.equal(readOption(['-o=dist'], ['--out', '-o'], 'fallback'), 'dist')
assert.equal(readOption(['-o', 'dist'], ['--out', '-o'], 'fallback'), 'dist')
assert.equal(readOption(['--out=dist'], ['--out', '-o'], 'fallback'), 'dist')
assert.equal(readOption(['--out', 'dist'], ['--out', '-o'], 'fallback'), 'dist')
assert.equal(readOption(['-do', 'preview'], ['--out', '-o'], 'fallback'), 'preview')
assert.equal(readOption(['-do=preview'], ['--out', '-o'], 'fallback'), 'preview')
assert.equal(readOption(['-dt', 'custom-theme'], ['--theme', '-t'], 'fallback'), 'custom-theme')
assert.equal(readOption(['--routerMode', 'hash'], '--router-mode', 'fallback'), 'hash')
assert.equal(readOption(['--routerMode=hash'], '--router-mode', 'fallback'), 'hash')
assert.equal(readOption(['-doh=false'], ['--out', '-o'], 'fallback'), 'dist')
assert.equal(readOption(['-o123'], ['--out', '-o'], 'fallback'), '123')

assert.equal(readBooleanOption(['--without-notes'], '--without-notes'), true)
assert.equal(readBooleanOption(['--without-notes', 'true'], '--without-notes'), true)
assert.equal(readBooleanOption(['--without-notes', 'false'], '--without-notes'), false)
assert.equal(readBooleanOption(['--without-notes=true'], '--without-notes'), true)
assert.equal(readBooleanOption(['--without-notes=false'], '--without-notes'), false)
assert.equal(readBooleanOption(['--help=false'], ['--help', '-h']), false)
assert.equal(readBooleanOption(['-h=false'], ['--help', '-h']), false)
assert.equal(readBooleanOption(['-dh'], ['--help', '-h']), true)
assert.equal(readBooleanOption(['-vh'], ['--help', '-h']), true)
assert.equal(readBooleanOption(['-dvh'], ['--version', '-v']), true)
assert.equal(readBooleanOption(['-dh=false'], ['--help', '-h']), false)
assert.equal(readBooleanOption(['--help=false', '-h'], ['--help', '-h']), true)
assert.equal(readBooleanOption(['-do', 'preview'], '--download'), true)
assert.equal(readBooleanOption(['--no-without-notes'], '--without-notes'), false)
assert.equal(readBooleanOption(['--withoutNotes'], '--without-notes'), true)
assert.equal(readBooleanOption(['-h0'], ['--help', '-h']), false)
assert.equal(readBooleanOption(['-v0'], ['--version', '-v']), false)

assert.equal(shouldGenerateReader([], root), true)
assert.equal(shouldGenerateReader(['slides.md'], root), true)
assert.equal(shouldGenerateReader(['slides-compare.md'], root), false)
assert.equal(shouldGenerateReader(['slides.md', 'slides-compare.md'], root), false)

assert.equal(supportsReaderOutput([]), true)
assert.equal(supportsReaderOutput(['--help']), false)
assert.equal(supportsReaderOutput(['-h']), false)
assert.equal(supportsReaderOutput(['--help', 'false']), true)
assert.equal(supportsReaderOutput(['--version']), false)
assert.equal(supportsReaderOutput(['-v=true']), false)
assert.equal(supportsReaderOutput(['--version=false']), true)
assert.equal(supportsReaderOutput(['-dh']), false)
assert.equal(supportsReaderOutput(['-vh']), false)
assert.equal(supportsReaderOutput(['-dvh']), false)
assert.equal(supportsReaderOutput(['-dh', 'false']), true)
assert.equal(supportsReaderOutput(['-dv', 'false']), true)
assert.equal(supportsReaderOutput(['-dvh', 'false']), false)
assert.equal(supportsReaderOutput(['--format', 'pdf']), true)
assert.equal(supportsReaderOutput(['--format=png']), true)

assert.deepEqual(readerBuildOptions([], []), {
  out: 'dist',
  base: '/',
  source: 'slides.md',
  includeNotes: true,
  routerMode: undefined,
})
assert.deepEqual(readerBuildOptions(['--base', '/JoJo-AIAgent/', '-o=dist', '--without-notes', '--router-mode', 'hash'], []), {
  out: 'dist',
  base: '/JoJo-AIAgent/',
  source: 'slides.md',
  includeNotes: false,
  routerMode: 'hash',
})
assert.equal(readerBuildOptions(['--without-notes', 'false'], []).includeNotes, true)
assert.equal(readerBuildOptions(['-do', 'preview'], []).out, 'preview')
assert.equal(readerBuildOptions(['--withoutNotes'], []).includeNotes, false)
assert.equal(readerBuildOptions(['--routerMode=hash'], []).routerMode, 'hash')
assert.equal(readerSlideUrl('http://127.0.0.1:4174/', 21), 'http://127.0.0.1:4174/21')
assert.equal(readerSlideUrl('http://127.0.0.1:4174/JoJo-AIAgent/', 21, 'hash'), 'http://127.0.0.1:4174/JoJo-AIAgent/#/21')
await assert.rejects(buildReader({ out: '' }), /refuses to overwrite the source reader directory/)
await assert.rejects(buildReader({ out: '.' }), /refuses to overwrite the source reader directory/)
await assert.rejects(cleanReaderOutputs({ out: '.' }), /refuses to overwrite the source reader directory/)
await assert.doesNotReject(assertSafeBuildOutput('dist'))
await assert.rejects(assertSafeBuildOutput('.'), /would overwrite repository source assets/)
await assert.rejects(assertSafeBuildOutput('reader'), /would overwrite repository source assets/)
await assert.rejects(assertSafeBuildOutput('reader/generated'), /would overwrite repository source assets/)
await assert.rejects(assertSafeBuildOutput('scripts'), /would overwrite repository source assets/)
await assert.rejects(assertSafeBuildOutput('components/generated'), /would overwrite repository source assets/)
await assert.rejects(assertSafeBuildOutput('public'), /would overwrite repository source assets/)

const projectRoot = path.resolve('.')
const safetyFixture = await fs.mkdtemp(path.join(os.tmpdir(), 'jojo-reader-safety-'))
try {
  const rootAlias = path.join(safetyFixture, 'repo-alias')
  await fs.symlink(projectRoot, rootAlias, process.platform === 'win32' ? 'junction' : 'dir')
  await assert.rejects(
    assertSafeReaderOutput(path.join(rootAlias, 'reader')),
    /refuses to overwrite the source reader directory/,
  )

  if (process.platform === 'darwin' || process.platform === 'win32') {
    const sourceReader = path.join(projectRoot, 'reader')
    const caseAliasReader = path.join(projectRoot.toUpperCase(), 'reader')
    const [sourceStats, aliasStats] = await Promise.all([
      fs.stat(sourceReader),
      fs.stat(caseAliasReader).catch(error => error?.code === 'ENOENT' ? null : Promise.reject(error)),
    ])
    if (aliasStats && sourceStats.dev === aliasStats.dev && sourceStats.ino === aliasStats.ino) {
      await assert.rejects(
        assertSafeReaderOutput(caseAliasReader),
        /refuses to overwrite the source reader directory/,
      )
    }
  }
}
finally {
  await fs.rm(safetyFixture, { recursive: true, force: true })
}

const staleOutputFixture = await fs.mkdtemp(path.join(os.tmpdir(), 'jojo-reader-stale-'))
try {
  await Promise.all([
    fs.mkdir(path.join(staleOutputFixture, 'reader'), { recursive: true }),
    fs.mkdir(path.join(staleOutputFixture, 'reader-legacy'), { recursive: true }),
    fs.mkdir(path.join(staleOutputFixture, 'reader-pilot'), { recursive: true }),
    fs.mkdir(path.join(staleOutputFixture, 'mobile-pilot'), { recursive: true }),
  ])
  await cleanReaderOutputs({ out: staleOutputFixture })
  await Promise.all([
    assert.rejects(fs.access(path.join(staleOutputFixture, 'reader'))),
    assert.rejects(fs.access(path.join(staleOutputFixture, 'reader-legacy'))),
    assert.rejects(fs.access(path.join(staleOutputFixture, 'reader-pilot'))),
    assert.rejects(fs.access(path.join(staleOutputFixture, 'mobile-pilot'))),
  ])
}
finally {
  await fs.rm(staleOutputFixture, { recursive: true, force: true })
}

const parsedMixedCluster = parseSlidevBuildArgs(['slides.md', '-doh=false', 'slides-compare.md'])
assert.deepEqual(parsedMixedCluster.positionals, ['slides.md', 'slides-compare.md'])
assert.equal(parsedMixedCluster.options.get('--download'), true)
assert.equal(parsedMixedCluster.options.get('--out'), 'dist')
assert.equal(parsedMixedCluster.options.get('--help'), false)

const windowsNode = 'C:\\Program Files\\nodejs\\node.exe'
const forwardedArgs = ['slides-compare.md', '--base', '/preview/', '--out', 'dist-compare']
const invocation = createSlidevInvocation(forwardedArgs, {
  root,
  execPath: windowsNode,
})
assert.equal(invocation.command, windowsNode)
assert.equal(invocation.args[0], path.join(root, 'node_modules', '@slidev', 'cli', 'bin', 'slidev.mjs'))
assert.deepEqual(invocation.args.slice(1), ['build', ...forwardedArgs])
assert.equal(invocation.options.cwd, root)
assert.equal(invocation.options.shell, false)

function fakeSpawn(code, signal, observed) {
  return (command, args, options) => {
    observed.push({ command, args, options })
    const child = new EventEmitter()
    queueMicrotask(() => child.emit('close', code, signal))
    return child
  }
}

const exitObserved = []
assert.deepEqual(
  await runSlidev(invocation, fakeSpawn(7, null, exitObserved)),
  { code: 7, signal: null },
)
assert.deepEqual(exitObserved[0], invocation)

const signalObserved = []
assert.deepEqual(
  await runSlidev(invocation, fakeSpawn(null, 'SIGTERM', signalObserved)),
  { code: null, signal: 'SIGTERM' },
)
assert.deepEqual(signalObserved[0], invocation)

console.log('Build wrapper QA passed: entries, clustered flags, router modes, output modes, notes policy, portable Node CLI invocation, argument forwarding, exit codes, and signals.')
