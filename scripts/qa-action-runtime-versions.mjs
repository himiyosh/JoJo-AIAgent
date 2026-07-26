import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const WORKFLOW_EXTENSIONS = new Set(['.yaml', '.yml'])

export const REQUIRED_ACTION_MAJORS = Object.freeze({
  'actions/checkout': 7,
  'actions/setup-node': 7,
  'actions/configure-pages': 6,
  'actions/upload-pages-artifact': 5,
  'actions/deploy-pages': 5,
})

function approvedReference(action) {
  return `${action}@v${REQUIRED_ACTION_MAJORS[action]}`
}

function stripYamlComment(value) {
  let quote = null

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    if (quote === '"') {
      if (character === '\\')
        index += 1
      else if (character === quote)
        quote = null
      continue
    }
    if (quote === "'") {
      if (character === "'" && value[index + 1] === "'") {
        index += 1
        continue
      }
      if (character === quote)
        quote = null
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      continue
    }
    if (character === '#' && (index === 0 || /\s/.test(value[index - 1])))
      return value.slice(0, index).trimEnd()
  }

  return value.trimEnd()
}

function readUsesValue(value, { stripComment = true } = {}) {
  const scalar = (stripComment ? stripYamlComment(value) : value).trim()
  if (!scalar)
    return scalar

  const quote = scalar[0]
  if (quote !== '"' && quote !== "'")
    return scalar
  if (scalar.length < 2 || !scalar.endsWith(quote))
    return scalar

  return scalar.slice(1, -1)
}

function namedAction(value) {
  const lowerCaseValue = value.toLowerCase()
  return Object.keys(REQUIRED_ACTION_MAJORS)
    .find(action => lowerCaseValue.includes(action))
}

function isBlockScalar(value) {
  return /^[>|][+-]?\d*$/.test(value)
}

function blockScalar(lines, startIndex, baseIndent) {
  const values = []
  let endIndex = startIndex
  let referenceIndex = startIndex

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (!line.trim()) {
      endIndex = index
      continue
    }
    const indentation = line.match(/^\s*/)[0].length
    if (indentation <= baseIndent)
      break

    if (values.length === 0)
      referenceIndex = index
    values.push(line.trim())
    endIndex = index
  }

  return { value: values.join(' '), endIndex, referenceIndex }
}

function referenceError(action, value) {
  const expected = approvedReference(action)
  const match = value.match(/^([^@\s]+)@(.+)$/)
  if (!match)
    return `${action} has a malformed uses reference "${value}". Replace it with "${expected}".`

  const [, name, ref] = match
  if (name !== action)
    return `${action} must use its canonical lowercase name; found "${name}". Replace it with "${expected}".`
  if (ref !== `v${REQUIRED_ACTION_MAJORS[action]}`)
    return `${action} must use approved "${expected}"; found "${value}".`

  return null
}

export function validateWorkflowText(text, file = '<workflow>') {
  const errors = []
  const lines = text.split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const match = line.match(/^\s*(?:-\s*)?uses\s*:\s*(.*)$/)
    if (!match)
      continue

    let value = readUsesValue(match[1])
    let referenceIndex = index
    if (isBlockScalar(value)) {
      const block = blockScalar(lines, index, line.match(/^\s*/)[0].length)
      value = readUsesValue(block.value, { stripComment: false })
      referenceIndex = block.referenceIndex
      index = block.endIndex
    }
    const action = namedAction(value)
    if (!action)
      continue

    const error = referenceError(action, value)
    if (error)
      errors.push(`${file}:${referenceIndex + 1}: ${error}`)
  }
  return errors
}

export async function workflowFiles(directory) {
  const files = []

  async function visit(currentDirectory) {
    const entries = await fs.readdir(currentDirectory, { withFileTypes: true })
    for (const entry of entries) {
      const entryPath = path.join(currentDirectory, entry.name)
      if (entry.isDirectory()) {
        await visit(entryPath)
        continue
      }
      if (entry.isFile() && WORKFLOW_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
        files.push(entryPath)
    }
  }

  await visit(directory)
  return files.sort()
}

export async function validateWorkflowDirectory(directory, root = directory) {
  const files = await workflowFiles(directory)
  const results = await Promise.all(files.map(async (file) => {
    const text = await fs.readFile(file, 'utf8')
    const relativePath = path.relative(root, file).split(path.sep).join('/')
    return validateWorkflowText(text, relativePath)
  }))
  return results.flat()
}

function assertFixtureFailure(text, expected) {
  const errors = validateWorkflowText(text, 'fixture.yml')
  assert.equal(errors.length, 1, `Expected exactly one failure, received: ${errors.join('\n')}`)
  assert.match(errors[0], expected)
}

export function runFixtureTests() {
  const validWorkflow = `
name: Action runtime fixture
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: "actions/setup-node@v7"
      - uses: actions/configure-pages@v6 # Pages setup is only needed for deployment.
      - uses: 'actions/upload-pages-artifact@v5'
      - uses: actions/deploy-pages@v5
      - uses: actions/cache@v4
`

  assert.deepEqual(validateWorkflowText(validWorkflow, 'fixture.yml'), [])
  for (const [action, major] of Object.entries(REQUIRED_ACTION_MAJORS)) {
    assertFixtureFailure(
      validWorkflow.replace(`${action}@v${major}`, `${action}@v${major - 1}`),
      new RegExp(`${action.replace('/', '\\/')} must use approved`),
    )
  }
  assertFixtureFailure(
    validWorkflow.replace('actions/checkout@v7', 'actions/checkout'),
    /actions\/checkout has a malformed uses reference/,
  )
  assertFixtureFailure(
    validWorkflow.replace('actions/setup-node@v7', 'actions/setup-node@main'),
    /actions\/setup-node must use approved/,
  )
  assertFixtureFailure(
    validWorkflow.replace('actions/configure-pages@v6', 'Actions/configure-pages@v6'),
    /actions\/configure-pages must use its canonical lowercase name/,
  )
  assertFixtureFailure(
    validWorkflow.replace('actions/checkout@v7', '>-\n        actions/checkout@v6'),
    /actions\/checkout must use approved/,
  )
}

export async function main() {
  runFixtureTests()
  const errors = await validateWorkflowDirectory(path.join(ROOT, '.github', 'workflows'), ROOT)
  if (errors.length)
    throw new Error(`GitHub Actions runtime guard failed:\n${errors.map(error => `- ${error}`).join('\n')}`)

  console.log('Action runtime QA passed: approved official action majors and malformed-reference fixtures are enforced.')
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  await main()
