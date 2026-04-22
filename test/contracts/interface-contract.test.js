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
