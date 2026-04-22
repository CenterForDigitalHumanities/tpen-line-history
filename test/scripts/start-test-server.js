import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createTestApp } from '../harness/app.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '../..')
const port = Number(process.env.PORT ?? 4173)

const app = express()
const fixtureApp = createTestApp()

app.use(fixtureApp)
app.use(express.static(repoRoot))

app.get('/', (_req, res) => {
  res.sendFile(path.join(repoRoot, 'demo.html'))
})

app.listen(port, () => {
  console.log(`tpen-line-history test server listening on http://127.0.0.1:${port}`)
})
