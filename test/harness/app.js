import express from 'express'

import { sampleAnnotationPage, sampleLine } from '../fixtures/line-fixtures.js'

export function createTestApp() {
  const app = express()

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true })
  })

  app.get('/fixtures/annotation-page.json', (_req, res) => {
    res.status(200).json(sampleAnnotationPage)
  })

  app.get('/fixtures/line.json', (_req, res) => {
    res.status(200).json(sampleLine)
  })

  return app
}
