import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

// =============================================================================
// Cross-Repo Compatibility Smoke Tests
//
// Purpose: Validate this component remains integrated with TPEN-interfaces.
// This script is OPTIONAL for local development, runs only in CI.
//
// Checks:
// - TPEN-interfaces still references tpen-line-history component
// - TPEN-interfaces still emits/references tpen-active-line-updated event
// - No silent breakage in split-screen integration points
//
// Usage:
//   npm run test:compat     # Run manually (optional)
//   CI includes via test:ci # Runs on main branch
//
// When TPEN-interfaces publishes a shared embed contract module (@tpen/embed-contract),
// this script will be replaced or augmented with contract version pinning checks.
// =============================================================================

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '../..')
const tmpRoot = path.join(repoRoot, '.tmp')
const interfacesRoot = path.join(tmpRoot, 'TPEN-interfaces')

const remote = process.env.TPEN_INTERFACES_REMOTE ?? 'https://github.com/CenterForDigitalHumanities/TPEN-interfaces.git'
const ref = process.env.TPEN_INTERFACES_REF ?? 'main'

function runGit(args, cwd = repoRoot) {
  const result = spawnSync('git', args, {
    cwd,
    stdio: 'pipe',
    encoding: 'utf8'
  })

  if (result.error) {
    throw new Error(`git ${args.join(' ')} failed: ${result.error.message}`)
  }

  if (result.status !== 0) {
    const details = (result.stderr || result.stdout || 'unknown git error').trim()
    throw new Error(`git ${args.join(' ')} failed: ${details}`)
  }

  return result.stdout.trim()
}

async function ensureInterfacesCheckout() {
  await fs.mkdir(tmpRoot, { recursive: true })

  try {
    await fs.access(interfacesRoot)
    try {
      await fs.access(path.join(interfacesRoot, '.git'))
    } catch {
      await fs.rm(interfacesRoot, { recursive: true, force: true })
    }
  } catch {}

  try {
    await fs.access(path.join(interfacesRoot, '.git'))
    runGit(['fetch', '--depth', '1', 'origin', ref], interfacesRoot)
    runGit(['checkout', ref], interfacesRoot)
    runGit(['reset', '--hard', `origin/${ref}`], interfacesRoot)
    return
  } catch {}

  runGit(['clone', '--depth', '1', '--branch', ref, remote, interfacesRoot])
}

async function checkIntegrationAnchors() {
  const targetFiles = [
    path.join(interfacesRoot, 'components', 'project-tools', 'index.js'),
    path.join(interfacesRoot, 'components', 'simple-transcription', 'index.js')
  ]

  const contents = await Promise.all(targetFiles.map(file => fs.readFile(file, 'utf8')))
  const joined = contents.join('\n')

  assert.match(
    joined,
    /tpen-line-history/,
    'Expected TPEN-interfaces to reference tpen-line-history in split-screen integration files'
  )

  assert.match(
    joined,
    /tpen-active-line-updated/,
    'Expected TPEN-interfaces to emit or reference tpen-active-line-updated integration event'
  )
}

async function main() {
  console.log('Running TPEN-interfaces integration smoke checks')
  await ensureInterfacesCheckout()
  await checkIntegrationAnchors()
  console.log('Integration smoke checks passed')
}

main().catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
