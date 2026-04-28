import assert from 'node:assert/strict'
import test from 'node:test'

import {
  boundingChanged,
  formatTimeAgo,
  formatTimestamp,
  getLineBounding,
  getLineImageSource,
  getLineText,
  getTimestamp
} from '../../line-history-utils.js'

test('getTimestamp prefers the newest parsed timestamp', () => {
  const timestamp = getTimestamp({
    __rerum: {
      createdAt: '2025-01-01T00:00:00.000Z',
      isOverwritten: '2025-01-02T00:00:00.000Z'
    }
  })

  assert.equal(timestamp, Date.parse('2025-01-02T00:00:00.000Z'))
})

test('getTimestamp returns numeric timestamp directly', () => {
  const timestamp = getTimestamp({ timestamp: 42 })
  assert.equal(timestamp, 42)
})

test('getTimestamp returns 0 when timestamp values are missing', () => {
  const timestamp = getTimestamp({})
  assert.equal(timestamp, 0)
})

test('getLineText supports body.value and fallback fields', () => {
  assert.equal(getLineText({ body: { value: 'from-value' } }), 'from-value')
  assert.equal(getLineText({ body: [{ value: 'from-array' }] }), 'from-array')
  assert.equal(getLineText({ body: 'from-string' }), 'from-string')
  assert.equal(getLineText({ text: 'from-text' }), 'from-text')
  assert.equal(getLineText({ 'cnt:chars': 'from-cnt-chars' }), 'from-cnt-chars')
})

test('getLineBounding parses iiif xywh formats', () => {
  const pixelBounding = getLineBounding({
    target: {
      selector: {
        value: 'xywh=pixel:10,20,30,40'
      }
    }
  })

  assert.deepEqual(pixelBounding, { x: 10, y: 20, width: 30, height: 40 })

  const plainBounding = getLineBounding({
    target: {
      selector: {
        value: 'xywh=11,22,33,44'
      }
    }
  })

  assert.deepEqual(plainBounding, { x: 11, y: 22, width: 33, height: 44 })
})

test('getLineBounding supports direct x/y/w/h fields', () => {
  const bounding = getLineBounding({ x: 1, y: 2, w: 3, h: 4 })
  assert.deepEqual(bounding, { x: 1, y: 2, width: 3, height: 4 })
})

test('getLineImageSource supports iiif target and direct fields', () => {
  assert.equal(getLineImageSource({ target: { source: 'iiif-canvas' } }), 'iiif-canvas')
  assert.equal(getLineImageSource({ on: 'direct-target' }), 'direct-target')
  assert.equal(getLineImageSource({ image: 'direct-image' }), 'direct-image')
  assert.equal(getLineImageSource({}), null)
})

test('formatTimestamp handles empty and valid timestamps', () => {
  assert.equal(formatTimestamp(null), 'Unknown date')

  const formatted = formatTimestamp('2025-01-01T00:00:00.000Z')
  assert.equal(typeof formatted, 'string')
  assert.equal(formatted.length > 0, true)
})

test('formatTimeAgo handles now and elapsed time', () => {
  assert.equal(formatTimeAgo(null), '')
  assert.equal(formatTimeAgo(Date.now()), 'just now')

  const oneHourAgo = Date.now() - (60 * 60 * 1000)
  assert.match(formatTimeAgo(oneHourAgo), /hour/)
})

test('boundingChanged compares nullable and concrete bounding boxes', () => {
  assert.equal(boundingChanged(null, null), false)
  assert.equal(boundingChanged({ x: 1, y: 1, width: 1, height: 1 }, null), true)
  assert.equal(
    boundingChanged(
      { x: 1, y: 2, width: 3, height: 4 },
      { x: 1, y: 2, width: 3, height: 4 }
    ),
    false
  )
  assert.equal(
    boundingChanged(
      { x: 1, y: 2, width: 3, height: 4 },
      { x: 9, y: 2, width: 3, height: 4 }
    ),
    true
  )
})
