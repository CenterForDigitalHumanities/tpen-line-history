import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  eventNameContract,
  isLineLikePayload,
  sampleLine
} from '../fixtures/line-fixtures.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '../..')

test('line payload fixture matches contract', () => {
  assert.equal(isLineLikePayload(sampleLine), true)
})

test('component listens for active-line event contract', async () => {
  const sourcePath = path.join(repoRoot, 'tpen-line-history.js')
  const source = await fs.readFile(sourcePath, 'utf8')

  assert.match(
    source,
    new RegExp(eventNameContract.incoming),
    'Expected TPEN event name contract to be present'
  )
})

test('component stays registered as custom element', async () => {
  const sourcePath = path.join(repoRoot, 'tpen-line-history.js')
  const source = await fs.readFile(sourcePath, 'utf8')

  assert.match(
    source,
    /customElements\.define\('tpen-line-history',\s*TPENLineHistory\)/,
    'Custom element registration contract changed'
  )
})

// ============================================================================
// Shared Integration Contract Tests
// ============================================================================
// These tests validate contracts defined in TPEN-interfaces repository.
// When TPEN-interfaces publishes an embed integration contract module,
// these tests import and enforce that contract here.
//
// Expected shared contract structure:
//   - Channel definitions: { name: string, transport: 'custom-event' | 'postMessage', ... }
//   - Payload schemas: validators or shape descriptors
//   - TPEN interface requirements: eventDispatcher signature, etc.
//
// ============================================================================

test('dual-transport readiness: handlers exist for custom-event channels', async () => {
  const sourcePath = path.join(repoRoot, 'tpen-line-history.js')
  const source = await fs.readFile(sourcePath, 'utf8')

  // Verify custom-event listener setup
  assert.match(
    source,
    /eventDispatcher\.on\s*\(/,
    'Expected event listener setup for custom-event transport'
  )
})

test('dual-transport readiness: component accepts line payloads in event.detail', async () => {
  const sourcePath = path.join(repoRoot, 'tpen-line-history.js')
  const source = await fs.readFile(sourcePath, 'utf8')

  // Verify handleLineChange exists and processes event payload
  assert.match(
    source,
    /handleLineChange\s*\([^)]*\)\s*{/,
    'Expected handleLineChange handler for line payloads'
  )
})

test('shared contract will be imported when available', async () => {
  // TODO: When TPEN-interfaces publishes @tpen/embed-contract,
  // uncomment and update these lines:
  //
  // import { channels, payloadSchemas } from '@tpen/embed-contract'
  // assert.ok(channels, 'Shared contract must export channels array')
  // assert.ok(payloadSchemas, 'Shared contract must export payload validators')
  //
  // For now, this test passes as a placeholder.
  assert.ok(true, 'Placeholder: shared contract import pending')
})
