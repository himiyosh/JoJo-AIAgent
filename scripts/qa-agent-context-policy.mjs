import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const POLICY_PATH = '.github/instructions/session-context.instructions.md'
const MAX_POLICY_BYTES = 8 * 1024
const REQUIRED_POLICY_FRAGMENTS = [
  'applyTo: "**"',
  'context preflight',
  '50%',
  '24 turn',
  '2 task wave',
  '256 KiB',
  '/safe-session-suspend',
  '/safe-session-resume',
  'fork_session',
  'atomic write',
  'fresh session',
  '64 KiB',
]

function containsInOrder(text, first, second) {
  const firstIndex = text.indexOf(first)
  const secondIndex = text.indexOf(second)
  return firstIndex >= 0 && secondIndex > firstIndex
}

export function validateContextPolicy({ policy, agents, slideAgent }) {
  const errors = []
  const policyBytes = Buffer.byteLength(policy)

  if (policyBytes > MAX_POLICY_BYTES)
    errors.push(`${POLICY_PATH} must stay compact: ${policyBytes} bytes exceeds ${MAX_POLICY_BYTES}.`)

  for (const fragment of REQUIRED_POLICY_FRAGMENTS) {
    if (!policy.includes(fragment))
      errors.push(`${POLICY_PATH} is missing required circuit-breaker fragment: ${fragment}`)
  }

  if (!agents.includes(POLICY_PATH) || !agents.includes('circuit breaker'))
    errors.push(`AGENTS.md must make ${POLICY_PATH} an explicit mandatory protocol.`)

  if (!containsInOrder(slideAgent, '.github/instructions/**', 'AGENTS.md'))
    errors.push('JoJoSlideAgent must load repository instructions before AGENTS.md.')

  return errors
}

export async function main() {
  const [policy, agents, slideAgent] = await Promise.all([
    fs.readFile(path.join(ROOT, POLICY_PATH), 'utf8'),
    fs.readFile(path.join(ROOT, 'AGENTS.md'), 'utf8'),
    fs.readFile(path.join(ROOT, '.github', 'agents', 'JoJoSlideAgent.agent.md'), 'utf8'),
  ])
  const errors = validateContextPolicy({ policy, agents, slideAgent })

  if (errors.length)
    throw new Error(`Agent context policy QA failed:\n${errors.map(error => `- ${error}`).join('\n')}`)

  console.log('Agent context policy QA passed: proactive rollover and compact-handoff guards are enforced.')
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  await main()
