import assert from 'node:assert/strict'
import test from 'node:test'
import request from 'supertest'

import { createTestApp } from '../harness/app.js'

const app = createTestApp()

test('health endpoint returns ok', async () => {
  const res = await request(app).get('/health')

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.ok, true)
})

test('annotation fixture endpoint returns annotation page shape', async () => {
  const res = await request(app).get('/fixtures/annotation-page.json')

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.type, 'AnnotationPage')
  assert.ok(Array.isArray(res.body.items))
  assert.equal(res.body.items.length > 0, true)
})

test('line fixture endpoint returns line-like payload', async () => {
  const res = await request(app).get('/fixtures/line.json')

  assert.equal(res.statusCode, 200)
  assert.equal(typeof (res.body.uri ?? res.body['@id']), 'string')
  assert.equal(typeof res.body.text, 'string')
})
